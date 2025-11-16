'use client'

import { useState, useEffect } from 'react'

export default function CookieNotice() {
  const [showNotice, setShowNotice] = useState(false)

  useEffect(() => {
    // Check if user has already acknowledged
    const hasAcknowledged = localStorage.getItem('cookie-notice-acknowledged')
    if (!hasAcknowledged) {
      setShowNotice(true)
    }
  }, [])

  const handleAcknowledge = () => {
    localStorage.setItem('cookie-notice-acknowledged', 'true')
    setShowNotice(false)
  }

  if (!showNotice) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-base-200 border-t border-base-300 p-4 shadow-lg z-50">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-base-content">
          <p>
            We use essential cookies to keep you logged in and ensure the site works properly.
            By continuing to use letsfindsanity, you agree to our use of these cookies.{' '}
            <a href="/privacy" className="link link-primary">
              Learn more
            </a>
          </p>
        </div>
        <button
          onClick={handleAcknowledge}
          className="btn btn-primary btn-sm whitespace-nowrap"
        >
          Got it
        </button>
      </div>
    </div>
  )
}
