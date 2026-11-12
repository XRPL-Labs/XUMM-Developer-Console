/**
 * What a custom node (XRPL protocol) reports about its network: asked over a websocket, from the browser.
 */

export type NetworkInfo = {
  native_asset?: string
  reserve_account?: number
  reserve_object?: number
  chain_id?: number
}

// A `ws://` node can not be reached from a `https://` page: over the websocket proxy of XRPL Labs
const reachable = (endpoint: string) => (endpoint.match(/^ws:/) ? 'wss://custom-node.xrpl-labs.com/ws/' + endpoint.replace(/^ws[s]{0,1}:\/\//, '') : endpoint)

const request = (endpoint: string, commands: string[], timeoutMs: number): Promise<any[] | null> =>
  new Promise(resolve => {
    let socket: WebSocket
    const results: any[] = []
    let done = false

    const finish = (value: any[] | null) => {
      if (done) return
      done = true
      clearTimeout(timer)
      try {
        socket?.close()
      } catch {
        // Closed already
      }
      resolve(value)
    }

    const timer = setTimeout(() => finish(null), timeoutMs)

    try {
      socket = new WebSocket(reachable(endpoint))
    } catch {
      return finish(null)
    }

    socket.onopen = () => commands.forEach((command, id) => socket.send(JSON.stringify({ id, command })))
    socket.onerror = () => finish(null)
    socket.onclose = () => finish(null)
    socket.onmessage = message => {
      try {
        const data = JSON.parse(String(message.data))
        if (typeof data?.id !== 'number' || data.id < 0 || data.id >= commands.length) return
        // The result of a command, or (an error of the node) an empty result
        results[data.id] = data.result || {}
        if (commands.every((_, id) => results[id] !== undefined)) finish(results)
      } catch {
        // Not for us
      }
    }
  })

export const fetchNetworkInfo = async (endpoint: string): Promise<NetworkInfo | null> => {
  const r = await request(endpoint, ['server_info', 'server_definitions'], 6000)
  if (!r) return null

  const [info, defs] = r
  const ledger = info?.info?.validated_ledger

  return {
    native_asset: defs?.native_currency_code || 'XRP',
    ...(ledger?.reserve_base_xrp ? { reserve_account: Number(ledger.reserve_base_xrp || 0) * 1_000_000 } : {}),
    ...(ledger?.reserve_base_native ? { reserve_account: Number(ledger.reserve_base_native || 0) * 1_000_000 } : {}),
    ...(ledger?.reserve_inc_xrp ? { reserve_object: Number(ledger.reserve_inc_xrp || 0) * 1_000_000 } : {}),
    ...(ledger?.reserve_inc_native ? { reserve_object: Number(ledger.reserve_inc_native || 0) * 1_000_000 } : {}),
    chain_id: info?.info?.network_id ? Number(info.info.network_id) : 0,
  }
}
