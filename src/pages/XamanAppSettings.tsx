/**
 * Settings of the Xaman app of the user (the device the user signed in with): custom nodes.
 */
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { api, errorRef } from '../lib/api'
import { toast } from '../lib/toast'
import { isPrivateHost } from '../lib/validate'
import { fetchNetworkInfo, type NetworkInfo } from '../lib/xrpl-node'
import { Alert, Button, Card, CardBody, CardHeader, Confirm, EmptyState, Field, Input, Page, PageHeader, Skeleton, Spinner } from '../components/ui'
import { faNetworkWired, faPlus, faTrash } from '../components/icons'

type Chain = {
  id: number
  chain_id: number
  color?: string
  name: string
  native_asset: string
  reserve_account: number
  reserve_object: number
  websocket: string
}

type Errors = { name: string; websocketEndpoint: string; chainId: string; nativeAssetCode: string }

const noErrors: Errors = { name: '', websocketEndpoint: '', chainId: '', nativeAssetCode: '' }

// A websocket URL, of a node on a public network
const websocketUrlError = (wsUrl: string): string => {
  try {
    const url = new URL(wsUrl)
    if (url.protocol !== 'ws:' && url.protocol !== 'wss:') return 'Invalid protocol, requires ws:// or wss://'
    if (isPrivateHost(url.hostname)) return 'Invalid Websocket URL'
    return ''
  } catch {
    return 'Invalid Websocket URL'
  }
}

