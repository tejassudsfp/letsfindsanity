'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import Loading from '@/components/shared/Loading'

export default function AdminSearchPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState<'all' | 'users' | 'posts'>('all')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const observerRef = useRef<IntersectionObserver>()
  const loadMoreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!authLoading && (!user || !user.is_admin)) {
      router.push('/')
    } else if (!authLoading && user && user.is_admin) {
      // Load all users by default
      loadAllUsers()
    }
  }, [user, authLoading, router])

  const loadAllUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users?limit=20`, {
        credentials: 'include'
      })
      const data = await response.json()
      setResults({
        users: data.users || [],
        posts: [],
        has_more_users: data.has_more,
        has_more_posts: false,
        next_cursor_users: data.next_cursor,
        next_cursor_posts: null
      })
    } catch (err) {
      console.error('Failed to load users:', err)
    } finally {
      setLoading(false)
    }
  }

  const performSearch = async (cursor?: string) => {
    if (!query && !selectedUserId) return

    if (cursor) {
      setLoadingMore(true)
    } else {
      setLoading(true)
      setResults(null)
    }

    try {
      const params = new URLSearchParams()
      if (query) params.append('q', query)
      if (selectedUserId) params.append('user_id', selectedUserId)
      params.append('type', searchType)
      params.append('limit', '20')
      if (cursor) {
        params.append('cursor', cursor)
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/search?${params}`, {
        credentials: 'include'
      })
      const data = await response.json()

      if (cursor && results) {
        // Append to existing results
        setResults({
          users: [...results.users, ...(data.users || [])],
          posts: [...results.posts, ...(data.posts || [])],
          has_more_users: data.has_more_users,
          has_more_posts: data.has_more_posts,
          next_cursor_users: data.next_cursor_users,
          next_cursor_posts: data.next_cursor_posts
        })
      } else {
        setResults(data)
      }
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMore = useCallback(() => {
    if (!results || loadingMore) return

    // Determine which cursor to use
    let cursor = null
    if (searchType === 'users' && results.has_more_users && results.next_cursor_users) {
      cursor = results.next_cursor_users
    } else if (searchType === 'posts' && results.has_more_posts && results.next_cursor_posts) {
      cursor = results.next_cursor_posts
    } else if (searchType === 'all') {
      // For 'all', load more based on which has more
      if (results.has_more_users && results.next_cursor_users) {
        cursor = results.next_cursor_users
      } else if (results.has_more_posts && results.next_cursor_posts) {
        cursor = results.next_cursor_posts
      }
    }

    if (cursor) {
      performSearch(cursor)
    }
  }, [results, loadingMore, searchType])

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

  if (authLoading) {
    return <Loading />
  }

  return (
    <div className="container">
      <div className="flex justify-between items-center mb-lg">
        <h1>admin search</h1>
        <Link href="/admin">
          <button>back to dashboard</button>
        </Link>
      </div>

      <div className="card mb-lg">
        <div className="mb-md">
          <input
            type="text"
            placeholder="search users (email, tag) or posts (title, content)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && performSearch()}
            style={{ width: '100%', padding: '12px', fontSize: '15px' }}
          />
        </div>

        <div className="flex gap-md items-center mb-md">
          <div className="flex gap-sm">
            <button
              className={searchType === 'all' ? 'primary' : ''}
              onClick={() => setSearchType('all')}
            >
              all
            </button>
            <button
              className={searchType === 'users' ? 'primary' : ''}
              onClick={() => setSearchType('users')}
            >
              users
            </button>
            <button
              className={searchType === 'posts' ? 'primary' : ''}
              onClick={() => setSearchType('posts')}
            >
              posts
            </button>
          </div>

          <button className="primary" onClick={() => performSearch()} disabled={loading}>
            {loading ? 'searching...' : 'search'}
          </button>
        </div>

        {searchType === 'posts' && (
          <div>
            <input
              type="text"
              placeholder="optional: filter by user ID to search posts within user"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              style={{ width: '100%', padding: '10px', fontSize: '14px' }}
            />
          </div>
        )}
      </div>

      {loading && <Loading />}

      {results && (
        <div>
          {/* Users Results */}
          {(searchType === 'all' || searchType === 'users') && results.users && results.users.length > 0 && (
            <div className="mb-xl">
              <h2 className="mb-md">users ({results.users.length})</h2>
              <div className="flex flex-col gap-md">
                {results.users.map((user: any) => (
                  <div key={user.id} className="card">
                    <div className="flex justify-between items-start mb-sm">
                      <div>
                        <Link href={`/admin/users/${user.id}`}>
                          <strong className="text-accent" style={{ cursor: 'pointer' }}>
                            {user.email}
                          </strong>
                        </Link>
                        {user.three_word_id && (
                          <div className="text-secondary" style={{ fontSize: '14px' }}>
                            @{user.three_word_id}
                          </div>
                        )}
                      </div>
                      <div className="text-tertiary" style={{ fontSize: '12px' }}>
                        {user.is_admin && <span style={{ color: 'var(--accent)' }}>admin • </span>}
                        last active: {user.last_active ? new Date(user.last_active).toLocaleDateString() : 'never'}
                      </div>
                    </div>
                    <div className="flex gap-md text-secondary" style={{ fontSize: '13px' }}>
                      <span>{user.post_count} posts</span>
                      <span>{user.comment_count} comments</span>
                      <span>{user.session_count} sessions</span>
                      {user.application_status && (
                        <span style={{ color: 'var(--accent)' }}>{user.application_status}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Posts Results */}
          {(searchType === 'all' || searchType === 'posts') && results.posts && results.posts.length > 0 && (
            <div className="mb-xl">
              <h2 className="mb-md">posts ({results.posts.length})</h2>
              <div className="flex flex-col gap-md">
                {results.posts.map((post: any) => (
                  <div key={post.id} className="card">
                    <div className="flex justify-between items-start mb-sm">
                      <div style={{ flex: 1 }}>
                        <Link href={`/posts/${post.id}`}>
                          <strong style={{ cursor: 'pointer' }}>{post.title}</strong>
                        </Link>
                        <div className="text-secondary" style={{ fontSize: '14px', marginTop: '4px' }}>
                          by @{post.three_word_id}
                          {post.user_email && (
                            <span className="text-tertiary"> ({post.user_email})</span>
                          )}
                        </div>
                      </div>
                      <div className="text-tertiary" style={{ fontSize: '12px' }}>
                        {new Date(post.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <p className="text-secondary" style={{ fontSize: '14px', marginBottom: '8px' }}>
                      {post.content}
                    </p>
                    <div className="flex gap-md text-tertiary" style={{ fontSize: '12px' }}>
                      <span>{post.upvote_count} upvotes</span>
                      <span>{post.comment_count} comments</span>
                      {post.flagged && <span style={{ color: 'var(--error)' }}>flagged ({post.flag_count})</span>}
                      {post.intent && <span>intent: {post.intent}</span>}
                    </div>
                    {post.topics && post.topics.length > 0 && (
                      <div className="flex gap-sm" style={{ marginTop: '8px', flexWrap: 'wrap' }}>
                        {post.topics.map((topic: string) => (
                          <span key={topic} className="text-tertiary" style={{ fontSize: '11px' }}>
                            #{topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {(!results.users || results.users.length === 0) && (!results.posts || results.posts.length === 0) && (
            <div className="card text-center text-secondary">
              no results found
            </div>
          )}

          {/* Load More Trigger */}
          {(results.has_more_users || results.has_more_posts) && (
            <div ref={loadMoreRef} className="text-center p-md">
              {loadingMore && <Loading message="loading more..." />}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
