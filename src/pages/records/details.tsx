/**
 * The details of one record: an API call (Logs), a payload (Payloads).
 */
import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { api } from '../../lib/api'
import { appPath } from '../../lib/routes'
import { JsonTree } from '../../components/JsonTree'
import { Badge, Card, CopyButton, ExtLink, Spinner, Tabs, cx } from '../../components/ui'
import { Icon, faArrowRight, faCheck, faCircleExclamation, faLink, faXmark } from '../../components/icons'

export type Rec = Record<string, any> & { call_uuidv4: string }

const mono = 'font-mono text-[12px] break-all'

function PropertyTable({ rows, labelWidth = 'w-52' }: { rows: { key: string; label: ReactNode; value: ReactNode; danger?: boolean }[]; labelWidth?: string }) {
  return (
    <Card className="overflow-hidden">
      <table className="w-full text-left text-[13px]">
        <thead>
          <tr>
            <th className={cx('border-b border-line bg-surface-2 px-4 py-2.5 text-xs font-medium text-muted', labelWidth)}>Property</th>
            <th className="border-b border-line bg-surface-2 px-4 py-2.5 text-xs font-medium text-muted">Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.key} className="[&:last-child>td]:border-b-0">
              <td className="border-b border-line px-4 py-2.5 align-top font-medium text-fg-2">{row.label}</td>
              <td className={cx('border-b border-line px-4 py-2.5 align-top text-fg', row.danger && 'bg-rose-50 dark:bg-rose-400/5')}>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

function Footnotes() {
  return (
    <ul className="mt-3 space-y-1 text-[13px] text-muted">
      <li>
        <b className="text-fg-2">*1</b> The call reference ID is present in the HTTP response header <code className="font-mono text-[12px]">X-Call-Ref</code>.
      </li>
      <li>
        <b className="text-fg-2">*2</b> A client access token allows you to directly deliver new payloads with a push notification to the client:{' '}
        <ExtLink href="https://docs.xumm.dev/concepts/payloads-sign-requests/delivery/push">read more in the developer docs</ExtLink>.
      </li>
    </ul>
  )
}

// A link to a record on the other page (the payload of a call, the call of a payload)
function RecordLink({ to, uuid }: { to: string; uuid: string }) {
  return (
    <Link to={to} className="inline-flex max-w-full items-center gap-2 rounded-md border border-brand-200 bg-brand-50 px-2 py-1 font-mono text-[12px] font-medium text-brand-700 hover:bg-brand-100 dark:border-brand-400/20 dark:bg-brand-400/10 dark:text-brand-300 dark:hover:bg-brand-400/20">
      <Icon icon={faLink} className="shrink-0 text-[10px]" />
      <span className="break-all">{uuid}</span>
      <Icon icon={faArrowRight} className="shrink-0 text-[10px]" />
    </Link>
  )
}

function ErrorValue({ children }: { children: ReactNode }) {
  return (
    <span className={cx(mono, 'inline-flex items-start gap-1.5 text-rose-700 dark:text-rose-300')}>
      <Icon icon={faCircleExclamation} className="mt-0.5 shrink-0" />
      {children}
    </span>
  )
}

function Bool({ yes }: { yes: boolean }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 font-medium', yes ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
      <Icon icon={yes ? faCheck : faXmark} /> {yes ? 'Yes' : 'No'}
    </span>
  )
}

/* Logs */

const logHiddenKeys = ['call_uuidv4_txt', 'call_type', 'call_uuidv4_bin', 'call_version', 'call_endpoint', 'call_moment_ts', 'call_idempotence', 'new']

const logLabels: Record<string, string> = {
  call_uuidv4: 'Call reference ID *1',
  call_moment: 'Call moment',
  call_method: 'HTTP method',
  call_contenttype: 'HTTP content type',
  call_useragent: 'Client user agent',
  call_url: 'Called API endpoint',
  call_httpcode: 'HTTP response code',
  payload_uuidv4: 'Stored payload ID',
  token_issued: 'Client token issued',
  token_expiration: 'Client token expires',
  token_accesstoken: 'Client access token *2',
  token_days_valid: 'Token validity (days)',
  call_ecode: 'Internal error code',
  call_emessage: 'Error (detail) message',
  call_emessage_debug: 'Causing error message',
  call_extref: 'External reference',
}

const extRefPayloadRe = /^payloads\(([a-f0-9-]+)\)/

