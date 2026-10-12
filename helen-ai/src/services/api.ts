import { supabase } from '@/services/supabase'

const configuredApiUrl = import.meta.env.VITE_DOCUMENT_API_URL?.trim()

export const apiBaseUrl = (
  configuredApiUrl ||
  `${window.location.protocol}//${window.location.hostname}:8000`
).replace(/\/$/, '')

const API_TIMEOUT_MS = 90_000
const SESSION_TIMEOUT_MS = 15_000
let refreshSessionPromise: ReturnType<typeof supabase.auth.refreshSession> | null = null

function refreshSession() {
  refreshSessionPromise ??= supabase.auth.refreshSession()
  const refreshResult = refreshSessionPromise
  return refreshResult.finally(() => {
    if (refreshSessionPromise === refreshResult) refreshSessionPromise = null
  })
}

async function getSessionWithTimeout() {
  let timeoutId: number | undefined
  try {
    return await Promise.race([
      supabase.auth.getSession(),
      new Promise<never>((_, reject) => {
        timeoutId = window.setTimeout(
          () => reject(new Error('Your sign-in check took too long. Reload the app and sign in again.')),
          SESSION_TIMEOUT_MS
        )
      }),
    ])
  } finally {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId)
  }
}

async function fetchWithTimeout(path: string, init: RequestInit, accessToken?: string): Promise<Response> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS)
  const headers = new Headers(init.headers)
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)

  try {
    return await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    })
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error('The document and quiz service took too long to respond. Check that the backend is running, then retry.')
    }
    throw new Error(`Cannot reach the document and quiz service at ${apiBaseUrl}. Start the backend and check its configuration.`)
  } finally {
    window.clearTimeout(timeout)
  }
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { data: { session: currentSession }, error } = await getSessionWithTimeout()
  if (error) {
    throw new Error('Your sign-in could not be refreshed. Sign in again, then retry.')
  }

  if (!currentSession?.access_token) {
    throw new Error('Your sign-in expired. Sign in again, then retry.')
  }

  const response = await fetchWithTimeout(path, init, currentSession.access_token)
  if (response.status !== 401) return response

  const { data: retried, error: retryError } = await refreshSession()
  if (retryError || !retried.session?.access_token) return response

  return fetchWithTimeout(path, init, retried.session.access_token)
}
