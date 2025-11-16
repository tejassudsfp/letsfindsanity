'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import Loading from '@/components/shared/Loading'
import ErrorMessage from '@/components/shared/ErrorMessage'

export default function FlagsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [flaggedPosts, setFlaggedPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && (!user || !user.is_admin)) {
      router.push('/')
    } else {
      loadFlagged()
    }
  }, [user, authLoading, router])

  async function loadFlagged() {
    setLoading(true)
    try {
      const data = await api.getFlaggedPosts()
      setFlaggedPosts(data.flagged_posts)
    } catch (err) {
      console.error('Failed to load flagged posts:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(postId: string) {
    if (!confirm('Are you sure you want to delete this post?')) return

    setProcessing(postId)
    setError('')
    try {
      await api.deletePost(postId)
      await loadFlagged()
    } catch (err: any) {
      setError(err.message || 'Failed to delete')
    } finally {
      setProcessing(null)
    }
  }

  if (authLoading || loading) {
    return <Loading />
  }

  return (
    <div className="container">
      <h1 className="mb-lg">flagged posts</h1>

      <ErrorMessage message={error} />

      {flaggedPosts.map((post) => (
        <div key={post.id} className="card mb-md">
          <div className="flex justify-between items-center mb-md">
            <div>
              <strong>{post.three_word_id}</strong>
              <div className="text-tertiary" style={{ fontSize: '12px' }}>
                {new Date(post.created_at).toLocaleDateString()} · {post.flag_count} flags
              </div>
            </div>
            <button
              onClick={() => handleDelete(post.id)}
              disabled={processing !== null}
              style={{ padding: '6px 12px', fontSize: '14px', background: '#ff4444', color: 'white' }}
            >
              delete post
            </button>
          </div>

          <p className="mb-md" style={{ whiteSpace: 'pre-wrap' }}>{post.content}</p>

          <div>
            <strong className="mb-sm">flags:</strong>
            {post.flags.map((flag: any, i: number) => (
              <div key={i} className="text-secondary" style={{ fontSize: '14px', marginTop: '4px' }}>
                • {flag.reason}
              </div>
            ))}
          </div>
        </div>
      ))}

      {flaggedPosts.length === 0 && (
        <div className="text-center text-secondary mt-xl">
          <p>no flagged posts</p>
        </div>
      )}
    </div>
  )
}
