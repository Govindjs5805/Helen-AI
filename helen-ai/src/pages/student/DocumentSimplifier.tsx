import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { useTextToSpeech } from '@/hooks/useTextToSpeech'
import { apiBaseUrl, apiFetch } from '@/services/api'

type DocumentStatus = 'processing' | 'done' | 'failed'
type SourceType = 'pdf' | 'image' | 'text'

interface DocumentRecord {
  id: string
  title: string
  source_type: SourceType
  status: DocumentStatus
  original_text?: string
  simplified_text?: string | null
  error_message?: string | null
  created_at: string
}

interface DocumentHistoryResponse {
  documents: DocumentRecord[]
  selected_document: DocumentRecord | null
}

interface ApiErrorBody {
  detail?: string | { message?: string; document_id?: string }
}

class DocumentApiError extends Error {
  documentId?: string

  constructor(message: string, documentId?: string) {
    super(message)
    this.documentId = documentId
  }
}

async function request<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await apiFetch(path, {
      ...init,
      headers: { ...init?.headers, Authorization: `Bearer ${token}` },
    })
  } catch (caught) {
    throw new DocumentApiError(
      caught instanceof Error
        ? caught.message
        : `Cannot reach the document service at ${apiBaseUrl}. Start the backend and check its configuration.`
    )
  }

  const payload = await response.json().catch(() => ({})) as ApiErrorBody
  if (!response.ok) {
    const detail = payload.detail
    if (typeof detail === 'string') throw new DocumentApiError(detail)
    throw new DocumentApiError(
      detail?.message || 'The document could not be processed. Please try again.',
      detail?.document_id
    )
  }
  return payload as T
}

function splitSentences(text: string): string[] {
  return text.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g)?.map(sentence => sentence.trim()).filter(Boolean) ?? []
}

interface TextSection {
  title: string
  content: string
}

function splitSections(text: string): TextSection[] {
  const sections: TextSection[] = []
  let title = ''
  let content: string[] = []

  const flush = () => {
    const body = content.join('\n').trim()
    if (title || body) sections.push({ title: title || `Section ${sections.length + 1}`, content: body })
  }

  text.split('\n').forEach(line => {
    const heading = line.match(/^#{1,3}\s+(.+)$/)
    if (heading) {
      flush()
      title = heading[1].trim()
      content = []
    } else {
      content.push(line)
    }
  })
  flush()

  if (sections.length === 1 && !sections[0].content.includes('\n')) {
    const paragraphs = text.split(/\n\s*\n/).map(part => part.trim()).filter(Boolean)
    if (paragraphs.length > 1) {
      return paragraphs.map((paragraph, index) => ({ title: `Section ${index + 1}`, content: paragraph }))
    }
  }
  return sections
}

function renderMarkedText(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={index}>{part.slice(2, -2)}</strong>
      : <span key={index}>{part.replace(/^[-*]\s+|^\d+[.)]\s+/, '')}</span>
  )
}

