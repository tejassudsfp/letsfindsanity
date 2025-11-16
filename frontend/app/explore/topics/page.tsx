'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Loading from '@/components/shared/Loading'
import TopicGraph from '@/components/shared/TopicGraph'
import Link from 'next/link'

export default function ExploreTopicsPage() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTopicConnections()
  }, [])

  async function loadTopicConnections() {
    setLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/topics/connections?scope=public`, {
        credentials: 'include'
      })
      const result = await response.json()
      setData(result)
    } catch (err) {
      console.error('Failed to load topic connections:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleNodeClick(topicId: string) {
    router.push(`/topics/${encodeURIComponent(topicId)}`)
  }

  if (loading) {
    return <Loading />
  }

  return (
    <div className="container">
      <div className="flex justify-between items-center mb-lg">
        <div>
          <h1 className="mb-sm">explore topic connections</h1>
          <p className="text-secondary">discover how topics relate across all public posts</p>
        </div>
        <Link href="/topics">
          <button>browse topics</button>
        </Link>
      </div>

      {data && data.nodes && data.nodes.length > 0 ? (
        <>
          <div className="card mb-md">
            <p className="text-secondary" style={{ fontSize: '14px' }}>
              this visualization shows how different topics are connected based on their co-occurrence in posts.
              larger nodes represent topics with more posts. thicker connections mean topics appear together more often.
              click a node to view posts in that topic.
            </p>
          </div>

          <div className="card">
            <TopicGraph
              nodes={data.nodes}
              edges={data.edges}
              onNodeClick={handleNodeClick}
            />
          </div>

          <div className="card mt-md">
            <h3 className="mb-md">top connected topics</h3>
            <div className="flex flex-col gap-sm">
              {data.edges.slice(0, 10).map((edge: any, i: number) => (
                <div key={i} className="flex justify-between items-center" style={{ fontSize: '14px' }}>
                  <div className="flex gap-sm items-center">
                    <Link href={`/topics/${edge.from}`}>
                      <span className="text-accent" style={{ cursor: 'pointer' }}>#{edge.from}</span>
                    </Link>
                    <span className="text-tertiary">↔</span>
                    <Link href={`/topics/${edge.to}`}>
                      <span className="text-accent" style={{ cursor: 'pointer' }}>#{edge.to}</span>
                    </Link>
                  </div>
                  <span className="text-secondary">{edge.value} shared posts</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="card text-center text-secondary">
          <p>no topic connections yet. start by creating some posts!</p>
        </div>
      )}
    </div>
  )
}
