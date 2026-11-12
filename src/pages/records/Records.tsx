/**
 * Logs (API calls) and Payloads (sign requests): the records of an application in a list, one record in detail.
 * New records arrive live (websocket): a notification offers to reload the list.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { api, appSocketUrl, errorRef, getBearer } from '../../lib/api'
import { isMock } from '../../lib/auth'
import { appPath, useSelectedApp } from '../../lib/routes'
import { toast } from '../../lib/toast'
import { uuidv4Re } from '../../lib/validate'
import { LogDetail, PayloadDetail, type Rec } from './details'
import { Alert, Badge, Button, Code, Input, PageHeader, Spinner, TimeAgo, buttonClass, cx } from '../../components/ui'
import {
  Icon,
  faArrowLeft,
  faBell,
  faBullhorn,
  faClock,
  faCubes,
  faListUl,
  faMagnifyingGlass,
  faMobileScreen,
  faThumbsUp,
  faTriangleExclamation,
  faUser,
  type IconDefinition,
} from '../../components/icons'

type Kind = 'app-logs' | 'app-payloads'

const endpointOf = (kind: Kind) => (kind === 'app-logs' ? 'calls' : 'payloads')

const txHashRe = /^[0-9A-F]{64}$/i

/* The colour of a record: what happened */
const logColor = (r: Rec): string => {
  if (r.call_httpcode !== 200) return 'bg-rose-500'
  if (r.call_endpoint === 'payload' && r.call_method === 'POST') return 'bg-brand-500'
  if (r.call_endpoint === 'payload' && r.call_method === 'PATCH') return 'bg-sky-500'
  if (r.call_endpoint === 'payload' && r.call_method === 'DELETE') return 'bg-rose-500'
  return 'bg-emerald-500'
}

const payloadColor = (r: Rec): string => {
  if (r.payload_tx_type === 'SignIn') return 'bg-emerald-500'
  if (r.payload_tx_type === 'Payment') return 'bg-brand-500'
  if (r.payload_tx_type === null) return 'bg-rose-500'
  return 'bg-slate-400'
}

const methodTone = (method: string) => (method === 'POST' ? 'brand' : method === 'GET' ? 'green' : method === 'PATCH' ? 'sky' : method === 'DELETE' ? 'red' : 'neutral')

function Flag({ icon, title }: { icon: IconDefinition; title: string }) {
  return (
    <span title={title} aria-label={title} className="flex size-5 items-center justify-center rounded bg-surface-3 text-[10px] text-fg-2">
      <Icon icon={icon} />
    </span>
  )
}

function LogItem({ r }: { r: Rec }) {
  return (
    <>
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-muted">{r.call_uuidv4}</span>
        <span className="flex shrink-0 gap-1">
          {r.call_type === 'app' && <Flag icon={faUser} title="User initiated (App)" />}
          {r.call_emessage && <Flag icon={faBullhorn} title="Error reference attached" />}
          {!r.call_emessage && r.call_httpcode !== 200 && <Flag icon={faTriangleExclamation} title="Non HTTP200 response code" />}
          {r.payload_uuidv4 && <Flag icon={faCubes} title="Payload stored" />}
          {r.token_accesstoken && <Flag icon={faBell} title="Pushed using client access token" />}
        </span>
      </div>
      <div className="mt-1.5 flex items-center gap-1.5">
        <Badge tone={methodTone(r.call_method)}>{r.call_method}</Badge>
        <span className="min-w-0 truncate font-mono text-[12px] text-fg">{r.call_url}</span>
      </div>
      <div className="mt-1.5 truncate text-xs text-muted">
        {r.call_moment && <TimeAgo date={new Date(r.call_moment_ts * 1000)} />}
        {r.call_useragent ? ` (${r.call_useragent})` : ''}
      </div>
    </>
  )
}

function PayloadItem({ r }: { r: Rec }) {
  return (
    <>
      <div className="truncate font-mono text-[11.5px] text-muted">{r.call_uuidv4}</div>
      <div className="mt-1.5 flex items-center gap-1.5">
        <span className="shrink-0 text-[13px] font-semibold text-fg">{r.payload_tx_type}</span>
        {String(r.meta_string || '') !== '' && <span className="min-w-0 truncate font-mono text-[11.5px] text-muted">{r.meta_string}</span>}
        <span className="ml-auto flex shrink-0 gap-1">
          {r.payload_app_opencount ? (
            <Badge tone="brand" icon={faMobileScreen}>
              Opened
            </Badge>
          ) : null}
          {r.payload_response_hex && (
            <Badge tone="green" icon={faThumbsUp}>
              Signed
            </Badge>
          )}
          {(r.__payload_expired || 0) > 0 && !r.payload_response_hex && <Badge tone="red">Expired</Badge>}
        </span>
      </div>
      <div className="mt-1.5 truncate text-xs text-muted">{r.payload_created && <TimeAgo date={new Date(r.payload_created_ts * 1000)} />}</div>
    </>
  )
}

