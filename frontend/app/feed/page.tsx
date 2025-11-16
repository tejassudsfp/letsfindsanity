'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { api } from '@/lib/api'
import PostCard from '@/components/feed/PostCard'
import Loading from '@/components/shared/Loading'

export default function FeedPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [intent, setIntent] = useState('')

  useEffect(() => {
    if (!authLoading && (!user || !user.three_word_id)) {
      router.push('/')
    } else {
      loadPosts()
    }
  }, [user, authLoading, router, page, intent])

  async function loadPosts() {
    setLoading(true)
    try {
      const data = await api.getPosts({ page, limit: 20, intent: intent || undefined })
      if (page === 1) {
        setPosts(data.posts)
      } else {
        setPosts([...posts, ...data.posts])
      }
      setHasMore(page < data.pages)
    } catch (err) {
      console.error('Failed to load posts:', err)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || !user) {
    return <Loading />
  }

  return (
    <div className="container">
      <div className="flex justify-between items-center mb-lg">
        <h1>community feed</h1>
        <select
          value={intent}
          onChange={(e) => {
            setIntent(e.target.value)
            setPage(1)
          }}
          style={{ width: 'auto', padding: '8px 12px' }}
        >
          <option value="">all intents</option>
          <option value="processing">processing</option>
          <option value="perspective">perspective</option>
          <option value="solution">solution</option>
          <option value="venting">venting</option>
          <option value="advice">advice</option>
          <option value="reflecting">reflecting</option>
        </select>
      </div>

      {posts.map((post) => (
        <PostCard key={post.id} post={post} onUpdate={loadPosts} />
      ))}

      {loading && <Loading />}

      {!loading && posts.length === 0 && (
        <div className="text-center text-secondary mt-xl">
          <p>no posts yet. be the first to share!</p>
        </div>
      )}

      {!loading && hasMore && posts.length > 0 && (
        <div className="text-center mt-lg">
          <button onClick={() => setPage(page + 1)}>
            load more
          </button>
        </div>
      )}
    </div>
  )
}
