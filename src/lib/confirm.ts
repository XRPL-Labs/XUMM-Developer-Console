/**
 * The confirmation in Xaman for a dangerous action: regenerate the API Secret, create an application, remove an
 * application, give another account access to an application, send the webhooks of an application to another URL.
 * A console session alone is not enough for these (a session left open, a passkey session).
 *
 * The API decides (POST console/confirm):
 * - Sign in with Xaman, at most 15 minutes ago: no question.
 * - Sign in with Xaman, longer ago: a sign request (SignIn), signed in Xaman. The action is sent with its proof.
 * - A passkey session: the console can not make a sign request. The user does Sign in with Xaman (then: no question).
 *
 * The last two actions are confirmed for their value (the accounts, the URL): the value goes with the question, and
 * the API answers that no confirmation is needed when the value changes nothing that needs one.
 */
import { create } from 'zustand'
import { api, safeUrl, type ApiError } from './api'
import { getXumm, isMock, signInWithXamanToo } from './auth'
import { useStore } from './store'
import { toast } from './toast'

export type ConfirmAction = 'regenerate-secret' | 'create-app' | 'remove-app' | 'add-co-owner' | 'change-webhook'

// The actions with a value. An API that does not know them (yet) answers 400: then there is nothing to confirm.
const valueActions: ConfirmAction[] = ['add-co-owner', 'change-webhook']

// The proof of a signed confirmation: sent with the action (`confirm` in the body)
export type Confirmation = { challenge: string; payload: string }

type ConfirmOptions =
  | { needed: false }
  | { needed: true; session: 'xaman' | 'passkey'; confirm: { challenge: string; identifier: string; memo: string; instruction: string; seconds: number } }

// The dialog (components/ConfirmInXaman.tsx)
export type PendingConfirm = {
  // The action, for the user: 'Regenerate the API Secret'
  title: string
  step: 'signin' | 'preparing' | 'sign'
  // step signin: the Sign in with Xaman window is open
  busy?: boolean
  // step sign: the sign request
  qr?: string
  link?: string
  instruction?: string
  signIn: () => void
  cancel: () => void
}

export const useConfirm = create<{ pending: PendingConfirm | null }>(() => ({ pending: null }))

const show = (pending: PendingConfirm | null) => useConfirm.setState({ pending })
const noop = () => {}

// The text of a refusal of the API, for the message of the action
export const refusalOf = (e: unknown): string => {
  const error = e as ApiError
  return [403, 404, 503].includes(error?.status ?? 0) && error?.message ? error.message : ''
}

/**
 * Before a dangerous action. Resolves:
 * - undefined: no confirmation needed, do the action
 * - a Confirmation: signed in Xaman, send it with the action (`confirm` in the body)
 * - null: the user cancelled (or did not sign): do not do the action
 * Rejects when the API refuses (e.g. not the owner of the application).
 *
 * value: for 'add-co-owner' the wished list of accounts, for 'change-webhook' the wished webhook URL.
 */
export const confirmInXaman = async (action: ConfirmAction, title: string, app?: string, value?: string | string[]): Promise<Confirmation | undefined | null> => {
  const ask = async (): Promise<ConfirmOptions> => {
    try {
      return await api<ConfirmOptions>('POST', 'console/confirm', { action, ...(app ? { app } : {}), ...(value !== undefined ? { value } : {}) })
    } catch (e) {
      if (valueActions.includes(action) && (e as ApiError)?.status === 400) return { needed: false }
      throw e
    }
  }

  let options = await ask()
  if (!options.needed) return undefined

  try {
    if (options.session === 'passkey') {
      // Sign in with Xaman: a fresh session of Sign in with Xaman needs no confirmation
      const signedIn = await new Promise<boolean>(resolve => {
        const base: PendingConfirm = { title, step: 'signin', signIn: noop, cancel: () => resolve(false) }
        const signIn = async () => {
          show({ ...base, busy: true, signIn: noop })
          const ok = isMock ? await new Promise<boolean>(r => setTimeout(() => r(true), 1500)) : await signInWithXamanToo().catch(() => false)
          if (ok) return resolve(true)
          show({ ...base, signIn: () => void signIn() })
        }
        show({ ...base, signIn: () => void signIn() })
      })
      if (!signedIn) return null
      if (isMock) return undefined

      show({ title, step: 'preparing', signIn: noop, cancel: noop })
      options = await ask()
      if (!options.needed) return undefined
      if (options.session !== 'xaman') throw new Error('Sign in with Xaman to confirm this action')
    }

    // A SignIn sign request for this action: signed in Xaman with the account of the session
    const { confirm } = options
    show({ title, step: 'preparing', signIn: noop, cancel: noop })

    if (isMock) {
      // No Xaman API in mock mode: the dialog, then 'signed'
      const signed = await new Promise<boolean>(resolve => {
        show({ title, step: 'sign', qr: '/theme/xumm-icon-white.svg', link: 'https://xaman.app', instruction: confirm.instruction, signIn: noop, cancel: () => resolve(false) })
        setTimeout(() => resolve(true), 6000)
      })
      return signed ? { challenge: confirm.challenge, payload: '00000000-0000-4000-8000-000000000000' } : null
    }

    let cancelled = false
    const subscription = await getXumm().payload?.createAndSubscribe(
      {
        txjson: { TransactionType: 'SignIn', Memos: [{ Memo: { MemoData: confirm.memo } }] },
        options: { expire: Math.max(1, Math.floor(confirm.seconds / 60)) },
        custom_meta: { identifier: confirm.identifier, instruction: confirm.instruction },
      } as any,
      (e: any) => {
        if (typeof e?.data?.signed === 'boolean') return e.data
        if (e?.data?.expired) return { signed: false, expired: true }
      },
    )
    if (!subscription?.created?.uuid) throw new Error('No sign request')

    show({
      title,
      step: 'sign',
      qr: safeUrl(subscription.created.refs.qr_png),
      link: safeUrl(subscription.created.next.always),
      instruction: confirm.instruction,
      signIn: noop,
      cancel: () => {
        cancelled = true
        subscription.resolve({ signed: false, cancelled: true })
      },
    })

    const result = (await subscription.resolved) as { signed?: boolean; expired?: boolean } | undefined
    if (cancelled) return null
    if (!result?.signed) {
      toast.error(result?.expired ? 'The sign request expired: nothing is changed' : 'The sign request was rejected: nothing is changed')
      return null
    }
    return { challenge: confirm.challenge, payload: subscription.created.uuid }
  } finally {
    show(null)
  }
}

// The account that must sign (the account of the session)
export const useConfirmAccount = () => useStore(s => s.user?.sub || '')
