/**
 * Development only (`bun run dev:mock`): the console without a sign in and without the Xaman API.
 * A signed in user, three applications and their records, kept in memory. Not part of a production build.
 */
import { setApiMock } from '../lib/api'
import type { AppDetails, User } from '../lib/store'

const account = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'

export const user: User = {
  sub: account,
  name: 'Mock Developer',
  picture: `https://xumm.app/avatar/${account}.png`,
}

const uuid = (n: number, prefix = '00000000') => `${prefix}-0000-4000-a000-${String(n).padStart(12, '0')}`
const hexBytes = (hex: string) => ({ type: 'Buffer', data: hex.match(/../g)!.map(b => parseInt(b, 16)) })
const wait = (ms = 250) => new Promise(resolve => setTimeout(resolve, ms))
const now = () => Math.floor(Date.now() / 1000)
const sqlDate = (ts: number) => new Date(ts * 1000).toISOString().slice(0, 19).replace('T', ' ')

const icon = (seed: string) => `https://xumm-cdn.imgix.net/app-logo/${seed}.png`

const apps: AppDetails[] = [
  {
    application_uuidv4: uuid(1, 'aaaaaaaa'),
    application_name: 'Sandbox Wallet Tools',
    application_description: 'Tools for power users: escrows, checks and multi sign, in a sandbox xApp.',
    application_icon_url: icon('27d62e4d-2972-4582-8ae6-f1c64d0e7499'),
    application_webhookurl: 'https://webhook.site/7f1b3c1e-mock',
    application_redirect_uris: 'https://wallet-tools.example/callback\nhttp://localhost:3000/callback',
    application_infourl_homepage: 'https://wallet-tools.example',
    application_infourl_terms: '',
    application_infourl_support: 'https://wallet-tools.example/support',
    application_infourl_privacy: 'https://wallet-tools.example/privacy',
    application_dev_email: 'dev@wallet-tools.example',
    application_auth0_owner: account,
    application_shared_with: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
    application_xapp_identifier: 'sandbox.4ac5d2b1e0f3',
    application_xapp_url: 'https://wallet-tools.example/xapp',
    application_xapp_networks: ['MAINNET', 'TESTNET'],
    application_xapp_debug_device_uuidv4_bin: hexBytes('D5017A3583F642E2B83ED95EA3028B47'),
    application_xapp_debug_devices_uuids: 'C2B4E9F0-1A2B-4C3D-8E4F-5A6B7C8D9E0F',
    application_xummloader: 1,
    application_no_netswitch_rld: 0,
    application_no_monetization: 0,
    payload_create_backend_only: 0,
    application_xapp_listed: 0,
    application_xapp_featured: 0,
    application_permissions_xapp_push: 0,
    application_token_exp_days: 30,
  },
  {
    application_uuidv4: uuid(2, 'bbbbbbbb'),
    application_name: 'Coffee Shop Checkout',
    application_description: 'Pay for your coffee with a sign request.',
    application_icon_url: icon('27d62e4d-2972-4582-8ae6-f1c64d0e7499'),
    application_webhookurl: '',
    application_redirect_uris: '',
    application_infourl_homepage: '',
    application_infourl_terms: '',
    application_infourl_support: '',
    application_infourl_privacy: '',
    application_dev_email: '',
    application_auth0_owner: account,
    application_shared_with: null,
    application_xapp_identifier: null,
    application_xapp_networks: [],
  },
  {
    application_uuidv4: uuid(3, 'cccccccc'),
    application_name: 'Listed xApp (shared with you)',
    application_description: 'A public, listed xApp of another developer.',
    application_icon_url: icon('27d62e4d-2972-4582-8ae6-f1c64d0e7499'),
    application_webhookurl: 'https://listed.example/hooks',
    application_redirect_uris: '',
    application_infourl_homepage: 'https://listed.example',
    application_infourl_terms: 'https://listed.example/terms',
    application_infourl_support: 'https://listed.example/support',
    application_infourl_privacy: 'https://listed.example/privacy',
    application_dev_email: 'hello@listed.example',
    application_auth0_owner: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
    application_shared_with: account,
    application_xapp_identifier: 'listed.tools',
    application_xapp_url: 'https://listed.example/xapp',
    application_xapp_networks: ['MAINNET', 'XAHAU', 'TESTNET'],
    application_xapp_debug_device_uuidv4_bin: null,
    application_xapp_debug_devices_uuids: '',
    application_xummloader: 0,
    application_no_netswitch_rld: 1,
    application_no_monetization: 1,
    payload_create_backend_only: 2,
    application_xapp_listed: 1,
    application_xapp_featured: 0,
    application_permissions_xapp_push: 1,
    application_token_exp_days: 90,
  },
]

