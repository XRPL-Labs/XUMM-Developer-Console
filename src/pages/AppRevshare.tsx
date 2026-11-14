import { useEffect, useState } from 'react'
import { api, errorRef, safeUrl } from '../lib/api'
import { getXumm, isMock, signInWithXamanToo } from '../lib/auth'
import { useSelectedApp } from '../lib/routes'
import { useStore } from '../lib/store'
import { toast } from '../lib/toast'
import { SharedAccessAlert } from './shared'
import { Button, Card, CardBody, CardHeader, EmptyState, ExtLink, Page, PageHeader, Skeleton, Stat } from '../components/ui'
import { faTrophy } from '../components/icons'

type Journal = { yearweek: string; fee_txcount: number; revshare_xrp: string; claimtx: string }
type Pending = { fee_txcount?: number; revshare_xrp?: number }

export function AppRevshare() {
  const { app, appId, isOwner } = useSelectedApp()

  const [fetched, setFetched] = useState(false)
  const [journalised, setJournalised] = useState<Journal[]>([])
  const [pending, setPending] = useState<Pending>({})
  // The account is verified: payouts (Checks) are sent
  const [canClaim, setCanClaim] = useState(true)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    if (!appId || !isOwner) return
    let current = true

    api('GET', 'console/revshare/' + appId)
      .then(r => {
        if (!current) return
        const verified = !!r?.verification

        if (Array.isArray(r?.journalised)) {
          setJournalised(
            r.journalised.map((t: any) => ({
              ...t,
              yearweek: String(t.yearweek).slice(0, 4) + ' W' + String(t.yearweek).slice(4),
              revshare_xrp: Number(t.revshare_xrp).toFixed(6),
              claimtx: t.claimtx || (verified ? 'Pending (max. 24h)...' : '-'),
            })),
          )
        }
        if (r?.pending?.[0]?.yearweek) setPending(r.pending[0])
        setCanClaim(verified)
        setFetched(true)
      })
      .catch(e => {
        if (!current) return
        setFetched(true)
        toast.error('Error fetching Revshare data' + errorRef(e))
      })

    return () => {
      current = false
    }
  }, [appId, isOwner])

  // The verification: an (empty) AccountSet transaction, signed with the account of the Developer Console
  const verify = async () => {
    if (isMock) return toast.info('Verification needs a Xaman sign in (not in mock mode)')
    setVerifying(true)
    try {
      // A passkey session can not create a sign request: Sign in with Xaman first
      if (useStore.getState().user?.passkey && !(await signInWithXamanToo())) {
        setVerifying(false)
        return toast.info('Sign in with Xaman is needed for the verification')
      }
      const xumm = getXumm()
      const Account = await xumm.user.account
      const payload = await xumm.payload?.create({
        options: {
          force_network: 'MAINNET',
          signers: [Account],
          return_url: { web: document.location.href },
        },
        custom_meta: { instructions: 'Sign to accept Xaman Revshare payments' },
        txjson: { Account, TransactionType: 'AccountSet' },
      } as any)
      if (!payload?.next?.always) throw new Error('No sign request')
      document.location.href = safeUrl(payload.next.always)
    } catch (e) {
      setVerifying(false)
      toast.error('Could not create the verification sign request' + errorRef(e))
    }
  }

  if (!app) return null

  return (
    <Page>
      <PageHeader title="Revshare" subtitle={app.name} icon={faTrophy} />

      {!isOwner ? (
        <>
          <SharedAccessAlert app={app} className="mb-4" />
          <p className="text-fg-2">As this application has been shared with you, you cannot view the revenue share of this application. Only the application owner can.</p>
        </>
      ) : (
        <div className="space-y-5">
          <Card>
            <CardHeader title="Current week (pending)" />
            <CardBody>
              {!fetched ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Skeleton className="h-[74px]" />
                  <Skeleton className="h-[74px]" />
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Stat label="Amount of fee transactions" value={pending.fee_txcount ?? 0} />
                  <Stat label="Pending fee transaction RevShare" value={pending.revshare_xrp ?? 0} suffix="XRP" />
                </div>
              )}
            </CardBody>
          </Card>

          {!canClaim && (
            <Card>
              <CardHeader title="Payout verification" />
              <CardBody>
                <p className="text-fg-2">
                  Payouts will be automatically processed within 24h, as an on ledger <ExtLink href="https://xrpl.org/docs/concepts/payment-types/checks">Check</ExtLink> sent
                  to your Developer Console account. This account can claim the Check on ledger.
                </p>
                <p className="mt-3 font-semibold text-rose-600 dark:text-rose-400">
                  To be eligible for payouts, your developer console account needs to be periodically verified by signing an empty AccountSet transaction.
                </p>
                <p className="mt-3 text-fg-2">After signing the verification transaction, it can take up to 24h until your payouts are available as Check.</p>
                <div className="mt-4 flex justify-end">
                  <Button variant="primary" loading={verifying} onClick={verify}>
                    Verify account
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader title="Historic Revshare" />
            {!fetched ? (
              <CardBody className="space-y-2">
                <Skeleton className="h-5" />
                <Skeleton className="h-5 w-2/3" />
              </CardBody>
            ) : journalised.length === 0 ? (
              <EmptyState icon={faTrophy} title="No data">
                There is no revenue share for this application yet.
              </EmptyState>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr>
                      {['Year & Week', 'Transaction count', 'XRP RevShare', 'Paid out (TXID)'].map((h, i) => (
                        <th key={h} className={`border-b border-line bg-surface-2 px-5 py-2.5 text-xs font-medium whitespace-nowrap text-muted ${i === 2 ? 'text-right' : ''}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {journalised.map(j => (
                      <tr key={j.yearweek} className="[&:last-child>td]:border-b-0">
                        <td className="border-b border-line px-5 py-3 font-medium whitespace-nowrap text-fg">{j.yearweek}</td>
                        <td className="tabular border-b border-line px-5 py-3 text-fg-2">{j.fee_txcount}</td>
                        <td className="tabular border-b border-line px-5 py-3 text-right text-fg-2">{j.revshare_xrp}</td>
                        <td className="border-b border-line px-5 py-3 font-mono text-[12px] break-all text-fg-2">{j.claimtx}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </Page>
  )
}
