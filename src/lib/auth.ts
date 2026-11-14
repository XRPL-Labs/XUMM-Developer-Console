/**
 * Sign in with Xaman (OAuth2 PKCE, the Xumm SDK). The JWT of the session authorises the calls to the Xaman API.
 */
import { Xumm } from 'xumm'
import { setSessionEndedHandler, setTokenProvider } from './api'
import { signInWithPasskey, type PasskeySession } from './passkeys'
import { useStore, type User } from './store'
import { toast } from './toast'

export const isMock = import.meta.env.DEV && import.meta.env.VITE_MOCK === '1'

let xumm: Xumm | null = null

export const getXumm = (): Xumm => {
  if (!xumm) throw new Error('Xaman SDK not started')
  return xumm
}

// The key the PKCE flow keeps the session under
const hasStoredSession = (): boolean => {
  try {
    return !!JSON.parse(localStorage.getItem('XummPkceJwt') || '{}')?.jwt
  } catch {
    return false
  }
}

/**
 * The session of a sign in with a passkey: a token of the Xaman API for the account of the passkey. There is no
 * Xaman SDK session with it, so the console can not create sign requests: Sign in with Xaman replaces it.
 */
const passkeyStorageKey = 'XamanConsolePasskeySession'
let passkeySession: PasskeySession | null = null

const storedPasskeySession = (): PasskeySession | null => {
  try {
    const session = JSON.parse(localStorage.getItem(passkeyStorageKey) || 'null')
    if (typeof session?.jwt === 'string' && typeof session?.account === 'string' && Number(session?.expires) > Date.now() / 1000 + 30) {
      return { jwt: session.jwt, account: session.account, expires: Number(session.expires) }
    }
  } catch {
    // No (valid) stored session
  }
  return null
}

const setPasskeySession = (session: PasskeySession | null) => {
  passkeySession = session
  try {
    if (session) localStorage.setItem(passkeyStorageKey, JSON.stringify(session))
    else localStorage.removeItem(passkeyStorageKey)
  } catch {
    // No storage: the session is for this page only
  }
}

const passkeyUser = (account: string): User => ({
  sub: account,
  picture: `https://xumm.app/avatar/${account}.png`,
  passkey: true,
})

// Back from the sign in on a mobile device (redirect instead of popup)
const isReturningFromSignIn = (): boolean => {
  const params = new URLSearchParams(window.location.search)
  return !!(params.get('authorization_code') || params.get('access_token'))
}

const onSignedIn = async (user: User) => {
  useStore.setState({ auth: 'signedIn', user })
  await useStore.getState().fetchApps().catch(e => console.log(e?.message))
}

export const startAuth = async () => {
  if (isMock) {
    const mock = await import('../dev/mock')
    mock.install()
    return onSignedIn(mock.user)
  }

  if (!__XUMM_KEY__) {
    toast.show({
      key: 'no_xumm_key',
      tone: 'error',
      title: 'No Xaman API key',
      description: 'Set VITE_XUMM_KEY in .env to sign in.',
      duration: 0,
    })
    return
  }

  xumm = new Xumm(__XUMM_KEY__)
  const sdk = xumm

  // The properties of the SDK are replaced when the session changes: read them at call time
  setTokenProvider(async () => passkeySession?.jwt || (await sdk.environment.bearer) || '')
  // The API refused the session: a passkey session is over (the page reloads to the sign in)
  setSessionEndedHandler(() => setPasskeySession(null))

  // A stored passkey session, when there is no session of Sign in with Xaman (that one has the SDK: it comes first)
  const storedPasskey = storedPasskeySession()
  const restorePasskey = !!storedPasskey && !hasStoredSession() && !isReturningFromSignIn()
  if (!restorePasskey) setPasskeySession(null)

  if (hasStoredSession() || isReturningFromSignIn()) {
    useStore.setState({ auth: 'restoring' })
    // No answer about the stored session: show the sign in
    setTimeout(() => {
      if (useStore.getState().auth === 'restoring') useStore.setState({ auth: 'signedOut' })
    }, 10000)
  }

  // Ready: the account is known, or the stored session was not valid (and is removed)
  sdk.on('ready', () => {
    if (useStore.getState().auth === 'restoring' && !hasStoredSession()) {
      useStore.setState({ auth: 'signedOut' })
    }
  })

  let signedInAccount = ''

  sdk.on('success', async () => {
    const account = await sdk.user.account
    // The SDK reports a session more than once (retrieved, success)
    if (!account || account === signedInAccount) return
    signedInAccount = account
    // Sign in with Xaman replaces a passkey session
    setPasskeySession(null)

    const [jwt, openid] = await Promise.all([sdk.environment.jwt, sdk.environment.openid])
    const user = { ...(jwt || {}), ...(openid || {}) } as User
    user.sub = user.sub || account
    user.picture = user.picture || `https://xumm.app/avatar/${account}.png`

    console.log('Logged in', account)
    await onSignedIn(user)
  })

  sdk.on('error', (e: Error) => {
    if (useStore.getState().auth !== 'signedIn') useStore.setState({ auth: 'signedOut' })
    toast.show({
      key: 'xumm_signin_error',
      tone: 'error',
      title: 'Could not Sign in with Xaman',
      description: e?.message,
      duration: 10,
    })
  })

  sdk.on('logout', () => {
    useStore.getState().reset()
    // A fresh SDK (and console) for the next sign in
    window.location.assign('/')
  })

  if (restorePasskey && storedPasskey) {
    passkeySession = storedPasskey
    await onSignedIn(passkeyUser(storedPasskey.account))
  }
}

export const signIn = async () => {
  useStore.setState({ auth: 'signingIn' })
  const result = await getXumm().authorize()
  // Closed or rejected: `authorize` resolves with the error
  if ((result instanceof Error || !result) && useStore.getState().auth === 'signingIn') {
    useStore.setState({ auth: 'signedOut' })
  }
}

// Sign in with a passkey of the account. Rejects when the browser dialog is closed or the API refuses the passkey.
export const signInPasskey = async () => {
  const session = await signInWithPasskey()
  setPasskeySession(session)
  await onSignedIn(passkeyUser(session.account))
}

/**
 * In a passkey session: Sign in with Xaman, for what needs a sign request (add a passkey, revenue share
 * verification). The passkey session stays when the sign in is closed or rejected.
 */
export const signInWithXamanToo = async (): Promise<boolean> => {
  const result = await getXumm().authorize()
  return !(result instanceof Error || !result)
}

export const signOut = async () => {
  if (isMock || passkeySession) {
    setPasskeySession(null)
    useStore.getState().reset()
    return window.location.assign('/')
  }
  await getXumm().logout()
}
