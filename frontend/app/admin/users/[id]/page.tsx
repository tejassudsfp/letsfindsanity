'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter, useParams } from 'next/navigation'
import Loading from '@/components/shared/Loading'

export default function AdminUserDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user: currentUser, loading: authLoading } = useAuth()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'posts' | 'comments' | 'sessions'>('overview')

  useEffect(() => {
    if (!authLoading && (!currentUser || !currentUser.is_admin)) {
      router.push('/')
    } else {
      loadUserDetails()
    }
  }, [currentUser, authLoading, router, params.id])

  async function loadUserDetails() {
    setLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${params.id}`, {
        credentials: 'include'
      })
      const data = await response.json()
      setUser(data)
    } catch (err) {
      console.error('Failed to load user details:', err)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return <Loading />
  }

  if (!user) {
    return (
      <div className="container">
        <p className="text-secondary">user not found</p>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="flex justify-between items-center mb-lg">
        <h1>user details</h1>
        <Link href="/admin/search">
          <button>back to search</button>
        </Link>
      </div>

      {/* User Header */}
      <div className="card mb-lg">
        <div className="flex justify-between items-start mb-md">
          <div>
            <h2>{user.user.email}</h2>
            {user.user.three_word_id && (
              <div className="text-secondary">@{user.user.three_word_id}</div>
            )}
          </div>
          <div className="text-tertiary" style={{ fontSize: '12px', textAlign: 'right' }}>
            {user.user.is_admin && <div style={{ color: 'var(--accent)', marginBottom: '4px' }}>ADMIN</div>}
            <div>joined: {new Date(user.user.created_at).toLocaleDateString()}</div>
            <div>last active: {user.user.last_active ? new Date(user.user.last_active).toLocaleDateString() : 'never'}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
          <div>
            <div className="text-tertiary" style={{ fontSize: '11px' }}>posts</div>
            <div style={{ fontSize: '20px', fontWeight: 600 }}>{user.stats.total_posts}</div>
          </div>
          <div>
            <div className="text-tertiary" style={{ fontSize: '11px' }}>comments</div>
            <div style={{ fontSize: '20px', fontWeight: 600 }}>{user.stats.total_comments}</div>
          </div>
          <div>
            <div className="text-tertiary" style={{ fontSize: '11px' }}>sessions</div>
            <div style={{ fontSize: '20px', fontWeight: 600 }}>{user.stats.total_sessions}</div>
          </div>
          <div>
            <div className="text-tertiary" style={{ fontSize: '11px' }}>flags made</div>
            <div style={{ fontSize: '20px', fontWeight: 600 }}>{user.stats.total_flags_made}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-sm mb-lg" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
        <button
          className={activeTab === 'overview' ? 'primary' : ''}
          onClick={() => setActiveTab('overview')}
        >
          overview
        </button>
        <button
          className={activeTab === 'posts' ? 'primary' : ''}
          onClick={() => setActiveTab('posts')}
        >
          posts ({user.posts.length})
        </button>
        <button
          className={activeTab === 'comments' ? 'primary' : ''}
          onClick={() => setActiveTab('comments')}
        >
          comments ({user.comments.length})
        </button>
        <button
          className={activeTab === 'sessions' ? 'primary' : ''}
          onClick={() => setActiveTab('sessions')}
        >
          sessions ({user.sessions.length})
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          {/* Applications */}
          {user.applications.length > 0 && (
            <div className="mb-xl">
              <h2 className="mb-md">applications</h2>
              {user.applications.map((app: any) => (
                <div key={app.id} className="card mb-md">
                  <div className="flex justify-between mb-sm">
                    <strong style={{ color: 'var(--accent)' }}>{app.status}</strong>
                    <span className="text-tertiary" style={{ fontSize: '12px' }}>
                      {new Date(app.submitted_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mb-sm">
                    <div className="text-secondary" style={{ fontSize: '13px' }}>what building:</div>
                    <p style={{ fontSize: '14px' }}>{app.what_building}</p>
                  </div>
                  <div className="mb-sm">
                    <div className="text-secondary" style={{ fontSize: '13px' }}>why join:</div>
                    <p style={{ fontSize: '14px' }}>{app.why_join}</p>
                  </div>
                  {app.proof_url && (
                    <div className="mb-sm">
                      <a href={app.proof_url} target="_blank" rel="noopener noreferrer" className="text-accent" style={{ fontSize: '13px' }}>
                        proof link →
                      </a>
                    </div>
                  )}
                  {app.rejection_reason && (
                    <div className="text-tertiary" style={{ fontSize: '13px' }}>
                      <strong>rejection:</strong> {app.rejection_reason}
                    </div>
                  )}
                  {app.admin_notes && (
                    <div className="text-tertiary" style={{ fontSize: '13px' }}>
                      <strong>admin notes:</strong> {app.admin_notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Deletion Requests */}
          {user.deletion_requests.length > 0 && (
            <div className="mb-xl">
              <h2 className="mb-md">deletion requests</h2>
              {user.deletion_requests.map((req: any) => (
                <div key={req.id} className="card mb-md">
                  <div className="flex justify-between mb-sm">
                    <strong style={{ color: 'var(--error)' }}>{req.status}</strong>
                    <span className="text-tertiary" style={{ fontSize: '12px' }}>
                      {new Date(req.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ fontSize: '14px', marginBottom: '8px' }}>{req.reason}</p>
                  {req.admin_notes && (
                    <div className="text-tertiary" style={{ fontSize: '13px' }}>
                      <strong>admin notes:</strong> {req.admin_notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Flags Made */}
          {user.flags.length > 0 && (
            <div className="mb-xl">
              <h2 className="mb-md">flags made by user</h2>
              {user.flags.slice(0, 10).map((flag: any) => (
                <div key={flag.id} className="card mb-sm">
                  <div className="flex justify-between">
                    <div>
                      <Link href={`/post/${flag.post_id}`} className="text-accent">
                        {flag.post_title}
                      </Link>
                      <div className="text-secondary" style={{ fontSize: '13px' }}>{flag.reason}</div>
                    </div>
                    <span className="text-tertiary" style={{ fontSize: '12px' }}>
                      {new Date(flag.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div className="flex flex-col gap-md">
          {user.posts.map((post: any) => (
            <div key={post.id} className="card">
              <div className="flex justify-between mb-sm">
                <Link href={`/post/${post.id}`}>
                  <strong>{post.title}</strong>
                </Link>
                <span className="text-tertiary" style={{ fontSize: '12px' }}>
                  {new Date(post.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-secondary" style={{ fontSize: '14px', marginBottom: '8px' }}>{post.content}</p>
              <div className="flex gap-md text-tertiary" style={{ fontSize: '12px' }}>
                <span>{post.upvote_count} upvotes</span>
                <span>{post.comment_count} comments</span>
                {post.flagged && <span style={{ color: 'var(--error)' }}>flagged ({post.flag_count})</span>}
                {!post.is_published && <span style={{ color: 'var(--error)' }}>deleted</span>}
              </div>
            </div>
          ))}
          {user.posts.length === 0 && (
            <div className="card text-center text-secondary">no posts</div>
          )}
        </div>
      )}

      {/* Comments Tab */}
      {activeTab === 'comments' && (
        <div className="flex flex-col gap-md">
          {user.comments.map((comment: any) => (
            <div key={comment.id} className="card">
              <div className="flex justify-between mb-sm">
                <div>
                  {comment.is_ai_analysis && (
                    <span style={{ fontSize: '11px', color: 'var(--accent)' }}>AI ANALYSIS</span>
                  )}
                </div>
                <span className="text-tertiary" style={{ fontSize: '12px' }}>
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              <p style={{ fontSize: '14px', marginBottom: '8px', whiteSpace: 'pre-wrap' }}>{comment.content}</p>
              <div className="text-secondary" style={{ fontSize: '13px' }}>
                {comment.upvote_count} upvotes
              </div>
              {comment.post_title && (
                <div className="text-tertiary" style={{ fontSize: '12px', marginTop: '8px' }}>
                  on post: <Link href={`/post/${comment.post_id}`} className="text-accent">{comment.post_title}</Link>
                </div>
              )}
            </div>
          ))}
          {user.comments.length === 0 && (
            <div className="card text-center text-secondary">no comments</div>
          )}
        </div>
      )}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="flex flex-col gap-md">
          {user.sessions.map((session: any) => (
            <div key={session.id} className="card">
              <div className="flex justify-between mb-sm">
                <div>
                  <strong>{session.intent}</strong>
                  {session.recommend_professional_help && (
                    <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--error)' }}>
                      RECOMMENDED HELP
                    </span>
                  )}
                </div>
                <span className="text-tertiary" style={{ fontSize: '12px' }}>
                  {session.completed_at ? new Date(session.completed_at).toLocaleDateString() : 'incomplete'}
                </span>
              </div>
              <div className="flex gap-md text-secondary" style={{ fontSize: '13px' }}>
                <span>{session.word_count} words</span>
                <span>{Math.round(session.duration_seconds / 60)} minutes</span>
                <span>safe for sharing: {session.is_safe_for_sharing ? 'yes' : 'no'}</span>
              </div>
            </div>
          ))}
          {user.sessions.length === 0 && (
            <div className="card text-center text-secondary">no sessions</div>
          )}
        </div>
      )}
    </div>
  )
}
