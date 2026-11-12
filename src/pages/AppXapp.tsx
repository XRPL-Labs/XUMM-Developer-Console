import { useEffect, useState, type ReactNode } from 'react'
import { api, errorRef } from '../lib/api'
import { bufferJsonToHex, hexToUuid, onlyHex } from '../lib/format'
import { useSelectedApp } from '../lib/routes'
import { useStore, type App } from '../lib/store'
import { toast } from '../lib/toast'
import { isUrl, uuidv4LinesRe, uuidv4Re } from '../lib/validate'
import { Alert, Button, Card, CardBody, CardHeader, Code, Confirm, ExtLink, Field, Input, Page, PageHeader, Row, Skeleton, Stat, Textarea, Toggle } from '../components/ui'
import { Icon, faChartPie, faCircleCheck, faCircleMinus, faLink, faMobileScreen, faScrewdriverWrench, faXmark } from '../components/icons'

const supportTicket = 'https://xumm.app/detect/xapp:xumm.support-md'
const requirements = 'https://docs.xumm.dev/environments/xapps-dapps/requirements#public-listed-xapps'

type Rail = { color?: string; name?: string; chain_id?: number }
type Stats = { d1: { c: number; u: number }; d30: { c: number; u: number }; all_time: { c: number } }

const hasStats = (stats: Partial<Stats>): stats is Stats => 'all_time' in stats

function NoGuarantee() {
  return (
    <>
      Activating xApp features and building a <b>sandbox xApp</b> does <b>NOT</b> guarantee your xApp will be going live in the future. To take your xApp live, it will be
      audited by XRPL Labs. Security &amp; usability will be tested. If you want to have more certainty in advance, please{' '}
      <ExtLink href={requirements}>read our Developer Help Center docs</ExtLink> or reach out to XRPL Labs: <ExtLink href={supportTicket}>submit a support ticket here</ExtLink>.
    </>
  )
}

function YesNo({ yes, children }: { yes: boolean; children?: ReactNode }) {
  return yes ? (
    <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
      <Icon icon={faCircleCheck} /> Yes
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 font-medium text-rose-600 dark:text-rose-400">
      <Icon icon={faCircleMinus} /> No {children}
    </span>
  )
}

/* xApp features not enabled (yet): the rules, and the activation */
function Activate({ appId }: { appId: string }) {
  const fetchApps = useStore(s => s.fetchApps)
  const [activating, setActivating] = useState(false)

  const activate = async () => {
    setActivating(true)
    try {
      const response = await api('POST', 'console/xapp/' + appId + '/activate', {})
      if (!response?.valid) throw new Error('Not activated')
      await fetchApps()
    } catch (e) {
      toast.error('Your xApp could not be activated' + errorRef(e))
    } finally {
      setActivating(false)
    }
  }

  return (
    <Alert tone="info" title="xApp features not enabled">
      <p className="font-semibold text-rose-600 dark:text-rose-400">
        To enable xApp features, please read the rules below <u>carefully</u>:
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>
          You can enroll for a <b>sandbox xApp</b>
        </li>
        <li>
          Only <b>you</b> can use your own <b>sandbox xApp</b> from a specific Xaman installation you can whitelist after activating xApp features.
        </li>
        <li>The fact that you got a sandbox xApp is not to be presented anywhere as an endorsement (e.g. in communication like on social media, etc.)</li>
        <li>To build an xApp, you need to have experience with Frontend Web Development as xApps are WebApps (loaded in Xaman)</li>
        <li>xApps need to add value to a significant share of the Xaman user base</li>
        <li>xApps need to be self explanatory to have clear instructions for end users</li>
        <li>xApps need to be designed in a way where users can not make dangerous mistakes: users need to be protected</li>
        <li>xApps developers can not be anonymous (accountability)</li>
        <li>
          Promotion of speculation, pushing users towards buying tokens <b>is not allowed</b> (see: user protection)
        </li>
        <li>
          <NoGuarantee />
        </li>
      </ul>
      <Button variant="primary" className="mt-4" loading={activating} onClick={activate}>
        I agree. Please activate xApp features
      </Button>
    </Alert>
  )
}

