import { useCallback, useEffect, useState } from 'react'
import { attentionRequest } from '@/services/attentionApi'

export interface LearningTask {
  id: string
  title: string
  estimated_minutes: number
  status: 'todo' | 'in_progress' | 'done'
  steps: Array<{ id: string; text: string; estimated_minutes: number; done: boolean }>
  created_at?: string
}

export function useTaskBreakdown(token: string | undefined) {
  const [tasks, setTasks] = useState<LearningTask[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const response = await attentionRequest<{ tasks: LearningTask[] }>('/attention/tasks', token)
      setTasks(response.tasks)
      setError('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Your tasks could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { void refresh() }, [refresh])

  const create = useCallback(async (title: string, instructions: string) => {
    if (!token) throw new Error('Sign in again to create a checklist.')
    setSaving(true)
    setError('')
    try {
      const response = await attentionRequest<{ task: LearningTask; first_tiny_step: string }>('/attention/tasks/breakdown', token, {
        method: 'POST',
        body: JSON.stringify({ title, instructions }),
      })
      setTasks(current => [response.task, ...current])
      return response.task
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'The checklist could not be created.'
      setError(message)
      throw new Error(message)
    } finally {
      setSaving(false)
    }
  }, [token])

  const update = useCallback(async (task: LearningTask, steps: LearningTask['steps']) => {
    if (!token) throw new Error('Sign in again to update this checklist.')
    const done = steps.length > 0 && steps.every(step => step.done)
    const status: LearningTask['status'] = done ? 'done' : steps.some(step => step.done) ? 'in_progress' : 'todo'
    const updated = { ...task, steps, status }
    setTasks(current => current.map(item => item.id === task.id ? updated : item))
    try {
      const result = await attentionRequest<{ task: LearningTask }>(`/attention/tasks/${task.id}`, token, {
        method: 'PATCH',
        body: JSON.stringify({ status, steps }),
      })
      setTasks(current => current.map(item => item.id === task.id ? result.task : item))
    } catch (caught) {
      setTasks(current => current.map(item => item.id === task.id ? task : item))
      const message = caught instanceof Error ? caught.message : 'This checklist could not be updated.'
      setError(message)
      throw new Error(message)
    }
  }, [token])

  return { tasks, loading, saving, error, create, update, refresh }
}
