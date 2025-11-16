'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { api } from '@/lib/api'
import ErrorMessage from '@/components/shared/ErrorMessage'
import Loading from '@/components/shared/Loading'

export default function ChooseIdentityPage() {
  const router = useRouter()
  const { user, loading: authLoading, refreshUser } = useAuth()

  const [options, setOptions] = useState<string[]>([])
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth')
      return
    }

    if (!authLoading && user && user.three_word_id) {
      router.push('/feed')
      return
    }

    loadOptions()
  }, [user, authLoading, router])

  async function loadOptions() {
    try {
      const data = await api.generateIdentityOptions()
      setOptions(data.options)
      setSelected(data.options[0])
    } catch (err) {
      console.error('Failed to load options:', err)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await api.chooseIdentity(selected)
      await refreshUser()
      router.push('/write')
    } catch (err: any) {
      setError(err.message || 'Failed to choose identity')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || !user) {
    return <Loading />
  }

  return (
    <div className="container" style={{ maxWidth: '500px' }}>
      <div className="card">
        <h2 className="mb-md">choose your anonymous identity</h2>
        <p className="text-secondary mb-lg" style={{ fontSize: '14px' }}>
          this will be how others see you in the community. you can reset it later.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-lg">
            {options.map((option) => (
              <div
                key={option}
                style={{
                  padding: '16px',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  background: selected === option ? 'var(--bg-tertiary)' : 'transparent'
                }}
                onClick={() => setSelected(option)}
              >
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="radio"
                    name="identity"
                    value={option}
                    checked={selected === option}
                    onChange={(e) => setSelected(e.target.value)}
                    style={{ width: 'auto' }}
                  />
                  <span style={{ fontSize: '18px' }}>{option}</span>
                </label>
              </div>
            ))}
          </div>

          <ErrorMessage message={error} />

          <button
            type="submit"
            className="primary"
            style={{ width: '100%' }}
            disabled={loading || !selected}
          >
            {loading ? 'choosing...' : 'choose identity'}
          </button>

          <button
            type="button"
            onClick={loadOptions}
            style={{ width: '100%', marginTop: '8px' }}
            disabled={loading}
          >
            generate new options
          </button>
        </form>
      </div>
    </div>
  )
}
