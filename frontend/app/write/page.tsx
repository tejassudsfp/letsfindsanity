'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { api } from '@/lib/api'
import ErrorMessage from '@/components/shared/ErrorMessage'
import Loading from '@/components/shared/Loading'
import LinkSessionsDialog from '@/components/shared/LinkSessionsDialog'

const INTENTS = [
  { value: 'processing', label: 'processing', desc: 'thinking out loud' },
  { value: 'agreeing', label: 'agreeing', desc: 'want supportive validation' },
  { value: 'challenging', label: 'challenging', desc: 'want different perspectives' },
  { value: 'solution', label: 'solution', desc: 'figured something out' },
  { value: 'venting', label: 'venting', desc: 'need to get it out' },
  { value: 'advice', label: 'advice', desc: 'have a specific problem' },
  { value: 'reflecting', label: 'reflecting', desc: 'looking back' },
]

const MIN_SECONDS = 600 // 10 minutes

function WritePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()

  const [step, setStep] = useState<'type' | 'intent' | 'writing' | 'analysis'>('type')
  const [entryType, setEntryType] = useState<'journal' | 'post'>('journal')
  const [intent, setIntent] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [content, setContent] = useState('')
  const [startTime, setStartTime] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [analysis, setAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [autosaveStatus, setAutosaveStatus] = useState('')
  const [journalTitle, setJournalTitle] = useState('')

  // Editable suggested post
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editAsk, setEditAsk] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)

  // Email todos
  const [emailingTodos, setEmailingTodos] = useState(false)
  const [emailSuccess, setEmailSuccess] = useState(false)

  // Linked sessions
  const [linkedSessionIds, setLinkedSessionIds] = useState<string[]>([])
  const [linkedSessions, setLinkedSessions] = useState<any[]>([])
  const [showLinkDialog, setShowLinkDialog] = useState(false)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const autosaveRef = useRef<NodeJS.Timeout | null>(null)
  const loadingMessageRef = useRef<NodeJS.Timeout | null>(null)

  const loadingMessages = [
    'reading your thoughts...',
    'pondering deeply...',
    'connecting the dots...',
    'finding patterns...',
    'brewing insights...',
    'channeling wisdom...',
    'almost there...',
    'putting it all together...',
    'this is good stuff...',
    'one moment please...'
  ]

  useEffect(() => {
    if (!authLoading && (!user || !user.three_word_id)) {
      router.push('/')
    }
  }, [user, authLoading, router])

  // Load draft if editing
  useEffect(() => {
    const editSessionId = searchParams.get('edit')
    if (editSessionId && user) {
      loadDraft(editSessionId)
    }
  }, [searchParams, user])

  // Rotate loading messages while analyzing
  useEffect(() => {
    if (loading && step === 'writing') {
      setLoadingMessageIndex(0)
      loadingMessageRef.current = setInterval(() => {
        setLoadingMessageIndex(prev => (prev + 1) % loadingMessages.length)
      }, 2000)

      return () => {
        if (loadingMessageRef.current) clearInterval(loadingMessageRef.current)
      }
    }
  }, [loading, step])

  async function loadDraft(id: string) {
    setLoading(true)
    try {
      const session = await api.getSession(id)
      setSessionId(id)
      setIntent(session.intent)
      setContent(session.raw_content || '')
      setStep('writing')
      setStartTime(Date.now())
    } catch (err: any) {
      setError('Failed to load draft')
    } finally {
      setLoading(false)
    }
  }

  // Timer
  useEffect(() => {
    if (step === 'writing' && startTime > 0) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)

      return () => {
        if (timerRef.current) clearInterval(timerRef.current)
      }
    }
  }, [step, startTime])

  // Autosave
  useEffect(() => {
    if (step === 'writing' && sessionId && content) {
      if (autosaveRef.current) clearTimeout(autosaveRef.current)

      autosaveRef.current = setTimeout(async () => {
        try {
          await api.autosaveSession(sessionId, content)
          setAutosaveStatus('saved')
          setTimeout(() => setAutosaveStatus(''), 2000)
        } catch (err) {
          console.error('Autosave failed:', err)
        }
      }, 2000)
    }

    return () => {
      if (autosaveRef.current) clearTimeout(autosaveRef.current)
    }
  }, [content, sessionId, step])

  async function handleStartWriting() {
    if (!intent) {
      setError('Please select an intent')
      return
    }

    setError('')
    setLoading(true)

    try {
      const data = await api.startSession(intent)
      setSessionId(data.session_id)
      setStartTime(Date.now())
      setStep('writing')
    } catch (err: any) {
      setError(err.message || 'Failed to start session')
    } finally {
      setLoading(false)
    }
  }

  async function handleAnalyze() {
    if (!content.trim()) return

    setError('')
    setLoading(true)

    try {
      const data = await api.analyzeSession(sessionId, content, elapsed, linkedSessionIds)
      setAnalysis(data.analysis)

      // Set journal title and suggested post
      if (data.analysis.journal_title) {
        setJournalTitle(data.analysis.journal_title)
      }

      if (data.analysis.suggested_post) {
        setEditTitle(data.analysis.suggested_post.title)
        setEditContent(data.analysis.suggested_post.content)
        setEditAsk(data.analysis.suggested_post.clear_ask)
      }

      setStep('analysis')
    } catch (err: any) {
      setError(err.message || 'Failed to analyze')
    } finally {
      setLoading(false)
    }
  }

  async function handleLinkedSessionsSelect(selectedIds: string[]) {
    setLinkedSessionIds(selectedIds)

    // Fetch full session details for character counting
    if (selectedIds.length > 0) {
      try {
        const sessions = await Promise.all(
          selectedIds.map(id => api.getSession(id))
        )
        setLinkedSessions(sessions)
      } catch (err) {
        console.error('Failed to fetch linked session details:', err)
      }
    } else {
      setLinkedSessions([])
    }
  }

  async function handleEmailTodos() {
    setError('')
    setEmailingTodos(true)
    setEmailSuccess(false)

    try {
      const token = localStorage.getItem('auth_token')
      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sessions/${sessionId}/email-todos`, {
        method: 'POST',
        credentials: 'include',
        headers
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send email')
      }

      setEmailSuccess(true)
      setTimeout(() => setEmailSuccess(false), 5000) // Hide success message after 5 seconds
    } catch (err: any) {
      setError(err.message || 'Failed to send email')
    } finally {
      setEmailingTodos(false)
    }
  }

  async function handleSavePrivate() {
    setError('')
    setLoading(true)

    try {
      await api.savePrivate(sessionId, content, analysis.private_reflection, elapsed, journalTitle)
      router.push('/journal')
    } catch (err: any) {
      setError(err.message || 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  async function handlePublish() {
    if (!editTitle || !editContent || !editAsk) {
      setError('Title, content, and ask are all required.')
      return
    }

    setError('')
    setPublishing(true)

    try {
      await api.shareSession(sessionId, {
        original_content: content,
        title: editTitle,
        anonymized_content: editContent,
        clear_ask: editAsk,
        topics: analysis.suggested_post.topics,
        ai_analysis: analysis.private_reflection,
        duration_seconds: elapsed
      })
      router.push('/feed')
    } catch (err: any) {
      setError(err.message || 'Failed to publish')
    } finally {
      setPublishing(false)
    }
  }

  if (authLoading || !user) {
    return <Loading />
  }

  const timeRemaining = Math.max(0, MIN_SECONDS - elapsed)
  const wordCount = content.split(/\s+/).filter(w => w).length
  const canAnalyze = content.trim().length > 0

  // Character count for token limit tracking (10k tokens ≈ 40k characters)
  const currentChars = content.length
  const linkedChars = linkedSessions.reduce((sum, s) => sum + (s.raw_content?.length || 0), 0)
  const totalChars = currentChars + linkedChars
  const charLimit = 40000
  const charWarning = totalChars > charLimit * 0.9

  return (
    <div className="container" style={{ maxWidth: '700px' }}>
      {/* Step 1: Choose Journal or Post */}
      {step === 'type' && (
        <div className="card">
          <h2 className="mb-md">what would you like to create?</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div
              style={{
                padding: '24px',
                border: entryType === 'journal' ? '2px solid var(--accent)' : '1px solid var(--border)',
                borderRadius: '8px',
                cursor: 'pointer',
                background: entryType === 'journal' ? 'var(--bg-tertiary)' : 'transparent',
                transition: 'all 0.2s',
                textAlign: 'center'
              }}
              onClick={() => setEntryType('journal')}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: '0 auto 12px' }}>
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                <line x1="10" y1="8" x2="16" y2="8"></line>
                <line x1="10" y1="12" x2="16" y2="12"></line>
                <line x1="10" y1="16" x2="14" y2="16"></line>
              </svg>
              <div style={{ fontWeight: 600, marginBottom: '6px', fontSize: '16px' }}>journal entry</div>
              <div className="text-secondary" style={{ fontSize: '13px' }}>
                private reflection with AI analysis
              </div>
            </div>

            <div
              style={{
                padding: '24px',
                border: entryType === 'post' ? '2px solid var(--accent)' : '1px solid var(--border)',
                borderRadius: '8px',
                cursor: 'pointer',
                background: entryType === 'post' ? 'var(--bg-tertiary)' : 'transparent',
                transition: 'all 0.2s',
                textAlign: 'center'
              }}
              onClick={() => setEntryType('post')}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: '0 auto 12px' }}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                <line x1="9" y1="10" x2="15" y2="10"></line>
                <line x1="9" y1="14" x2="15" y2="14"></line>
              </svg>
              <div style={{ fontWeight: 600, marginBottom: '6px', fontSize: '16px' }}>public post</div>
              <div className="text-secondary" style={{ fontSize: '13px' }}>
                share with the community
              </div>
            </div>
          </div>

          <button
            className="primary"
            onClick={() => setStep('intent')}
            style={{ width: '100%' }}
          >
            continue
          </button>
        </div>
      )}

      {/* Step 2: Intent Selection */}
      {step === 'intent' && (
        <div className="card">
          <h2 className="mb-md">what's your intent?</h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            marginBottom: '24px'
          }}>
            {INTENTS.map((i) => (
              <div
                key={i.value}
                style={{
                  padding: '12px',
                  border: intent === i.value ? '2px solid var(--accent)' : '1px solid var(--border)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: intent === i.value ? 'var(--bg-tertiary)' : 'transparent',
                  transition: 'all 0.2s'
                }}
                onClick={() => setIntent(i.value)}
              >
                <div style={{ fontWeight: 500, marginBottom: '4px' }}>{i.label}</div>
                <div className="text-secondary" style={{ fontSize: '13px' }}>{i.desc}</div>
              </div>
            ))}
          </div>

          {error && <ErrorMessage message={error} />}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setStep('type')}
              style={{ flex: 1 }}
            >
              back
            </button>
            <button
              className="primary"
              onClick={handleStartWriting}
              disabled={!intent || loading}
              style={{ flex: 2 }}
            >
              {loading ? 'starting...' : 'start writing'}
            </button>
          </div>
        </div>
      )}

      {/* Writing */}
      {step === 'writing' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px' }}>{entryType === 'journal' ? 'journal entry' : 'public post'}</h3>
              <p className="text-secondary" style={{ fontSize: '13px', marginTop: '4px' }}>
                {INTENTS.find(i => i.value === intent)?.label}
              </p>
            </div>
            <div className="text-secondary" style={{ fontSize: '13px', textAlign: 'right' }}>
              <div>{Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, '0')}</div>
              <div>{wordCount} words</div>
              {charWarning && (
                <div style={{ color: 'var(--warning)', fontSize: '11px' }}>
                  {totalChars}/{charLimit} chars
                </div>
              )}
              {autosaveStatus && <div style={{ color: 'var(--accent)', fontSize: '11px' }}>saved</div>}
            </div>
          </div>

          {/* Link Previous Sessions */}
          {entryType === 'journal' && (
            <div style={{ marginBottom: '16px' }}>
              <button
                onClick={() => setShowLinkDialog(true)}
                style={{
                  padding: '8px 12px',
                  fontSize: '13px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
                link previous sessions ({linkedSessionIds.length}/2)
              </button>

              {/* Display linked sessions */}
              {linkedSessions.length > 0 && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {linkedSessions.map((session) => (
                    <div
                      key={session.id}
                      style={{
                        padding: '10px 12px',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        fontSize: '13px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, marginBottom: '2px' }}>
                          {session.title || 'untitled'}
                        </div>
                        <div className="text-secondary" style={{ fontSize: '12px' }}>
                          {new Date(session.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {' '} · {session.word_count} words
                        </div>
                      </div>
                      <button
                        onClick={() => window.open(`/journal/${session.id}`, '_blank')}
                        style={{
                          padding: '4px 8px',
                          fontSize: '12px',
                          background: 'transparent',
                          border: '1px solid var(--border)',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          marginLeft: '8px'
                        }}
                      >
                        view
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="start writing..."
            style={{
              width: '100%',
              minHeight: '400px',
              fontSize: '15px',
              lineHeight: '1.7',
              resize: 'vertical',
              marginBottom: '16px'
            }}
            autoFocus
          />

          {error && <ErrorMessage message={error} />}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className="primary"
              onClick={handleAnalyze}
              disabled={!canAnalyze || loading}
              style={{ flex: 1 }}
            >
              {loading ? loadingMessages[loadingMessageIndex] : `analyze (${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60).toString().padStart(2, '0')} for best results)`}
            </button>
          </div>
        </div>
      )}

      {/* Link Sessions Dialog */}
      <LinkSessionsDialog
        isOpen={showLinkDialog}
        onClose={() => setShowLinkDialog(false)}
        selectedIds={linkedSessionIds}
        onSelect={handleLinkedSessionsSelect}
        maxSelection={2}
      />

      {/* Analysis + Suggested Post */}
      {step === 'analysis' && analysis && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Private Analysis */}
          <div className="card">
            <h3 className="mb-sm">private analysis</h3>
            <div
              style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '15px' }}
              dangerouslySetInnerHTML={{
                __html: analysis.private_reflection
                  .replace(/^### (.+)$/gm, '<h4 style="margin-top: 16px; margin-bottom: 8px; font-weight: 600; font-size: 16px;">$1</h4>')
                  .replace(/^## (.+)$/gm, '<h3 style="margin-top: 20px; margin-bottom: 10px; font-weight: 600; font-size: 18px;">$1</h3>')
                  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\n\n/g, '</p><p style="margin-bottom: 12px;">')
                  .replace(/^(.+)$/m, '<p style="margin-bottom: 12px;">$1')
                  .concat('</p>')
              }}
            />
          </div>

          {/* Suggested Public Post */}
          {analysis.suggested_post && (
            <div className="card" style={{ border: '2px solid var(--accent)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0 }}>suggested public post</h3>
                  <p className="text-secondary" style={{ fontSize: '13px', marginTop: '4px' }}>
                    {analysis.suggested_post.safe_to_publish
                      ? 'ready to publish — edit if you want'
                      : `⚠️ ${analysis.suggested_post.safety_notes}`}
                  </p>
                </div>
              </div>

              {/* Editable Title */}
              <div className="mb-md">
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={{ width: '100%' }}
                  maxLength={100}
                />
              </div>

              {/* Editable Content */}
              <div className="mb-md">
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  content
                </label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  style={{ width: '100%', minHeight: '150px', fontSize: '14px', lineHeight: '1.6' }}
                />
              </div>

              {/* Editable Ask */}
              <div className="mb-md">
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  what are you asking for?
                </label>
                <input
                  type="text"
                  value={editAsk}
                  onChange={(e) => setEditAsk(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Topics */}
              <div className="mb-lg">
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  topics
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {analysis.suggested_post.topics.map((topic: string, idx: number) => (
                    <span key={idx} style={{
                      fontSize: '12px',
                      padding: '4px 10px',
                      background: 'var(--bg-tertiary)',
                      borderRadius: '12px'
                    }}>
                      #{topic}
                    </span>
                  ))}
                </div>
              </div>

              {error && <ErrorMessage message={error} />}
              {emailSuccess && (
                <div style={{
                  padding: '12px',
                  background: 'var(--accent)',
                  color: 'var(--bg-primary)',
                  borderRadius: '4px',
                  marginTop: '12px',
                  textAlign: 'center',
                  fontSize: '14px'
                }}>
                  ✓ email sent! check your inbox for the action items from fred.
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button
                  onClick={handleEmailTodos}
                  disabled={emailingTodos}
                  style={{ flex: 1 }}
                >
                  {emailingTodos ? 'sending...' : 'email todos to me'}
                </button>
                <button
                  className="primary"
                  onClick={handlePublish}
                  disabled={publishing || !editTitle || !editContent || !editAsk}
                  style={{ flex: 1 }}
                >
                  {publishing ? 'publishing...' : 'share as post'}
                </button>
                <button
                  onClick={() => router.push('/journal')}
                  style={{ flex: 0.5 }}
                >
                  done
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function WritePage() {
  return (
    <Suspense fallback={<Loading />}>
      <WritePageContent />
    </Suspense>
  )
}
