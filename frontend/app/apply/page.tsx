'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { api } from '@/lib/api'
import ErrorMessage from '@/components/shared/ErrorMessage'
import Loading from '@/components/shared/Loading'

export default function ApplyPage() {
  const router = useRouter()
  const { user, loading: authLoading, refreshUser } = useAuth()

  const [whatBuilding, setWhatBuilding] = useState('')
  const [whyJoin, setWhyJoin] = useState('')
  const [proofUrl, setProofUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth')
    }
  }, [user, authLoading, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await api.submitApplication({
        what_building: whatBuilding,
        why_join: whyJoin,
        proof_url: proofUrl || undefined
      })
      await refreshUser()
      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Failed to submit application')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return <Loading />
  }

  if (!user) {
    return null
  }

  return (
    <div className="container" style={{ maxWidth: '600px' }}>
      <div className="card">
        <h2 className="mb-md">apply to join</h2>
        <p className="text-secondary mb-lg" style={{ fontSize: '14px' }}>
          we want to create a safe space for builders. tell us about yourself.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-md">
            <label style={{ display: 'block', marginBottom: '8px' }}>
              what are you building? *
            </label>
            <textarea
              value={whatBuilding}
              onChange={(e) => setWhatBuilding(e.target.value)}
              placeholder="describe your project, startup, or what you're working on..."
              required
              disabled={loading}
              rows={4}
            />
          </div>

          <div className="mb-md">
            <label style={{ display: 'block', marginBottom: '8px' }}>
              why do you want to join? *
            </label>
            <textarea
              value={whyJoin}
              onChange={(e) => setWhyJoin(e.target.value)}
              placeholder="what are you hoping to get from this community?"
              required
              disabled={loading}
              rows={4}
            />
          </div>

          <div className="mb-md">
            <label style={{ display: 'block', marginBottom: '8px' }}>
              proof (optional)
            </label>
            <input
              type="url"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="linkedin, website, twitter, etc."
              disabled={loading}
            />
            <p className="text-tertiary mt-xs" style={{ fontSize: '12px' }}>
              helps us verify you're a builder
            </p>
          </div>

          <ErrorMessage message={error} />

          <button
            type="submit"
            className="primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'submitting...' : 'submit application'}
          </button>
        </form>
      </div>
    </div>
  )
}
