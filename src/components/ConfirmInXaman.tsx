/**
 * The dialog of a confirmation in Xaman (lib/confirm.ts): a dangerous action needs a signature of the account.
 */
import { useRef } from 'react'
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { useConfirm, useConfirmAccount, type PendingConfirm } from '../lib/confirm'
import { Button, Spinner } from './ui'
import { Icon, faFingerprint, faMobileScreen, faShieldHalved } from './icons'

export function ConfirmInXaman() {
  const pending = useConfirm(s => s.pending)
  const account = useConfirmAccount()
  // The last dialog stays on screen while it closes
  const last = useRef<PendingConfirm | null>(null)
  if (pending) last.current = pending
  const shown = pending || last.current

  return (
    <Dialog open={!!pending} onClose={() => pending?.cancel()} className="relative z-50">
      <DialogBackdrop transition className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] transition duration-200 data-[closed]:opacity-0 dark:bg-black/60" />
      <div className="fixed inset-0 flex items-end justify-center overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:items-center">
        <DialogPanel
          transition
          className="w-full max-w-[26rem] overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl transition duration-200 data-[closed]:translate-y-2 data-[closed]:opacity-0 sm:data-[closed]:translate-y-0 sm:data-[closed]:scale-95"
        >
          {shown && (
            <>
              <div className="flex items-center gap-3.5 border-b border-line bg-surface-2 px-5 py-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-[17px] text-white shadow-sm dark:bg-brand-500">
                  <Icon icon={faShieldHalved} />
                </span>
                <div className="min-w-0">
                  <DialogTitle className="text-[15px] font-semibold text-fg">Confirm in Xaman</DialogTitle>
                  <div className="truncate text-[13px] text-fg-2">{shown.title}</div>
                </div>
              </div>

              <div className="px-5 py-5 text-[13px]">
                {shown.step === 'signin' && (
                  <>
                    <div className="flex gap-3">
                      <Icon icon={faFingerprint} className="mt-0.5 shrink-0 text-[15px] text-muted" />
                      <p className="text-fg-2">
                        You are signed in with a passkey. This action needs a signature of your account: Sign in with Xaman
                        {account && (
                          <>
                            {' '}
                            with <span className="font-mono text-[12px] break-all text-fg">{account}</span>
                          </>
                        )}{' '}
                        to continue.
                      </p>
                    </div>
                    <div className="mt-5 flex justify-end gap-2">
                      <Button onClick={() => shown.cancel()} disabled={shown.busy}>
                        Cancel
                      </Button>
                      <Button variant="primary" loading={shown.busy} onClick={() => shown.signIn()}>
                        {!shown.busy && <img src="/theme/xumm-icon-white.svg" alt="" className="size-4" />}
                        Sign in with Xaman
                      </Button>
                    </div>
                  </>
                )}

                {shown.step === 'preparing' && (
                  <div className="flex items-center justify-center gap-2.5 py-8 text-fg-2">
                    <Spinner className="size-4" />
                    One moment...
                  </div>
                )}

                {shown.step === 'sign' && (
                  <>
                    <div className="flex flex-col items-center">
                      <div className="rounded-xl border border-line bg-white p-2 shadow-sm">
                        <img src={shown.qr} alt="Sign request QR code" className="size-44" />
                      </div>
                      <div className="mt-4 flex items-center gap-2.5 font-medium text-fg">
                        <Spinner className="size-3.5" />
                        Waiting for your signature
                      </div>
                    </div>
                    <p className="mt-3 text-center text-fg-2">
                      Open the push notification in Xaman, or scan the QR code.
                      {account && (
                        <>
                          {' '}
                          Sign with <span className="font-mono text-[12px] break-all text-fg">{account}</span>.
                        </>
                      )}
                    </p>
                    {shown.instruction && (
                      <div className="mt-4 flex gap-2.5 rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-xs text-fg-2">
                        <Icon icon={faMobileScreen} className="mt-0.5 shrink-0 text-muted" />
                        <span>
                          Xaman shows: <span className="text-fg">{shown.instruction}</span>
                        </span>
                      </div>
                    )}
                    <div className="mt-5 flex items-center justify-between gap-2">
                      <a href={shown.link} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-700 hover:underline dark:text-brand-300">
                        Open the sign request
                      </a>
                      <Button onClick={() => shown.cancel()}>Cancel</Button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  )
}
