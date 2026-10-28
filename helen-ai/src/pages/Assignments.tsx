import { useEffect, useState } from 'react'
import { CalendarDays, ClipboardList, BookOpen, Clock3 } from 'lucide-react'
import { supabase } from '@/services/supabase'
import { useAuth } from '@/context/AuthContext'

interface AssignmentRow {
  id: string
  title: string
  instructions: string
  due_date: string | null
  created_at: string
  classrooms: { name: string; subject: string } | null
}

export function Assignments() {
  const { profile } = useAuth()
  const [items, setItems] = useState<AssignmentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true); setError('')
      const { data, error: requestError } = await supabase
        .from('classroom_assignments')
        .select('id, title, instructions, due_date, created_at, classrooms(name, subject)')
        .order('created_at', { ascending: false })
      if (cancelled) return
      if (requestError) { setError('Assignments could not be loaded. Please refresh and try again.') }
      else setItems((data ?? []) as unknown as AssignmentRow[])
      setLoading(false)
    }
    void load()
    return () => { cancelled = true }
  }, [])

  const now = new Date().toISOString().slice(0, 10)
  const upcoming = items.filter(a => a.due_date && a.due_date >= now).length

  return <main className="mx-auto w-full max-w-6xl space-y-7 pb-10 text-text">
    <header className="rounded-[28px] border border-blue-100 bg-gradient-to-br from-white via-blue-50 to-indigo-100 p-6 dark:border-blue-900/70 dark:from-[#101a35] dark:via-[#111f42] dark:to-[#172b5b] sm:p-8">
      <div className="flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-700 text-white dark:bg-blue-500 dark:text-slate-950"><ClipboardList size={24}/></span><div><p className="text-xs font-bold uppercase tracking-[.16em] text-blue-700 dark:text-blue-300">Learning activities</p><h1 className="mt-2 font-heading text-3xl font-bold text-slate-900 dark:text-white">My assignments</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">Assignments shared by your teachers, with instructions and due dates in one place.</p></div></div>
    </header>

    <section className="grid gap-4 sm:grid-cols-2">
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-surface p-5 dark:border-slate-700"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><BookOpen size={21}/></span><div><p className="text-sm text-text/65">Assignments received</p><p className="text-2xl font-bold">{loading ? '—' : items.length}</p></div></div>
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-surface p-5 dark:border-slate-700"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"><CalendarDays size={21}/></span><div><p className="text-sm text-text/65">Upcoming due dates</p><p className="text-2xl font-bold">{loading ? '—' : upcoming}</p></div></div>
    </section>

    {error && <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">{error}</p>}
    {loading ? <div role="status" className="space-y-3">{[1,2,3].map(n=><div key={n} className="h-32 animate-pulse rounded-2xl bg-surface"/>)}</div> : error ? null : items.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-surface px-6 py-12 text-center dark:border-slate-700"><ClipboardList size={30} className="mx-auto text-blue-600"/><h2 className="mt-4 text-lg font-bold">No assignments yet</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text/65">When your teacher shares an assignment with one of your classes, it will appear here.</p></div> : <section className="space-y-4">{items.map(a=><article key={a.id} className="rounded-2xl border border-slate-200 bg-surface p-5 shadow-sm dark:border-slate-700 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-start"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><ClipboardList size={21}/></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold">{a.title}</h2>{a.due_date && a.due_date < now && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-200">Past due</span>}</div><p className="mt-1 text-sm font-semibold text-blue-700 dark:text-blue-300">{a.classrooms?.name || 'Classroom'}{a.classrooms?.subject ? ` · ${a.classrooms.subject}` : ''}</p><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-text/80">{a.instructions}</p><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-3 text-xs text-text/60 dark:border-slate-800"><span className="inline-flex items-center gap-1.5"><Clock3 size={14}/> Posted {new Date(a.created_at).toLocaleDateString()}</span>{a.due_date && <span className="inline-flex items-center gap-1.5 font-semibold"><CalendarDays size={14}/> Due {new Date(`${a.due_date}T00:00:00`).toLocaleDateString()}</span>}</div></div></div></article>)}</section>}
  </main>
}
