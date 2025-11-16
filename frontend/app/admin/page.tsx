'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import Loading from '@/components/shared/Loading'
import LineChart from '@/components/admin/LineChart'

export default function AdminPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Date range for analytics (default: last 30 days)
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - 30)
    return date.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    if (!authLoading && (!user || !user.is_admin)) {
      router.push('/')
    } else {
      loadData()
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user?.is_admin) {
      loadAnalytics()
    }
  }, [startDate, endDate, user])

  async function loadData() {
    setLoading(true)
    try {
      const data = await api.getAdminStats()
      setStats(data)
    } catch (err) {
      console.error('Failed to load stats:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadAnalytics() {
    try {
      const data = await api.getAdminAnalytics(startDate, endDate)
      setAnalytics(data)
    } catch (err) {
      console.error('Failed to load analytics:', err)
    }
  }

  if (authLoading || loading || !stats) {
    return <Loading />
  }

  return (
    <div className="container">
      <h1 className="mb-lg">admin dashboard</h1>

      {analytics && (
        <>
          {/* Dashboard Stats - 4 per row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <div className="card">
              <div className="text-secondary" style={{ fontSize: '12px' }}>total builders</div>
              <div style={{ fontSize: '28px', fontWeight: 600 }}>{analytics.summary.total_builders.toLocaleString()}</div>
            </div>

            <div className="card">
              <div className="text-secondary" style={{ fontSize: '12px' }}>active today</div>
              <div style={{ fontSize: '28px', fontWeight: 600 }}>{analytics.summary.active_today.toLocaleString()}</div>
            </div>

            <div className="card">
              <div className="text-secondary" style={{ fontSize: '12px' }}>total posts</div>
              <div style={{ fontSize: '28px', fontWeight: 600 }}>{analytics.summary.total_posts.toLocaleString()}</div>
            </div>

            <div className="card">
              <div className="text-secondary" style={{ fontSize: '12px' }}>posts this week</div>
              <div style={{ fontSize: '28px', fontWeight: 600 }}>{analytics.summary.posts_this_week.toLocaleString()}</div>
            </div>

            <div className="card">
              <div className="text-secondary" style={{ fontSize: '12px' }}>total sessions</div>
              <div style={{ fontSize: '28px', fontWeight: 600 }}>{analytics.summary.total_sessions.toLocaleString()}</div>
            </div>

            <div className="card">
              <div className="text-secondary" style={{ fontSize: '12px' }}>sessions this week</div>
              <div style={{ fontSize: '28px', fontWeight: 600 }}>{analytics.summary.sessions_this_week.toLocaleString()}</div>
            </div>

            <div className="card">
              <div className="text-secondary" style={{ fontSize: '12px' }}>total analyses</div>
              <div style={{ fontSize: '28px', fontWeight: 600 }}>{analytics.summary.total_analyses.toLocaleString()}</div>
            </div>

            <div className="card">
              <div className="text-secondary" style={{ fontSize: '12px' }}>analyses this week</div>
              <div style={{ fontSize: '28px', fontWeight: 600 }}>{analytics.summary.analyses_this_week.toLocaleString()}</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '32px' }}>
            <Link href="/admin/applications">
              <button className="primary" style={{ width: '100%' }}>
                applications ({stats.pending_applications} pending)
              </button>
            </Link>

            <Link href="/admin/flags">
              <button style={{ width: '100%' }}>
                flagged posts ({stats.flagged_posts})
              </button>
            </Link>

            <Link href="/admin/search">
              <button className="primary" style={{ width: '100%' }}>
                search users & posts
              </button>
            </Link>

            <Link href="/admin/comments">
              <button style={{ width: '100%' }}>
                view all comments
              </button>
            </Link>
          </div>

          {/* Date Range Selector for Charts */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  start date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  end date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    const date = new Date()
                    date.setDate(date.getDate() - 7)
                    setStartDate(date.toISOString().split('T')[0])
                    setEndDate(new Date().toISOString().split('T')[0])
                  }}
                  style={{ fontSize: '12px', padding: '8px 12px' }}
                >
                  last 7 days
                </button>
                <button
                  onClick={() => {
                    const date = new Date()
                    date.setDate(date.getDate() - 30)
                    setStartDate(date.toISOString().split('T')[0])
                    setEndDate(new Date().toISOString().split('T')[0])
                  }}
                  style={{ fontSize: '12px', padding: '8px 12px' }}
                >
                  last 30 days
                </button>
              </div>
            </div>
          </div>

          {/* API Token Usage Chart */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <h2 className="mb-md">API Token Usage</h2>
            <LineChart
              data={analytics.api_usage}
              lines={[
                { key: 'input_tokens', label: 'Input Tokens', color: '#3b82f6' },
                { key: 'output_tokens', label: 'Output Tokens', color: '#10b981' }
              ]}
              height={250}
            />
          </div>

          {/* Builder Growth Chart */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <h2 className="mb-md">Builder Growth</h2>
            <LineChart
              data={analytics.builder_growth}
              lines={[
                { key: 'total_builders', label: 'Total Builders', color: '#8b5cf6' }
              ]}
              height={250}
            />
          </div>

          {/* Daily Activity Chart */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <h2 className="mb-md">Daily Activity</h2>
            <LineChart
              data={analytics.daily_activity}
              lines={[
                { key: 'active_sessions', label: 'Sessions', color: '#f59e0b' },
                { key: 'posts_created', label: 'Posts', color: '#ec4899' }
              ]}
              height={250}
            />
          </div>

          {/* Top Topics */}
          <div className="card">
            <h2 className="mb-md">top topics</h2>
            <div>
              {stats.top_topics.map((topic: any) => (
                <div key={topic.name} className="flex justify-between items-center mb-sm">
                  <span>#{topic.name}</span>
                  <span className="text-secondary">{topic.count} posts</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
