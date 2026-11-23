/**
 * KYC for developers (lib/kyc.ts): the dialog when the account needs a KYC to create or change an application, and
 * the notice in the last days of a KYC.
 */
import { useRef, useState } from 'react'
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { safeUrl } from '../lib/api'
import { kycDay, kycMonth, kycNoticeDays, kycPeriod, kycUrl, useKyc, type KycStatus, type PendingKyc } from '../lib/kyc'
import { useStore } from '../lib/store'
import { Button, buttonClass } from './ui'
import { Icon, faArrowUpRightFromSquare, faClock, faIdCard, faShieldHalved, faXmark } from './icons'

// The KYC in Xaman: the link of the API when it is a link to Xaman, else the known link
const linkOf = (status: KycStatus | null): string => {
  try {
    const url = safeUrl(status?.kycUrl)
    return ['xaman.app', 'xumm.app'].includes(new URL(url).hostname) ? url : kycUrl
  } catch {
    return kycUrl
  }
}

export function KycNeeded() {
  const pending = useKyc(s => s.pending)
  const account = useStore(s => s.user?.sub || '')
  // The last dialog stays on screen while it closes
  const last = useRef<PendingKyc | null>(null)
  if (pending) last.current = pending
  const shown = pending || last.current
  const status = shown?.status || null
  const expired = status?.reason === 'expired'
  const days = status?.maxAgeDays ?? 365

  return (
    <Dialog open={!!pending} onClose={() => !pending?.checking && pending?.cancel()} className="relative z-50">
      <DialogBackdrop transition className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] transition duration-200 data-[closed]:opacity-0 dark:bg-black/60" />
      <div className="fixed inset-0 flex items-end justify-center overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:items-center">
        <DialogPanel
          transition
          className="w-full max-w-[28rem] overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl transition duration-200 data-[closed]:translate-y-2 data-[closed]:opacity-0 sm:data-[closed]:translate-y-0 sm:data-[closed]:scale-95"
        >
          {shown && (
            <>
              <div className="flex items-center gap-3.5 border-b border-line bg-surface-2 px-5 py-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-[17px] text-white shadow-sm dark:bg-brand-500">
                  <Icon icon={faIdCard} />
                </span>
                <div className="min-w-0">
                  <DialogTitle className="text-[15px] font-semibold text-fg">{expired ? 'A new KYC is needed' : 'KYC is needed'}</DialogTitle>
                  <div className="truncate text-[13px] text-fg-2">To create or change an application</div>
                </div>
              </div>

              <div className="space-y-3 px-5 py-5 text-[13px] leading-relaxed text-fg-2">
                {expired && (
                  <p className="font-medium text-fg" data-kyc="expired">
                    {status?.since ? `Your KYC of ${kycMonth(status.since)} is older than ${kycPeriod(days)}.` : `Your KYC is older than ${kycPeriod(days)}.`} Do the KYC again to continue.
                  </p>
                )}
                <p>
                  Lately, many scam applications are made. To keep the ecosystem safe for all users, a developer needs a KYC (identity verification) to create or change an
                  application.
                </p>
                <p>
                  Do the KYC in Xaman with the account that is signed in here
                  {account ? (
                    <>
                      : <span className="font-mono text-[12px] break-all text-fg">{account}</span>
                    </>
                  ) : (
                    '.'
                  )}
                </p>
                <p>
                  The KYC has a one-time fee. You pay it in the Xaman app, which shows the amount first.
                  {days > 0 && <> The KYC is valid for {kycPeriod(days)} for the Developer Console.</>}
                </p>
                <div className="flex gap-2.5 rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-xs">
                  <Icon icon={faShieldHalved} className="mt-0.5 shrink-0 text-muted" />
                  <span>
                    Your identity documents and personal details stay with Veriff, the KYC provider. Xaman does not store them. Xaman keeps only the result (approved or not)
                    for your account, a reference to the check at Veriff, the type of document and its expiry date.
                  </span>
                </div>

                {shown.answer && !shown.checking && (
                  <p className="font-medium text-amber-700 dark:text-amber-300" role="status" data-kyc="answer">
                    {shown.answer === 'not-yet'
                      ? 'No valid KYC found for this account yet. Complete the KYC in Xaman, then check again.'
                      : 'The KYC could not be checked. Try again in a moment.'}
                  </p>
                )}

                <div className="flex flex-col gap-2 pt-2">
                  <a href={linkOf(status)} target="_blank" rel="noopener noreferrer" className={buttonClass('primary', 'lg', 'w-full')} data-kyc="start">
                    <img src="/theme/xumm-icon-white.svg" alt="" className="size-4" />
                    Start KYC in Xaman
                    <Icon icon={faArrowUpRightFromSquare} className="text-xs opacity-80" />
                  </a>
                  <div className="flex gap-2">
                    <Button onClick={() => shown.cancel()} disabled={shown.checking}>
                      Cancel
                    </Button>
                    <Button className="min-w-0 flex-1" loading={shown.checking} onClick={() => shown.check()} data-kyc="check">
                      I completed KYC, check again
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  )
}

/* The last days of a KYC: a notice, the console works as before */
export function KycNotice() {
  const status = useKyc(s => s.status)
  const [hidden, setHidden] = useState(false)

  const end = status?.mode === 'on' && status.kyc === true ? status.validUntil : null
  if (hidden || !end || end - Date.now() / 1000 > kycNoticeDays * 86400) return null

  return (
    <div className="flex items-start gap-2.5 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-[13px] text-amber-900 sm:px-6 dark:border-amber-400/20 dark:bg-amber-400/5 dark:text-amber-200" role="status" data-kyc="notice">
      <Icon icon={faClock} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
      <span className="min-w-0 flex-1">
        Your KYC for the Developer Console is valid until {kycDay(end)}. After that date a new KYC is needed to create or change an application. Your present KYC stays valid
        until the new one is approved.{' '}
        <a href={linkOf(status)} target="_blank" rel="noopener noreferrer" className="font-semibold whitespace-nowrap underline underline-offset-2 hover:no-underline" data-kyc="renew">
          Renew now
        </a>
      </span>
      <button type="button" className="-my-0.5 shrink-0 rounded-md p-1 hover:bg-amber-100 dark:hover:bg-amber-400/10" onClick={() => setHidden(true)} aria-label="Hide this notice">
        <Icon icon={faXmark} />
      </button>
    </div>
  )
}