function renderAdhdContent(content: string) {
  const blocks: Array<{ kind: 'paragraph' | 'bullet' | 'numbered'; lines: string[] }> = []
  content.split('\n').map(line => line.trim()).filter(Boolean).forEach(line => {
    const isNumbered = /^\d+[.)]\s+/.test(line)
    const isBullet = /^[-*]\s+/.test(line)
    const kind = isNumbered ? 'numbered' : isBullet ? 'bullet' : 'paragraph'
    const previous = blocks[blocks.length - 1]
    if (kind !== 'paragraph' && previous?.kind === kind) previous.lines.push(line)
    else blocks.push({ kind, lines: [line] })
  })

  return (
    <div className="space-y-3 leading-relaxed text-text">
      {blocks.map((block, index) => block.kind === 'paragraph' ? (
        <p key={index}>{renderMarkedText(block.lines[0])}</p>
      ) : block.kind === 'numbered' ? (
        <ol key={index} className="list-decimal space-y-2 pl-6">
          {block.lines.map((line, lineIndex) => <li key={lineIndex}>{renderMarkedText(line)}</li>)}
        </ol>
      ) : (
        <ul key={index} className="list-disc space-y-2 pl-6">
          {block.lines.map((line, lineIndex) => <li key={lineIndex}>{renderMarkedText(line)}</li>)}
        </ul>
      ))}
    </div>
  )
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function previewDocument(preset: string): DocumentRecord {
  const simplifiedByPreset: Record<string, string> = {
    dyslexia: 'Plants use sunlight to make their own food. This process is called photosynthesis.\n\nThe roots take in water. The leaves take in carbon dioxide from the air.',
    adhd: '## Main idea\n- **Plants use sunlight to make food.**\n- This process is called photosynthesis.\n\n## What plants need\n1. Roots take in water.\n2. Leaves take in carbon dioxide from the air.',
    visual_impairment: 'Plants make their own food using energy from sunlight. This process is called photosynthesis. Their roots absorb water, and their leaves take in carbon dioxide from the air.',
    hearing_impairment: 'Plants use sunlight to make food through photosynthesis. Roots absorb water, while leaves take in carbon dioxide from the air.',
    learning_disability: 'Plants use sunlight to make food. This process is called photosynthesis, which means using light to make food. Roots take in water, and leaves absorb carbon dioxide, a gas in the air.',
  }
  return {
    id: 'document-preview',
    title: 'How plants make food',
    source_type: 'text',
    status: 'done',
    original_text: 'Photosynthesis is the process by which autotrophic organisms synthesize complex organic compounds from carbon dioxide and water, utilizing light energy absorbed by chlorophyll pigments. This biochemical process facilitates energy storage and supports ecosystem productivity.',
    simplified_text: simplifiedByPreset[preset] ?? simplifiedByPreset.learning_disability,
    created_at: '2026-10-02T00:00:00.000Z',
  }
}

