'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/providers/AuthProvider'
import Loading from '@/components/shared/Loading'

export default function HomePage() {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (user && user.three_word_id) {
      window.location.href = '/feed'
    }
  }, [user])

  if (loading) {
    return <Loading />
  }

  if (user && user.three_word_id) {
    return <Loading />
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Hero Section */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-center" style={{ maxWidth: '600px', padding: '40px 20px' }}>
          <h1 style={{
            fontSize: 'clamp(32px, 8vw, 48px)',
            marginBottom: '20px',
            fontWeight: 600,
            lineHeight: '1.2'
          }}>
            letsfindsanity
          </h1>
          <p className="text-secondary" style={{
            fontSize: '18px',
            lineHeight: '1.6',
            marginBottom: '20px'
          }}>
            journal. reflect. seek. stay sane.
          </p>

          <p style={{
            fontSize: '16px',
            lineHeight: '1.5',
            marginBottom: '12px'
          }}>
            building something worth it isn't easy.
          </p>

          <p style={{
            fontSize: '16px',
            lineHeight: '1.5',
            marginBottom: '40px'
          }}>
            come be part of a community that shows up to cheer you!
          </p>

          <Link href="/about">
            <p className="text-tertiary" style={{
              fontSize: '13px',
              marginBottom: '40px',
              textDecoration: 'underline',
              cursor: 'pointer'
            }}>
              learn more
            </p>
          </Link>

          {/* CTA Buttons */}
          <div className="flex justify-center gap-md">
            {!user && (
              <Link href="/auth">
                <button className="primary" style={{
                  padding: '12px 28px',
                  fontSize: '15px',
                  fontWeight: 500
                }}>
                  start writing
                </button>
              </Link>
            )}

            {user && !user.three_word_id && (
              <>
                {(!user.has_application || user.can_reapply) && (
                  <Link href="/apply">
                    <button className="primary" style={{
                      padding: '12px 28px',
                      fontSize: '15px',
                      fontWeight: 500
                    }}>
                      {user.can_reapply ? 'reapply' : 'request access'}
                    </button>
                  </Link>
                )}
                {user.application_status === 'pending' && (
                  <p className="text-secondary">
                    application pending review...
                  </p>
                )}
                {user.application_status === 'rejected' && user.rejection_reason && !user.can_reapply && (
                  <div style={{ maxWidth: '400px', textAlign: 'center' }}>
                    <p className="text-secondary" style={{ marginBottom: '8px' }}>
                      application not approved
                    </p>
                    <p className="text-tertiary" style={{ fontSize: '14px' }}>
                      {user.rejection_reason}
                    </p>
                  </div>
                )}
                {user.application_status === 'rejected' && user.can_reapply && (
                  <div style={{ maxWidth: '400px', textAlign: 'center' }}>
                    <p className="text-secondary" style={{ marginBottom: '8px' }}>
                      previous application not approved
                    </p>
                    <p className="text-tertiary" style={{ fontSize: '14px', marginBottom: '12px' }}>
                      {user.rejection_reason}
                    </p>
                  </div>
                )}
                {user.application_status === 'more_info_needed' && user.more_info_request && (
                  <div style={{ maxWidth: '400px', textAlign: 'center' }}>
                    <p className="text-secondary" style={{ marginBottom: '8px' }}>
                      more info needed
                    </p>
                    <p className="text-tertiary" style={{ fontSize: '14px', marginBottom: '12px' }}>
                      {user.more_info_request}
                    </p>
                    <Link href="/apply">
                      <button className="primary" style={{
                        padding: '12px 28px',
                        fontSize: '15px',
                        fontWeight: 500
                      }}>
                        update application
                      </button>
                    </Link>
                  </div>
                )}
                {user.application_status === 'approved' && (
                  <Link href="/choose-identity">
                    <button className="primary" style={{
                      padding: '12px 28px',
                      fontSize: '15px',
                      fontWeight: 500
                    }}>
                      choose your identity
                    </button>
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
