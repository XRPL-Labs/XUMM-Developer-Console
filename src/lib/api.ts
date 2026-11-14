/**
 * The Xaman API, console endpoints. Authorised with the JWT of the signed in user (Sign in with Xaman).
 */

export const apiEndpoint: string = __API_ENDPOINT__.replace(/\/*$/, '/')

// The live updates of an application: `wss://{api host}/app/{application uuid}`
export const appSocketUrl = (appId: string): string =>
  apiEndpoint.replace(/^http/, 'ws').split('/').slice(0, 3).join('/') + '/app/' + appId

export class ApiError extends Error {
  status?: number
  // The reference of the failed call: support can look the call up with it
  reference?: string
}

// Text for a message: the reference of the failed call, when the API gave one
export const errorRef = (e: unknown): string => {
  const reference = (e as ApiError)?.reference
  return reference ? ` (${reference})` : ''
}

type TokenProvider = () => Promise<string>
type MockHandler = (method: string, endpoint: string, body?: unknown) => Promise<unknown>

let tokenProvider: TokenProvider = async () => ''
let mockHandler: MockHandler | null = null
let apiHasBeen200 = false
let onSessionEnded: () => void = () => {}

// Called before the reload when the API refuses the session (401)
export const setSessionEndedHandler = (handler: () => void) => {
  onSessionEnded = handler
}

export const setTokenProvider = (provider: TokenProvider) => {
  tokenProvider = provider
}

export const setApiMock = (handler: MockHandler) => {
  mockHandler = handler
}

export const getBearer = () => tokenProvider()

// anonymous: a call without a session (sign in with a passkey). No token, and a refusal is not the end of a session.
export async function api<T = any>(method: string, endpoint: string, body?: unknown, options: { anonymous?: boolean } = {}): Promise<T> {
  const httpMethod = method.trim().toUpperCase()

  if (mockHandler) {
    return (await mockHandler(httpMethod, endpoint, body)) as T
  }

  const token = options.anonymous ? '' : await tokenProvider()
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData
  const hasJsonBody = !isForm && typeof body === 'object' && body !== null

  let response: Response
  try {
    response = await fetch(apiEndpoint + endpoint, {
      method: httpMethod,
      headers: {
        ...(options.anonymous ? {} : { Authorization: 'Bearer ' + token }),
        ...(hasJsonBody ? { 'Content-Type': 'application/json' } : {}),
      },
      body: isForm ? (body as FormData) : hasJsonBody ? JSON.stringify(body) : undefined,
    })
  } catch (e) {
    throw Object.assign(new ApiError((e as Error)?.message || 'Network error'), { cause: e })
  }

  let data: any = null
  try {
    data = await response.json()
  } catch {
    // No (JSON) body
  }

  if (!response.ok) {
    const error = new ApiError(data?.error?.message || `API HTTP code ${response.status}`)
    error.status = response.status
    error.reference = data?.error?.reference

    // The session ended (JWT expired): start over at the sign in
    if (response.status === 401 && apiHasBeen200 && !options.anonymous) {
      onSessionEnded()
      window.location.reload()
    }

    throw error
  }

  if (!options.anonymous) apiHasBeen200 = true

  return data as T
}

// A URL the API gave, to send the browser to: over https only (no `javascript:` or other schemes)
export const safeUrl = (url: unknown): string => {
  const parsed = new URL(String(url))
  if (parsed.protocol !== 'https:') throw new Error('Unexpected URL')
  return parsed.href
}
