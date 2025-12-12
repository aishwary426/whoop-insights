'use client'

import { useEffect } from 'react'
import NeonButton from '../../components/ui/NeonButton'
import Link from 'next/link'

export default function LoginError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Login page error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-bgDark px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-4xl font-bold text-white">
          Login Error
        </h1>
        <p className="text-white/60">
          {error.message || 'An error occurred on the login page'}
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























