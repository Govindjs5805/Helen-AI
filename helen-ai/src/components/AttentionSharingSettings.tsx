import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { attentionRequest } from '@/services/attentionApi'

interface ShareEntry {
  id: string
  recipient_role?: 'parent' | 'teacher'
  recipient_email?: string
  recipient_name?: string
  share_focus_summary: boolean
  share_task_progress: boolean
  share_accommodations: boolean
  expires_at?: string
}

interface SharesResponse {
  shares: ShareEntry[]
  pending_invites: ShareEntry[]
}

export function AttentionSharingSettings() {
  const { session } = useAuth()
  const [email, setEmail] = useState('')
  const [focus, setFocus] = useState(false)
  const [tasks, setTasks] = useState(false)
  const [accommodations, setAccommodations] = useState(false)
  const [shares, setShares] = useState<SharesResponse>({ shares: [], pending_invites: [] })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    if (!session?.access_token) return
    setLoading(true)
    try {
      setShares(await attentionRequest<SharesResponse>('/attention/shares', session.access_token))
      setError('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Sharing settings could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [session?.access_token])

  useEffect(() => { void refresh() }, [refresh])

  async function invite(event: React.FormEvent) {
    event.preventDefault()
    if (!session?.access_token) return
    setSaving(true)
    setMessage('')
    setError('')
    try {
      const response = await attentionRequest<{ code: string }>('/attention/shares/invites', session.access_token, {
        method: 'POST',
        body: JSON.stringify({
          recipient_email: email.trim(),
          share_focus_summary: focus,
          share_task_progress: tasks,
          share_accommodations: accommodations,
        }),
      })
      setCode(response.code)
      setMessage('Invite created. Copy this one-time code and share it only with the intended person. It expires in 24 hours.')
      setEmail('')
      await refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The sharing invite could not be created.')
    } finally {
      setSaving(false)
    }
  }

  async function revoke(id: string, invite = false) {
    if (!session?.access_token) return
    try {
      await attentionRequest(`/attention/shares/${invite ? 'invites/' : ''}${id}`, session.access_token, { method: 'DELETE' })
      setMessage(invite ? 'The invite was revoked.' : 'Sharing permission was revoked.')
      setCode('')
      await refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Sharing could not be revoked.')
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code)
      setMessage('Invite code copied.')
    } catch {
      setMessage('Copy is unavailable. Select and copy the code manually.')
    }
  }

  return (
    <section className="space-y-5 rounded-xl border border-text/15 bg-surface p-5 sm:p-7" aria-labelledby="attention-sharing-title">
      <header>
        <h2 id="attention-sharing-title" className="font-heading text-xl font-semibold">Share attention summaries</h2>
        <p className="mt-1 text-sm text-text/70">Private by default. You choose the account and the specific information. You can revoke access at any time.</p>
      </header>
      <form onSubmit={event => void invite(event)} className="space-y-3 rounded-lg border border-text/10 bg-background p-4">
        <label htmlFor="share-email" className="block text-sm font-semibold">Parent or teacher account email
          <input id="share-email" type="email" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} className="mt-1 min-h-11 w-full rounded-md border border-text/25 bg-surface px-3 font-normal" />
        </label>
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">Choose what they can see</legend>
          <Check checked={focus} onChange={setFocus} label="Weekly focus-session summary (counts and average duration only)" />
          <Check checked={tasks} onChange={setTasks} label="Task completion trends (counts only, not task titles or instructions)" />
          <Check checked={accommodations} onChange={setAccommodations} label="Focus and chunking preferences to guide accommodations" />
        </fieldset>
        <button type="submit" disabled={saving || !(focus || tasks || accommodations)} className="min-h-11 rounded-md bg-primary px-5 py-2 font-semibold text-white disabled:opacity-50">{saving ? 'Creating invite…' : 'Create a 24-hour invite'}</button>
      </form>
      {code && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm font-semibold">One-time invite code</p>
          <code className="mt-2 block break-all rounded bg-background p-3 text-sm">{code}</code>
          <button type="button" onClick={() => void copyCode()} className="mt-2 min-h-11 rounded-md border border-primary px-4 py-2 text-sm font-semibold text-primary">Copy code</button>
        </div>
      )}
      {error && <p role="alert" className="rounded-md border border-text/20 p-3 text-sm">{error}</p>}
      {message && <p role="status" aria-live="polite" className="text-sm">{message}</p>}
      {loading && <p role="status" className="text-sm text-text/65">Loading sharing permissions…</p>}
      <div className="space-y-3">
        {shares.shares.map(share => (
          <article key={share.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-text/10 p-4">
            <div className="text-sm">
              <p className="font-semibold">{share.recipient_name || share.recipient_email || share.recipient_role}</p>
              <p className="mt-1 text-text/65">{scopeLabels(share).join(' · ')}</p>
            </div>
            <button type="button" onClick={() => void revoke(share.id)} className="min-h-11 rounded-md border border-text/25 px-4 py-2 text-sm font-semibold">Revoke access</button>
          </article>
        ))}
        {shares.pending_invites.map(invite => (
          <article key={invite.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-text/10 p-4">
            <div className="text-sm">
              <p className="font-semibold">Invite for {invite.recipient_email}</p>
              <p className="mt-1 text-text/65">Expires {invite.expires_at ? new Date(invite.expires_at).toLocaleString() : 'soon'}</p>
            </div>
            <button type="button" onClick={() => void revoke(invite.id, true)} className="min-h-11 rounded-md border border-text/25 px-4 py-2 text-sm font-semibold">Revoke invite</button>
          </article>
        ))}
      </div>
    </section>
  )
}

function Check({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} className="accent-primary" />{label}</label>
}

function scopeLabels(entry: ShareEntry) {
  return [
    entry.share_focus_summary ? 'Focus summary' : '',
    entry.share_task_progress ? 'Task trends' : '',
    entry.share_accommodations ? 'Support preferences' : '',
  ].filter(Boolean)
}