const calls = (app: string) =>
  Array.from({ length: 40 }, (_, i) => {
    const ts = now() - i * 137 - 20
    const type = i % 5
    const base = {
      call_uuidv4: uuid(1000 + i, app.slice(0, 8)),
      call_uuidv4_txt: uuid(1000 + i, app.slice(0, 8)),
      call_moment: sqlDate(ts),
      call_moment_ts: ts,
      call_type: i % 7 === 3 ? 'app' : 'api',
      call_version: 'v1',
      call_contenttype: 'application/json',
      call_useragent: i % 7 === 3 ? 'Xaman/4.2.0 (iOS)' : 'xumm-sdk/node (1.11.2)',
    }
    if (type === 0) return { ...base, call_method: 'POST', call_endpoint: 'payload', call_url: '/api/v1/platform/payload', call_httpcode: 200, payload_uuidv4: uuid(2000 + i, app.slice(0, 8)) }
    if (type === 1) return { ...base, call_method: 'GET', call_endpoint: 'payload', call_url: '/api/v1/platform/payload/' + uuid(2000 + i - 1, app.slice(0, 8)), call_httpcode: 200, call_extref: `payloads(${uuid(2000 + i - 1, app.slice(0, 8))})` }
    if (type === 2) return { ...base, call_method: 'GET', call_endpoint: 'ping', call_url: '/api/v1/platform/ping', call_httpcode: 200 }
    if (type === 3) return { ...base, call_method: 'POST', call_endpoint: 'payload', call_url: '/api/v1/platform/payload', call_httpcode: 400, call_ecode: 602, call_emessage: 'Payload encoding error', call_emessage_debug: 'Unknown transaction type: Paymnt' }
    return { ...base, call_method: 'DELETE', call_endpoint: 'payload', call_url: '/api/v1/platform/payload/' + uuid(2000 + i - 4, app.slice(0, 8)), call_httpcode: 200, token_accesstoken: uuid(3000 + i), token_issued: sqlDate(ts - 86400), token_expiration: sqlDate(ts + 86400 * 29), token_days_valid: 30 }
  })

