'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../providers/AuthProvider'
import ProfileDropdown from '../shared/ProfileDropdown'

export default function Header() {
  const { user, loading } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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

          {/* Desktop Navigation - Center */}
          {!loading && user && user.three_word_id && (
            <nav className="desktop-nav flex items-center gap-lg" style={{
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

          {/* Desktop Public Navigation - Center */}
          {!loading && !user && (
            <nav className="desktop-nav flex items-center gap-lg" style={{
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

          {/* Mobile Hamburger Menu */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ display: 'none' }}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>

          {/* Profile/Auth - Right Edge (Desktop) */}
          <div className="desktop-nav flex items-center gap-md" style={{ paddingRight: '8px' }}>
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

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="mobile-menu" style={{
            position: 'fixed',
            top: '73px',
            left: 0,
            right: 0,
            background: 'var(--bg-primary)',
            borderBottom: '1px solid var(--border)',
            padding: '20px 24px',
            zIndex: 1000,
            display: 'none'
          }}>
            {!loading && user && user.three_word_id && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Link href="/feed" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '16px', padding: '8px 0' }}>home</Link>
                <Link href="/topics" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '16px', padding: '8px 0' }}>topics</Link>
                <Link href="/search" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '16px', padding: '8px 0' }}>search</Link>
                <Link href="/journal" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '16px', padding: '8px 0' }}>my journal</Link>
                <Link href="/my-posts" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '16px', padding: '8px 0' }}>my posts</Link>
                <Link href="/write" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '16px', padding: '8px 0', fontWeight: 500 }}>write</Link>
                {user.is_admin && <Link href="/admin" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '16px', padding: '8px 0' }}>admin</Link>}
                <div style={{ borderTop: '1px solid var(--border)', marginTop: '8px', paddingTop: '16px' }}>
                  <ProfileDropdown />
                </div>
              </div>
            )}

            {!loading && !user && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Link href="/about" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '16px', padding: '8px 0', color: 'var(--text-secondary)' }}>about</Link>
                <Link href="/tech" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '16px', padding: '8px 0', color: 'var(--text-secondary)' }}>technical</Link>
                <Link href="/privacy" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '16px', padding: '8px 0', color: 'var(--text-secondary)' }}>privacy</Link>
                <Link href="/terms" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '16px', padding: '8px 0', color: 'var(--text-secondary)' }}>terms</Link>
                <div style={{ borderTop: '1px solid var(--border)', marginTop: '8px', paddingTop: '16px' }}>
                  <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <button className="primary" style={{ width: '100%' }}>login</button>
                  </Link>
                </div>
              </div>
            )}

            {!loading && user && !user.three_word_id && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {user.application_status === 'approved' && (
                  <Link href="/choose-identity" onClick={() => setMobileMenuOpen(false)}>
                    <button className="primary" style={{ width: '100%' }}>choose identity</button>
                  </Link>
                )}
                {(!user.has_application || user.can_reapply) && (
                  <Link href="/apply" onClick={() => setMobileMenuOpen(false)}>
                    <button className="primary" style={{ width: '100%' }}>{user.can_reapply ? 'reapply' : 'request access'}</button>
                  </Link>
                )}
                {user.application_status === 'more_info_needed' && (
                  <Link href="/apply" onClick={() => setMobileMenuOpen(false)}>
                    <button className="primary" style={{ width: '100%' }}>update application</button>
                  </Link>
                )}
                {user.application_status === 'pending' && (
                  <span className="text-secondary" style={{ padding: '8px 0' }}>application pending...</span>
                )}
                {user.application_status === 'rejected' && !user.can_reapply && (
                  <span className="text-secondary" style={{ padding: '8px 0' }}>application not approved</span>
                )}
              </div>
            )}
          </div>
        )}
    </header>
  )
}
