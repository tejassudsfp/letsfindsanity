'use client'

import { useState, useEffect } from 'react'

const QUIRKY_MESSAGES = [
  'engineers engineering...',
  'models working their magic...',
  'algorithm doing its thing...',
  'banging my head against the wall...',
  'servers cooking...',
  'water boiling...',
  'caffeine loading...',
  'thinking really hard...',
  'consulting the rubber duck...',
  'stack overflow searching...',
  'deploying good vibes...',
  'warming up the neurons...',
  'compiling thoughts...',
  'downloading motivation...',
  'refactoring reality...',
]

export default function Loading({ message }: { message?: string } = {}) {
  const [currentMessage, setCurrentMessage] = useState(message || '')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!message) {
      // Set initial random message after mount
      setCurrentMessage(QUIRKY_MESSAGES[Math.floor(Math.random() * QUIRKY_MESSAGES.length)])
    }
  }, [message])

  useEffect(() => {
    if (!mounted || message) return // Don't rotate if a specific message is provided or not mounted

    const interval = setInterval(() => {
      setCurrentMessage(QUIRKY_MESSAGES[Math.floor(Math.random() * QUIRKY_MESSAGES.length)])
    }, 2000)

    return () => clearInterval(interval)
  }, [message, mounted])

  return (
    <div className="flex flex-col justify-center items-center p-lg gap-md">
      <div className="spinner"></div>
      {(currentMessage || mounted) && (
        <p className="text-secondary" style={{ fontSize: '14px', fontStyle: 'italic' }}>
          {currentMessage || 'loading...'}
        </p>
      )}
    </div>
  )
}
