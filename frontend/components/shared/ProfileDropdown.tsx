'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../providers/AuthProvider'
import ThemeToggle from '../layout/ThemeToggle'

export default function ProfileDropdown() {
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  if (!user || !user.three_word_id) return null

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'var(--accent)',
          color: 'var(--bg-primary)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          flexShrink: 0
        }}
        aria-label="Profile menu"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block' }}
        >
          <path
            d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
            fill="currentColor"
          />
          <path
            d="M12 14C6.47715 14 2 17.5817 2 22H22C22 17.5817 17.5228 14 12 14Z"
            fill="currentColor"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '48px',
            right: 0,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '16px',
            minWidth: '240px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            zIndex: 1000
          }}
        >
          <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              signed in as
            </div>
            <div style={{ fontSize: '16px', fontWeight: 500 }}>
              {user.three_word_id}
            </div>
          </div>

          <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              theme
            </div>
            <ThemeToggle />
          </div>

          <button
            onClick={() => {
              logout()
              setIsOpen(false)
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '14px',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              cursor: 'pointer',
              color: 'var(--text-primary)'
            }}
          >
            logout
          </button>
        </div>
      )}
    </div>
  )
}
