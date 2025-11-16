'use client'

import { useState } from 'react'
import Link from 'next/link'
import ThreeWordBadge from '../shared/ThreeWordBadge'
import { api } from '@/lib/api'

interface PostCardProps {
  post: any
  onUpdate?: () => void
}

const REACTIONS = [
  { type: 'felt-this', label: 'felt this' },
  { type: 'you-got-this', label: 'you got this' },
  { type: 'been-there', label: 'been there' },
  { type: 'this-helped', label: 'this helped' },
]

export default function PostCard({ post, onUpdate }: PostCardProps) {
  const [reacting, setReacting] = useState(false)

  async function handleReaction(type: string) {
    setReacting(true)
    try {
      if (post.user_reacted === type) {
        await api.removeReaction(post.id, type)
      } else {
        if (post.user_reacted) {
          await api.removeReaction(post.id, post.user_reacted)
        }
        await api.addReaction(post.id, type)
      }
      onUpdate?.()
    } catch (err) {
      console.error('Reaction failed:', err)
    } finally {
      setReacting(false)
    }
  }

  return (
    <div className="card mb-md">
      <div className="flex justify-between items-start mb-sm">
        <ThreeWordBadge threeWordId={post.three_word_id} />
        <span className="text-tertiary" style={{ fontSize: '12px' }}>
          {new Date(post.created_at).toLocaleDateString()}
        </span>
      </div>

      {/* Title - Prominent */}
      {post.title && (
        <Link href={`/post/${post.id}`}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: 600,
            marginBottom: '12px',
            lineHeight: '1.3',
            color: 'var(--text-primary)'
          }}>
            {post.title}
          </h3>
        </Link>
      )}

      {/* Intent Label */}
      <div className="flex items-center gap-sm mb-md">
        <span style={{
          fontSize: '12px',
          color: 'var(--text-secondary)',
          fontWeight: 500
        }}>
          intent:
        </span>
        <span style={{
          padding: '2px 10px',
          background: 'var(--bg-tertiary)',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 500
        }}>
          {post.intent}
        </span>
      </div>

      {/* Topics */}
      {post.topics && post.topics.length > 0 && (
        <div className="flex gap-sm mb-md" style={{ flexWrap: 'wrap' }}>
          {post.topics.map((topic: string) => (
            <Link key={topic} href={`/topics/${topic}`}>
              <span style={{
                padding: '2px 8px',
                background: 'var(--bg-tertiary)',
                borderRadius: '4px',
                fontSize: '11px',
                color: 'var(--text-secondary)'
              }}>
                #{topic}
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* Content */}
      <p className="mb-md" style={{
        whiteSpace: 'pre-wrap',
        lineHeight: '1.6',
        fontSize: '15px'
      }}>
        {post.anonymized_content}
      </p>

      {/* Clear Ask - Highlighted */}
      {post.clear_ask && (
        <div style={{
          padding: '12px',
          background: 'var(--bg-tertiary)',
          borderLeft: '3px solid var(--accent)',
          borderRadius: '4px',
          marginBottom: '16px'
        }}>
          <div style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: 'var(--text-tertiary)',
            marginBottom: '4px'
          }}>
            asking for
          </div>
          <p style={{ fontSize: '14px', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
            {post.clear_ask}
          </p>
        </div>
      )}

      {/* Reactions and Comments */}
      <div className="flex items-center justify-between" style={{
        paddingTop: '12px',
        borderTop: '1px solid var(--border)'
      }}>
        <div className="flex gap-sm">
          {REACTIONS.map((r) => (
            <button
              key={r.type}
              onClick={() => handleReaction(r.type)}
              disabled={reacting}
              style={{
                padding: '6px 10px',
                fontSize: '11px',
                background: post.user_reacted === r.type ? 'var(--accent)' : 'transparent',
                color: post.user_reacted === r.type ? 'var(--bg-primary)' : 'var(--text-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-md" style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
          <span>
            {post.reaction_count} reactions
          </span>
          <Link href={`/post/${post.id}`} style={{ color: 'var(--text-secondary)' }}>
            {post.comment_count} comments
          </Link>
        </div>
      </div>
    </div>
  )
}