const payloads = (app: string) =>
  Array.from({ length: 25 }, (_, i) => {
    const ts = now() - i * 311 - 45
    const signed = i % 3 === 0
    const expired = i % 3 === 1
    const signIn = i % 4 === 0
    const txjson = signIn ? { TransactionType: 'SignIn' } : { TransactionType: i % 4 === 3 ? 'TrustSet' : 'Payment', Destination: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn', Amount: String(1_000_000 * (i + 1)), Memos: [{ Memo: { MemoData: 'F09F988E' } }] }
    return {
      call_uuidv4: uuid(2000 + i * 5, app.slice(0, 8)),
      call_uuidv4_txt: uuid(2000 + i * 5, app.slice(0, 8)),
      payload_tx_type: txjson.TransactionType,
      payload_tx_destination: signIn ? '' : 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
      payload_tx_destination_tag: null,
      payload_created: sqlDate(ts),
      payload_created_ts: ts,
      payload_expiration: sqlDate(ts + 86400),
      payload_request_json: JSON.stringify(txjson),
      payload_submit: 1,
      payload_multisign: 0,
      payload_pathfinding: 0,
      payload_pathfinding_fallback: 0,
      payload_web_opencount: i % 2,
      payload_ws_opencount: 1,
      payload_api_opencount: 2,
      payload_app_opencount: signed || i % 2 ? 1 : 0,
      payload_return_url_web: i % 2 ? 'https://wallet-tools.example/thanks?payload={id}' : '',
      payload_origintype: 'QR',
      payload_force_network: i % 6 === 0 ? 'MAINNET' : '',
      meta_string: i % 2 ? 'order-' + (4200 + i) : '',
      meta_blob: i % 5 === 0 ? JSON.stringify({ cart: [{ sku: 'espresso', qty: 2 }], table: 7 }) : '',
      meta_user_instruction: i % 2 ? 'Pay for your order' : '',
      _opened_by_deeplink: signed ? 1 : i % 2 ? 0 : null,
      __payload_expired: expired ? 1 : 0,
      ...(signed
        ? {
            payload_resolved: sqlDate(ts + 42),
            payload_signmethod: 'BIOMETRIC',
            payload_response_account: account,
            payload_response_txid: 'A1B2C3D4E5F60718293A4B5C6D7E8F90A1B2C3D4E5F60718293A4B5C6D7E8F9' + (i % 10),
            payload_response_hex: '1200002280000000240000000161400000000000000A68400000000000000C7321'.repeat(6),
            payload_dispatched_to: signIn ? '' : 'wss://xrplcluster.com',
            payload_dispatched_result: signIn ? '' : 'tesSUCCESS',
            payload_dispatched_nodetype: signIn ? '' : 'MAINNET',
          }
        : {}),
    }
  })

const records: Record<string, { calls: any[]; payloads: any[] }> = {}
const recordsOf = (app: string) => (records[app] ||= { calls: calls(app), payloads: payloads(app) })

let chains = [
  { id: 12, chain_id: 21338, color: 'FF8855AA', name: 'My Xahau Testnet node', native_asset: 'XAH', reserve_account: 1, reserve_object: 0.2, websocket: 'wss://xahau-test.example' },
  { id: 9, chain_id: 0, color: 'FF2299DD', name: 'Own mainnet node', native_asset: 'XRP', reserve_account: 1, reserve_object: 0.2, websocket: 'wss://node.example:51233' },
]

const extStats: Record<string, { active: boolean; grants: string[] }> = {}
const pendingEvents: Record<string, number> = {}
let sharedAccounts = ['rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn', 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH']

const rails = {
  MAINNET: { color: '#2E5BFF', name: 'XRP Ledger', chain_id: 0 },
  TESTNET: { color: '#FF8A00', name: 'XRPL Testnet', chain_id: 1 },
  DEVNET: { color: '#B300FF', name: 'XRPL Devnet', chain_id: 2 },
  XAHAU: { color: '#FFCC00', name: 'Xahau', chain_id: 21337 },
  XAHAUTESTNET: { color: '#FF6600', name: 'Xahau Testnet', chain_id: 21338 },
}

let passkeys = [
  { id: 1, name: 'Mac Chrome', created: now() - 40 * 86400, last_used: now() - 3600, backed_up: true, transports: ['internal', 'hybrid'], current: false },
  { id: 2, name: 'YubiKey', created: now() - 5 * 86400, last_used: null, backed_up: false, transports: ['usb'], current: false },
]

const fail = (message: string, status = 400) => Object.assign(new Error(message), { status, reference: uuid(9999) })

async function handler(method: string, endpoint: string, body: any): Promise<unknown> {
  await wait()
  console.log('[mock api]', method, endpoint, body ?? '')

  const [path, query = ''] = endpoint.split('?')
  const seg = path.replace(/\/$/, '').split('/')
  const app = apps.find(a => a.application_uuidv4 === seg[2])

  if (path === 'console/known-shared-accounts') {
    if (method === 'POST') {
      const target = apps.find(a => a.application_uuidv4 === body.app)
      if (target) target.application_shared_with = body.sharedWith.join(',')
      sharedAccounts = [...new Set([...sharedAccounts, ...body.sharedWith])]
      return { added: body.sharedWith, removed: [] }
    }
    return { accounts: sharedAccounts }
  }

  if (path === 'console/apps') return { applications: apps.map(a => ({ ...a })) }
  if (path === 'platform/rails') return rails

  if (seg[1] === 'passkeys') {
    if (method === 'GET') return { passkeys: passkeys.map(p => ({ ...p })), max: 10 }
    if (method === 'DELETE') {
      passkeys = passkeys.filter(p => p.id !== Number(seg[2]))
      return { removed: true }
    }
    throw fail('Mock API: adding a passkey needs the Xaman API', 503)
  }

  if (path === 'console/store-logo') return { uploaded: true, file: { key: 'app-logo/27d62e4d-2972-4582-8ae6-f1c64d0e7499.png' } }

  if (seg[1] === 'app') {
    if (method === 'PATCH' && body?.regenerateSecret) return { updated: true, credentials: { secret: crypto.randomUUID() } }
    if (method === 'PATCH' && typeof body?.backendOnly === 'boolean') {
      if (app) app.payload_create_backend_only = body.backendOnly ? 1 : 3
      return { updated: true, credentials: { secret: null } }
    }
    if (method === 'DELETE' && body?.removeApp) {
      apps.splice(apps.indexOf(app!), 1)
      return { updated: true }
    }
    if (app) {
      Object.assign(app, {
        application_name: body.appName.trim(),
        application_description: body.appDescription.trim(),
        application_webhookurl: body.appWebhookUrl,
        application_redirect_uris: body.redirectUris,
        application_infourl_homepage: body.infourlHomepage,
        application_infourl_terms: body.infourlTerms,
        application_infourl_support: body.infourlSupport,
        application_infourl_privacy: body.infourlPrivacy,
        application_dev_email: body.devEmail,
        application_icon_url: body.appIcon,
      })
      return { updated: true, uuidv4: app.application_uuidv4, name: app.application_name }
    }
    const created: AppDetails = {
      application_uuidv4: crypto.randomUUID(),
      application_name: body.appName.trim(),
      application_description: body.appDescription.trim(),
      application_icon_url: body.appIcon,
      application_auth0_owner: account,
      application_xapp_networks: [],
    }
    apps.push(created)
    return { created: true, uuidv4: created.application_uuidv4, name: created.application_name, credentials: { secret: crypto.randomUUID() } }
  }

  if (seg[1] === 'calls' || seg[1] === 'payloads') {
    const list = recordsOf(seg[2])[seg[1] as 'calls' | 'payloads']
    if (query.includes('one=true')) {
      const needle = (seg[3] || '').toLowerCase()
      return list.filter(r => r.call_uuidv4 === needle || String(r.payload_response_txid || '').toLowerCase() === needle).slice(0, 1)
    }
    return list
  }

  if (seg[1] === 'payload-webhooks') {
    const payload = recordsOf(seg[2]).payloads.find(p => p.call_uuidv4 === seg[3])
    return {
      record: seg[3],
      calls: payload?.payload_resolved
        ? [
            { attempt: 1, response_code: 500, moment: payload.payload_resolved, response_message: 'Internal Server Error' },
            { attempt: 2, response_code: 200, moment: payload.payload_resolved, response_message: '{"ok":true}' },
          ]
        : [],
    }
  }

  if (seg[1] === 'revshare') {
    return {
      journalised: [
        { yearweek: 202645, fee_txcount: 312, revshare_xrp: 18.204511, claimtx: null },
        { yearweek: 202644, fee_txcount: 287, revshare_xrp: 16.9, claimtx: '5F1C0D7E2A9B4C3D8E6F7A1B2C3D4E5F60718293A4B5C6D7E8F9A0B1C2D3E4F5' },
        { yearweek: 202643, fee_txcount: 301, revshare_xrp: 17.33, claimtx: '0A1B2C3D4E5F60718293A4B5C6D7E8F95F1C0D7E2A9B4C3D8E6F7A1B2C3D4E5F' },
      ],
      pending: [{ yearweek: 202646, fee_txcount: 96, revshare_xrp: 5.412 }],
      verification: seg[2] !== uuid(1, 'aaaaaaaa'),
    }
  }

  if (seg[1] === 'chains') {
    if (method === 'POST') {
      chains = [{ id: Math.max(0, ...chains.map(c => c.id)) + 1, chain_id: body.chain_id, color: 'FF00AA88', name: body.name, native_asset: body.native_asset, reserve_account: 1, reserve_object: 0.2, websocket: body.endpoint }, ...chains]
      return { added: true }
    }
    if (method === 'DELETE') {
      chains = chains.filter(c => c.id !== body.id)
      return { removed: true }
    }
    return { chains }
  }

  if (seg[1] === 'docs-jwt') return { finalUrl: 'https://xumm.readme.io/reference' }

  if (seg[1] === 'xapp' && app) {
    const id = app.application_uuidv4
    switch (seg[3]) {
      case 'activate':
        Object.assign(app, { application_xapp_identifier: 'sandbox.' + id.slice(0, 12).replace(/-/g, ''), application_xapp_url: '', application_xapp_networks: ['MAINNET'], application_token_exp_days: 30 })
        return { identifier: app.application_xapp_identifier, valid: true }
      case 'debug':
        if (body.xAppDestinationUrl && !/^https/.test(body.xAppDestinationUrl)) throw fail('Assertion failed')
        Object.assign(app, {
          application_xapp_debug_device_uuidv4_bin: body.devUuid ? hexBytes(body.devUuid.replace(/-/g, '').toUpperCase()) : null,
          application_xummloader: Number(!!body.xummLoader),
          application_no_netswitch_rld: Number(!!body.xummEvent),
          application_xapp_networks: body.xAppNetworks,
          ...(typeof body.sandboxUuids === 'string' ? { application_xapp_debug_devices_uuids: body.sandboxUuids.toUpperCase() } : {}),
          ...(typeof body.xAppDestinationUrl === 'string' ? { application_xapp_url: body.xAppDestinationUrl } : {}),
        })
        return { uuid: body.devUuid, application_xapp_url: body.xAppDestinationUrl }
      case 'stats':
        return { d1: { c: 1284, u: 311 }, d30: { c: 40211, u: 6120 }, all_time: { c: 512004 } }
      case 'xapp-events':
        pendingEvents[id] ??= 7
        if (method === 'DELETE') {
          pendingEvents[id] = 0
          return { done: true }
        }
        return { event_count: pendingEvents[id], method }
      case 'ext-stats': {
        const state = (extStats[id] ||= { active: false, grants: [] })
        if (method === 'POST' && body?.user) state.grants.push(body.user)
        else if (method === 'POST') state.active = true
        else if (method === 'DELETE') state.grants = state.grants.filter(g => g !== body.user)
        return state.active ? { active: true, grants: [...state.grants] } : { active: false }
      }
    }
  }

  throw fail('Mock API: no such endpoint ' + method + ' ' + endpoint, 404)
}

export const install = () => setApiMock(handler)