export function Records({ kind }: { kind: Kind }) {
  const { app, appId } = useSelectedApp()
  const params = useParams()
  const navigate = useNavigate()

  // The record of the URL: `/{application}/{page}/{record uuid}`
  const routeRecord = uuidv4Re.test(params.record || '') ? String(params.record) : ''

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<Rec[]>([])
  const [search, setSearch] = useState('')
  const [searching, setSearching] = useState(false)

  const list = useRef<HTMLDivElement>(null)
  // For the handlers of the websocket: the data and the record of this moment
  const dataRef = useRef<Rec[]>([])
  dataRef.current = data
  const routeRecordRef = useRef(routeRecord)
  routeRecordRef.current = routeRecord
  const missedRecords = useRef(0)

  const endpoint = 'console/' + endpointOf(kind) + '/' + appId
  const selected = data.find(r => r.call_uuidv4 === routeRecord) || null
  const validSearch = uuidv4Re.test(search.trim()) || (kind === 'app-payloads' && txHashRe.test(search.trim()))

  const scrollTo = (uuid?: string) => {
    requestAnimationFrame(() => {
      const el = uuid ? document.getElementById('record-' + uuid) : null
      list.current?.scrollTo({ top: el ? el.offsetTop : 0 })
    })
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      let records = await api('GET', endpoint + '/')
      const wanted = routeRecordRef.current

      // The record of the URL is not one of the latest records: the records around that record
      if (Array.isArray(records) && records.length > 0 && wanted && !records.some((r: Rec) => r.call_uuidv4 === wanted)) {
        records = await api('GET', endpoint + '/' + wanted)
      }

      setData(Array.isArray(records) ? records : [])
      if (wanted) scrollTo(wanted)
    } catch (e) {
      setData([])
      toast.error('Error fetching the records' + errorRef(e))
    }
    setLoading(false)
  }, [endpoint])

  useEffect(() => {
    missedRecords.current = 0
    void fetchData()
    return () => toast.dismiss('ws_update')
  }, [fetchData])

  /* Live updates */

  // A payload on screen changed (opened, signed): the latest state of the listed records
  const liveDataUpdate = useCallback(async () => {
    const records = await api('GET', endpoint).catch(() => null)
    if (!Array.isArray(records)) return
    setData(current => current.map(r => ({ ...r, ...(records.find((n: Rec) => n.call_uuidv4 === r.call_uuidv4) || {}) })))
  }, [endpoint])

  const reload = useCallback(async () => {
    missedRecords.current = 0
    const records = await api('GET', endpoint).catch(() => null)
    if (!Array.isArray(records)) return

    setData(current => {
      const existing = current.map(r => r.call_uuidv4)
      const fresh = records.filter((r: Rec) => !existing.includes(r.call_uuidv4)).map((r: Rec) => ({ ...r, new: true }))
      const next = [...fresh, ...current.map(r => ({ ...r, new: undefined }))]
      return next.length > 250 ? next.slice(0, 50) : next
    })
    scrollTo()
  }, [endpoint])

  const handleUpdate = useCallback(
    (message: any) => {
      const listed = dataRef.current.map(r => r.call_uuidv4)

      if (kind === 'app-payloads') {
        if (message.endpoint !== 'payload') return
        // The Xaman app opened / resolved a listed payload
        if (message.type === 'app' && listed.includes(message.call)) return void liveDataUpdate()
        if (listed.includes(message.call)) return
        // A call about a listed payload (its reference)
        if (typeof message.extRef === 'string' && listed.includes(message.extRef.split('(').reverse()[0].split(')')[0])) return
      }

      missedRecords.current++
      toast.show({
        key: 'ws_update',
        tone: 'info',
        title: (
          <>
            Updated data (<b>{missedRecords.current}</b>)
          </>
        ),
        description: 'There are new record(s) available since you opened this page.',
        action: { label: 'Reload', onClick: () => void reload() },
        duration: 10,
      })
    },
    [kind, liveDataUpdate, reload],
  )

  useEffect(() => {
    if (!appId || isMock) return

    let socket: WebSocket | null = null
    let retry: ReturnType<typeof setTimeout>
    let closed = false

    const connect = async () => {
      const token = await getBearer()
      if (closed) return

      socket = new WebSocket(appSocketUrl(appId))
      socket.onopen = () => socket?.send(JSON.stringify({ auth: 'Bearer ' + token }))
      socket.onclose = e => {
        // Not closed by us (or the API, on purpose): connect again
        if (!closed && !e.wasClean) retry = setTimeout(connect, 3000)
      }
      socket.onmessage = message => {
        try {
          const json = JSON.parse(String(message.data))
          // `message`: the API talking about the connection. Else: an update
          if (typeof json.message === 'undefined') handleUpdate(json)
        } catch {
          // Not JSON
        }
      }
    }

    void connect()

    return () => {
      closed = true
      clearTimeout(retry)
      try {
        socket?.close()
      } catch {
        // Closed already
      }
    }
  }, [appId, handleUpdate])

  /* Search */

  const searchByUuid = async () => {
    const value = search.trim()
    if (!validSearch || routeRecord === value || searching) return

    setSearching(true)
    try {
      const record = await api('GET', endpoint + '/' + value.toLowerCase() + '?one=true')

      if (Array.isArray(record) && record.length === 1) {
        const found: Rec = record[0]
        setSearch(found.call_uuidv4)
        setData(current => (current.some(r => r.call_uuidv4 === found.call_uuidv4) ? current : [found, ...current]))
        navigate(appPath(appId, kind, found.call_uuidv4))
        scrollTo(found.call_uuidv4)
      } else {
        toast.show({ key: 'record_no_found', tone: 'error', title: 'Record not found', description: <Code>{value.toLowerCase()}</Code>, duration: 10 })
      }
    } catch (e) {
      toast.error('Error searching the record' + errorRef(e))
    }
    setSearching(false)
  }

  if (!app) return null

  const title = kind === 'app-logs' ? 'API call log' : 'Payloads'
  const empty = !loading && data.length === 0

  return (
    <div className="flex min-h-0 flex-1 lg:h-[calc(100dvh-3.5rem)] lg:flex-none">
      {/* The list. On a small screen: the list, or (a record selected) the record */}
      {!empty && !loading && (
        <aside className={cx('flex w-full shrink-0 flex-col border-r border-line bg-surface lg:w-[340px]', routeRecord && selected && 'max-lg:hidden')}>
          <form
            className="flex shrink-0 gap-2 border-b border-line p-3"
            onSubmit={e => {
              e.preventDefault()
              void searchByUuid()
            }}
          >
            <Input
              className="h-9 font-mono !text-[12.5px]"
              placeholder={kind === 'app-payloads' ? 'Search by UUID/TX ID' : 'Search by UUID'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              spellCheck={false}
              aria-label="Search"
            />
            <Button type="submit" variant="primary" className="w-9 !px-0" disabled={!validSearch} loading={searching} aria-label="Search">
              {!searching && <Icon icon={faMagnifyingGlass} />}
            </Button>
          </form>
          <div ref={list} className="relative min-h-0 flex-1 overflow-y-auto max-lg:max-h-[calc(100dvh-7.5rem)]">
            {data.map(r => (
              <Link
                key={r.call_uuidv4}
                id={'record-' + r.call_uuidv4}
                to={appPath(appId, kind, r.call_uuidv4)}
                className={cx(
                  'relative block border-b border-line py-3 pr-5 pl-4 outline-none transition hover:bg-surface-2 focus-visible:bg-surface-2',
                  r.new && 'bg-emerald-50 dark:bg-emerald-400/5',
                  r === selected && '!bg-brand-50 dark:!bg-brand-400/10',
                )}
              >
                <span className={cx('absolute inset-y-2 right-1.5 w-1 rounded-full', kind === 'app-logs' ? logColor(r) : payloadColor(r))} />
                {kind === 'app-logs' ? <LogItem r={r} /> : <PayloadItem r={r} />}
              </Link>
            ))}
          </div>
        </aside>
      )}

      <section className={cx('min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6', !empty && !loading && !(routeRecord && selected) && 'max-lg:hidden')}>
        {loading ? (
          <div className="flex h-full min-h-40 items-center justify-center gap-2.5 text-[13px] text-muted">
            <Spinner className="size-3.5" /> Loading data...
          </div>
        ) : empty ? (
          <div className="flex h-full min-h-60 flex-col items-center justify-center text-center">
            <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-surface-3 text-muted">
              <Icon icon={faClock} />
            </div>
            <div className="text-sm font-semibold text-fg">No records found.</div>
            <div className="mt-1 text-[13px] text-muted">
              Please check the{' '}
              <a href="https://docs.xumm.dev/concepts/getting-started" target="_blank" rel="noopener noreferrer" className={buttonClass('secondary', 'sm', 'mx-0.5')}>
                Docs
              </a>{' '}
              to learn how to get started.
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-5xl">
            {selected && (
              <Link to={appPath(appId, kind)} className={buttonClass('ghost', 'sm', 'mb-3 -ml-2 lg:hidden')}>
                <Icon icon={faArrowLeft} /> All records
              </Link>
            )}
            <PageHeader title={title} subtitle={app.name} icon={kind === 'app-logs' ? faListUl : faCubes} />
            {selected ? (
              kind === 'app-logs' ? (
                <LogDetail appId={appId} record={selected} />
              ) : (
                <PayloadDetail appId={appId} record={selected} />
              )
            ) : (
              <Alert tone="warning">
                <Icon icon={faArrowLeft} className="mr-1.5" />
                Please select {kind === 'app-logs' ? 'an API call to inspect the call details' : 'a payload to inspect the payload details'}.
              </Alert>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

