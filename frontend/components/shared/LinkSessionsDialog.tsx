'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

interface Session {
  id: string
  title: string
  topics: string[]
  completed_at: string
  word_count: number
}

interface LinkSessionsDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedIds: string[]
  onSelect: (ids: string[]) => void
  maxSelection?: number
}

export default function LinkSessionsDialog({
  isOpen,
  onClose,
  selectedIds,
  onSelect,
  maxSelection = 2
}: LinkSessionsDialogProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [tempSelected, setTempSelected] = useState<string[]>(selectedIds)

  useEffect(() => {
    if (isOpen) {
      setTempSelected(selectedIds)
      fetchSessions('')
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        fetchSessions(searchQuery)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [searchQuery])

  async function fetchSessions(query: string) {
    setLoading(true)
    try {
      const data = await api.searchSessionsForLinking(query)
      setSessions(data.sessions)
    } catch (err) {
      console.error('Failed to fetch sessions:', err)
    } finally {
      setLoading(false)
    }
  }

  function toggleSession(id: string) {
    if (tempSelected.includes(id)) {
      setTempSelected(tempSelected.filter(s => s !== id))
    } else if (tempSelected.length < maxSelection) {
      setTempSelected([...tempSelected, id])
    }
  }

  function handleConfirm() {
    onSelect(tempSelected)
    onClose()
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--bg-primary)',
        borderRadius: '8px',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid var(--border)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid var(--border)'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
            link previous sessions
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            select up to {maxSelection} previous journal entries for context. this helps ai identify patterns across your entries.
          </p>

          {/* Search input */}
          <input
            type="text"
            placeholder="search by title or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              fontSize: '14px',
              color: 'var(--text-primary)'
            }}
          />
        </div>

        {/* Session list */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '12px'
        }}>
          {loading && <p style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>searching...</p>}

          {!loading && sessions.length === 0 && (
            <p style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              {searchQuery ? 'no sessions found' : 'no completed sessions yet'}
            </p>
          )}

          {!loading && sessions.map((session) => {
            const isSelected = tempSelected.includes(session.id)
            const isDisabled = !isSelected && tempSelected.length >= maxSelection

            return (
              <div
                key={session.id}
                onClick={() => !isDisabled && toggleSession(session.id)}
                style={{
                  padding: '12px',
                  marginBottom: '8px',
                  background: isSelected ? 'var(--accent-bg)' : 'var(--bg-secondary)',
                  border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: '4px',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  opacity: isDisabled ? 0.5 : 1,
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '4px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 500, color: isSelected ? 'var(--accent)' : 'var(--text-primary)' }}>
                    {session.title || 'untitled'}
                  </h3>
                  {isSelected && (
                    <span style={{ fontSize: '12px', color: 'var(--accent)' }}>✓ selected</span>
                  )}
                </div>

                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  {formatDate(session.completed_at)} · {session.word_count} words
                </div>

                {session.topics && session.topics.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {session.topics.map((topic, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '12px',
                          padding: '2px 8px',
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border)',
                          borderRadius: '12px',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {tempSelected.length} / {maxSelection} selected
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                fontSize: '14px',
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              cancel
            </button>
            <button
              onClick={handleConfirm}
              className="primary"
              style={{
                padding: '8px 16px',
                fontSize: '14px'
              }}
            >
              link sessions
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