export function LogDetail({ appId, record }: { appId: string; record: Rec }) {
  const rows = Object.keys(record)
    .filter(k => record[k])
    .filter(k => !logHiddenKeys.includes(k))
    .map(k => {
      const v = record[k]
      let value: ReactNode = <span className={mono}>{String(v)}</span>
      let danger = false

      if (k === 'payload_uuidv4') {
        value = <RecordLink to={appPath(appId, 'app-payloads', v)} uuid={v} />
      } else if (k === 'call_extref' && String(v).match(extRefPayloadRe)) {
        const uuid = String(v).replace(extRefPayloadRe, '$1')
        value = <RecordLink to={appPath(appId, 'app-payloads', uuid)} uuid={uuid} />
      } else if (k.match(/uuidv4|accesstoken/)) {
        value = <span className={cx(mono, 'text-brand-700 dark:text-brand-300')}>{String(v)}</span>
      } else if (k.match(/^call_e(message|code)/)) {
        danger = true
        value = <ErrorValue>{String(v)}</ErrorValue>
      }

      return { key: k, label: logLabels[k] || k, value, danger }
    })

  return (
    <>
      <PropertyTable rows={rows} />
      <Footnotes />
    </>
  )
}

/* Payloads */

const payloadHiddenKeys = ['call_uuidv4_txt', 'call_uuidv4_bin', 'payload_handler', 'payload_created_ts', 'new']
// Shown without a value as well
const payloadForceShowKeys = ['_opened_by_deeplink', 'payload_pathfinding_fallback', '__payload_expired']
const payloadBoolKeys = ['payload_submit', '__payload_expired', 'payload_pathfinding_fallback', 'payload_multisign', 'payload_pathfinding']
const payloadAccountKeys = ['payload_tx_destination', 'payload_response_account', 'payload_response_multisign_account']

const payloadLabels: Record<string, string> = {
  moment: 'Moment (UTC)',
  response_message: 'Response Body',
  call_uuidv4: 'Call reference ID *1',
  token_issued: 'Client token issued',
  token_expiration: 'Client token expires',
  token_accesstoken: 'Client access token *2',
  token_days_valid: 'Token validity (days)',
  call_ecode: 'Internal error code',
  call_emessage: 'Error (detail) message',
  payload_tx_type: 'Transaction type',
  payload_tx_destination: 'Destination account',
  payload_tx_destination_tag: 'Destination tag',
  payload_created: 'Payload create moment',
  payload_expiration: 'Payload expiration moment',
  payload_web_opencount: 'Open count (web)',
  payload_ws_opencount: 'Open count (websocket)',
  payload_api_opencount: 'Open count (API)',
  payload_app_opencount: 'Open count (app)',
  payload_submit: 'Auto-submit after signing',
  payload_pathfinding: 'Allow Pathfinding',
  payload_return_url_app: 'Return URL (app client)',
  payload_return_url_web: 'Return URL (web client)',
  payload_resolved: 'Payload resolved (moment)',
  payload_dispatched_to: 'Signed tx dispatched to',
  payload_dispatched_result: 'Tx submission result',
  payload_dispatched_nodetype: 'Tx submission Node Type',
  payload_response_hex: 'Signed tx blob (HEX)',
  payload_response_txid: 'Signed tx hash',
  payload_response_account: 'Account (transaction)',
  payload_response_multisign_account: 'Account (multisign)',
  payload_request_json: 'Payload JSON',
  payload_multisign: 'Sign for multisign',
  meta_string: 'Custom Identifier',
  meta_blob: 'Meta data (Blob)',
  payload_force_network: 'Force network',
  payload_pathfinding_fallback: 'Pathfinding Fallback',
  meta_user_instruction: 'User instruction',
  payload_reject_initiator: 'Payload rejected by',
  payload_origintype: 'Payload Origin',
  payload_signmethod: 'Signed using (method)',
  _opened_by_deeplink: 'Client opened: Deeplink',
  __payload_expired: 'Payload expired',
}

type WebhookCall = { attempt: number; response_code: number | string; moment?: string; response_message?: string }

