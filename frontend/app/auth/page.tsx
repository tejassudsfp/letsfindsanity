'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { api } from '@/lib/api'
import ErrorMessage from '@/components/shared/ErrorMessage'
import Loading from '@/components/shared/Loading'
import { track } from '@vercel/analytics'

export default function AuthPage() {
  const router = useRouter()
  const { login, loading: authLoading } = useAuth()

  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRequestOTP(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Track login attempt with email
    track('Login Attempt - Send Code', { email })

    try {
      await api.requestOTP(email, 'login')
      track('Login - Code Sent Successfully', { email })
      setStep('code')
    } catch (err: any) {
      track('Login - Code Send Failed', { email, error: err.message || 'Failed to send code' })
      setError(err.message || 'Failed to send code')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    track('Login - Verify Code Attempt', { email })

    try {
      await login(email, code)
      track('Login - Success', { email })
      router.push('/')
    } catch (err: any) {
      track('Login - Verification Failed', { email, error: err.message || 'Invalid code' })
      setError(err.message || 'Invalid code')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return <Loading />
  }

  return (
    <div className="container" style={{ maxWidth: '400px' }}>
      <div className="card">
        <h2 className="mb-lg">login or sign up</h2>

        {step === 'email' && (
          <form onSubmit={handleRequestOTP}>
            <div className="mb-md">
              <label style={{ display: 'block', marginBottom: '8px' }}>
                email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={loading}
              />
            </div>

            <ErrorMessage message={error} />

            <button
              type="submit"
              className="primary"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'sending...' : 'send code'}
            </button>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={handleVerifyOTP}>
            <p className="text-secondary mb-md" style={{ fontSize: '14px' }}>
              enter the 6-digit code sent to {email}
            </p>

            <div className="mb-md">
              <label style={{ display: 'block', marginBottom: '8px' }}>
                verification code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                required
                disabled={loading}
                autoFocus
              />
            </div>

            <ErrorMessage message={error} />

            <button
              type="submit"
              className="primary"
              style={{ width: '100%', marginBottom: '8px' }}
              disabled={loading || code.length !== 6}
            >
              {loading ? 'verifying...' : 'verify code'}
            </button>

            <button
              type="button"
              onClick={() => setStep('email')}
              style={{ width: '100%' }}
              disabled={loading}
            >
              use different email
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
