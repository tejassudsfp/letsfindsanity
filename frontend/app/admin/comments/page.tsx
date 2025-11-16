'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import Loading from '@/components/shared/Loading'

export default function AdminCommentsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterUserId, setFilterUserId] = useState('')
  const [filterPostId, setFilterPostId] = useState('')
  const observerRef = useRef<IntersectionObserver>()
  const loadMoreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!authLoading && (!user || !user.is_admin)) {
      router.push('/')
    } else {
      loadComments()
    }
  }, [user, authLoading, router])

  async function loadComments(cursor?: string, append = false) {
    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
      setComments([])
    }

    try {
      const params = new URLSearchParams()
      params.append('limit', '50')
      if (cursor) params.append('cursor', cursor)
      if (searchTerm) params.append('search', searchTerm)
      if (filterUserId) params.append('user_id', filterUserId)
      if (filterPostId) params.append('post_id', filterPostId)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/comments?${params}`, {
        credentials: 'include'
      })
      const data = await response.json()

      if (append) {
        setComments(prev => [...prev, ...data.comments])
      } else {
        setComments(data.comments)
      }

      setHasMore(data.has_more)
      setNextCursor(data.next_cursor)
    } catch (err) {
      console.error('Failed to load comments:', err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMore = useCallback(() => {
    if (hasMore && nextCursor && !loadingMore) {
      loadComments(nextCursor, true)
    }
  }, [hasMore, nextCursor, loadingMore])

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loadingMore) {
        loadMore()
      }
    })

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => observerRef.current?.disconnect()
  }, [loadMore, loadingMore])

  const applyFilters = () => {
    loadComments()
  }

  const clearFilters = () => {
    setSearchTerm('')
    setFilterUserId('')
    setFilterPostId('')
    setTimeout(() => loadComments(), 0)
  }

  if (authLoading) {
    return <Loading />
  }

  return (
    <div className="container">
      <div className="flex justify-between items-center mb-lg">
        <h1>all comments</h1>
        <Link href="/admin">
          <button>back to dashboard</button>
        </Link>
      </div>

      <div className="card mb-lg">
        <h3 className="mb-md">filters</h3>

        <div className="mb-md">
          <label className="text-secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
            search in content
          </label>
          <input
            type="text"
            placeholder="search comment content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
            style={{ width: '100%', padding: '10px', fontSize: '14px' }}
          />
        </div>

        <div className="mb-md">
          <label className="text-secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
            filter by user ID
          </label>
          <input
            type="text"
            placeholder="user id..."
            value={filterUserId}
            onChange={(e) => setFilterUserId(e.target.value)}
            style={{ width: '100%', padding: '10px', fontSize: '14px' }}
          />
        </div>

        <div className="mb-md">
          <label className="text-secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
            filter by post ID
          </label>
          <input
            type="text"
            placeholder="post id..."
            value={filterPostId}
            onChange={(e) => setFilterPostId(e.target.value)}
            style={{ width: '100%', padding: '10px', fontSize: '14px' }}
          />
        </div>

        <div className="flex gap-md">
          <button className="primary" onClick={applyFilters}>
            apply filters
          </button>
          <button onClick={clearFilters}>
            clear filters
          </button>
        </div>
      </div>

      {loading && <Loading />}

      {!loading && comments && (
        <div className="mb-xl">
          <h2 className="mb-md">{comments.length} comments loaded</h2>
          <div className="flex flex-col gap-md">
            {comments.map((comment: any) => (
              <div key={comment.id} className="card">
                <div className="flex justify-between items-start mb-sm">
                  <div>
                    <div className="flex gap-sm items-center">
                      <strong>@{comment.user.three_word_id || 'anonymous'}</strong>
                      {comment.is_ai_analysis && (
                        <span style={{ fontSize: '11px', color: 'var(--accent)' }}>AI</span>
                      )}
                    </div>
                    {comment.user.email && (
                      <div className="text-tertiary" style={{ fontSize: '12px' }}>
                        {comment.user.email}
                      </div>
                    )}
                  </div>
                  <div className="text-tertiary" style={{ fontSize: '12px' }}>
                    {new Date(comment.created_at).toLocaleString()}
                  </div>
                </div>

                <p style={{ fontSize: '14px', marginBottom: '12px', whiteSpace: 'pre-wrap' }}>
                  {comment.content}
                </p>

                <div className="text-secondary" style={{ fontSize: '13px', marginBottom: '8px' }}>
                  {comment.upvote_count} upvotes
                </div>

                {comment.post.id && (
                  <div className="text-tertiary" style={{ fontSize: '12px', padding: '8px', background: 'var(--bg-secondary)', borderRadius: '4px' }}>
                    <div className="mb-xs">
                      <strong>Post:</strong> <Link href={`/posts/${comment.post.id}`} style={{ color: 'var(--accent)' }}>
                        {comment.post.title}
                      </Link>
                    </div>
                    <div>
                      by @{comment.post.author} • {new Date(comment.post.created_at).toLocaleDateString()}
                    </div>
                  </div>
                )}

                {comment.user.id && (
                  <div style={{ marginTop: '8px' }}>
                    <Link href={`/admin/users/${comment.user.id}`}>
                      <button style={{ fontSize: '12px', padding: '6px 12px' }}>
                        view user
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>

          {comments.length === 0 && (
            <div className="card text-center text-secondary">
              no comments found
            </div>
          )}

          {/* Load More Trigger */}
          {hasMore && (
            <div ref={loadMoreRef} className="text-center p-lg">
              {loadingMore && <Loading message="loading more comments..." />}
            </div>
          )}

          {!hasMore && comments.length > 0 && (
            <div className="text-center text-tertiary p-md" style={{ fontSize: '12px' }}>
              no more comments to load
            </div>
          )}
        </div>
      )}
    </div>
  )
}
