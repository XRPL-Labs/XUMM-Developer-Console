/**
 * The passkeys of the signed in account: sign in to the console without the Xaman app.
 * A passkey is added only after a SignIn sign request, signed in Xaman with this account.
 */
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { errorRef, safeUrl } from '../lib/api'
import { getXumm, isMock, signInWithXamanToo } from '../lib/auth'
import { addPasskey, createPasskey, isCancelled, listPasskeys, passkeysSupported, removePasskey, type Passkey } from '../lib/passkeys'
import { useStore } from '../lib/store'
import { toast } from '../lib/toast'
import { Alert, Badge, Button, Card, CardBody, CardHeader, Confirm, EmptyState, Field, Input, Page, PageHeader, Skeleton, Spinner, TimeAgo } from '../components/ui'
import { faCircleCheck, faFingerprint, faPlus, faTrash } from '../components/icons'

// The sign request that confirms a new passkey, while the user signs it in Xaman
type Confirmation = { qr: string; link: string }

// A name for the passkey of this device
const defaultName = (): string => {
  const ua = navigator.userAgent
  const device = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android' : /Mac OS X/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : ''
  const browser = /Edg\//.test(ua) ? 'Edge' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : ''
  return [device, browser].filter(Boolean).join(' ')
}

export function Passkeys() {
  const user = useStore(s => s.user)
  const passkeySessionOnly = !!user?.passkey

  const [loaded, setLoaded] = useState(false)
  const [unavailable, setUnavailable] = useState('')
  const [passkeys, setPasskeys] = useState<Passkey[]>([])
  const [max, setMax] = useState(10)

  const [name, setName] = useState(defaultName)
  const [adding, setAdding] = useState(false)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  // Closes the websocket of the sign request, when the user leaves or cancels
  const cancel = useRef<() => void>(() => {})

  const fetchPasskeys = async () => {
    try {
      const response = await listPasskeys()
      setPasskeys(response.passkeys)
      setMax(response.max)
      setUnavailable('')
    } catch (e) {
      setUnavailable((e as Error)?.message || 'Passkeys are not available')
    }
    setLoaded(true)
  }

  useEffect(() => {
    void fetchPasskeys()
    return () => cancel.current()
  }, [])

  const add = async (event: FormEvent) => {
    event.preventDefault()
    if (adding) return
    if (isMock) return toast.info('Adding a passkey needs a Xaman sign in (not in mock mode)')

    setAdding(true)
    try {
      // 1. The browser makes the passkey (nothing is stored yet)
      const { credential, confirm } = await createPasskey()

      // 2. A SignIn sign request for this passkey: signed in Xaman with this account
      const xumm = getXumm()
      let cancelled = false
      const subscription = await xumm.payload?.createAndSubscribe(
        {
          txjson: { TransactionType: 'SignIn', Memos: [{ Memo: { MemoData: confirm.memo } }] },
          options: { expire: Math.max(1, Math.floor(confirm.seconds / 60)) },
          custom_meta: { identifier: confirm.identifier, instruction: 'Confirm: add a passkey to your Xaman Developer Console account' },
        } as any,
        (e: any) => {
          if (typeof e?.data?.signed === 'boolean') return e.data
          if (e?.data?.expired) return { signed: false, expired: true }
        },
      )
      if (!subscription?.created?.uuid) throw new Error('No sign request')
      cancel.current = () => {
        cancelled = true
        subscription.resolve({ signed: false, cancelled: true })
      }
      setConfirmation({ qr: safeUrl(subscription.created.refs.qr_png), link: safeUrl(subscription.created.next.always) })

      const result = (await subscription.resolved) as { signed?: boolean; expired?: boolean } | undefined
      cancel.current = () => {}
      setConfirmation(null)
      if (cancelled) return
      if (!result?.signed) {
        toast.error(result?.expired ? 'The sign request expired: the passkey is not added' : 'The sign request was rejected: the passkey is not added')
        return
      }

      // 3. The API checks the passkey and the signed SignIn, then stores the passkey
      await addPasskey(credential, subscription.created.uuid, name.trim())
      toast.success('Passkey added')
      await fetchPasskeys()
    } catch (e) {
      setConfirmation(null)
      if (!isCancelled(e)) toast.error(((e as Error)?.message || 'Could not add the passkey') + errorRef(e))
    } finally {
      setAdding(false)
    }
  }

  const remove = async (passkey: Passkey) => {
    try {
      await removePasskey(passkey.id)
      toast.success(`Passkey ${passkey.name} removed`)
      await fetchPasskeys()
    } catch (e) {
      toast.error('Error removing the passkey' + errorRef(e))
    }
  }

  const full = passkeys.length >= max

  return (
    <Page>
      <PageHeader title="Passkeys" subtitle={user?.sub} icon={faFingerprint} />

      <p className="mb-4 text-fg-2">
        With a passkey you sign in to the Developer Console with the fingerprint, face or PIN of this device: no QR code, no Xaman app at hand. To add a passkey you confirm
        with a sign request in Xaman, signed with the account you are signed in with.
      </p>

      {loaded && unavailable !== '' ? (
        <Alert tone="warning" title="Passkeys are not available">
          {unavailable}
        </Alert>
      ) : (
        <div className="space-y-5">
          <Card>
            <CardHeader title="Your passkeys" icon={faFingerprint} description={loaded ? `${passkeys.length} of ${max}` : undefined} />
            {!loaded ? (
              <CardBody className="space-y-2">
                <Skeleton className="h-5" />
                <Skeleton className="h-5 w-2/3" />
              </CardBody>
            ) : passkeys.length === 0 ? (
              <EmptyState icon={faFingerprint} title="No passkeys yet">
                Add a passkey below to sign in without the Xaman app.
              </EmptyState>
            ) : (
              <ul className="divide-y divide-line">
                {passkeys.map(p => (
                  <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-[13px] font-medium text-fg">{p.name}</span>
                        {p.current && (
                          <Badge tone="green" icon={faCircleCheck}>
                            This session
                          </Badge>
                        )}
                        {p.backed_up && <Badge>Synced</Badge>}
                      </div>
                      <div className="mt-0.5 text-xs text-muted">
                        Added <TimeAgo date={new Date(p.created * 1000)} />
                        {' · '}
                        {p.last_used ? (
                          <>
                            last used <TimeAgo date={new Date(p.last_used * 1000)} />
                          </>
                        ) : (
                          'not used yet'
                        )}
                      </div>
                    </div>
                    <Confirm
                      title={`Remove the passkey ${p.name}?`}
                      description={p.current ? 'You are signed in with this passkey: this session ends.' : 'You can no longer sign in with it. Also remove it from your device or password manager.'}
                      confirmLabel="Yes, remove"
                      onConfirm={() => remove(p)}
                      size="sm"
                      icon={faTrash}
                    >
                      Remove
                    </Confirm>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Add a passkey" icon={faPlus} />
            <CardBody>
              {!passkeysSupported() ? (
                <Alert tone="warning">This browser does not support passkeys.</Alert>
              ) : passkeySessionOnly ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-fg-2">You are signed in with a passkey. To add another passkey, Sign in with Xaman first: the new passkey is confirmed with a sign request.</p>
                  <Button variant="primary" onClick={() => void signInWithXamanToo()}>
                    <img src="/theme/xumm-icon-white.svg" alt="" className="size-4" />
                    Sign in with Xaman
                  </Button>
                </div>
              ) : confirmation ? (
                <div className="flex flex-wrap items-center gap-6">
                  <img src={confirmation.qr} alt="Sign request QR code" className="size-40 rounded-lg border border-line bg-white p-1.5" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 text-[13px] font-medium text-fg">
                      <Spinner className="size-3.5" />
                      Confirm in Xaman
                    </div>
                    <p className="mt-2 text-fg-2">
                      Sign the request in Xaman with <span className="font-mono text-[12px]">{user?.sub}</span>: open the push notification, or scan the QR code. The passkey
                      is added when the request is signed.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <a href={confirmation.link} target="_blank" rel="noopener noreferrer" className="text-[13px] font-medium text-brand-700 hover:underline dark:text-brand-300">
                        Open the sign request
                      </a>
                      <button type="button" className="ml-auto text-[13px] text-muted hover:text-fg" onClick={() => cancel.current()}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={add} className="flex flex-wrap items-end gap-3">
                  <Field label="Name" hint="For your own reference, e.g. the device." className="min-w-56 flex-1">
                    <Input value={name} onChange={e => setName(e.target.value)} maxLength={64} placeholder="e.g. MacBook" disabled={adding || full} />
                  </Field>
                  <Button type="submit" variant="primary" icon={faPlus} loading={adding} disabled={full} className="mb-[22px]">
                    Add passkey
                  </Button>
                  {full && <p className="w-full text-xs text-muted">At most {max} passkeys: remove one first.</p>}
                </form>
              )}
            </CardBody>
          </Card>
        </div>
      )}
    </Page>
  )
}
