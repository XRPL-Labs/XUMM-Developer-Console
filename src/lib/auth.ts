/**
 * Sign in with Xaman (OAuth2 PKCE, the Xumm SDK). The JWT of the session authorises the calls to the Xaman API.
 */
import { Xumm } from 'xumm'
import { setTokenProvider } from './api'
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
  setTokenProvider(async () => (await sdk.environment.bearer) || '')

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
}

export const signIn = async () => {
  useStore.setState({ auth: 'signingIn' })
  const result = await getXumm().authorize()
  // Closed or rejected: `authorize` resolves with the error
  if ((result instanceof Error || !result) && useStore.getState().auth === 'signingIn') {
    useStore.setState({ auth: 'signedOut' })
  }
}

export const signOut = async () => {
  if (isMock) {
    useStore.getState().reset()
    return window.location.assign('/')
  }
  await getXumm().logout()
}