export function XamanAppSettings() {
  const [loaded, setLoaded] = useState(false)
  const [chains, setChains] = useState<Chain[]>([])

  const [name, setName] = useState('')
  const [endpoint, setEndpoint] = useState('')
  const [chainId, setChainId] = useState('')
  const [asset, setAsset] = useState('')
  const [errors, setErrors] = useState<Errors>(noErrors)

  // What the node at the endpoint reports: the network ID and the asset come from the node
  const [info, setInfo] = useState<NetworkInfo>({})
  const probed = useRef<{ endpoint: string; result: Promise<NetworkInfo> }>({ endpoint: '', result: Promise.resolve({}) })
  const [probing, setProbing] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const fetchChains = async () => {
    try {
      const response = await api('GET', 'console/chains')
      setChains(response?.chains || [])
    } catch (e) {
      toast.error('Error fetching your custom nodes' + errorRef(e))
    }
    setLoaded(true)
  }

  useEffect(() => {
    void fetchChains()
  }, [])

  // Once per endpoint
  const probe = (wsUrl: string): Promise<NetworkInfo> => {
    if (probed.current.endpoint === wsUrl) return probed.current.result

    setInfo({})
    const result = (async (): Promise<NetworkInfo> => {
      if (websocketUrlError(wsUrl) !== '') return {}

      setProbing(true)
      const parsed = (await fetchNetworkInfo(wsUrl)) || {}
      setProbing(false)

      // Another endpoint was entered in the meantime
      if (probed.current.endpoint !== wsUrl) return parsed

      setInfo(parsed)
      if (parsed.chain_id !== undefined) setChainId(String(parsed.chain_id))
      if (parsed.native_asset) setAsset(parsed.native_asset)
      return parsed
    })()

    probed.current = { endpoint: wsUrl, result }
    return result
  }

  const validate = async (): Promise<{ valid: boolean; info: NetworkInfo }> => {
    const next: Errors = { ...noErrors }
    let parsed: NetworkInfo = {}

    const urlError = websocketUrlError(endpoint)
    if (urlError !== '') {
      next.websocketEndpoint = urlError
    } else {
      parsed = await probe(endpoint)
      if (!parsed.reserve_account) next.websocketEndpoint = 'Could not verify XRP Ledger Protocol required information'
    }

    // The values of the node, when it reported them
    const id = parsed.chain_id !== undefined ? parsed.chain_id : chainId.trim() === '' ? NaN : Number(chainId)
    const code = parsed.native_asset || asset

    if (!Number.isInteger(id) || id < 0 || id > 4294967295) next.chainId = 'Network ID must be an uint32 number'
    if (name.trim().length < 5) next.name = 'Name must be at least 5 characters'
    else if (name.trim().length > 25) next.name = 'Name must be less than 25 characters'
    if (!/^[A-Z]{3}$/.test(code)) next.nativeAssetCode = 'Native asset code must be three uppercase letters'

    setErrors(next)
    return { valid: Object.values(next).every(e => e === ''), info: parsed }
  }

  const onEndpointBlur = async () => {
    if (endpoint === '' || endpoint === probed.current.endpoint) return
    await probe(endpoint)
    void validate()
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (submitting) return

    setSubmitting(true)
    try {
      const { valid, info: parsed } = await validate()
      if (!valid) return

      await api('POST', 'console/chains', {
        chain_id: parsed.chain_id !== undefined ? parsed.chain_id : Number(chainId),
        name,
        native_asset: parsed.native_asset || asset,
        endpoint,
      })

      setName('')
      setEndpoint('')
      setChainId('')
      setAsset('')
      setInfo({})
      probed.current = { endpoint: '', result: Promise.resolve({}) }

      toast.success('Custom node added')
      await fetchChains()
    } catch (e) {
      toast.error((e as Error)?.message && !(e as Error).message.startsWith('API HTTP') ? (e as Error).message : 'Error adding your custom node' + errorRef(e))
    } finally {
      setSubmitting(false)
    }
  }

  const remove = async (chain: Chain) => {
    setChains(chains.filter(c => c !== chain))
    try {
      await api('DELETE', 'console/chains', chain)
    } catch (e) {
      toast.error('Error removing your custom node' + errorRef(e))
      void fetchChains()
    }
  }

  const fromNode = (value: unknown) => value !== undefined && value !== null && value !== ''

  return (
    <Page wide>
      <PageHeader title="Xaman App settings" />

      <Card>
        <CardHeader title="Custom nodes" icon={faNetworkWired} />
        <CardBody>
          <p className="text-fg-2">
            You can add custom nodes, available in Xaman, allowing you to use your own node for existing networks, or test with your own (test) net(s). These custom nodes can
            be used on the device used to sign in at the Xaman Developer Console.
          </p>
          <Alert tone="info" className="mt-4">
            <b>
              After adding or removing custom nodes, synchronise the node list by opening the Xaman app, going to Settings, Advanced, Network settings &amp; tap the Sync. icon
              in the upper right corner.
            </b>
          </Alert>
        </CardBody>

        <div className="border-t border-line">
          {!loaded ? (
            <CardBody className="space-y-2">
              <Skeleton className="h-5" />
              <Skeleton className="h-5 w-2/3" />
            </CardBody>
          ) : chains.length === 0 ? (
            <EmptyState icon={faNetworkWired} title="No custom nodes">
              You can add a custom node with the form below.
            </EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr>
                    {['Network ID', 'Custom ID', 'Color', 'Name', 'Asset', 'Acc. Reserve', 'Obj. Reserve', 'Websocket URL', ''].map((h, i) => (
                      <th key={i} className="border-b border-line bg-surface-2 px-4 py-2.5 text-xs font-medium whitespace-nowrap text-muted">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chains.map(c => (
                    <tr key={c.id} className="hover:bg-surface-2 [&:last-child>td]:border-b-0 [&>td]:border-b [&>td]:border-line [&>td]:px-4 [&>td]:py-2.5">
                      <td className="tabular text-fg">{c.chain_id}</td>
                      <td className="tabular text-fg-2">{c.id}</td>
                      <td>{c.color && <span className="inline-block size-3.5 rounded border border-line-strong align-middle" style={{ backgroundColor: '#' + String(c.color).slice(-6) }} />}</td>
                      <td className="font-medium whitespace-nowrap text-fg">{c.name}</td>
                      <td className="font-mono text-[12px] text-fg-2">{c.native_asset}</td>
                      <td className="tabular text-fg-2">{c.reserve_account}</td>
                      <td className="tabular text-fg-2">{c.reserve_object}</td>
                      <td className="font-mono text-[12px] break-all text-fg-2">{c.websocket}</td>
                      <td className="text-right">
                        <Confirm title={`Remove ${c.name}?`} description="The custom node is removed from your Xaman app at the next sync." confirmLabel="Yes, remove" onConfirm={() => remove(c)} size="sm" variant="ghost" icon={faTrash}>
                          <span className="sr-only">Remove</span>
                        </Confirm>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      <Card className="mt-5">
        <CardHeader title="Add custom node" icon={faPlus} />
        <CardBody>
          <form onSubmit={submit} noValidate autoComplete="off" className="grid max-w-3xl gap-4 sm:grid-cols-2">
            <Field label="Name" error={errors.name} className="sm:col-span-2">
              <Input placeholder="My Cool Node" minLength={4} maxLength={25} value={name} invalid={!!errors.name} onChange={e => setName(e.target.value)} />
            </Field>
            <Field
              label={
                <span className="inline-flex items-center gap-2">
                  Websocket endpoint {probing && <Spinner className="size-3 text-muted" />}
                </span>
              }
              error={errors.websocketEndpoint}
              hint={probing ? 'Asking the node for its network...' : undefined}
              className="sm:col-span-2"
            >
              <Input
                className="font-mono"
                placeholder="ws://example.com"
                value={endpoint}
                invalid={!!errors.websocketEndpoint}
                onChange={e => setEndpoint(e.target.value)}
                onBlur={onEndpointBlur}
                spellCheck={false}
              />
            </Field>
            <Field label="Network ID" error={errors.chainId} hint={fromNode(info.chain_id) ? 'Reported by the node' : undefined}>
              <Input
                type="number"
                min={0}
                max={4294967295}
                placeholder="1337"
                value={chainId}
                invalid={!!errors.chainId}
                disabled={fromNode(info.chain_id)}
                onChange={e => setChainId(e.target.value)}
              />
            </Field>
            <Field label="Native asset code" error={errors.nativeAssetCode} hint={fromNode(info.native_asset) ? 'Reported by the node' : undefined}>
              <Input className="font-mono" placeholder="ABC" value={asset} invalid={!!errors.nativeAssetCode} disabled={fromNode(info.native_asset)} onChange={e => setAsset(e.target.value)} />
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit" variant="primary" loading={submitting}>
                Submit
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </Page>
  )
}
