'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, Bell, ShieldCheck } from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import { getCurrentUser } from '../../lib/auth'
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
      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-8 pt-28 pb-12 text-gray-900 dark:text-white">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/10 dark:bg-neon-primary/10 border border-blue-600/20 dark:border-neon-primary/20 mb-3">
            <Settings className="w-4 h-4 text-blue-600 dark:text-neon-primary" />
            <span className="text-sm font-medium text-blue-600 dark:text-neon-primary">Profile & Settings</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-white/60 mt-2">Manage notifications, privacy, and account preferences.</p>
        </div>

        <div className="space-y-6">
          <NeonCard className="p-6 border-gray-200 dark:border-white/10 bg-white/80 dark:bg-[#0A0A0A]">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-neon-primary/10 flex items-center justify-center border border-blue-600/20 dark:border-neon-primary/20 flex-shrink-0">
                <Bell className="w-5 h-5 text-blue-600 dark:text-neon-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Notification Preferences</h2>
                <p className="text-sm text-gray-600 dark:text-white/60 mb-3">Control email and push alerts for your insights and recommendations.</p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                  <span className="text-xs text-gray-500 dark:text-white/40">Feature coming soon</span>
                </div>
              </div>
            </div>
          </NeonCard>

          <NeonCard className="p-6 border-gray-200 dark:border-white/10 bg-white/80 dark:bg-[#0A0A0A]">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-neon-primary/10 flex items-center justify-center border border-blue-600/20 dark:border-neon-primary/20 flex-shrink-0">
                <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-neon-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Privacy & Data</h2>
                <p className="text-sm text-gray-600 dark:text-white/60 mb-3">Manage downloads, model storage, and data removal. Your data is processed locally and never shared.</p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                  <span className="text-xs text-gray-500 dark:text-white/40">Granular controls coming soon</span>
                </div>
              </div>
            </div>
          </NeonCard>
        </div>
      </div>
    </AppLayout>
  )
}
