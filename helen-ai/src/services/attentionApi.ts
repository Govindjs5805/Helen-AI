import { apiBaseUrl } from '@/services/api'

export async function attentionRequest<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  let response: Response
  const controller = new AbortController()
  let timedOut = false
  const timeout = window.setTimeout(() => {
    timedOut = true
    controller.abort()
  }, 12_000)
  const abortRequest = () => controller.abort()
  if (init?.signal?.aborted) controller.abort()
  else init?.signal?.addEventListener('abort', abortRequest, { once: true })

  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
        Authorization: `Bearer ${token}`,
      },
    })
  } catch (caught) {
    if (init?.signal?.aborted && caught instanceof Error) throw caught
    if (timedOut) {
      throw new Error('The learning service did not respond in time. Check that the backend is running and try again.')
    }
    throw new Error('Could not reach the learning service. Your focus timer will still work offline.')
  } finally {
    window.clearTimeout(timeout)
    init?.signal?.removeEventListener('abort', abortRequest)
  }
  const result = await response.json().catch(() => ({})) as { detail?: string }
  if (!response.ok) throw new Error(result.detail || 'This action could not be saved. Please try again.')
  return result as T
}
