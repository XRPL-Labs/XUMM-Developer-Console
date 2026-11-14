/**
 * Passkeys (WebAuthn) for the console: add / remove a passkey of the signed in account, and sign in with one.
 * The Xaman API keeps the passkeys and checks them. A passkey is added only with a signed SignIn of the account.
 */
import { api } from './api'

export type Passkey = {
  id: number
  name: string
  created: number
  last_used: number | null
  // Synced by the passkey provider (iCloud Keychain, Google Password Manager, ...)
  backed_up: boolean
  transports: string[]
  // The passkey this session is signed in with
  current: boolean
}

export type PasskeySession = { jwt: string; account: string; expires: number }

// The new passkey, as the API takes it
export type NewCredential = {
  id: string
  rawId: string
  type: string
  response: { clientDataJSON: string; attestationObject: string; transports: string[] }
}

const toBytes = (value: string): Uint8Array<ArrayBuffer> => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))
  const bytes = new Uint8Array(new ArrayBuffer(binary.length))
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

const fromBytes = (buffer: ArrayBuffer): string => {
  let binary = ''
  for (const byte of new Uint8Array(buffer)) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export const passkeysSupported = (): boolean =>
  typeof window !== 'undefined' && typeof window.PublicKeyCredential === 'function' && !!navigator.credentials

// The user closed the browser's passkey dialog (or it timed out): not an error to show
export const isCancelled = (e: unknown): boolean => ['NotAllowedError', 'AbortError'].includes((e as Error)?.name)

export const listPasskeys = async (): Promise<{ passkeys: Passkey[]; max: number }> => {
  const response = await api('GET', 'console/passkeys')
  return { passkeys: Array.isArray(response?.passkeys) ? response.passkeys : [], max: Number(response?.max) || 10 }
}

/**
 * Step 1 of adding a passkey: the browser makes it. Nothing is stored yet.
 * confirm: the SignIn sign request that must confirm this passkey: its custom identifier, and the memo (MemoData, hex)
 * of the transaction. The memo makes the signature for this passkey only.
 */
export type PasskeyConfirm = { identifier: string; memo: string; seconds: number }

export const createPasskey = async (): Promise<{ credential: NewCredential; confirm: PasskeyConfirm }> => {
  const options = await api('POST', 'console/passkeys', { action: 'options' })
  const publicKey = options.publicKey

  const created = (await navigator.credentials.create({
    publicKey: {
      ...publicKey,
      challenge: toBytes(publicKey.challenge),
      user: { ...publicKey.user, id: toBytes(publicKey.user.id) },
      excludeCredentials: (publicKey.excludeCredentials || []).map((c: { id: string; type: 'public-key' }) => ({ ...c, id: toBytes(c.id) })),
    },
  })) as PublicKeyCredential | null
  if (!created) throw new Error('No passkey was created')

  const response = created.response as AuthenticatorAttestationResponse
  return {
    credential: {
      id: created.id,
      rawId: fromBytes(created.rawId),
      type: created.type,
      response: {
        clientDataJSON: fromBytes(response.clientDataJSON),
        attestationObject: fromBytes(response.attestationObject),
        transports: typeof response.getTransports === 'function' ? response.getTransports() : [],
      },
    },
    confirm: options.confirm,
  }
}

// Step 3: store the passkey, with the signed SignIn (payload) as proof
export const addPasskey = (credential: NewCredential, payload: string, name: string): Promise<{ added: boolean; passkey: { id: number; name: string } }> =>
  api('POST', 'console/passkeys', { action: 'add', credential, payload, name })

export const removePasskey = (id: number): Promise<{ removed: boolean }> => api('DELETE', 'console/passkeys/' + id)

// Sign in: the session of the account of the passkey
export const signInWithPasskey = async (): Promise<PasskeySession> => {
  const options = await api('POST', 'console/passkey-login', { action: 'options' }, { anonymous: true })
  const publicKey = options.publicKey

  const assertion = (await navigator.credentials.get({
    publicKey: { ...publicKey, challenge: toBytes(publicKey.challenge), allowCredentials: [] },
  })) as PublicKeyCredential | null
  if (!assertion) throw new Error('No passkey was used')

  const response = assertion.response as AuthenticatorAssertionResponse
  return api(
    'POST',
    'console/passkey-login',
    {
      action: 'verify',
      credential: {
        id: assertion.id,
        rawId: fromBytes(assertion.rawId),
        type: assertion.type,
        response: {
          clientDataJSON: fromBytes(response.clientDataJSON),
          authenticatorData: fromBytes(response.authenticatorData),
          signature: fromBytes(response.signature),
          userHandle: response.userHandle ? fromBytes(response.userHandle) : null,
        },
      },
    },
    { anonymous: true },
  )
}