/* The settings of the xApp */
function Details({ app, appId }: { app: App; appId: string }) {
  const patchAppDetails = useStore(s => s.patchAppDetails)
  const fetchApps = useStore(s => s.fetchApps)
  const d = app.details

  const sandbox = !!String(d.application_xapp_identifier || '').match(/sandbox/)
  const networks = Array.isArray(d.application_xapp_networks) ? d.application_xapp_networks : []

  const [rails, setRails] = useState<Record<string, Rail>>({})

  // The stored values: a field that differs can be saved
  const [storedDebugId, setStoredDebugId] = useState(() => bufferJsonToHex(d.application_xapp_debug_device_uuidv4_bin))
  const [storedGuests, setStoredGuests] = useState(() => String(d.application_xapp_debug_devices_uuids || '').toUpperCase())
  const [storedUrl, setStoredUrl] = useState(() => String(d.application_xapp_url || ''))

  const [devUuid, setDevUuid] = useState(() => hexToUuid(storedDebugId))
  const [sandboxUuids, setSandboxUuids] = useState(storedGuests)
  const [xAppUrl, setXAppUrl] = useState(storedUrl)
  const [saving, setSaving] = useState(false)

  const xummLoader = Number(d.application_xummloader || 0) === 1
  const xummEvent = Number(d.application_no_netswitch_rld || 0) === 1
  const xummNoMon = Number(d.application_no_monetization || 0) === 1

  useEffect(() => {
    api('GET', 'platform/rails')
      .then(r => setRails(r || {}))
      .catch(() => {})
  }, [])

  const errors = {
    devUuid: devUuid !== '' && !uuidv4Re.test(devUuid) ? 'Please enter a valid Device ID (36 char. UUIDv4, App: Settings - Advanced)' : undefined,
    sandboxUuids: sandbox && sandboxUuids !== '' && !uuidv4LinesRe.test(sandboxUuids) ? 'Please enter one valid Device UUID per line, max. 30' : undefined,
    xAppUrl: sandbox && xAppUrl !== '' && !isUrl(xAppUrl) ? 'This field must be a valid url.' : undefined,
  }

  const debugIdChanged = storedDebugId !== onlyHex(devUuid)
  const guestsChanged = storedGuests !== sandboxUuids.toUpperCase()
  const urlChanged = storedUrl !== xAppUrl

  // All the settings go to the API at once: a change of one setting, with the others as they are on screen
  const submit = async (change: { xummLoader?: boolean; xummEvent?: boolean; xAppNetworks?: string[] } = {}) => {
    if (errors.devUuid || errors.sandboxUuids || errors.xAppUrl) {
      return toast.error('Please check all required form fields')
    }

    const xAppNetworks = change.xAppNetworks ?? networks
    const values = {
      xummEvent: change.xummEvent ?? xummEvent,
      xummLoader: change.xummLoader ?? xummLoader,
      xummNoMon,
      devUuid,
      ...(sandbox ? { sandboxUuids, xAppDestinationUrl: xAppUrl } : {}),
      xAppNetworks,
    }

    // On screen at once
    patchAppDetails(appId, {
      application_xummloader: Number(values.xummLoader),
      application_no_netswitch_rld: Number(values.xummEvent),
      application_xapp_networks: xAppNetworks,
    })

    setSaving(true)
    try {
      await api('POST', 'console/xapp/' + appId + '/debug', values)

      setStoredDebugId(onlyHex(devUuid))
      if (sandbox) {
        setStoredGuests(sandboxUuids.toUpperCase())
        setStoredUrl(xAppUrl)
        patchAppDetails(appId, { application_xapp_url: xAppUrl, application_xapp_debug_devices_uuids: sandboxUuids.toUpperCase() })
      }
    } catch (e) {
      toast.error('Error updating your application' + errorRef(e))
      // What is stored, instead of what was on screen
      void fetchApps().catch(() => {})
    } finally {
      setSaving(false)
    }
  }

  const toggleNetwork = (network: string) => {
    void submit({ xAppNetworks: networks.includes(network) ? networks.filter(n => n !== network) : [...networks, network] })
  }

  const deeplink = 'https://xumm.app/detect/xapp:' + d.application_xapp_identifier
  const liveUrl = String(d.application_xapp_url || '')
  const previewUrl = liveUrl + (liveUrl.match(/\?/) ? '&' : '?') + 'xAppToken=00000000-0000-0000-0000-000000000000&xAppStyle=LIGHT'

  const saveButton = (
    <Button variant="primary" loading={saving} onClick={() => void submit()}>
      Save
    </Button>
  )

  return (
    <Card>
      <CardHeader
        title="xApp Details"
        icon={faScrewdriverWrench}
        description={
          <>
            To change any of the static xApp related settings, please <ExtLink href={supportTicket}>submit a support ticket here</ExtLink>.
          </>
        }
      />
      {sandbox && (
        <div className="border-b border-line px-5 py-4">
          <Alert tone="info">
            <NoGuarantee />
          </Alert>
        </div>
      )}
      <div className="divide-y divide-line">
        <Row label="Sandboxed">
          <YesNo yes={sandbox} />
        </Row>

        <Row label="Deeplink / QR Value">
          <a href={deeplink} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-1.5 break-all">
            <Icon icon={faLink} className="text-xs" /> {deeplink}
          </a>
        </Row>

        <Row label="WebApp URL">
          {sandbox ? (
            <Field error={errors.xAppUrl}>
              <div className="flex gap-2">
                <Input type="url" placeholder="xApp destination URL" value={xAppUrl} invalid={!!errors.xAppUrl} onChange={e => setXAppUrl(e.target.value)} />
                {urlChanged && !errors.xAppUrl && saveButton}
              </div>
            </Field>
          ) : liveUrl ? (
            <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 break-all text-fg-2 underline underline-offset-2 hover:text-fg">
              <Icon icon={faLink} className="text-xs" /> {liveUrl}
            </a>
          ) : (
            '-'
          )}
        </Row>

        <Row label="Xaman Loader Screen">
          <Toggle
            checked={xummLoader}
            disabled={saving || String(d.application_infourl_support || '') === ''}
            onChange={checked => void submit({ xummLoader: checked })}
            label={
              <>
                Xaman loader till SDK <Code>ready()</Code> is called
              </>
            }
            description={String(d.application_infourl_support || '') === '' ? 'Xaman 2.5.0 and higher. Needs a Support URL (application settings).' : 'Xaman 2.5.0 and higher'}
          />
        </Row>

        <Row label="Available for networks">
          {Object.keys(rails).length === 0 ? (
            <Skeleton className="h-5 w-48" />
          ) : (
            <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {Object.entries(rails).map(([key, rail]) => (
                <Toggle
                  key={key}
                  checked={networks.includes(key)}
                  disabled={saving}
                  onChange={() => toggleNetwork(key)}
                  label={
                    <span className="inline-flex items-center gap-1.5">
                      <i className="inline-block size-2.5 rounded-full" style={{ backgroundColor: rail.color }} />
                      <span className="font-mono text-[12.5px] font-semibold">{key}</span>
                    </span>
                  }
                  description={
                    <>
                      {rail.name} <span className="font-mono">{rail.chain_id}</span>
                    </>
                  }
                />
              ))}
            </div>
          )}
        </Row>

        <Row label="Network Switch Event">
          <Toggle
            checked={xummEvent}
            disabled={saving || networks.length < 2}
            onChange={checked => void submit({ xummEvent: checked })}
            label="xApp Event instead of xApp reload on end user network change"
            description={networks.length < 2 ? 'Xaman 2.6.0 and higher. For an xApp on two or more networks.' : 'Xaman 2.6.0 and higher'}
          />
        </Row>

        <Row label="Disable monetisation">
          <Toggle
            checked={xummNoMon}
            disabled
            onChange={() => {}}
            label="Always allow users to open this xApp (even if payment restricted)"
            description={
              <>
                Xaman 3.2.0 and higher. Set by XRPL Labs: <ExtLink href={supportTicket}>submit a support ticket</ExtLink> to change this.
              </>
            }
          />
        </Row>

        <Row label="Listed">
          <YesNo yes={!sandbox && Number(d.application_xapp_listed || 0) > 0}>
            <ExtLink href={requirements} className="ml-2">
              Read more...
            </ExtLink>
          </YesNo>
        </Row>
        <Row label="Featured">
          <YesNo yes={!sandbox && Number(d.application_xapp_featured || 0) > 0} />
        </Row>
        <Row label="Push permission">
          <YesNo yes={!sandbox && Number(d.application_permissions_xapp_push || 0) > 0} />
        </Row>

        <Row label="User Token Expiration">
          {d.application_token_exp_days ? (
            <>
              {String(d.application_token_exp_days)} days after last use (per <Code>user_token</Code>)
            </>
          ) : (
            '-'
          )}
        </Row>

        <Row label="Debug Device ID" hint="Allowed to re-fetch OTT data">
          <Field error={errors.devUuid}>
            <div className="flex gap-2">
              <Input
                className="font-mono"
                placeholder="Xaman device ID (App: Settings - Advanced)"
                value={devUuid}
                invalid={!!errors.devUuid}
                onChange={e => setDevUuid(e.target.value)}
                spellCheck={false}
              />
              {debugIdChanged && !errors.devUuid && saveButton}
            </div>
          </Field>
        </Row>

        {sandbox && (
          <Row label="Guest Device IDs" hint="Max. 30, allowed to access your sandboxed xApp. One per line.">
            <Field error={errors.sandboxUuids}>
              <Textarea
                rows={Math.min(12, Math.max(2, sandboxUuids.split('\n').length))}
                className="font-mono !text-[13px]"
                placeholder="d5017a35-83f6-42e2-b83e-d95ea3028b47"
                value={sandboxUuids}
                invalid={!!errors.sandboxUuids}
                onChange={e => setSandboxUuids(e.target.value)}
                spellCheck={false}
              />
            </Field>
            {guestsChanged && !errors.sandboxUuids && <div className="mt-2 flex justify-end">{saveButton}</div>}
          </Row>
        )}
      </div>
    </Card>
  )
}