function WebhookCalls({ calls }: { calls: WebhookCall[] }) {
  return (
    <div className="space-y-4">
      {calls.map((call, i) => {
        const ok = ['2', '3'].includes(String(call.response_code).slice(0, 1))
        return (
          <Card key={i} className="overflow-hidden">
            <header className={cx('flex items-center justify-between px-4 py-2.5 text-[13px] font-semibold text-white', ok ? 'bg-emerald-600' : 'bg-rose-600')}>
              <span>Attempt #{call.attempt}</span>
              <span className="font-mono text-[12px]">HTTP {call.response_code}</span>
            </header>
            <table className="w-full text-left text-[13px]">
              <tbody>
                {(['moment', 'response_message'] as const).map(key => (
                  <tr key={key} className="[&:last-child>td]:border-b-0">
                    <td className="w-36 border-b border-line px-4 py-2.5 align-top font-medium text-fg-2">{payloadLabels[key]}</td>
                    <td className="border-b border-line px-4 py-2.5 align-top">
                      <pre className="overflow-hidden font-mono text-[12px] break-all whitespace-pre-wrap text-fg">{call[key]}</pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )
      })}
    </div>
  )
}

export function PayloadDetail({ appId, record }: { appId: string; record: Rec }) {
  const [tab, setTab] = useState<'details' | 'webhooks'>('details')
  const [webhookCalls, setWebhookCalls] = useState<WebhookCall[]>([])
  const [webhooksFetched, setWebhooksFetched] = useState(false)

  const uuid = record.call_uuidv4

  // Another payload: its details, and its webhook calls
  useEffect(() => {
    let current = true
    setTab('details')
    setWebhookCalls([])
    setWebhooksFetched(false)

    api('GET', 'console/payload-webhooks/' + appId + '/' + uuid)
      .then(hooks => {
        if (!current || hooks?.record !== uuid) return
        setWebhookCalls(hooks.calls || [])
        setWebhooksFetched(true)
      })
      .catch(() => {})

    return () => {
      current = false
    }
  }, [appId, uuid])

  const rows = Object.keys(record)
    .filter(k => record[k] || payloadForceShowKeys.includes(k))
    .filter(k => !payloadHiddenKeys.includes(k))
    .map(k => {
      const v = record[k]
      let value: ReactNode = <span className={mono}>{String(v)}</span>
      let danger = false

      if (k === 'call_uuidv4') {
        value = <RecordLink to={appPath(appId, 'app-logs', v)} uuid={v} />
      } else if (k === 'payload_request_json' || (k === 'meta_blob' && String(v || '') !== '')) {
        value = <JsonTree json={String(v)} />
      } else if (k.match(/uuidv4|accesstoken/)) {
        value = <span className={cx(mono, 'text-brand-700 dark:text-brand-300')}>{String(v)}</span>
      } else if (k.match(/opencount/)) {
        value = <span className={mono}>{String(v)} time(s)</span>
      } else if (k.match(/return_url/)) {
        value = <span className={mono}>{String(v).replace('{id}', record.call_uuidv4)}</span>
      } else if (k === 'payload_response_txid' || k === 'payload_response_hex' || payloadAccountKeys.includes(k)) {
        value = (
          <div className="flex items-start gap-2">
            <span className={cx(mono, 'min-w-0 flex-1', k === 'payload_response_hex' && 'max-h-28 overflow-y-auto text-brand-700 dark:text-brand-300')}>{String(v)}</span>
            <CopyButton text={String(v)} message={`Copied "${String(v).length > 40 ? String(v).slice(0, 40) + '…' : v}" to clipboard`} />
          </div>
        )
      } else if (k === 'payload_tx_type') {
        value =
          String(v).toLowerCase() === 'signin' ? (
            <ExtLink href="https://docs.xumm.dev/environments/identity-oauth2-openid">{v}</ExtLink>
          ) : (
            <ExtLink href={'https://xrpl.org/docs/references/protocol/transactions/types/' + String(v).toLowerCase()}>{v}</ExtLink>
          )
      } else if (payloadBoolKeys.includes(k)) {
        value = <Bool yes={Number(v || 0) > 0} />
      } else if (k === '_opened_by_deeplink') {
        value = typeof v === 'number' ? <Bool yes={v > 0} /> : <span className="text-muted">Not opened yet...</span>
      } else if (k.match(/^call_e(message|code)/)) {
        danger = true
        value = <ErrorValue>{String(v)}</ErrorValue>
      }

      return { key: k, label: payloadLabels[k] || k, value, danger }
    })

  return (
    <>
      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { key: 'details', label: 'Payload details' },
          {
            key: 'webhooks',
            disabled: !record.payload_resolved || !webhooksFetched || webhookCalls.length < 1,
            label: (
              <>
                Webhook calls
                {!webhooksFetched ? <Spinner className="size-3" /> : webhookCalls.length > 0 ? <Badge tone="brand">{webhookCalls.length}</Badge> : <Badge>NONE</Badge>}
              </>
            ),
          },
        ]}
      />
      {tab === 'details' ? (
        <>
          <PropertyTable rows={rows} />
          <Footnotes />
        </>
      ) : (
        <WebhookCalls calls={webhookCalls} />
      )}
    </>
  )
}
