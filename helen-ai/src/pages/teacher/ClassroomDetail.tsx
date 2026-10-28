import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, CalendarDays, CheckCircle2, ClipboardList, GraduationCap, Plus, Send, Users, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/services/supabase'

interface Classroom { id: string; name: string; subject: string }
interface RosterStudent { id: string; student_id: string; full_name: string; joined_at: string }
interface StudentLookup { student_id: string; full_name: string }
interface Assignment { id: string; title: string; instructions: string; due_date: string | null; created_at: string }

export function ClassroomDetail() {
  const { classroomId = '' } = useParams()
  const { session } = useAuth()
  const [classroom, setClassroom] = useState<Classroom | null>(null)
  const [roster, setRoster] = useState<RosterStudent[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [studentIdInput, setStudentIdInput] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const [addMessage, setAddMessage] = useState('')
  const [removingId, setRemovingId] = useState('')
  const [assignmentFormOpen, setAssignmentFormOpen] = useState(false)
  const [assignmentTitle, setAssignmentTitle] = useState('')
  const [assignmentInstructions, setAssignmentInstructions] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [posting, setPosting] = useState(false)
  const [assignmentError, setAssignmentError] = useState('')
  const [assignmentMessage, setAssignmentMessage] = useState('')
  const [query, setQuery] = useState('')

  const loadRoster = useCallback(async () => {
    if (!classroomId) return
    const { data, error } = await supabase.rpc('get_classroom_roster', { p_classroom_id: classroomId })
    if (error) throw error
    setRoster((data ?? []) as RosterStudent[])
  }, [classroomId])

  const loadAssignments = useCallback(async () => {
    if (!classroomId) return
    const { data, error } = await supabase.from('classroom_assignments').select('id, title, instructions, due_date, created_at').eq('classroom_id', classroomId).order('created_at', { ascending: false })
    if (error) throw error
    setAssignments((data ?? []) as Assignment[])
  }, [classroomId])

  useEffect(() => {
    const teacherId = session?.user.id
    if (!classroomId || !teacherId) { setLoading(false); setLoadError('This class could not be found.'); return }
    let cancelled = false
    async function loadClassroom() {
      setLoading(true); setLoadError('')
      const { data, error } = await supabase.from('classrooms').select('id, name, subject').eq('id', classroomId).eq('teacher_id', teacherId).maybeSingle()
      if (cancelled) return
      if (error || !data) { setLoadError('This class could not be found or you do not have access to it.'); setClassroom(null); setLoading(false); return }
      setClassroom(data as Classroom)
      try {
        await Promise.all([loadRoster(), loadAssignments()])
      } catch {
        if (!cancelled) setLoadError('Some classroom information could not be loaded. Refresh and try again.')
      }
      if (!cancelled) setLoading(false)
    }
    void loadClassroom()
    return () => { cancelled = true }
  }, [classroomId, session?.user.id, loadRoster, loadAssignments])

  async function addStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!classroomId) return
    setAdding(true); setAddError(''); setAddMessage('')
    const normalizedId = studentIdInput.trim().toUpperCase()
    const { data, error: lookupError } = await supabase.rpc('lookup_student_by_id', { p_student_id: normalizedId })
    const student = (data as StudentLookup[] | null)?.[0]
    if (lookupError || !student) { setAddError('No student was found with that Student ID. Check it and try again.'); setAdding(false); return }
    const { error } = await supabase.from('classroom_students').insert({ classroom_id: classroomId, student_id: student.student_id })
    if (error?.code === '23505') setAddError('This student is already on this class roster.')
    else if (error) setAddError('The student could not be added. Try again.')
    else {
      setStudentIdInput('')
      setAddMessage(`${student.full_name || student.student_id} was added to this class.`)
      try { await loadRoster() } catch { setLoadError('Student added, but the roster could not be refreshed.') }
    }
    setAdding(false)
  }

  async function removeStudent(student: RosterStudent) {
    if (!window.confirm(`Remove ${student.full_name || student.student_id} from ${classroom?.name}? Their account will not be deleted.`)) return
    setRemovingId(student.id)
    const { error } = await supabase.from('classroom_students').delete().eq('id', student.id).eq('classroom_id', classroomId)
    if (error) setLoadError('The student could not be removed. Try again.')
    else setRoster(current => current.filter(item => item.id !== student.id))
    setRemovingId('')
  }

  async function postAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!classroomId || !session?.user.id) return
    setPosting(true); setAssignmentError(''); setAssignmentMessage('')
    const { data, error } = await supabase.from('classroom_assignments').insert({
      classroom_id: classroomId,
      teacher_id: session.user.id,
      title: assignmentTitle.trim(),
      instructions: assignmentInstructions.trim(),
      due_date: dueDate || null,
    }).select('id, title, instructions, due_date, created_at').single()
    if (error || !data) setAssignmentError('The assignment could not be posted. Please check that the latest database migration has been applied.')
    else {
      setAssignments(old => [data as Assignment, ...old])
      setAssignmentTitle(''); setAssignmentInstructions(''); setDueDate('')
      setAssignmentFormOpen(false)
      setAssignmentMessage('Assignment posted to this classroom.')
    }
    setPosting(false)
  }

  const filteredRoster = roster.filter(s => `${s.full_name} ${s.student_id}`.toLowerCase().includes(query.toLowerCase()))
  if (loading) return <div role="status" className="mx-auto max-w-6xl animate-pulse space-y-4"><div className="h-40 rounded-3xl bg-surface"/><div className="h-24 rounded-2xl bg-surface"/><div className="h-56 rounded-2xl bg-surface"/></div>
  if (loadError && !classroom) return <section className="mx-auto max-w-4xl space-y-4 text-text"><p role="alert" className="rounded-xl border border-red-700/30 bg-surface p-5">{loadError}</p><Link to="/dashboard" className="inline-flex min-h-10 items-center gap-2 text-primary"><ArrowLeft size={16}/> Back to dashboard</Link></section>
  if (!classroom) return null

  return <main className="mx-auto w-full max-w-7xl space-y-7 pb-10 text-text">
    <Link to="/dashboard" className="inline-flex min-h-9 items-center gap-2 text-sm font-semibold text-blue-700 hover:underline dark:text-blue-300"><ArrowLeft size={16}/> All classrooms</Link>
    <header className="relative overflow-hidden rounded-[28px] border border-blue-100 bg-gradient-to-br from-white via-blue-50 to-indigo-100 p-6 dark:border-blue-900/70 dark:from-[#101a35] dark:via-[#111f42] dark:to-[#172b5b] sm:p-8">
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div><span className="inline-flex rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 dark:border-blue-800 dark:bg-white/5 dark:text-blue-200">{classroom.subject}</span><h1 className="mt-3 font-heading text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">{classroom.name}</h1><p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">Class overview, learner roster, progress links and learning activities in one dedicated space.</p></div>
        <button onClick={() => { setAssignmentFormOpen(v => !v); setAssignmentError('') }} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 font-bold text-white shadow-sm hover:bg-blue-800 dark:bg-blue-500 dark:text-slate-950"><Plus size={18}/>{assignmentFormOpen ? 'Close assignment form' : 'Create assignment'}</button>
      </div>
    </header>

    <section aria-label="Class overview" className="grid gap-4 sm:grid-cols-3">
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-surface p-5 dark:border-slate-700"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><Users size={21}/></span><div><p className="text-sm text-text/65">Enrolled students</p><p className="text-2xl font-bold">{roster.length}</p></div></div>
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-surface p-5 dark:border-slate-700"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"><ClipboardList size={21}/></span><div><p className="text-sm text-text/65">Assignments posted</p><p className="text-2xl font-bold">{assignments.length}</p></div></div>
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-surface p-5 dark:border-slate-700"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300"><GraduationCap size={21}/></span><div><p className="text-sm text-text/65">Learner progress</p><p className="text-sm font-semibold">View per student</p></div></div>
    </section>

    {loadError && <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">{loadError}</p>}
    {assignmentMessage && <p role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200"><CheckCircle2 size={17}/>{assignmentMessage}</p>}

    {assignmentFormOpen && <form onSubmit={postAssignment} className="rounded-2xl border border-blue-200 bg-surface p-5 shadow-sm dark:border-blue-900 sm:p-6">
      <div className="flex items-start gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><Send size={19}/></span><div><h2 className="text-lg font-bold">Post an assignment</h2><p className="mt-1 text-sm text-text/65">This activity will be attached to {classroom.name}.</p></div></div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm font-semibold">Assignment title<input required maxLength={120} value={assignmentTitle} onChange={e => setAssignmentTitle(e.target.value)} placeholder="e.g. Fractions practice" className="min-h-11 w-full rounded-xl border border-slate-200 bg-background px-3 text-text outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700"/></label>
        <label className="space-y-1.5 text-sm font-semibold">Due date <span className="font-normal text-text/55">(optional)</span><input type="date" min={new Date().toISOString().slice(0,10)} value={dueDate} onChange={e => setDueDate(e.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-background px-3 text-text outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700"/></label>
        <label className="space-y-1.5 text-sm font-semibold sm:col-span-2">Instructions<textarea required rows={4} maxLength={5000} value={assignmentInstructions} onChange={e => setAssignmentInstructions(e.target.value)} placeholder="Explain what students should do, how to complete it, and any helpful accommodations." className="w-full rounded-xl border border-slate-200 bg-background p-3 font-normal text-text outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700"/></label>
      </div>
      {assignmentError && <p role="alert" className="mt-3 text-sm text-red-600">{assignmentError}</p>}
      <div className="mt-4 flex flex-wrap gap-3"><button disabled={posting} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-700 px-5 font-bold text-white hover:bg-blue-800 disabled:opacity-60 dark:bg-blue-500 dark:text-slate-950"><Send size={16}/>{posting ? 'Posting…' : 'Post assignment'}</button><button type="button" onClick={() => setAssignmentFormOpen(false)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 font-semibold dark:border-slate-700"><X size={16}/> Cancel</button></div>
    </form>}

    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,.8fr)]">
      <div className="min-w-0 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-blue-700 dark:text-blue-300">Learners</p><h2 className="mt-1 text-2xl font-bold">Student roster</h2><p className="mt-1 text-sm text-text/65">Open a student’s progress to see their learning activity.</p></div><label className="text-sm"><span className="sr-only">Search students</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name or ID" className="min-h-10 w-full rounded-xl border border-slate-200 bg-surface px-3 text-sm outline-none focus:border-blue-500 sm:w-56 dark:border-slate-700"/></label></div>
        <form onSubmit={addStudent} className="grid gap-3 rounded-2xl border border-slate-200 bg-surface p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end dark:border-slate-700">
          <label className="space-y-1.5 text-sm font-semibold">Add student by Student ID<input required value={studentIdInput} onChange={e => setStudentIdInput(e.target.value)} placeholder="HAI-2026-0001" autoCapitalize="characters" autoComplete="off" className="min-h-11 w-full rounded-xl border border-slate-200 bg-background px-3 font-mono font-normal text-text outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700"/></label>
          <button disabled={adding} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 font-bold text-white hover:bg-blue-800 disabled:opacity-60 dark:bg-blue-500 dark:text-slate-950"><Plus size={17}/>{adding ? 'Adding…' : 'Add student'}</button>
          {addError && <p role="alert" className="text-sm text-red-600 sm:col-span-2">{addError}</p>}{addMessage && <p role="status" className="text-sm text-blue-700 sm:col-span-2 dark:text-blue-300">{addMessage}</p>}
        </form>
        {roster.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-surface p-8 text-center dark:border-slate-700"><Users size={28} className="mx-auto text-blue-600"/><h3 className="mt-3 font-bold">No students added yet</h3><p className="mt-1 text-sm text-text/65">Add a student using their Helen AI Student ID.</p></div> : filteredRoster.length === 0 ? <p className="rounded-2xl border border-slate-200 bg-surface p-5 text-sm text-text/65 dark:border-slate-700">No students match that search.</p> : <div className="overflow-hidden rounded-2xl border border-slate-200 bg-surface dark:border-slate-700"><div className="overflow-x-auto"><table className="w-full min-w-[38rem] text-left text-sm"><thead className="bg-background text-text/65"><tr><th className="px-4 py-3 font-semibold">Student</th><th className="px-4 py-3 font-semibold">Student ID</th><th className="px-4 py-3 font-semibold">Joined</th><th className="px-4 py-3 font-semibold">Actions</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{filteredRoster.map(s => <tr key={s.id} className="transition hover:bg-blue-50/50 dark:hover:bg-blue-950/20"><td className="px-4 py-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-xs font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-200">{s.full_name.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase() || 'ST'}</span><span className="font-semibold">{s.full_name || 'Student'}</span></div></td><td className="px-4 py-4 font-mono text-xs">{s.student_id}</td><td className="px-4 py-4 text-text/65">{new Date(s.joined_at).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}</td><td className="px-4 py-4"><div className="flex items-center gap-3"><Link to={`/student-progress?studentId=${encodeURIComponent(s.student_id)}&classroomId=${encodeURIComponent(classroomId)}`} className="font-bold text-blue-700 hover:underline dark:text-blue-300">Progress</Link><button type="button" disabled={removingId===s.id} onClick={()=>void removeStudent(s)} className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50">{removingId===s.id?'Removing…':'Remove'}</button></div></td></tr>)}</tbody></table></div></div>}
      </div>

      <aside className="space-y-4">
        <div><p className="text-xs font-bold uppercase tracking-widest text-blue-700 dark:text-blue-300">Class activity</p><h2 className="mt-1 text-2xl font-bold">Assignments</h2><p className="mt-1 text-sm text-text/65">Learning activities shared with this class.</p></div>
        {assignments.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-surface p-6 text-center dark:border-slate-700"><BookOpen size={26} className="mx-auto text-blue-600"/><h3 className="mt-3 font-bold">Nothing posted yet</h3><p className="mt-1 text-sm text-text/65">Create the first assignment for this class.</p><button onClick={()=>setAssignmentFormOpen(true)} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-700 px-4 text-sm font-bold text-white dark:bg-blue-500 dark:text-slate-950"><Plus size={16}/> Create assignment</button></div> : <div className="space-y-3">{assignments.map(a=><article key={a.id} className="rounded-2xl border border-slate-200 bg-surface p-4 dark:border-slate-700"><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"><ClipboardList size={19}/></span><div className="min-w-0"><h3 className="font-bold">{a.title}</h3><p className="mt-1 whitespace-pre-wrap break-words text-sm leading-5 text-text/70">{a.instructions}</p></div></div><div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-text/60 dark:border-slate-800"><span>Posted {new Date(a.created_at).toLocaleDateString()}</span>{a.due_date && <span className="inline-flex items-center gap-1 font-semibold"><CalendarDays size={14}/> Due {new Date(`${a.due_date}T00:00:00`).toLocaleDateString()}</span>}</div></article>)}</div>}
      </aside>
    </section>
  </main>
}
