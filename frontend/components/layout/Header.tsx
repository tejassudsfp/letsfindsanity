'use client'

import Link from 'next/link'
import { useAuth } from '../providers/AuthProvider'
import ProfileDropdown from '../shared/ProfileDropdown'

export default function Header() {
  const { user, loading } = useAuth()

  return (
    <header style={{
      borderBottom: '1px solid var(--border)',
      padding: '16px 24px',
      marginBottom: '32px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '100%' }}>
        {/* Logo - Left Edge */}
        <Link href="/" style={{ fontSize: '20px', fontWeight: 600 }}>
          letsfindsanity
        </Link>

          {/* Navigation - Center */}
          {!loading && user && user.three_word_id && (
            <nav className="flex items-center gap-lg" style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)'
            }}>
              <Link href="/feed" style={{ fontSize: '15px' }}>home</Link>
              <Link href="/topics" style={{ fontSize: '15px' }}>topics</Link>
              <Link href="/search" style={{ fontSize: '15px' }}>search</Link>
              <Link href="/journal" style={{ fontSize: '15px' }}>my journal</Link>
              <Link href="/my-posts" style={{ fontSize: '15px' }}>my posts</Link>
              <Link href="/write" style={{ fontSize: '15px', fontWeight: 500 }}>write</Link>
              {user.is_admin && <Link href="/admin" style={{ fontSize: '15px' }}>admin</Link>}
            </nav>
          )}

          {/* Public Navigation - Center */}
          {!loading && !user && (
            <nav className="flex items-center gap-lg" style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)'
            }}>
              <Link href="/about" style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>about</Link>
              <Link href="/tech" style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>technical</Link>
              <Link href="/privacy" style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>privacy</Link>
              <Link href="/terms" style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>terms</Link>
            </nav>
          )}

          {/* Profile/Auth - Right Edge */}
          <div className="flex items-center gap-md" style={{ paddingRight: '8px' }}>
            {!loading && user && user.three_word_id && (
              <ProfileDropdown />
            )}
            {!loading && user && !user.three_word_id && (
              <>
                {user.application_status === 'approved' && (
                  <Link href="/choose-identity">choose identity</Link>
                )}
                {(!user.has_application || user.can_reapply) && (
                  <Link href="/apply">{user.can_reapply ? 'reapply' : 'request access'}</Link>
                )}
                {user.application_status === 'more_info_needed' && (
                  <Link href="/apply">update application</Link>
                )}
                {user.application_status === 'pending' && (
                  <span className="text-secondary">application pending...</span>
                )}
                {user.application_status === 'rejected' && !user.can_reapply && (
                  <span className="text-secondary">application not approved</span>
                )}
              </>
            )}
            {!loading && !user && (
              <Link href="/auth" style={{
                padding: '8px 20px',
                background: 'var(--accent)',
                color: 'var(--bg-primary)',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 500
              }}>
                login
              </Link>
            )}
          </div>
        </div>
    </header>
  )
}
