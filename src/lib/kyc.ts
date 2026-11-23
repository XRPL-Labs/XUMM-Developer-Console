/**
 * KYC for developers: to create or change an application, the account that is signed in needs a KYC in Xaman that is
 * not older than one year.
 *
 * The API decides (GET console/kyc-status):
 * - not required: the action goes on.
 * - required: the dialog (components/KycNeeded.tsx) explains why, and opens the KYC in Xaman. After the KYC the user
 *   asks to check again, and the action that was started goes on.
 * An action that the API refuses for a missing KYC shows the same dialog.
 *
 * An API without this route (404): no question, the console works as before.
 */
import { create } from 'zustand'
import { api, type ApiError } from './api'

// The KYC xApp, opened in Xaman
export const kycUrl = 'https://xaman.app/detect/xapp:xumm.kyc'

// The code of an action that is refused for a missing KYC
const kycNeededCode = 644

// The last days of a KYC: the console tells the user (components/KycNeeded.tsx, KycNotice)
export const kycNoticeDays = 30

export type KycStatus = {
  mode: 'off' | 'log' | 'on'
  required: boolean
  // null: not known
  kyc: boolean | null
  // Why there is no valid KYC: never done for this account, or older than `maxAgeDays`
  reason: 'none' | 'expired' | null
  // The moment of the last KYC of the account (Unix seconds)
  since: number | null
  // The end of the valid KYC (Unix seconds)
  validUntil: number | null
  account: string | null
  maxAgeDays: number
  kycUrl?: string
  // The actions that need the KYC. Not in the answer: all of them.
  actions?: string[]
}

// The actions of the console that create or change an application (the names of the API)
export type KycAction =
  | 'create-app'
  | 'update-app'
  | 'regenerate-secret'
  | 'backend-only'
  | 'add-co-owner'
  | 'xapp-activate'
  | 'xapp-settings'
  | 'ext-stats-activate'
  | 'ext-stats-grant'
  | 'upload-logo'

// The dialog
export type PendingKyc = {
  status: KycStatus | null
  checking: boolean
  // The answer of the last check: no valid KYC (yet), or the check failed
  answer?: 'not-yet' | 'error'
  check: () => void
  cancel: () => void
}

// status: the last answer of the API (for the notice about the end of a KYC)
export const useKyc = create<{ pending: PendingKyc | null; status: KycStatus | null }>(() => ({ pending: null, status: null }))

// An API without the route: asked once
let noStatusRoute = false

// The state of the account that is signed in. Never from a cache. null: not known (the action goes on).
export const fetchKycStatus = async (): Promise<KycStatus | null> => {
  if (noStatusRoute) return null
  try {
    const status = await api<KycStatus>('GET', 'console/kyc-status', undefined, { noCache: true })
    if (typeof status?.required !== 'boolean') return null
    useKyc.setState({ status })
    return status
  } catch (e) {
    if ((e as ApiError)?.status === 404) noStatusRoute = true
    return null
  }
}

export const isKycRefusal = (e: unknown): boolean => (e as ApiError)?.code === kycNeededCode

// The dialog. Resolves true when the API says that the KYC is there, false when the user cancels.
const askForKyc = (first: KycStatus | null): Promise<boolean> =>
  new Promise(resolve => {
    let status = first
    const done = (ok: boolean) => {
      useKyc.setState({ pending: null })
      resolve(ok)
    }
    const show = (state: Pick<PendingKyc, 'checking' | 'answer'>) => useKyc.setState({ pending: { status, ...state, check: () => void check(), cancel: () => done(false) } })
    const check = async () => {
      show({ checking: true })
      const next = await fetchKycStatus()
      if (next) status = next
      if (next && !next.required) return done(true)
      show({ checking: false, answer: next ? 'not-yet' : 'error' })
    }
    show({ checking: false })
  })

/**
 * Runs an action that creates or changes an application. name: the action, as the API names it.
 * Resolves true when the action ran, false when the user cancelled the KYC dialog (the action did not run).
 * Rejects with the error of the action.
 */
export const withKyc = async (name: KycAction, action: () => Promise<void>): Promise<boolean> => {
  const status = await fetchKycStatus()
  const needed = !!status?.required && (!Array.isArray(status.actions) || status.actions.includes(name))
  if (needed && !(await askForKyc(status))) return false
  try {
    await action()
  } catch (e) {
    if (!isKycRefusal(e)) throw e
    // Refused for a missing KYC (the state changed after the question, or the question had no answer)
    noStatusRoute = false
    if (!(await askForKyc(await fetchKycStatus()))) return false
    await action()
  }
  return true
}

// 'March 2026'
export const kycMonth = (ts: number): string => new Date(ts * 1000).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
// '12 March 2026'
export const kycDay = (ts: number): string => new Date(ts * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

// 'one year', '90 days'
export const kycPeriod = (days: number): string => (days === 365 ? 'one year' : days + ' days')