export function DocumentSimplifier({ preview = false }: { preview?: boolean }) {
  const { session } = useAuth()
  const { activeDisabilityPreset } = useTheme()
  const preset = activeDisabilityPreset ?? 'learning_disability'
  const speech = useTextToSpeech()
  const lastDocumentKey = session?.user.id
    ? `helen-ai:last-document:${session.user.id}`
    : null

  const [history, setHistory] = useState<DocumentRecord[]>(() => preview ? [previewDocument(preset)] : [])
  const [currentDocument, setCurrentDocument] = useState<DocumentRecord | null>(() => preview ? previewDocument(preset) : null)
  const [historyLoading, setHistoryLoading] = useState(!preview)
  const [historyError, setHistoryError] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [pasteMode, setPasteMode] = useState(false)
  const [pastedText, setPastedText] = useState('')
  const [title, setTitle] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [progressMessage, setProgressMessage] = useState('')
  const [error, setError] = useState('')
  const [retryDocumentId, setRetryDocumentId] = useState('')
  const [readAlong, setReadAlong] = useState(false)
  const [openSection, setOpenSection] = useState(0)
  const documentPollToken = useRef(0)

  const simplifiedText = currentDocument?.simplified_text ?? ''
  const sentences = useMemo(() => splitSentences(simplifiedText), [simplifiedText])
  const sections = useMemo(() => splitSections(simplifiedText), [simplifiedText])
  const presetLabels: Record<string, string> = {
    dyslexia: 'Dyslexia',
    adhd: 'ADHD',
    visual_impairment: 'Visual impairment',
    hearing_impairment: 'Hearing impairment',
    learning_disability: 'Learning disability',
  }

  useEffect(() => {
    if (!preview) return
    const sample = previewDocument(preset)
    setCurrentDocument(sample)
    setHistory([sample])
  }, [preview, preset])

  async function loadHistory(
    selectedId?: string,
    restore = false
  ): Promise<DocumentHistoryResponse> {
    if (preview || !session?.access_token) {
      setHistoryLoading(false)
      return { documents: [], selected_document: null }
    }
    setHistoryLoading(true)
    setHistoryError('')
    try {
      const query = new URLSearchParams()
      if (selectedId) query.set('selected_id', selectedId)
      if (restore) query.set('restore', 'true')
      const suffix = query.size ? `?${query.toString()}` : ''
      const result = await request<DocumentHistoryResponse>(`/documents${suffix}`, session.access_token)
      setHistory(result.documents)
      return result
    } catch (caught) {
      setHistoryError(caught instanceof Error ? caught.message : 'Document history could not be loaded.')
      return { documents: [], selected_document: null }
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    const restoreDocument = async () => {
      const previousId = lastDocumentKey
        ? localStorage.getItem(lastDocumentKey)
        : null
      const result = await loadHistory(previousId ?? undefined, true)
      if (cancelled || preview) return

      const restored = result.selected_document
      if (!restored) return
      if (lastDocumentKey) localStorage.setItem(lastDocumentKey, restored.id)
      setCurrentDocument(restored)
      setOpenSection(0)
      setRetryDocumentId('')
      if (restored.status === 'failed') {
        setError(restored.error_message || 'This document needs another try.')
        setRetryDocumentId(restored.original_text?.trim() ? restored.id : '')
      } else if (restored.status === 'processing' && restored.original_text?.trim()) {
        const pollToken = ++documentPollToken.current
        void watchDocument(restored.id, pollToken)
      }
    }

    void restoreDocument()
    return () => {
      cancelled = true
    }
  }, [session?.user.id])

  useEffect(() => {
    if (!lastDocumentKey || !currentDocument) return
    localStorage.setItem(lastDocumentKey, currentDocument.id)
  }, [lastDocumentKey, currentDocument?.id])

  useEffect(() => () => {
    documentPollToken.current += 1
    speech.stop()
  }, [speech.stop])

  async function openDocument(documentId: string) {
    if (preview) {
      setCurrentDocument(previewDocument(preset))
      setError('')
      return
    }
    if (!session?.access_token) return
    if (lastDocumentKey) localStorage.setItem(lastDocumentKey, documentId)
    const pollToken = ++documentPollToken.current
    setError('')
    setRetryDocumentId('')
    speech.stop()
    setReadAlong(false)
    try {
      const document = await request<DocumentRecord>(`/documents/${documentId}`, session.access_token)
      setCurrentDocument(document)
      setOpenSection(0)
      if (document.status === 'failed') {
        setError(document.error_message || 'This document needs another try.')
        setRetryDocumentId(document.id)
      } else if (document.status === 'processing' && document.original_text?.trim()) {
        void watchDocument(document.id, pollToken)
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'That document could not be opened.')
    }
  }

  async function watchDocument(documentId: string, pollToken: number) {
    if (!session?.access_token) return
    setBusy(true)
    setError('')
    setProgressMessage('Checking whether simplification is complete…')

    try {
      for (let attempt = 0; attempt < 30; attempt += 1) {
        await new Promise(resolve => setTimeout(resolve, 2000))
        if (pollToken !== documentPollToken.current) return

        const document = await request<DocumentRecord>(`/documents/${documentId}`, session.access_token)
        setCurrentDocument(document)
        setHistory(previous => previous.map(item => item.id === document.id
          ? { ...item, status: document.status, error_message: document.error_message }
          : item))

        if (document.status === 'done' || document.status === 'failed') {
          if (document.status === 'failed') {
            setError(document.error_message || 'This document needs another try.')
            setRetryDocumentId(document.original_text?.trim() ? document.id : '')
          } else {
            setError('')
            setRetryDocumentId('')
          }
          await loadHistory()
          return
        }
      }

      if (pollToken === documentPollToken.current) {
        setError('This document is still processing. Refresh its status shortly; it will not be submitted again.')
      }
    } catch (caught) {
      if (pollToken === documentPollToken.current) {
        setError(caught instanceof Error ? caught.message : 'Could not check document status. Refresh and try again.')
      }
    } finally {
      if (pollToken === documentPollToken.current) {
        setBusy(false)
        setProgressMessage('')
      }
    }
  }

  async function simplify(documentId: string) {
    if (!session?.access_token) return
    documentPollToken.current += 1
    setBusy(true)
    setError('')
    setRetryDocumentId('')
    setProgressMessage('Simplifying for your learning profile…')
    const body = new FormData()
    body.set('document_id', documentId)

    try {
      const result = await request<{ id: string; status: 'done'; simplified_text: string }>(
        '/ai/simplify', session.access_token, { method: 'POST', body }
      )
      setCurrentDocument(previous => previous?.id === documentId
        ? { ...previous, status: result.status, simplified_text: result.simplified_text, error_message: null }
        : previous)
      setOpenSection(0)
      await loadHistory()
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Simplification failed. Please retry.'
      setError(message)
      setRetryDocumentId(documentId)
      setCurrentDocument(previous => previous?.id === documentId
        ? { ...previous, status: 'failed', error_message: message }
        : previous)
      await loadHistory()
    } finally {
      setBusy(false)
      setProgressMessage('')
    }
  }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (preview) return
    if (!session?.access_token) return
    if (!pasteMode && !selectedFile) {
      setError('Choose a file or paste text to get started.')
      return
    }
    if (pasteMode && !pastedText.trim()) {
      setError('Paste some text before continuing.')
      return
    }

    documentPollToken.current += 1
    setBusy(true)
    setError('')
    setProgressMessage(pasteMode ? 'Saving your text…' : 'Uploading and reading your document…')
    speech.stop()
    const body = new FormData()
    if (selectedFile && !pasteMode) body.set('file', selectedFile)
    if (pasteMode) body.set('text', pastedText)
    if (title.trim()) body.set('title', title.trim())

    try {
      const uploaded = await request<{
        id: string
        title: string
        source_type: SourceType
        status: 'processing'
      }>('/documents/upload', session.access_token, { method: 'POST', body })
      const initial: DocumentRecord = {
        ...uploaded,
        created_at: new Date().toISOString(),
      }
      setCurrentDocument(initial)
      setHistory(previous => [initial, ...previous.filter(item => item.id !== initial.id)])
      setSelectedFile(null)
      setPastedText('')
      setTitle('')
      setProgressMessage('Text extracted. Simplifying for your learning profile…')
      await simplify(uploaded.id)
    } catch (caught) {
      const apiError = caught instanceof DocumentApiError ? caught : undefined
      const message = caught instanceof Error ? caught.message : 'The upload could not be processed. Please retry.'
      setError(message)
      if (apiError?.documentId) {
        try {
          const failedDocument = await request<DocumentRecord>(`/documents/${apiError.documentId}`, session.access_token)
          setCurrentDocument(failedDocument)
          setRetryDocumentId(failedDocument.original_text?.trim() ? failedDocument.id : '')
        } catch {
          setRetryDocumentId('')
        }
        setError(message)
      }
      await loadHistory()
    } finally {
      setBusy(false)
      setProgressMessage('')
    }
  }

  function acceptFile(file: File | undefined) {
    if (!file) return
    const valid = /\.(pdf|png|jpe?g|webp|tiff?|bmp|txt|md)$/i.test(file.name)
    if (!valid) {
      setError('That file type is not supported. Choose a PDF, image, or text file.')
      setSelectedFile(null)
      return
    }
    setError('')
    setSelectedFile(file)
    setPasteMode(false)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    acceptFile(event.dataTransfer.files[0])
  }

  function downloadSimplified() {
    if (!simplifiedText || !currentDocument) return
    const file = new Blob([simplifiedText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(file)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${currentDocument.title || 'simplified-document'}.txt`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function playText(text: string) {
    const segments = splitSentences(text)
    speech.speakSegments(segments.length ? segments : [text])
  }

  function startReadAlong() {
    if (!readAlong) {
      setReadAlong(true)
      speech.speakSegments(sentences)
    } else if (speech.isPaused) {
      speech.resume()
    } else if (speech.isSpeaking) {
      speech.pause()
    } else {
      speech.speakSegments(sentences)
    }
  }

  const presetDescription: Record<string, string> = {
    dyslexia: 'Short sentences, one idea at a time, with technical words kept intact.',
    adhd: 'Focused sections with clear headings and concise action points.',
    visual_impairment: 'Written for listening, with a voice-first reading option.',
    hearing_impairment: 'Kept close to the original with light clarity edits.',
    learning_disability: 'Shorter paragraphs, plain language, and inline term definitions.',
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 text-text">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">DOCUMENT SIMPLIFIER</p>
          <h1 className="mt-1 font-heading text-3xl font-bold text-text">Make a document easier to work with</h1>
          <p className="mt-2 max-w-2xl text-sm text-text/70">Your text is adapted to your primary learning profile. Only you can access your document content.</p>
        </div>
        <p className="rounded-md border border-text/20 bg-surface px-3 py-2 text-sm text-text">
          Adaptation: <strong>{presetLabels[preset]}</strong>
        </p>
      </header>

      <section className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(17rem,0.6fr)]">
        <div className="min-w-0 space-y-5 rounded-lg border border-text/15 bg-surface p-4 sm:p-6">
          <div>
            <h2 className="font-heading text-xl font-semibold text-text">Add a document</h2>
            <p className="mt-1 text-sm text-text/70">{presetDescription[preset]}</p>
          </div>
          {preview && <p className="rounded-md border border-text/15 bg-background p-3 text-sm text-text/70">Visual preview only. Upload controls are disabled.</p>}

          <form onSubmit={upload} className="space-y-4">
            <fieldset disabled={preview} className="space-y-4 disabled:opacity-75">
              <legend className="sr-only">Upload a document to simplify</legend>
            <div
              onDragOver={event => { event.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={event => {
                event.preventDefault()
                if (!preview) handleDrop(event)
              }}
              className={`rounded-lg border-2 border-dashed p-5 text-center transition-colors sm:p-8 ${isDragging ? 'border-primary bg-primary/10' : 'border-text/25 bg-background'}`}
            >
              <p className="font-medium text-text">Drop a file here</p>
              <p className="mt-1 text-sm text-text/70">PDF, image, or plain text</p>
              <label
                htmlFor="document-file"
                className="mt-4 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10 focus-within:ring-2 focus-within:ring-primary"
              >
                Choose file
              </label>
              <input
                id="document-file"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.tif,.tiff,.bmp,.txt,.md"
                className="sr-only"
                onChange={event => acceptFile(event.target.files?.[0])}
              />
              {selectedFile && <p className="mt-3 break-all text-sm font-medium text-text">{selectedFile.name}</p>}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => { setPasteMode(value => !value); setError('') }}
                aria-expanded={pasteMode}
                className="min-h-10 rounded-md px-3 py-2 text-sm font-medium text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {pasteMode ? 'Use a file instead' : 'Paste text instead'}
              </button>
              {selectedFile && !pasteMode && (
                <button type="button" onClick={() => setSelectedFile(null)} className="min-h-10 px-2 text-sm text-text/70 underline underline-offset-4">
                  Remove file
                </button>
              )}
            </div>

            {pasteMode && (
              <label htmlFor="pasted-document-text" className="block space-y-1.5 text-sm font-medium text-text">
                <span>Text to simplify</span>
                <textarea
                  id="pasted-document-text"
                  value={pastedText}
                  onChange={event => setPastedText(event.target.value)}
                  rows={7}
                  maxLength={250000}
                  placeholder="Paste a passage, lesson, or assignment here…"
                  className="w-full resize-y rounded-md border border-text/25 bg-background p-3 font-normal text-text placeholder:text-text/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </label>
            )}

            <label htmlFor="document-title" className="block space-y-1.5 text-sm font-medium text-text">
              <span>Title <span className="font-normal text-text/60">(optional)</span></span>
              <input
                id="document-title"
                value={title}
                onChange={event => setTitle(event.target.value)}
                maxLength={180}
                placeholder="For example, Chapter 4 notes"
                className="min-h-11 w-full rounded-md border border-text/25 bg-background px-3 py-2 text-text placeholder:text-text/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </label>

            {error && (
              <div role="alert" className="space-y-2 rounded-md border border-red-700/40 bg-background p-3 text-sm text-text">
                <p>{error}</p>
                {retryDocumentId && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void simplify(retryDocumentId)}
                    className="min-h-10 rounded-md border border-primary px-3 py-1.5 font-semibold text-primary hover:bg-primary/10 disabled:opacity-60"
                  >
                    Retry simplification
                  </button>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-primary px-5 py-3 font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-wait disabled:opacity-60 sm:w-auto"
            >
              {busy ? 'Working…' : error && (selectedFile || (pasteMode && pastedText.trim())) ? 'Retry upload' : 'Simplify document'}
            </button>
            </fieldset>
          </form>

          {busy && (
            <div role="status" aria-live="polite" className="flex items-center gap-3 rounded-md border border-primary/30 bg-background p-4 text-sm text-text">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" aria-hidden="true" />
              <span>{progressMessage || 'Preparing your document…'}</span>
            </div>
          )}
        </div>

        <aside className="min-w-0 space-y-3 rounded-lg border border-text/15 bg-surface p-4 sm:p-5" aria-labelledby="document-history-heading">
          <div className="flex items-center justify-between gap-2">
            <h2 id="document-history-heading" className="font-heading text-lg font-semibold text-text">Your documents</h2>
            <button type="button" onClick={() => void loadHistory()} className="min-h-10 px-2 text-sm font-medium text-primary underline underline-offset-4">
              Refresh
            </button>
          </div>
          {historyLoading ? (
            <p role="status" className="text-sm text-text/70">Loading document history…</p>
          ) : historyError ? (
            <p role="alert" className="text-sm text-text">{historyError}</p>
          ) : history.length === 0 ? (
            <p className="rounded-md border border-text/15 bg-background p-4 text-sm text-text/70">Your saved documents will appear here.</p>
          ) : (
            <ul className="max-h-[26rem] space-y-2 overflow-y-auto">
              {history.map(document => (
                <li key={document.id}>
                  <button
                    type="button"
                    onClick={() => void openDocument(document.id)}
                    className={`w-full rounded-md border p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${currentDocument?.id === document.id ? 'border-primary bg-primary/10' : 'border-text/15 bg-background hover:border-primary/50'}`}
                  >
                    <span className="block break-words text-sm font-semibold text-text">{document.title}</span>
                    <span className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-text/70">
                      <span>{formatDate(document.created_at)}</span>
                      <span className="capitalize">{document.status}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </section>

      {currentDocument && (
        <section aria-labelledby="document-result-heading" className="space-y-4 border-t border-text/20 pt-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="document-result-heading" className="font-heading text-2xl font-bold text-text">{currentDocument.title}</h2>
              <p className="mt-1 text-sm text-text/70">Status: <span className="capitalize">{currentDocument.status}</span></p>
            </div>
            {simplifiedText && (
              <button type="button" onClick={downloadSimplified} className="inline-flex min-h-11 items-center justify-center rounded-md border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                Download simplified text
              </button>
            )}
          </div>

          {currentDocument.status === 'processing' && (
            <p role="status" className="rounded-md border border-primary/30 bg-surface p-4 text-sm text-text">Your document is being prepared. This can take a few seconds.</p>
          )}

          {simplifiedText && preset === 'visual_impairment' && (
            <div className="space-y-5 rounded-lg border-2 border-primary bg-surface p-5 sm:p-8">
              <p className="text-sm font-semibold text-text">Voice-first version</p>
              {speech.supported ? (
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => speech.isSpeaking ? speech.stop() : playText(simplifiedText)}
                    className="inline-flex min-h-16 w-full items-center justify-center gap-3 rounded-md bg-primary px-6 py-5 text-xl font-bold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 sm:w-auto sm:min-w-64"
                  >
                    {speech.isSpeaking ? 'Stop listening' : 'Listen'}
                  </button>
                  {speech.isSpeaking && (
                    <button type="button" onClick={speech.isPaused ? speech.resume : speech.pause} className="min-h-12 rounded-md border border-primary px-4 py-2 font-semibold text-primary">
                      {speech.isPaused ? 'Resume' : 'Pause'}
                    </button>
                  )}
                </div>
              ) : (
                <p role="alert" className="text-sm text-text">Text-to-speech is unavailable in this browser. You can still read or download the text below.</p>
              )}
              <details className="rounded-md border border-text/15 bg-background p-4">
                <summary className="min-h-10 cursor-pointer py-2 font-semibold text-text">Read the text</summary>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-text">{simplifiedText}</p>
              </details>
            </div>
          )}

          {simplifiedText && preset === 'adhd' && (
            <div className="space-y-3 rounded-lg border border-text/15 bg-surface p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-heading text-lg font-semibold text-text">Focused sections</h3>
                <p className="text-sm font-medium text-text" aria-live="polite">
                  {sections.length ? `${openSection < 0 ? 0 : openSection + 1} of ${sections.length} sections` : '0 sections'}
                </p>
              </div>
              <div className="space-y-2">
                {sections.map((section, index) => (
                  <section key={`${section.title}-${index}`} className="overflow-hidden rounded-md border border-text/20">
                    <h4>
                      <button
                        type="button"
                        aria-expanded={openSection === index}
                        onClick={() => setOpenSection(openSection === index ? -1 : index)}
                        className="flex min-h-12 w-full items-center justify-between gap-3 bg-background px-4 py-3 text-left font-semibold text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <span>{section.title}</span>
                        <span aria-hidden="true">{openSection === index ? '−' : '+'}</span>
                      </button>
                    </h4>
                    {openSection === index && (
                      <div className="space-y-2 p-4 text-text">
                        {renderAdhdContent(section.content)}
                      </div>
                    )}
                  </section>
                ))}
              </div>
            </div>
          )}

          {simplifiedText && !['visual_impairment', 'adhd'].includes(preset) && (
            <div className="grid gap-4 lg:grid-cols-2">
              <article className="min-w-0 rounded-lg border border-text/15 bg-surface p-4 sm:p-5">
                <h3 className="mb-3 font-heading text-lg font-semibold text-text">Original</h3>
                <div className="max-h-[38rem] overflow-auto rounded-md border border-text/15 bg-background p-4">
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-text">{currentDocument.original_text}</p>
                </div>
              </article>
              <article className="min-w-0 rounded-lg border border-primary/30 bg-surface p-4 sm:p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-heading text-lg font-semibold text-text">Simplified</h3>
                  {preset === 'dyslexia' && speech.supported && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-pressed={readAlong}
                        onClick={startReadAlong}
                        className="min-h-10 rounded-md border border-primary px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/10"
                      >
                        {!readAlong ? 'Read along' : speech.isPaused ? 'Resume' : speech.isSpeaking ? 'Pause' : 'Read again'}
                      </button>
                      {speech.isSpeaking && (
                        <button
                          type="button"
                          onClick={() => { speech.stop(); setReadAlong(false) }}
                          className="min-h-10 rounded-md px-3 py-2 text-sm font-medium text-text underline underline-offset-4"
                        >
                          Stop
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {preset === 'dyslexia' && readAlong ? (
                  <div className="max-h-[38rem] space-y-2 overflow-auto rounded-md border border-text/15 bg-background p-4" style={{ fontFamily: 'var(--font-family)', letterSpacing: 'var(--font-letter-spacing)', lineHeight: 'var(--font-line-height)' }}>
                    {sentences.map((sentence, index) => (
                      <span key={`${sentence}-${index}`} className={`inline rounded-sm text-base ${speech.activeSegment === index ? 'bg-accent text-black' : 'text-text'}`}>
                        {sentence}{' '}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="max-h-[38rem] overflow-auto rounded-md border border-text/15 bg-background p-4" style={preset === 'dyslexia' ? { fontFamily: 'var(--font-family)', letterSpacing: 'var(--font-letter-spacing)', lineHeight: 'var(--font-line-height)' } : undefined}>
                    <p className="whitespace-pre-wrap break-words text-sm text-text">{simplifiedText}</p>
                  </div>
                )}
              </article>
            </div>
          )}
        </section>
      )}
    </main>
  )
}