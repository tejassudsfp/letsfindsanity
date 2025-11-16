'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import Loading from '@/components/shared/Loading'
import ErrorMessage from '@/components/shared/ErrorMessage'

export default function ApplicationsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && (!user || !user.is_admin)) {
      router.push('/')
    } else {
      loadApplications()
    }
  }, [user, authLoading, router])

  async function loadApplications() {
    setLoading(true)
    try {
      const data = await api.getApplications('pending')
      setApplications(data.applications)
    } catch (err) {
      console.error('Failed to load applications:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(id: string) {
    setProcessing(id)
    setError('')
    try {
      await api.approveApplication(id)
      await loadApplications()
    } catch (err: any) {
      setError(err.message || 'Failed to approve')
    } finally {
      setProcessing(null)
    }
  }

  async function handleReject(id: string) {
    const reason = prompt('Enter rejection reason:')
    if (!reason) return

    setProcessing(id)
    setError('')
    try {
      await api.rejectApplication(id, reason)
      await loadApplications()
    } catch (err: any) {
      setError(err.message || 'Failed to reject')
    } finally {
      setProcessing(null)
    }
  }

  if (authLoading || loading) {
    return <Loading />
  }

  return (
    <div className="container">
      <h1 className="mb-lg">pending applications</h1>

      <ErrorMessage message={error} />

      {applications.map((app) => (
        <div key={app.id} className="card mb-md">
          <div className="flex justify-between items-center mb-md">
            <div>
              <div className="text-secondary" style={{ fontSize: '12px' }}>
                {app.user.email}
              </div>
              <div className="text-tertiary" style={{ fontSize: '12px' }}>
                {new Date(app.submitted_at).toLocaleDateString()}
              </div>
            </div>
            <div className="flex gap-sm">
              <button
                onClick={() => handleApprove(app.id)}
                className="primary"
                disabled={processing !== null}
                style={{ padding: '6px 12px', fontSize: '14px' }}
              >
                approve
              </button>
              <button
                onClick={() => handleReject(app.id)}
                disabled={processing !== null}
                style={{ padding: '6px 12px', fontSize: '14px' }}
              >
                reject
              </button>
            </div>
          </div>

          <div className="mb-md">
            <strong>what are they building?</strong>
            <p style={{ whiteSpace: 'pre-wrap', marginTop: '4px' }}>{app.what_building}</p>
          </div>

          <div className="mb-md">
            <strong>why join?</strong>
            <p style={{ whiteSpace: 'pre-wrap', marginTop: '4px' }}>{app.why_join}</p>
          </div>

          {app.proof_url && (
            <div>
              <strong>proof:</strong>{' '}
              <a href={app.proof_url} target="_blank" rel="noopener noreferrer">
                {app.proof_url}
              </a>
            </div>
          )}
        </div>
      ))}

      {applications.length === 0 && (
        <div className="text-center text-secondary mt-xl">
          <p>no pending applications</p>
        </div>
      )}
    </div>
  )
}
