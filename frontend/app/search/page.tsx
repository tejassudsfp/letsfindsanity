'use client'

import { useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { api } from '@/lib/api'
import PostCard from '@/components/feed/PostCard'
import Loading from '@/components/shared/Loading'

export default function SearchPage() {
  const { user, loading: authLoading } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setSearched(true)
    try {
      const data = await api.search(query)
      setResults(data.results)
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return <Loading />
  }

  return (
    <div className="container">
      <h1 className="mb-lg">search posts</h1>

      <form onSubmit={handleSearch} className="mb-xl">
        <div className="flex gap-md">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="search for posts..."
            style={{ flex: 1 }}
          />
          <button type="submit" className="primary" disabled={loading || !query.trim()}>
            {loading ? 'searching...' : 'search'}
          </button>
        </div>
      </form>

      {results.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {!loading && searched && results.length === 0 && (
        <div className="text-center text-secondary mt-xl">
          <p>no results found for "{query}"</p>
        </div>
      )}
    </div>
  )
}
