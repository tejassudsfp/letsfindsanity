'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/providers/AuthProvider'
import { api } from '@/lib/api'
import Loading from '@/components/shared/Loading'
import ErrorMessage from '@/components/shared/ErrorMessage'

interface LinkedSession {
  id: string
  title: string
  completed_at: string
  word_count: number
  topics: string[]
}

interface Session {
  id: string
  intent: string
  title: string
  raw_content: string
  ai_analysis: string
  completed_at: string | null
  topics: string[]
  is_safe_for_sharing?: boolean
  safety_reason?: string
  duration_seconds?: number
  word_count?: number
  post_id?: string
  post_three_word_id?: string
  linked_sessions?: LinkedSession[]
}

const INTENTS = ['processing', 'agreeing', 'challenging', 'solution', 'venting', 'advice', 'reflecting']

export default function JournalPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([])
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filterIntent, setFilterIntent] = useState('')
  const [filterTopic, setFilterTopic] = useState('')
  const [filterStatus, setFilterStatus] = useState('') // analyzed, unanalyzed, shared
  const [showFilters, setShowFilters] = useState(false)

  // All unique topics from sessions
  const [allTopics, setAllTopics] = useState<string[]>([])

  // Edit mode
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  useEffect(() => {
    if (!authLoading && (!user || !user.three_word_id)) {
      router.push('/')
    } else if (!authLoading && user) {
      loadSessions()
    }
  }, [user, authLoading, router])

  useEffect(() => {
    // Apply filters
    let filtered = sessions

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(s =>
        s.raw_content.toLowerCase().includes(query) ||
        s.ai_analysis?.toLowerCase().includes(query)
      )
    }

    if (filterIntent) {
      filtered = filtered.filter(s => s.intent === filterIntent)
    }

    if (filterTopic) {
      filtered = filtered.filter(s => s.topics?.includes(filterTopic))
    }

    if (filterStatus === 'analyzed') {
      filtered = filtered.filter(s => s.ai_analysis && s.ai_analysis.trim() !== '')
    } else if (filterStatus === 'unanalyzed') {
      filtered = filtered.filter(s => !s.ai_analysis || s.ai_analysis.trim() === '')
    } else if (filterStatus === 'shared') {
      filtered = filtered.filter(s => s.post_id)
    }

    setFilteredSessions(filtered)
  }, [sessions, searchQuery, filterIntent, filterTopic, filterStatus])

  async function loadSessions() {
    setLoading(true)
    setError('')
    try {
      const data = await api.getMySessions()
      setSessions(data.sessions || [])

      // Extract all unique topics
      const topicsSet = new Set<string>()
      data.sessions?.forEach((s: Session) => {
        s.topics?.forEach(t => topicsSet.add(t))
      })
      setAllTopics(Array.from(topicsSet).sort())
    } catch (err: any) {
      setError(err.message || 'Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }

  async function deleteSession(sessionId: string) {
    if (!confirm('Are you sure you want to delete this entry? This cannot be undone.')) return

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sessions/${sessionId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      setSessions(prev => prev.filter(s => s.id !== sessionId))
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null)
      }
    } catch (err) {
      console.error('Failed to delete session:', err)
      setError('Failed to delete entry')
    }
  }

  async function saveEdit(sessionId: string) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sessions/${sessionId}/edit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: editContent })
      })

      // Reload sessions
      await loadSessions()
      setEditingSessionId(null)
      setEditContent('')

      // Update selected session
      if (selectedSession?.id === sessionId) {
        const updated = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sessions/${sessionId}`, {
          credentials: 'include'
        })
        const data = await updated.json()
        setSelectedSession(data)
      }
    } catch (err) {
      console.error('Failed to save edit:', err)
      setError('Failed to save changes')
    }
  }

  function startEdit(session: Session) {
    setEditingSessionId(session.id)
    setEditContent(session.raw_content)
  }

  function cancelEdit() {
    setEditingSessionId(null)
    setEditContent('')
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return 'Draft'
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'today'
    if (diffDays === 1) return 'yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (authLoading || loading) {
    return <Loading />
  }

  return (
    <div style={{
      display: 'flex',
      height: 'calc(100vh - 97px)', // Account for navbar (60px + 32px margin + 5px adjustment)
      overflow: 'hidden',
      marginTop: '-32px' // Pull up to connect with header
    }}>
      {/* Sidebar */}
      <div style={{
        width: '320px',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-secondary)'
      }}>
        {/* Sidebar Header */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>my journal</h2>
            <div style={{ display: 'flex', gap: '6px' }}>
              <Link href="/journal/visualize">
                <button style={{ fontSize: '11px', padding: '6px 10px', whiteSpace: 'nowrap' }}>theme map</button>
              </Link>
              <Link href="/write">
                <button className="primary" style={{ fontSize: '11px', padding: '6px 10px' }}>+ new</button>
              </Link>
            </div>
          </div>

          {/* Search with Filter Button */}
          <div style={{ position: 'relative', marginBottom: '8px' }}>
            <input
              type="text"
              placeholder="search entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', paddingRight: '80px' }}
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                padding: '4px 10px',
                fontSize: '12px',
                background: showFilters ? 'var(--accent)' : 'var(--bg-tertiary)',
                color: showFilters ? 'var(--bg-primary)' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              filters {showFilters ? '▴' : '▾'}
            </button>
          </div>

          {/* Active Filter Badges */}
          {(filterIntent || filterTopic || filterStatus) && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {filterIntent && (
                <span style={{
                  fontSize: '11px',
                  padding: '3px 8px',
                  background: 'var(--accent)',
                  color: 'var(--bg-primary)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer'
                }} onClick={() => setFilterIntent('')}>
                  {filterIntent} ×
                </span>
              )}
              {filterTopic && (
                <span style={{
                  fontSize: '11px',
                  padding: '3px 8px',
                  background: 'var(--accent)',
                  color: 'var(--bg-primary)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer'
                }} onClick={() => setFilterTopic('')}>
                  #{filterTopic} ×
                </span>
              )}
              {filterStatus && (
                <span style={{
                  fontSize: '11px',
                  padding: '3px 8px',
                  background: 'var(--accent)',
                  color: 'var(--bg-primary)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer'
                }} onClick={() => setFilterStatus('')}>
                  {filterStatus} ×
                </span>
              )}
            </div>
          )}

          {/* Expandable Filters */}
          {showFilters && (
            <div style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '8px'
            }}>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>
                  INTENT
                </label>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {INTENTS.map(intent => (
                    <button
                      key={intent}
                      onClick={() => setFilterIntent(filterIntent === intent ? '' : intent)}
                      style={{
                        fontSize: '11px',
                        padding: '4px 8px',
                        background: filterIntent === intent ? 'var(--accent)' : 'var(--bg-tertiary)',
                        color: filterIntent === intent ? 'var(--bg-primary)' : 'var(--text-secondary)',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      {intent}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>
                  TOPIC
                </label>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxHeight: '120px', overflowY: 'auto' }}>
                  {allTopics.map(topic => (
                    <button
                      key={topic}
                      onClick={() => setFilterTopic(filterTopic === topic ? '' : topic)}
                      style={{
                        fontSize: '11px',
                        padding: '4px 8px',
                        background: filterTopic === topic ? 'var(--accent)' : 'var(--bg-tertiary)',
                        color: filterTopic === topic ? 'var(--bg-primary)' : 'var(--text-secondary)',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      #{topic}
                    </button>
                  ))}
                  {allTopics.length === 0 && (
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      no topics yet
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>
                  STATUS
                </label>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {['analyzed', 'unanalyzed', 'shared'].map(status => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(filterStatus === status ? '' : status)}
                      style={{
                        fontSize: '11px',
                        padding: '4px 8px',
                        background: filterStatus === status ? 'var(--accent)' : 'var(--bg-tertiary)',
                        color: filterStatus === status ? 'var(--bg-primary)' : 'var(--text-secondary)',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      {status === 'unanalyzed' ? 'drafts' : status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="text-secondary" style={{ fontSize: '11px' }}>
            {filteredSessions.length} {filteredSessions.length === 1 ? 'entry' : 'entries'}
          </div>
        </div>

        {/* Entry List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              onClick={() => setSelectedSession(session)}
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border)',
                cursor: 'pointer',
                background: selectedSession?.id === session.id ? 'var(--bg-tertiary)' : 'transparent',
                transition: 'background 0.15s'
              }}
            >
              <h4 style={{
                fontSize: '13px',
                fontWeight: 600,
                margin: '0 0 6px 0',
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {session.title || 'untitled'}
              </h4>

              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '8px' }}>
                <span className="text-tertiary" style={{ fontSize: '11px' }}>
                  {formatDate(session.completed_at)}
                </span>
                <span className="text-tertiary" style={{ fontSize: '10px' }}>•</span>
                <span style={{
                  fontSize: '11px',
                  padding: '2px 6px',
                  background: 'var(--bg-primary)',
                  borderRadius: '4px',
                  color: 'var(--text-secondary)'
                }}>
                  {session.intent}
                </span>
              </div>

              <p style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                margin: '0 0 8px 0',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                lineHeight: '1.4'
              }}>
                {session.raw_content}
              </p>

              {/* Topics row */}
              {session.topics && session.topics.length > 0 && (
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '6px' }}>
                  {session.topics.slice(0, 3).map(topic => (
                    <span key={topic} style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      background: 'var(--bg-primary)',
                      borderRadius: '4px',
                      color: 'var(--text-tertiary)',
                      border: '1px solid var(--border)'
                    }}>
                      #{topic}
                    </span>
                  ))}
                  {session.topics.length > 3 && (
                    <span className="text-tertiary" style={{ fontSize: '10px' }}>
                      +{session.topics.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Status badges row */}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {session.ai_analysis && session.ai_analysis.trim() !== '' && (
                  <span className="text-tertiary" style={{ fontSize: '10px' }}>
                    ✓ analyzed
                  </span>
                )}
                {session.post_id && (
                  <span className="text-tertiary" style={{ fontSize: '10px' }}>
                    ✓ shared
                  </span>
                )}
              </div>
            </div>
          ))}

          {filteredSessions.length === 0 && (
            <div className="text-center text-secondary" style={{ padding: '40px 20px' }}>
              <p>{searchQuery || filterIntent || filterTopic || filterStatus ? 'no matching entries' : 'no entries yet'}</p>
              {!searchQuery && !filterIntent && !filterTopic && !filterStatus && (
                <Link href="/write" style={{ marginTop: '12px', display: 'block' }}>
                  <button className="primary small">start writing</button>
                </Link>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-primary)' }}>
        {selectedSession ? (
          <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{
                    padding: '4px 12px',
                    background: 'var(--accent)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: 'var(--bg-primary)',
                    fontWeight: 500
                  }}>
                    {selectedSession.intent}
                  </span>
                  {selectedSession.post_id && (
                    <Link href={`/post/${selectedSession.post_id}`} target="_blank">
                      <span style={{
                        padding: '4px 12px',
                        background: 'var(--bg-tertiary)',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: 'var(--text-primary)',
                        cursor: 'pointer'
                      }}>
                        view public post
                      </span>
                    </Link>
                  )}
                </div>
                <span className="text-tertiary" style={{ fontSize: '13px' }}>
                  {formatDate(selectedSession.completed_at)}
                </span>
              </div>

              {selectedSession.topics && selectedSession.topics.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  {selectedSession.topics.map(topic => (
                    <span key={topic} onClick={() => setFilterTopic(topic)} style={{
                      fontSize: '12px',
                      padding: '4px 10px',
                      background: 'var(--bg-secondary)',
                      borderRadius: '12px',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}>
                      #{topic}
                    </span>
                  ))}
                </div>
              )}

              {/* Linked Sessions */}
              {selectedSession.linked_sessions && selectedSession.linked_sessions.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 500 }}>
                    linked sessions for context
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedSession.linked_sessions.map((linkedSession) => (
                      <div
                        key={linkedSession.id}
                        style={{
                          padding: '10px 12px',
                          background: 'var(--bg-secondary)',
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
                            {linkedSession.title}
                          </div>
                          <div className="text-secondary" style={{ fontSize: '12px' }}>
                            {new Date(linkedSession.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            {' '} · {linkedSession.word_count} words
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const linkedSessionObj = sessions.find(s => s.id === linkedSession.id)
                            if (linkedSessionObj) {
                              setSelectedSession(linkedSessionObj)
                            }
                          }}
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
                </div>
              )}
            </div>

            {/* Raw Content */}
            <div className="card" style={{ marginBottom: '24px' }}>
              <h3 className="mb-md">your writing</h3>

              {editingSessionId === selectedSession.id ? (
                <>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    style={{ minHeight: '300px', width: '100%', marginBottom: '12px' }}
                    autoFocus
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => saveEdit(selectedSession.id)} className="primary">
                      save changes
                    </button>
                    <button onClick={cancelEdit}>cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', marginBottom: '16px' }}>
                    {selectedSession.raw_content}
                  </p>

                  <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: 'var(--text-tertiary)' }}>
                    {selectedSession.word_count && <span>{selectedSession.word_count} words</span>}
                    {selectedSession.duration_seconds && (
                      <span>{Math.floor(selectedSession.duration_seconds / 60)} min</span>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* AI Analysis */}
            {selectedSession.ai_analysis && selectedSession.ai_analysis.trim() !== '' && (
              <div className="card" style={{ marginBottom: '24px', background: 'var(--bg-tertiary)' }}>
                <h3 className="mb-md">reflection</h3>
                <div
                  style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '15px' }}
                  dangerouslySetInnerHTML={{
                    __html: selectedSession.ai_analysis
                      .replace(/^### (.+)$/gm, '<h4 style="margin-top: 16px; margin-bottom: 8px; font-weight: 600; font-size: 16px;">$1</h4>')
                      .replace(/^## (.+)$/gm, '<h3 style="margin-top: 20px; margin-bottom: 10px; font-weight: 600; font-size: 18px;">$1</h3>')
                      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\n\n/g, '</p><p style="margin-bottom: 12px;">')
                      .replace(/^(.+)$/m, '<p style="margin-bottom: 12px;">$1')
                      .concat('</p>')
                  }}
                />
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px' }}>
              {(!selectedSession.ai_analysis || selectedSession.ai_analysis.trim() === '') && (
                <button onClick={() => startEdit(selectedSession)} className="secondary">
                  edit draft
                </button>
              )}
              <button onClick={() => deleteSession(selectedSession.id)} style={{ color: 'var(--error)' }}>
                delete entry
              </button>
            </div>

            {error && <ErrorMessage message={error} />}
          </div>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--text-tertiary)',
            fontSize: '14px'
          }}>
            select an entry to view details
          </div>
        )}
      </div>
    </div>
  )
}
