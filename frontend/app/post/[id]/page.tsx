'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { api } from '@/lib/api'
import ThreeWordBadge from '@/components/shared/ThreeWordBadge'
import Loading from '@/components/shared/Loading'
import ErrorMessage from '@/components/shared/ErrorMessage'

// Helper function to render markdown in comments
function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h4 style="margin-top: 16px; margin-bottom: 8px; font-weight: 600; font-size: 16px;">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 style="margin-top: 20px; margin-bottom: 10px; font-weight: 600; font-size: 18px;">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p style="margin-bottom: 12px;">')
    .replace(/^(.+)$/m, '<p style="margin-bottom: 12px;">$1')
    .concat('</p>')
}

export default function PostPage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()

  const [post, setPost] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && (!user || !user.three_word_id)) {
      router.push('/')
    } else {
      loadPost()
    }
  }, [user, authLoading, router, params.id])

  async function loadPost() {
    setLoading(true)
    try {
      const data = await api.getPost(params.id as string)
      setPost(data.post)
      setComments(data.comments)
    } catch (err) {
      console.error('Failed to load post:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim()) return

    setError('')
    setSubmitting(true)

    try {
      await api.addComment(params.id as string, newComment)
      setNewComment('')
      await loadPost()
    } catch (err: any) {
      setError(err.message || 'Failed to add comment')
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || loading || !post) {
    return <Loading />
  }

  return (
    <div className="container" style={{ maxWidth: '700px' }}>
      <div className="card mb-lg">
        <div className="flex justify-between items-center mb-sm">
          <ThreeWordBadge threeWordId={post.three_word_id} />
          <span className="text-tertiary" style={{ fontSize: '12px' }}>
            {new Date(post.created_at).toLocaleDateString()}
          </span>
        </div>

        <div className="mb-sm">
          <span style={{
            padding: '2px 8px',
            background: 'var(--bg-tertiary)',
            borderRadius: '4px',
            fontSize: '12px',
            marginRight: '8px'
          }}>
            {post.intent}
          </span>
          {post.topics && post.topics.map((topic: string) => (
            <span key={topic} style={{
              padding: '2px 8px',
              background: 'var(--bg-tertiary)',
              borderRadius: '4px',
              fontSize: '12px',
              marginRight: '8px'
            }}>
              #{topic}
            </span>
          ))}
        </div>

        <p className="mb-md" style={{ whiteSpace: 'pre-wrap', fontSize: '16px' }}>
          {post.anonymized_content}
        </p>

        {post.clear_ask && (
          <p className="text-secondary mb-md" style={{ fontSize: '14px', fontStyle: 'italic' }}>
            {post.clear_ask}
          </p>
        )}

        <div className="text-secondary" style={{ fontSize: '14px' }}>
          {post.reaction_count} reactions · {post.comment_count} comments
        </div>
      </div>

      <div className="card">
        <h3 className="mb-md">comments</h3>

        {comments.map((comment) => (
          <div key={comment.id} style={{
            padding: '12px',
            borderBottom: '1px solid var(--border)',
            marginBottom: '12px'
          }}>
            <div className="flex justify-between items-center mb-xs">
              <ThreeWordBadge threeWordId={comment.three_word_id} />
              <span className="text-tertiary" style={{ fontSize: '12px' }}>
                {new Date(comment.created_at).toLocaleDateString()}
              </span>
            </div>
            <div
              style={{ fontSize: '14px', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(comment.content) }}
            />
          </div>
        ))}

        {comments.length === 0 && (
          <p className="text-secondary mb-md">no comments yet. be the first!</p>
        )}

        <form onSubmit={handleAddComment}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="add a comment..."
            rows={3}
            disabled={submitting}
          />

          <ErrorMessage message={error} />

          <button
            type="submit"
            className="primary mt-sm"
            style={{ width: '100%' }}
            disabled={submitting || !newComment.trim()}
          >
            {submitting ? 'posting...' : 'post comment'}
          </button>
        </form>
      </div>
    </div>
  )
}
