'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, Bell, ShieldCheck } from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import { getCurrentUser } from '../../lib/supabase'
import TranscendentalBackground from '../../components/ui/TranscendentalBackground'
import NeonCard from '../../components/ui/NeonCard'

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/login')
        return
      }
      setUser(currentUser)
    }
    checkUser()
  }, [router])

  return (
    <AppLayout user={user}>
      <TranscendentalBackground />
      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-8 py-12 text-gray-900 dark:text-white">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-3">
            <Settings className="w-4 h-4 text-purple-600 dark:text-purple-300" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-200">Profile & Settings</span>
          </div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-gray-600 dark:text-white/60">Manage notifications, privacy, and account preferences.</p>
        </div>

        <div className="space-y-6">
          <NeonCard className="p-6 border-gray-200 dark:border-white/10 bg-white/80 dark:bg-[#0A0A0A]">
            <div className="flex items-start gap-3 mb-4">
              <Bell className="w-5 h-5 text-amber-600 dark:text-amber-300" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notification Preferences</h2>
                <p className="text-sm text-gray-600 dark:text-white/60">Control email and push alerts (coming soon).</p>
              </div>
            </div>
            <div className="text-sm text-gray-500 dark:text-white/40">Feature coming soon.</div>
          </NeonCard>

          <NeonCard className="p-6 border-gray-200 dark:border-white/10 bg-white/80 dark:bg-[#0A0A0A]">
            <div className="flex items-start gap-3 mb-4">
              <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-300" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Privacy & Data</h2>
                <p className="text-sm text-gray-600 dark:text-white/60">Manage downloads, model storage, and data removal.</p>
              </div>
            </div>
            <div className="text-sm text-gray-500 dark:text-white/40">We'll add granular controls here.</div>
          </NeonCard>
        </div>
      </div>
    </AppLayout>
  )
}
