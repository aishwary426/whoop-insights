'use client'

import { useEffect } from 'react'
import NeonButton from '../components/ui/NeonButton'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-bgDark px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Something went wrong!
        </h1>
        <p className="text-gray-600 dark:text-white/60">
          {error.message || 'An unexpected error occurred'}
        </p>
        <div className="flex gap-4 justify-center">
          <NeonButton onClick={reset} variant="primary">
            Try again
          </NeonButton>
          <Link href="/">
            <NeonButton variant="secondary">
              Go home
            </NeonButton>
          </Link>
        </div>
      </div>
    </div>
  )
}























