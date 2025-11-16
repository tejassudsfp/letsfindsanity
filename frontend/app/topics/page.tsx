'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/providers/AuthProvider'
import { api } from '@/lib/api'
import Loading from '@/components/shared/Loading'

export default function TopicsPage() {
  const { user, loading: authLoading } = useAuth()
  const [topics, setTopics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [followedTopics, setFollowedTopics] = useState<string[]>([])

  useEffect(() => {
    if (!authLoading) {
      loadTopics()
      if (user?.three_word_id) {
        loadFollowedTopics()
      }
    }
  }, [authLoading, user])

  async function loadTopics() {
    setLoading(true)
    try {
      const data = await api.getAllTopics()
      setTopics(data.topics)
    } catch (err) {
      console.error('Failed to load topics:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadFollowedTopics() {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/topics/following`, {
        credentials: 'include'
      })
      const data = await response.json()
      setFollowedTopics(data.topics || [])
    } catch (err) {
      console.error('Failed to load followed topics:', err)
    }
  }

  async function toggleFollow(topicName: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (!user?.three_word_id) return

    const isFollowing = followedTopics.includes(topicName)

    try {
      if (isFollowing) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/topics/unfollow/${encodeURIComponent(topicName)}`, {
          method: 'DELETE',
          credentials: 'include'
        })
        setFollowedTopics(prev => prev.filter(t => t !== topicName))
      } else {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/topics/follow`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ topic: topicName })
        })
        setFollowedTopics(prev => [...prev, topicName])
      }
    } catch (err) {
      console.error('Failed to toggle follow:', err)
    }
  }

  if (authLoading || loading) {
    return <Loading />
  }

  return (
    <div className="container">
      <h1 className="mb-lg">browse topics</h1>

      {user?.three_word_id && followedTopics.length > 0 && (
        <div className="mb-xl">
          <h2 className="mb-md" style={{ fontSize: '18px' }}>following</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            {topics.filter(t => followedTopics.includes(t.name)).map((topic) => (
              <Link key={topic.name} href={`/topics/${topic.name}`}>
                <div className="card" style={{ cursor: 'pointer', position: 'relative' }}>
                  <div className="flex justify-between items-start">
                    <div style={{ flex: 1 }}>
                      <h3 className="mb-xs">#{topic.name}</h3>
                      <p className="text-secondary" style={{ fontSize: '14px' }}>
                        {topic.count} posts
                      </p>
                    </div>
                    <button
                      onClick={(e) => toggleFollow(topic.name, e)}
                      className="ghost"
                      style={{ padding: '8px' }}
                      title="unfollow"
                    >
                      ♥
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <h2 className="mb-md" style={{ fontSize: '18px' }}>all topics</h2>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
        {topics.map((topic) => (
          <Link key={topic.name} href={`/topics/${topic.name}`}>
            <div className="card" style={{ cursor: 'pointer', position: 'relative' }}>
              <div className="flex justify-between items-start">
                <div style={{ flex: 1 }}>
                  <h3 className="mb-xs">#{topic.name}</h3>
                  <p className="text-secondary" style={{ fontSize: '14px' }}>
                    {topic.count} posts
                  </p>
                </div>
                {user?.three_word_id && (
                  <button
                    onClick={(e) => toggleFollow(topic.name, e)}
                    className="ghost"
                    style={{
                      padding: '8px',
                      fontSize: '20px',
                      color: followedTopics.includes(topic.name) ? 'var(--accent)' : 'var(--text-tertiary)'
                    }}
                    title={followedTopics.includes(topic.name) ? 'unfollow' : 'follow'}
                  >
                    {followedTopics.includes(topic.name) ? '♥' : '♡'}
                  </button>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {topics.length === 0 && (
        <div className="text-center text-secondary mt-xl">
          <p>no topics yet</p>
        </div>
      )}
    </div>
  )
}
