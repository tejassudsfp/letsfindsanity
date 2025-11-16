'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/providers/AuthProvider'
import Loading from '@/components/shared/Loading'
import ThreeWordBadge from '@/components/shared/ThreeWordBadge'

interface Post {
  id: string
  three_word_id: string
  title: string
  anonymized_content: string
  clear_ask: string
  intent: string
  topics: string[]
  reaction_count: number
  comment_count: number
  created_at: string
  is_published: boolean
  session_id: string | null
  session_exists: boolean
  reaction_breakdown: {
    'felt-this'?: number
    'you-got-this'?: number
    'been-there'?: number
    'this-helped'?: number
  }
}

interface Comment {
  id: string
  three_word_id: string
  content: string
  created_at: string
}

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

const INTENTS = ['processing', 'agreeing', 'challenging', 'solution', 'venting', 'advice', 'reflecting']

export default function MyPostsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [posts, setPosts] = useState<Post[]>([])
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([])
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingComments, setLoadingComments] = useState(false)
  const [error, setError] = useState('')

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filterIntent, setFilterIntent] = useState('')
  const [filterTopic, setFilterTopic] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // All unique topics from posts
  const [allTopics, setAllTopics] = useState<string[]>([])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth')
    } else if (!authLoading && user) {
      fetchPosts()
    }
  }, [user, authLoading, router])

  useEffect(() => {
    // Apply filters
    let filtered = posts

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.anonymized_content.toLowerCase().includes(query) ||
        p.clear_ask.toLowerCase().includes(query)
      )
    }

    if (filterIntent) {
      filtered = filtered.filter(p => p.intent === filterIntent)
    }

    if (filterTopic) {
      filtered = filtered.filter(p => p.topics?.includes(filterTopic))
    }

    setFilteredPosts(filtered)
  }, [posts, searchQuery, filterIntent, filterTopic])

  async function fetchPosts() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/mine`, {
        credentials: 'include'
      })

      if (res.ok) {
        const data = await res.json()
        setPosts(data.posts || [])

        // Extract all unique topics
        const topicsSet = new Set<string>()
        data.posts?.forEach((p: Post) => {
          p.topics?.forEach(t => topicsSet.add(t))
        })
        setAllTopics(Array.from(topicsSet).sort())
      } else {
        setError('Failed to load your posts')
      }
    } catch (err) {
      setError('Failed to load your posts')
    } finally {
      setLoading(false)
    }
  }

  async function loadPostComments(postId: string) {
    setLoadingComments(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/${postId}`, {
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        setComments(data.comments || [])
      }
    } catch (err) {
      console.error('Failed to load comments:', err)
    } finally {
      setLoadingComments(false)
    }
  }

  function selectPost(post: Post) {
    setSelectedPost(post)
    loadPostComments(post.id)
  }

  async function deletePost(postId: string) {
    if (!confirm('Are you sure you want to delete this post? This will not delete your journal entry.')) {
      return
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== postId))
        if (selectedPost?.id === postId) {
          setSelectedPost(null)
          setComments([])
        }
      } else {
        alert('Failed to delete post')
      }
    } catch (err) {
      alert('Failed to delete post')
    }
  }

  function formatDate(dateString: string) {
    // Parse UTC date string and convert to local time
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`

    // Display in user's local timezone
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    })
  }

  const reactionLabels = {
    'felt-this': 'felt this',
    'you-got-this': 'you got this',
    'been-there': 'been there',
    'this-helped': 'this helped'
  }

  if (authLoading || loading) {
    return <Loading />
  }

  return (
    <div style={{
      display: 'flex',
      height: 'calc(100vh - 97px)',
      overflow: 'hidden',
      marginTop: '-32px'
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
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>my public posts</h2>
            <Link href="/write">
              <button className="primary" style={{ fontSize: '11px', padding: '6px 10px' }}>+ new</button>
            </Link>
          </div>

          {/* Search with Filter Button */}
          <div style={{ position: 'relative', marginBottom: '8px' }}>
            <input
              type="text"
              placeholder="search posts..."
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
          {(filterIntent || filterTopic) && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {filterIntent && (
                <span style={{
                  fontSize: '11px',
                  padding: '3px 8px',
                  background: 'var(--accent)',
                  color: 'var(--bg-primary)',
                  borderRadius: '12px',
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
                  cursor: 'pointer'
                }} onClick={() => setFilterTopic('')}>
                  #{filterTopic} ×
                </span>
              )}
            </div>
          )}

          {/* Filter Dropdowns */}
          {showFilters && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
              <select
                value={filterIntent}
                onChange={(e) => setFilterIntent(e.target.value)}
                style={{ width: '100%', fontSize: '12px' }}
              >
                <option value="">all intents</option>
                {INTENTS.map(intent => (
                  <option key={intent} value={intent}>{intent}</option>
                ))}
              </select>

              <select
                value={filterTopic}
                onChange={(e) => setFilterTopic(e.target.value)}
                style={{ width: '100%', fontSize: '12px' }}
              >
                <option value="">all topics</option>
                {allTopics.map(topic => (
                  <option key={topic} value={topic}>#{topic}</option>
                ))}
              </select>
            </div>
          )}

          <div className="text-secondary" style={{ fontSize: '12px' }}>
            {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'}
          </div>
        </div>

        {/* Posts List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredPosts.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p style={{ marginBottom: '16px', fontSize: '14px' }}>
                {posts.length === 0 ? "you haven't shared any posts yet" : "no posts match your filters"}
              </p>
              {posts.length === 0 && (
                <Link href="/write">
                  <button className="primary" style={{ fontSize: '13px' }}>write and share</button>
                </Link>
              )}
            </div>
          ) : (
            filteredPosts.map(post => (
              <div
                key={post.id}
                onClick={() => selectPost(post)}
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  background: selectedPost?.id === post.id ? 'var(--bg-tertiary)' : 'transparent',
                  transition: 'background 0.1s'
                }}
              >
                <div style={{ marginBottom: '6px' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
                    {post.title}
                  </h4>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className="text-tertiary" style={{ fontSize: '11px' }}>
                      {formatDate(post.created_at)}
                    </span>
                    <span className="text-tertiary" style={{ fontSize: '11px' }}>•</span>
                    <span style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      background: 'var(--bg-primary)',
                      borderRadius: '3px',
                      color: 'var(--text-tertiary)'
                    }}>
                      {post.intent}
                    </span>
                  </div>
                </div>

                <p className="text-secondary" style={{
                  fontSize: '12px',
                  lineHeight: '1.4',
                  margin: '6px 0 8px 0',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {post.anonymized_content}
                </p>

                {/* Topics row */}
                {post.topics && post.topics.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '6px' }}>
                    {post.topics.slice(0, 3).map((topic: string) => (
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
                    {post.topics.length > 3 && (
                      <span className="text-tertiary" style={{ fontSize: '10px' }}>
                        +{post.topics.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Reactions and comments row */}
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {Object.entries(post.reaction_breakdown).length > 0 ? (
                    Object.entries(post.reaction_breakdown).map(([type, count]) => (
                      <span key={type} className="text-tertiary" style={{ fontSize: '10px' }}>
                        {count} {reactionLabels[type as keyof typeof reactionLabels]}
                      </span>
                    ))
                  ) : (
                    <span className="text-tertiary" style={{ fontSize: '10px' }}>
                      0 reactions
                    </span>
                  )}
                  <span className="text-tertiary" style={{ fontSize: '10px' }}>
                    • {post.comment_count} {post.comment_count === 1 ? 'comment' : 'comments'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selectedPost ? (
          <>
            {/* Post Header */}
            <div style={{ borderBottom: '1px solid var(--border)', padding: '16px 24px', background: 'var(--bg-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>
                    {selectedPost.title}
                  </h1>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="text-secondary" style={{ fontSize: '13px' }}>
                      {formatDate(selectedPost.created_at)}
                    </span>
                    <span className="text-tertiary">•</span>
                    <span style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      background: 'var(--bg-tertiary)',
                      borderRadius: '4px',
                      color: 'var(--text-secondary)'
                    }}>
                      {selectedPost.intent}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link href={`/post/${selectedPost.id}`} target="_blank">
                    <button style={{ fontSize: '12px', padding: '6px 12px' }}>
                      view public post
                    </button>
                  </Link>
                  {selectedPost.session_exists && (
                    <Link href={`/journal?session=${selectedPost.session_id}`}>
                      <button style={{ fontSize: '12px', padding: '6px 12px' }}>
                        view journal entry
                      </button>
                    </Link>
                  )}
                  <button
                    onClick={() => deletePost(selectedPost.id)}
                    style={{
                      fontSize: '12px',
                      padding: '6px 12px',
                      background: 'var(--error-bg)',
                      color: 'var(--error)',
                      border: '1px solid var(--error)'
                    }}
                  >
                    delete
                  </button>
                </div>
              </div>

              {/* Topics */}
              {selectedPost.topics && selectedPost.topics.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedPost.topics.map((topic, idx) => (
                    <span key={idx} style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border)',
                      borderRadius: '4px',
                      color: 'var(--text-tertiary)'
                    }}>
                      #{topic}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Post Content + Comments */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {/* Post Content */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{ fontSize: '15px', lineHeight: '1.7', marginBottom: '16px', whiteSpace: 'pre-wrap' }}>
                  {selectedPost.anonymized_content}
                </div>

                {selectedPost.clear_ask && (
                  <div style={{
                    padding: '12px 16px',
                    background: 'var(--bg-secondary)',
                    borderLeft: '3px solid var(--accent)',
                    borderRadius: '4px',
                    marginBottom: '16px'
                  }}>
                    <div className="text-secondary" style={{ fontSize: '12px', marginBottom: '4px', fontWeight: 500 }}>
                      asking for:
                    </div>
                    <div style={{ fontSize: '14px' }}>{selectedPost.clear_ask}</div>
                  </div>
                )}

                {/* Stats */}
                <div style={{
                  display: 'flex',
                  gap: '20px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>{selectedPost.reaction_count}</span>
                    <span className="text-secondary" style={{ fontSize: '13px' }}>reactions</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>{selectedPost.comment_count}</span>
                    <span className="text-secondary" style={{ fontSize: '13px' }}>comments</span>
                  </div>
                </div>

                {/* Reaction Breakdown */}
                {Object.keys(selectedPost.reaction_breakdown).length > 0 && (
                  <div style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    {Object.entries(selectedPost.reaction_breakdown).map(([type, count]) => (
                      <div key={type} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px'
                      }}>
                        <span style={{
                          padding: '4px 8px',
                          background: 'var(--bg-secondary)',
                          borderRadius: '4px',
                          fontWeight: 500
                        }}>
                          {count}
                        </span>
                        <span className="text-secondary">
                          {reactionLabels[type as keyof typeof reactionLabels]}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Comments Section */}
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                  comments ({comments.length})
                </h3>

                {loadingComments ? (
                  <div className="text-secondary" style={{ textAlign: 'center', padding: '24px' }}>
                    loading comments...
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-secondary" style={{ textAlign: 'center', padding: '24px' }}>
                    no comments yet
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {comments.map((comment) => (
                      <div key={comment.id} style={{
                        padding: '16px',
                        background: 'var(--bg-secondary)',
                        borderRadius: '8px',
                        border: '1px solid var(--border)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <ThreeWordBadge threeWordId={comment.three_word_id} />
                          <span className="text-tertiary" style={{ fontSize: '12px' }}>
                            {formatDate(comment.created_at)}
                          </span>
                        </div>
                        <div
                          style={{ fontSize: '14px', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(comment.content) }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)'
          }}>
            <p>select a post to view details</p>
          </div>
        )}
      </div>
    </div>
  )
}
