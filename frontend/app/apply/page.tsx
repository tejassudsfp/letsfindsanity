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
  const [howHeard, setHowHeard] = useState('')
  const [howHeardOther, setHowHeardOther] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const howHeardOptions = [
    'google',
    'instagram',
    'product hunt',
    'freewrite community',
    'razorpay community',
    'other startup forums',
    'hacker news',
    'other'
  ]

  const isReapplying = user?.can_reapply || user?.application_status === 'more_info_needed'
  const isUpdating = user?.application_status === 'more_info_needed'

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth')
      return
    }

    // Check if user already has approved application and identity
    if (!authLoading && user && user.three_word_id) {
      router.push('/feed')
    }
  }, [user, authLoading, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      // Small delay to ensure cookie is set
      await new Promise(resolve => setTimeout(resolve, 100))

      const finalHowHeard = howHeard === 'other' ? howHeardOther : howHeard

      if (isUpdating) {
        await api.updateApplication({
          what_building: whatBuilding,
          why_join: whyJoin,
          proof_url: proofUrl || undefined
        })
      } else {
        await api.submitApplication({
          what_building: whatBuilding,
          why_join: whyJoin,
          proof_url: proofUrl || undefined,
          how_heard: finalHowHeard || undefined
        })
      }
      await refreshUser()
      setSuccess(true)
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to submit application'
      if (errorMessage.includes('Authentication required')) {
        setError('Session expired. Please log in again.')
        setTimeout(() => {
          router.push('/auth')
        }, 2000)
      } else {
        setError(errorMessage)
      }
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
        <h2 className="mb-md">{isReapplying ? (isUpdating ? 'update your application' : 'reapply to join') : 'apply to join'}</h2>
        <p className="text-secondary mb-lg" style={{ fontSize: '14px' }}>
          {isUpdating
            ? 'please update your application with the requested information.'
            : isReapplying
            ? 'we want to create a safe space for builders. tell us about yourself.'
            : 'we want to create a safe space for builders. tell us about yourself.'}
        </p>

        {user?.more_info_request && isUpdating && (
          <div style={{
            padding: '12px 16px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            marginBottom: '20px'
          }}>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
              <strong>Additional info needed:</strong> {user.more_info_request}
            </p>
          </div>
        )}

        {user?.rejection_reason && isReapplying && !isUpdating && (
          <div style={{
            padding: '12px 16px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            marginBottom: '20px'
          }}>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
              <strong>Previous feedback:</strong> {user.rejection_reason}
            </p>
          </div>
        )}

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

          <div className="mb-md">
            <label style={{ display: 'block', marginBottom: '8px' }}>
              where did you hear about letsfindsanity? (optional)
            </label>
            <select
              value={howHeard}
              onChange={(e) => setHowHeard(e.target.value)}
              disabled={loading}
              style={{ width: '100%' }}
            >
              <option value="">select an option...</option>
              {howHeardOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          {howHeard === 'other' && (
            <div className="mb-md">
              <label style={{ display: 'block', marginBottom: '8px' }}>
                please specify
              </label>
              <input
                type="text"
                value={howHeardOther}
                onChange={(e) => setHowHeardOther(e.target.value)}
                placeholder="tell us where you heard about us..."
                disabled={loading}
              />
            </div>
          )}

          <button
            type="submit"
            className="primary"
            style={{ width: '100%', marginBottom: '12px' }}
            disabled={loading || success}
          >
            {loading ? 'submitting...' : success ? 'submitted!' : (isUpdating ? 'update application' : 'submit application')}
          </button>

          {success && (
            <p className="text-center" style={{ fontSize: '14px', color: 'var(--success)', margin: 0 }}>
              ✓ {isUpdating ? 'application updated successfully!' : 'application submitted successfully!'}
            </p>
          )}

          <ErrorMessage message={error} />
        </form>
      </div>
    </div>
  )
}
