'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CalorieGPSRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/gps-burn-analytics')
  }, [router])

  return null
}
