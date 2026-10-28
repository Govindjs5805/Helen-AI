import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Plus, Users, Search, GraduationCap, ChevronRight, Sparkles } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/services/supabase'

interface TeacherDetails { institute_name: string; place: string; designation: string | null }
interface Classroom { id: string; name: string; subject: string; created_at: string; student_count: number | null }
const gradients = ['from-blue-600 to-indigo-600', 'from-sky-500 to-blue-600', 'from-violet-500 to-indigo-600', 'from-indigo-500 to-blue-700']
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0]).join('').toUpperCase()

export function Dashboard() {
  const { session, profile } = useAuth()
  const [details, setDetails] = useState<TeacherDetails | null>(null)
  const [classes, setClasses] = useState<Classroom[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  useEffect(() => {
    const teacherId = session?.user.id
    if (!teacherId) { setLoading(false); return }
    let cancelled = false
    async function load() {
      setLoading(true); setError('')
      const [teacher, classroom] = await Promise.all([
        supabase.from('teacher_profiles').select('institute_name, place, designation').eq('id', teacherId).maybeSingle(),
        supabase.from('classrooms').select('id, name, subject, created_at').eq('teacher_id', teacherId).order('created_at', { ascending: false }),
      ])
      if (cancelled) return
      if (!teacher.error) setDetails(teacher.data as TeacherDetails | null)
      if (classroom.error) { setError('We could not load your classes. Please refresh and try again.'); setClasses([]) }
      else {
        const rows = classroom.data ?? []
        if (!rows.length) setClasses([])
        else {
          const roster = await supabase.from('classroom_students').select('classroom_id').in('classroom_id', rows.map(x => x.id))
          if (cancelled) return
          const counts = new Map<string, number>()
          for (const row of roster.data ?? []) counts.set(row.classroom_id, (counts.get(row.classroom_id) ?? 0) + 1)
          setClasses(rows.map(row => ({ ...row, student_count: roster.error ? null : counts.get(row.id) ?? 0 })))
        }
      }
      setLoading(false)
    }
    void load()
    return () => { cancelled = true }
  }, [session?.user.id])

  async function createClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session?.user.id) return
    setCreating(true); setCreateError('')
    const { data, error } = await supabase.from('classrooms').insert({ teacher_id: session.user.id, name: name.trim(), subject: subject.trim() }).select('id, name, subject, created_at').single()
    if (error || !data) setCreateError('Could not create this class. Check the details and try again.')
    else { setClasses(old => [{ ...data, student_count: 0 }, ...old]); setName(''); setSubject(''); setFormOpen(false) }
    setCreating(false)
  }

  const filtered = classes.filter(c => `${c.name} ${c.subject}`.toLowerCase().includes(search.toLowerCase()))
  const totalStudents = classes.reduce((sum, c) => sum + (c.student_count ?? 0), 0)

  return <main className="mx-auto w-full max-w-7xl space-y-8 pb-10 text-text">
    <header className="relative overflow-hidden rounded-[28px] border border-blue-100 bg-gradient-to-br from-white via-blue-50 to-indigo-100 p-6 shadow-sm dark:border-blue-900/70 dark:from-[#101a35] dark:via-[#111f42] dark:to-[#172b5b] sm:p-9">
      <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rounded-full bg-blue-300/30 blur-3xl dark:bg-blue-500/15"/>
      <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1.5 text-xs font-bold uppercase tracking-[.15em] text-blue-700 dark:border-blue-800 dark:bg-white/5 dark:text-blue-200"><Sparkles size={14}/> Teacher workspace</span>
          <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">Welcome, {profile?.full_name?.split(' ')[0] || 'Teacher'}.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">Manage your classrooms, follow each learner’s progress, and create supportive learning activities in one place.</p>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">{[details?.institute_name, details?.designation, details?.place].filter(Boolean).join(' · ') || 'Your inclusive classroom, organised.'}</p>
        </div>
        <button onClick={() => { setFormOpen(v => !v); setCreateError('') }} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/15 transition hover:-translate-y-0.5 hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-blue-500 dark:text-slate-950 dark:hover:bg-blue-400"><Plus size={18}/>{formOpen ? 'Close form' : 'Create a class'}</button>
      </div>
    </header>

    <section aria-label="Teaching overview" className="grid gap-4 sm:grid-cols-2">
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-surface p-5 shadow-sm dark:border-slate-700"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><BookOpen size={22}/></div><div><p className="text-sm text-text/65">Your classes</p><p className="mt-1 text-3xl font-bold">{loading ? '—' : classes.length}</p></div><span className="ml-auto text-xs text-text/55">Classrooms</span></div>
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-surface p-5 shadow-sm dark:border-slate-700"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"><Users size={22}/></div><div><p className="text-sm text-text/65">Students across classes</p><p className="mt-1 text-3xl font-bold">{loading ? '—' : totalStudents}</p></div><span className="ml-auto text-xs text-text/55">Roster total</span></div>
    </section>

    {formOpen && <form onSubmit={createClass} className="rounded-2xl border border-blue-200 bg-surface p-5 shadow-sm dark:border-blue-900 sm:p-6">
      <h2 className="text-lg font-bold">Create a new class</h2><p className="mt-1 text-sm text-text/65">Give your class a name and subject. You can add students next.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm font-semibold">Class name<input required maxLength={80} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Grade 8 · Section A" className="min-h-12 w-full rounded-xl border border-slate-200 bg-background px-4 font-normal text-text outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700"/></label>
        <label className="space-y-1.5 text-sm font-semibold">Subject<input required maxLength={80} value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Science" className="min-h-12 w-full rounded-xl border border-slate-200 bg-background px-4 font-normal text-text outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700"/></label>
      </div>
      {createError && <p role="alert" className="mt-3 text-sm text-red-600">{createError}</p>}
      <div className="mt-5 flex flex-wrap gap-3"><button disabled={creating} className="min-h-11 rounded-xl bg-blue-700 px-5 font-bold text-white hover:bg-blue-800 disabled:opacity-60 dark:bg-blue-500 dark:text-slate-950">{creating ? 'Creating…' : 'Create class'}</button><button type="button" onClick={() => setFormOpen(false)} className="min-h-11 rounded-xl border border-slate-200 px-5 font-semibold hover:bg-background dark:border-slate-700">Cancel</button></div>
    </form>}

    <section className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-blue-700 dark:text-blue-300">Class management</p><h2 className="mt-2 font-heading text-2xl font-bold sm:text-3xl">Your classrooms</h2><p className="mt-1 text-sm text-text/65">Open a class to manage students, monitor progress, and post assignments.</p></div><label className="relative block w-full sm:max-w-xs"><Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text/45"/><input aria-label="Search classes" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search classes or subjects" className="min-h-11 w-full rounded-xl border border-slate-200 bg-surface pl-10 pr-4 text-sm text-text outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700"/></label></div>
      {error && <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">{error}</p>}
      {loading ? <div role="status" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[1,2,3].map(n => <div key={n} className="h-48 animate-pulse rounded-2xl bg-surface"/> )}</div> : error ? null : filtered.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-surface px-6 py-12 text-center dark:border-slate-700"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><GraduationCap size={25}/></div><h3 className="mt-4 text-lg font-bold">{classes.length ? 'No matching classes' : 'Your first class starts here'}</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text/65">{classes.length ? 'Try another class name or subject.' : 'Create a class, add students by Student ID, and follow their learning progress.'}</p>{!classes.length && <button onClick={() => setFormOpen(true)} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-700 px-5 font-bold text-white hover:bg-blue-800 dark:bg-blue-500 dark:text-slate-950"><Plus size={17}/> Create your first class</button>}</div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((item, i) => <Link key={item.id} to={`/classrooms/${item.id}`} className="group overflow-hidden rounded-2xl border border-slate-200 bg-surface shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-950/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:hover:border-blue-800"><div className={`h-2 bg-gradient-to-r ${gradients[i % gradients.length]}`}/><div className="p-5"><div className="flex items-start justify-between gap-3"><div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${gradients[i % gradients.length]} text-sm font-extrabold text-white`}>{initials(item.name) || 'CL'}</div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-200">{item.subject}</span></div><h3 className="mt-4 text-xl font-bold tracking-tight group-hover:text-blue-700 dark:group-hover:text-blue-300">{item.name}</h3><p className="mt-1 text-sm text-text/55">Created {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p><div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800"><span className="inline-flex items-center gap-2 text-sm text-text/70"><Users size={16}/>{item.student_count === null ? 'Roster unavailable' : `${item.student_count} ${item.student_count === 1 ? 'student' : 'students'}`}</span><span className="inline-flex items-center gap-1 text-sm font-bold text-blue-700 dark:text-blue-300">Open class <ChevronRight size={16} className="transition group-hover:translate-x-1"/></span></div></div></Link>)}</div>}
    </section>
    <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-blue-950 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-100"><GraduationCap size={19} className="mt-0.5 shrink-0"/><p><strong>Designed for inclusive learning.</strong> Each class has its own roster, student progress view, and assignment area.</p></div>
  </main>
}
