import { useCallback, useEffect, useRef, useState } from 'react'
import { attentionRequest } from '@/services/attentionApi'

export interface FocusTimerState {
  taskLabel: string
  mode: 'idle' | 'focus' | 'break'
  endAt: number | null
  pausedSeconds: number
  sessionId: string | null
  focusElapsedSeconds: number
  focusTotalSeconds: number
}

const EMPTY_STATE: FocusTimerState = {
  taskLabel: '',
  mode: 'idle',
  endAt: null,
  pausedSeconds: 0,
  sessionId: null,
  focusElapsedSeconds: 0,
  focusTotalSeconds: 0,
}

export function useFocusTimer(userId: string | undefined, token: string | undefined) {
  const storageKey = userId ? `helen-ai-focus:${userId}` : ''
  const [timer, setTimer] = useState<FocusTimerState>(EMPTY_STATE)
  const [now, setNow] = useState(Date.now())
  const [error, setError] = useState('')
  const [loadedStorageKey, setLoadedStorageKey] = useState('')
  const lastSessionId = useRef<string | null>(null)

  useEffect(() => {
    setLoadedStorageKey('')
    if (!storageKey) {
      setTimer(EMPTY_STATE)
      lastSessionId.current = null
      return
    }
    try {
      const saved = localStorage.getItem(storageKey)
      if (!saved) {
        setTimer(EMPTY_STATE)
        lastSessionId.current = null
        setLoadedStorageKey(storageKey)
        return
      }
      const parsed = JSON.parse(saved) as Partial<FocusTimerState>
      if (parsed.mode === 'focus' || parsed.mode === 'break') {
        setTimer({ ...EMPTY_STATE, ...parsed })
        lastSessionId.current = parsed.sessionId ?? null
      } else {
        setTimer(EMPTY_STATE)
        lastSessionId.current = null
      }
      setLoadedStorageKey(storageKey)
    } catch {
      setTimer(EMPTY_STATE)
      lastSessionId.current = null
      setError('Your saved timer state could not be restored.')
      setLoadedStorageKey(storageKey)
    }
  }, [storageKey])

  useEffect(() => {
    if (!storageKey || loadedStorageKey !== storageKey) return
    try {
      localStorage.setItem(storageKey, JSON.stringify(timer))
    } catch {
      setError('Your timer is running, but this browser could not save it for later.')
    }
  }, [storageKey, loadedStorageKey, timer])

  useEffect(() => {
    if (!timer.endAt || timer.mode === 'idle') return
    const interval = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(interval)
  }, [timer.endAt, timer.mode])

  const remainingSeconds = timer.endAt
    ? Math.max(0, Math.ceil((timer.endAt - now) / 1000))
    : timer.pausedSeconds

  const start = useCallback(async (taskLabel: string, minutes: number) => {
    setError('')
    const seconds = minutes * 60
    const startedAt = Date.now()
    setTimer({
      taskLabel,
      mode: 'focus',
      endAt: startedAt + seconds * 1000,
      pausedSeconds: seconds,
      sessionId: null,
      focusElapsedSeconds: 0,
      focusTotalSeconds: seconds,
    })
    setNow(startedAt)
    if (token) {
      try {
        const result = await attentionRequest<{ session: { id: string } }>('/attention/focus-sessions', token, {
          method: 'POST',
          body: JSON.stringify({ task_label: taskLabel, planned_minutes: minutes }),
        })
        setTimer(current => current.mode === 'focus' && current.taskLabel === taskLabel
          ? { ...current, sessionId: result.session.id }
          : current)
        lastSessionId.current = result.session.id
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Could not save this session.')
      }
    }
  }, [token])

  const pause = useCallback(() => {
    setTimer(current => ({
      ...current,
      endAt: null,
      pausedSeconds: current.endAt ? Math.max(0, Math.ceil((current.endAt - Date.now()) / 1000)) : current.pausedSeconds,
    }))
  }, [])

  const resume = useCallback(() => {
    setTimer(current => current.mode === 'idle' ? current : {
      ...current,
      endAt: Date.now() + current.pausedSeconds * 1000,
    })
    setNow(Date.now())
  }, [])

  const finish = useCallback(async (status: 'completed' | 'stopped' = 'completed') => {
    const current = timer
    if (current.sessionId) lastSessionId.current = current.sessionId
    const remaining = current.endAt ? Math.max(0, Math.ceil((current.endAt - Date.now()) / 1000)) : current.pausedSeconds
    const elapsed = current.mode === 'focus'
      ? Math.max(0, current.focusTotalSeconds - remaining)
      : current.focusElapsedSeconds
    setTimer(EMPTY_STATE)
    if (current.sessionId && token) {
      try {
        await attentionRequest(`/attention/focus-sessions/${current.sessionId}`, token, {
          method: 'PATCH',
          body: JSON.stringify({
            status,
            ended_at: new Date().toISOString(),
            focus_minutes: Math.floor(elapsed / 60),
          }),
        })
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Could not save the session summary.')
      }
    }
  }, [timer, token])

  const startBreak = useCallback((minutes: number) => {
    const seconds = minutes * 60
    setTimer(current => ({ ...current, mode: 'break', endAt: Date.now() + seconds * 1000, pausedSeconds: seconds }))
    setNow(Date.now())
    if (lastSessionId.current && token) {
      void attentionRequest(`/attention/focus-sessions/${lastSessionId.current}/events`, token, {
        method: 'POST',
        body: JSON.stringify({ event: 'break', minutes }),
      }).catch(caught => {
        setError(caught instanceof Error ? caught.message : 'The break could not be added to your session.')
      })
    }
  }, [token])

  const logEvent = useCallback(async (event: 'stuck' | 'distracted' | 'break', minutes = 0) => {
    if (!timer.sessionId || !token) return
    try {
      await attentionRequest(`/attention/focus-sessions/${timer.sessionId}/events`, token, {
        method: 'POST',
        body: JSON.stringify({ event, minutes }),
      })
      setError('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'This event could not be saved.')
    }
  }, [timer.sessionId, token])

  return { timer, remainingSeconds, error, start, pause, resume, finish, startBreak, logEvent }
}
