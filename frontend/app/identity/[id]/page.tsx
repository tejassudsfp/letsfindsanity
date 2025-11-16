'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import PostCard from '@/components/feed/PostCard'
import Loading from '@/components/shared/Loading'

export default function IdentityPage() {
  const params = useParams()
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPosts()
  }, [params.id])

  async function loadPosts() {
    setLoading(true)
    try {
      const data = await api.getPostsByIdentity(params.id as string)
      setPosts(data.posts)
    } catch (err) {
      console.error('Failed to load posts:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <Loading />
  }

  return (
    <div className="container">
      <h1 className="mb-lg">{params.id}</h1>

      {posts.map((post) => (
        <PostCard key={post.id} post={post} onUpdate={loadPosts} />
      ))}

      {posts.length === 0 && (
        <div className="text-center text-secondary mt-xl">
          <p>no posts from this identity yet</p>
        </div>
      )}
    </div>
  )
}
