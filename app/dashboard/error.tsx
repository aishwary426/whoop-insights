'use client'

import { useEffect } from 'react'
import NeonButton from '../../components/ui/NeonButton'
import Link from 'next/link'
import AppLayout from '../../components/layout/AppLayout'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <AppLayout>
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Dashboard Error
          </h1>
          <p className="text-gray-600 dark:text-white/60">
            {error.message || 'An error occurred while loading the dashboard'}
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
    </AppLayout>
  )
}























