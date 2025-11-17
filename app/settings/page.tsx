'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, Bell, ShieldCheck } from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import { getCurrentUser } from '../../lib/supabase'

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
      <div className="relative max-w-4xl mx-auto px-4 md:px-8 py-12">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-3">
            <Settings className="w-4 h-4 text-purple-300" />
            <span className="text-sm font-medium text-purple-200">Profile & Settings</span>
          </div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-slate-400">Manage notifications, privacy, and account preferences.</p>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-start gap-3 mb-4">
              <Bell className="w-5 h-5 text-amber-300" />
              <div>
                <h2 className="text-lg font-semibold">Notification Preferences</h2>
                <p className="text-sm text-slate-500">Control email and push alerts (coming soon).</p>
              </div>
            </div>
            <div className="text-sm text-slate-400">Feature coming soon.</div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-start gap-3 mb-4">
              <ShieldCheck className="w-5 h-5 text-green-300" />
              <div>
                <h2 className="text-lg font-semibold">Privacy & Data</h2>
                <p className="text-sm text-slate-500">Manage downloads, model storage, and data removal.</p>
              </div>
            </div>
            <div className="text-sm text-slate-400">We’ll add granular controls here.</div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
