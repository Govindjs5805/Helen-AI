import { apiBaseUrl } from '@/services/api'

export async function attentionRequest<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
        Authorization: `Bearer ${token}`,
      },
    })
  } catch {
    throw new Error('Could not reach the learning service. Your focus timer will still work offline.')
  }
  const result = await response.json().catch(() => ({})) as { detail?: string }
  if (!response.ok) throw new Error(result.detail || 'This action could not be saved. Please try again.')
  return result as T
}