/* Opened counts, pending events */
function StatsCard({ appId, stats, reload }: { appId: string; stats: Partial<Stats>; reload: () => void }) {
  const [pendingEvents, setPendingEvents] = useState<number | null>(null)

  const fetchEvents = () =>
    api('GET', 'console/xapp/' + appId + '/xapp-events')
      .then(r => setPendingEvents(Number(r?.event_count) || 0))
      .catch(() => {})

  useEffect(() => {
    void fetchEvents()
  }, [appId]) // eslint-disable-line react-hooks/exhaustive-deps

  const purge = async () => {
    setPendingEvents(0)
    try {
      await api('DELETE', 'console/xapp/' + appId + '/xapp-events')
    } catch (e) {
      toast.error('Error removing the pending events' + errorRef(e))
    }
    void fetchEvents()
    reload()
  }

  return (
    <Card>
      <CardHeader
        title={
          <>
            xApp Stats <span className="font-normal text-muted">(count / unique users)</span>
          </>
        }
        icon={faChartPie}
      />
      <CardBody>
        {!hasStats(stats) ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map(i => (
              <Skeleton key={i} className="h-[74px]" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Opened / 24h" value={stats.d1.c} suffix={`/ ${stats.d1.u}`} />
            <Stat label="Opened / 30d" value={stats.d30.c} suffix={`/ ${stats.d30.u}`} />
            <Stat label="Opened (total)" value={stats.all_time.c} />
            <Stat
              label="Pending Events"
              value={pendingEvents === null ? '...' : pendingEvents}
              action={
                (pendingEvents || 0) > 0 ? (
                  <Confirm title="Purge the pending xApp events?" description="The pending events will not be delivered." confirmLabel="Yes, purge" onConfirm={purge} size="sm" variant="danger">
                    Purge
                  </Confirm>
                ) : undefined
              }
            />
          </div>
        )}
      </CardBody>
    </Card>
  )
}

/* The stats of the xApp, published to a Google BigQuery dataset of the developer */
function BigQueryCard({ appId }: { appId: string }) {
  const [loaded, setLoaded] = useState(false)
  const [active, setActive] = useState(false)
  const [users, setUsers] = useState<string[]>([])
  const [user, setUser] = useState('')
  const [busy, setBusy] = useState(false)

  const endpoint = 'console/xapp/' + appId + '/ext-stats'

  const fetchState = async () => {
    try {
      const response = await api('GET', endpoint)
      setActive(!!response?.active)
      setUsers(response?.grants || [])
    } catch (e) {
      toast.error('Error fetching the stats publishing state' + errorRef(e))
    }
    setLoaded(true)
  }

  useEffect(() => {
    void fetchState()
  }, [appId]) // eslint-disable-line react-hooks/exhaustive-deps

  const activate = async () => {
    setBusy(true)
    try {
      await api('POST', endpoint)
      setActive(true)
    } catch (e) {
      toast.error('Error activating stats publishing' + errorRef(e))
    } finally {
      setBusy(false)
    }
  }

  const addUser = async () => {
    const value = user.trim()
    if (value === '' || users.includes(value)) return
    setUsers([...users, value])
    setUser('')
    setBusy(true)
    try {
      await api('POST', endpoint, { user: value })
    } catch (e) {
      toast.error('Error authorizing the Google account' + errorRef(e))
    } finally {
      setBusy(false)
    }
    void fetchState()
  }

  const revokeUser = async (value: string) => {
    setUsers(users.filter(u => u !== value))
    try {
      await api('DELETE', endpoint, { user: value })
    } catch (e) {
      toast.error('Error revoking the Google account' + errorRef(e))
      void fetchState()
    }
  }

  const dataset = 'xamandb.xappstats.' + appId

  return (
    <Card>
      <CardHeader title="Auto stats export to Google BigQuery" icon={faChartPie} />
      <CardBody>
        {!loaded ? (
          <div className="space-y-2">
            <Skeleton className="h-5" />
            <Skeleton className="h-5" />
            <Skeleton className="h-5 w-2/3" />
          </div>
        ) : !active ? (
          <>
            <p className="text-fg-2">
              To automatically export xApp stats to Google BigQuery for your own detailed analysis or dashboards, activate Google BigQuery stats publishing. We will create a
              private dataset for you. You can then add one or more Google Accounts authorized to access the dataset.
            </p>
            <div className="mt-4 flex justify-end">
              <Button variant="primary" loading={busy} onClick={activate}>
                Activate xApp stats publishing
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-5">
            <div className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
              <Icon icon={faCircleCheck} /> Google BigQuery dataset stats publishing: Enabled
            </div>

            <div>
              <div className="mb-1.5 text-[13px] font-semibold text-fg">External dataset</div>
              <a href={'https://console.cloud.google.com/bigquery?ws=!1m5!1m4!4m3!1sxamandb!2sxappstats!3s' + appId} target="_blank" rel="noopener noreferrer" className="link font-mono text-[12.5px] break-all">
                {dataset}
              </a>
            </div>

            <div>
              <div className="mb-1.5 text-[13px] font-semibold text-fg">Example query</div>
              <pre className="overflow-x-auto rounded-lg border border-line bg-surface-2 p-3 font-mono text-[12px] text-fg-2">{`SELECT *\nFROM \`${dataset}\`\nORDER BY moment DESC\nLIMIT 1`}</pre>
            </div>

            <div>
              <div className="mb-1.5 text-[13px] font-semibold text-fg">Authorizations</div>
              {users.length === 0 ? (
                <Alert tone="danger">There are no authorized users yet, this dataset cannot be queried. Please add a user below.</Alert>
              ) : (
                <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line">
                  {users.map(u => (
                    <li key={u} className="flex items-center justify-between gap-3 px-3 py-2">
                      <span className="min-w-0 truncate font-mono text-[12.5px] text-fg">{u}</span>
                      <button type="button" className="rounded-md p-1.5 text-muted hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-400/10" onClick={() => void revokeUser(u)} aria-label={`Revoke ${u}`} title="Revoke">
                        <Icon icon={faXmark} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <div className="mb-1.5 text-[13px] font-semibold text-fg">Add user(s)</div>
              <p className="mb-2 text-fg-2">To authorize a Google account (Google Apps / For Work / Gmail / ...) to access the dataset with xApp stats, enter an email address:</p>
              <div className="flex gap-2 max-sm:flex-col">
                <Input
                  type="email"
                  placeholder="Google user account, e.g. my-db-admin@gmail.com"
                  value={user}
                  onChange={e => setUser(e.target.value)}
                  onKeyUp={e => e.key === 'Enter' && void addUser()}
                />
                <Button variant="primary" disabled={user.trim() === ''} loading={busy} onClick={addUser}>
                  Authorize Google account
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  )
}

export function AppXapp() {
  const { app, appId } = useSelectedApp()
  const [stats, setStats] = useState<Partial<Stats>>({})

  const enabled = !!app?.details.application_xapp_identifier

  const fetchStats = async () => {
    try {
      setStats((await api('GET', 'console/xapp/' + appId + '/stats')) || {})
    } catch (e) {
      toast.error('Error fetching xApp Stats' + errorRef(e))
    }
  }

  useEffect(() => {
    if (enabled) void fetchStats()
  }, [appId, enabled]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!app) return null

  return (
    <Page>
      <PageHeader title="xApp" subtitle={app.name} icon={faMobileScreen} />

      <p className="mb-5 text-fg-2">
        xApps are WebApps, embedded in Xaman for a great user experience. They add value (tooling, wizards) for end users, using Sign Requests and their Web UI to help users
        perform tasks on the XRPL and beyond. <ExtLink href="https://docs.xumm.dev/environments/xapps-dapps">Read more about xApps in the Developer Docs</ExtLink>.
      </p>

      {!enabled ? (
        <Activate appId={appId} />
      ) : (
        <div className="space-y-5">
          <Alert tone="success" title="xApp enabled">
            This application is xApp enabled: you can load your WebApp in Xaman and use xApp related <ExtLink href="https://docs.xumm.dev/environments/xapps-dapps">features</ExtLink>{' '}
            🎉
          </Alert>
          <Details app={app} appId={appId} />
          <StatsCard appId={appId} stats={stats} reload={fetchStats} />
          {hasStats(stats) && <BigQueryCard appId={appId} />}
        </div>
      )}
    </Page>
  )
}
