import { useState } from 'react'
import { errorRef } from '../lib/api'
import { isMock, signIn, signInPasskey } from '../lib/auth'
import { isCancelled, passkeysSupported } from '../lib/passkeys'
import { useStore } from '../lib/store'
import { toast } from '../lib/toast'
import { Button, Spinner } from './ui'
import { XamanLogo } from './XamanLogo'
import { Icon, faBolt, faCubes, faFingerprint, faShieldHalved } from './icons'

// The brand panel: what the console is for
function BrandPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-brand-700 text-white lg:flex lg:w-[46%] lg:flex-col lg:justify-between lg:p-10 dark:bg-brand-900">
      <div className="absolute inset-0 opacity-[0.14] [background-image:linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="absolute -bottom-40 -left-40 size-[520px] rounded-full bg-brand-400/40 blur-3xl" />

      <div className="relative flex items-center gap-3">
        <XamanLogo className="h-5" />
        <span className="rounded-md bg-white/15 px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase">Developers</span>
      </div>

      <div className="relative">
        <h1 className="text-[34px] leading-tight font-semibold tracking-tight">
          Build on Xaman.
          <br />
          Your apps, keys and xApps.
        </h1>
        <ul className="mt-8 space-y-4 text-[15px] text-white/85">
          <li className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20">
              <Icon icon={faShieldHalved} />
            </span>
            API credentials, webhooks and OAuth2 redirect URIs
          </li>
          <li className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20">
              <Icon icon={faBolt} />
            </span>
            Live API call logs and sign request payloads
          </li>
          <li className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20">
              <Icon icon={faCubes} />
            </span>
            xApp settings, stats and revenue share
          </li>
        </ul>
      </div>

      <div className="relative text-xs text-white/60">© {new Date().getFullYear()} XRPL Labs</div>
    </div>
  )
}

export function SignIn() {
  const auth = useStore(s => s.auth)
  const [passkeyBusy, setPasskeyBusy] = useState(false)

  const withPasskey = async () => {
    setPasskeyBusy(true)
    try {
      await signInPasskey()
    } catch (e) {
      // Closed the browser's passkey dialog: nothing to report
      if (!isCancelled(e)) {
        toast.show({ key: 'passkey_signin_error', tone: 'error', title: 'Could not sign in with a passkey', description: ((e as Error)?.message || '') + errorRef(e), duration: 10 })
      }
    }
    setPasskeyBusy(false)
  }

  return (
    <div className="flex min-h-dvh">
      <BrandPanel />
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <XamanLogo className="mb-8 h-5 text-fg lg:hidden" />
          <h2 className="text-2xl font-semibold tracking-tight text-fg">Developer Console</h2>
          <p className="mt-2 text-[15px] text-muted">Sign in with your Xaman account to manage your applications, API keys and xApps.</p>

          <Button variant="primary" size="lg" className="mt-8 w-full" loading={auth === 'signingIn'} disabled={passkeyBusy} onClick={() => void signIn()}>
            {auth !== 'signingIn' && <img src="/theme/xumm-icon-white.svg" alt="" className="size-4" />}
            Sign in with Xaman
          </Button>

          {passkeysSupported() && !isMock && (
            <Button size="lg" className="mt-3 w-full" icon={faFingerprint} loading={passkeyBusy} disabled={auth === 'signingIn'} onClick={() => void withPasskey()}>
              Sign in with Passkey
            </Button>
          )}

          <p className="mt-6 text-[13px] leading-relaxed text-muted">
            A sign in request opens in a new window: scan the QR code with Xaman, or confirm the push notification on your device.
            {passkeysSupported() && !isMock && ' After that you can add a passkey (menu top right) to sign in with the fingerprint, face or PIN of this device.'}
          </p>
        </div>
      </div>
    </div>
  )
}

export function FullScreenLoader({ label }: { label: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5">
      <XamanLogo className="h-5 text-fg" />
      <div className="flex items-center gap-2.5 text-[13px] text-muted">
        <Spinner className="size-3.5" />
        {label}
      </div>
    </div>
  )
}
