'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import Loading from '@/components/shared/Loading'
import TopicGraph from '@/components/shared/TopicGraph'
import Link from 'next/link'

export default function JournalVisualizePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && user) {
      loadTopicConnections()
    }
  }, [user, authLoading])

  async function loadTopicConnections() {
    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/topics/connections?scope=personal`, {
        credentials: 'include',
        headers
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
    router.push(`/journal?topic=${encodeURIComponent(topicId)}`)
  }

  if (authLoading || loading) {
    return <Loading />
  }

  return (
    <div className="container">
      <div className="mb-md">
        <Link href="/journal">
          <button>← back to journal</button>
        </Link>
      </div>

      <div className="mb-lg">
        <h1 className="mb-sm">your journal topic map</h1>
        <p className="text-secondary">visualize how topics connect in your personal journal</p>
      </div>

      {data && data.nodes && data.nodes.length > 0 ? (
        <>
          <div className="card mb-md">
            <p className="text-secondary" style={{ fontSize: '14px' }}>
              this is your personal topic map showing how different themes connect in your journal entries.
              larger nodes represent topics you've written about more. thicker connections mean topics appear together often.
              click a node to filter your journal by that topic.
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
            <h3 className="mb-md">your most connected topics</h3>
            {data.edges.length > 0 ? (
              <div className="flex flex-col gap-sm">
                {data.edges.slice(0, 10).map((edge: any, i: number) => (
                  <div key={i} className="flex justify-between items-center" style={{ fontSize: '14px' }}>
                    <div className="flex gap-sm items-center">
                      <span
                        className="text-accent"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleNodeClick(edge.from)}
                      >
                        #{edge.from}
                      </span>
                      <span className="text-tertiary">↔</span>
                      <span
                        className="text-accent"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleNodeClick(edge.to)}
                      >
                        #{edge.to}
                      </span>
                    </div>
                    <span className="text-secondary">{edge.value} shared entries</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-tertiary" style={{ fontSize: '14px' }}>
                write more entries to see how your topics connect!
              </p>
            )}
          </div>

          <div className="card mt-md">
            <h3 className="mb-md">all your topics</h3>
            <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
              {data.nodes.map((node: any) => (
                <span
                  key={node.id}
                  className="text-accent"
                  style={{ fontSize: '14px', cursor: 'pointer', padding: '4px 8px', background: 'var(--bg-tertiary)', borderRadius: '4px' }}
                  onClick={() => handleNodeClick(node.id)}
                >
                  #{node.label} ({node.value})
                </span>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="card text-center text-secondary">
          <p>no topics in your journal yet.</p>
          <p className="mt-sm" style={{ fontSize: '14px' }}>share some journal entries as public posts to tag them with topics!</p>
        </div>
      )}
    </div>
  )
}
