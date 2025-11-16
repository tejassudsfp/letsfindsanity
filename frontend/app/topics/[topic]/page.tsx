'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { api } from '@/lib/api'
import PostCard from '@/components/feed/PostCard'
import Loading from '@/components/shared/Loading'

export default function TopicPage() {
  const params = useParams()
  const { user } = useAuth()
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [checkingFollow, setCheckingFollow] = useState(true)

  useEffect(() => {
    loadPosts()
    if (user?.three_word_id) {
      checkIfFollowing()
    } else {
      setCheckingFollow(false)
    }
  }, [params.topic, user])

  async function checkIfFollowing() {
    setCheckingFollow(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/topics/following`, {
        credentials: 'include'
      })
      const data = await response.json()
      setIsFollowing(data.topics?.includes(params.topic as string) || false)
    } catch (err) {
      console.error('Failed to check following status:', err)
    } finally {
      setCheckingFollow(false)
    }
  }

  async function loadPosts() {
    setLoading(true)
    try {
      const data = await api.getTopicPosts(params.topic as string)
      setPosts(data.posts)
    } catch (err) {
      console.error('Failed to load posts:', err)
    } finally {
      setLoading(false)
    }
  }

  async function toggleFollow() {
    if (!user?.three_word_id) return

    try {
      if (isFollowing) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/topics/unfollow/${encodeURIComponent(params.topic as string)}`, {
          method: 'DELETE',
          credentials: 'include'
        })
        setIsFollowing(false)
      } else {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/topics/follow`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ topic: params.topic as string })
        })
        setIsFollowing(true)
      }
    } catch (err) {
      console.error('Failed to toggle follow:', err)
    }
  }

  if (loading) {
    return <Loading />
  }

  return (
    <div className="container">
      <div className="flex justify-between items-center mb-lg">
        <div>
          <Link href="/topics" className="text-secondary" style={{ fontSize: '14px', marginBottom: '8px', display: 'block' }}>
            ← back to all topics
          </Link>
          <h1>#{params.topic}</h1>
          <p className="text-secondary" style={{ fontSize: '14px' }}>
            {posts.length} {posts.length === 1 ? 'post' : 'posts'}
          </p>
        </div>

        {user?.three_word_id && !checkingFollow && (
          <button
            className="ghost"
            onClick={toggleFollow}
            style={{
              fontSize: '24px',
              padding: '8px 16px',
              color: isFollowing ? 'var(--accent)' : 'var(--text-tertiary)'
            }}
            title={isFollowing ? 'unfollow' : 'follow'}
          >
            {isFollowing ? '♥' : '♡'}
          </button>
        )}
      </div>

      {posts.map((post) => (
        <PostCard key={post.id} post={post} onUpdate={loadPosts} />
      ))}

      {posts.length === 0 && (
        <div className="card text-center text-secondary">
          <p>no posts with this topic yet</p>
          {user?.three_word_id && (
            <Link href="/write" className="text-accent" style={{ marginTop: '12px', display: 'block' }}>
              be the first to write about #{params.topic}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
