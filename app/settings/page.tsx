'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, Bell, ShieldCheck, Brain } from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import { getCurrentUser } from '../../lib/auth'
import { api } from '../../lib/api'
import NeonCard from '../../components/ui/NeonCard'

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    nationality: '',
    goal: ''
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/login')
        return
      }
      setUser(currentUser)

      // Auto-sync from metadata if profile name is empty
      const metaName = currentUser.user_metadata?.name || currentUser.user_metadata?.full_name || currentUser.user_metadata?.display_name

      setFormData({
        name: currentUser.user_metadata?.name || metaName || '',
        age: currentUser.user_metadata?.age?.toString() || '',
        nationality: currentUser.user_metadata?.nationality || '',
        goal: currentUser.user_metadata?.goal || ''
      })
    }
    checkUser()
  }, [router])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      await api.updateUserProfile({
        name: formData.name,
        email: user?.email,
        age: formData.age ? parseInt(formData.age) : undefined,
        nationality: formData.nationality,
        goal: formData.goal
      })
      setMessage({ type: 'success', text: 'Profile updated successfully' })
      // Update local user state
      setUser((prev: any) => ({ ...prev, ...formData, age: formData.age ? parseInt(formData.age) : undefined }))
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout user={user}>
      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-8 pt-28 pb-12 text-gray-900 dark:text-white">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/10 dark:bg-neon-primary/10 border border-blue-600/20 dark:border-neon-primary/20 mb-3">
            <Settings className="w-4 h-4 text-blue-600 dark:text-neon-primary" />
            <span className="text-sm font-medium text-blue-600 dark:text-neon-primary">Profile & Settings</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-white/60 mt-2">Manage your profile, notifications, and account preferences.</p>
        </div>

        <div className="space-y-6">
          {/* Profile Settings */}
          <NeonCard className="p-6 border-gray-200 dark:border-white/10 bg-white/80 dark:bg-[#0A0A0A]">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-neon-primary/10 flex items-center justify-center border border-blue-600/20 dark:border-neon-primary/20 flex-shrink-0">
                <Settings className="w-5 h-5 text-blue-600 dark:text-neon-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Profile Information</h2>
                <p className="text-sm text-gray-600 dark:text-white/60">Update your personal details for better AI coaching.</p>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-blue-600 dark:focus:ring-neon-primary focus:outline-none text-gray-900 dark:text-white"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Age</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-blue-600 dark:focus:ring-neon-primary focus:outline-none text-gray-900 dark:text-white"
                    placeholder="Age"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nationality</label>
                  <input
                    type="text"
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-blue-600 dark:focus:ring-neon-primary focus:outline-none text-gray-900 dark:text-white"
                    placeholder="Nationality"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Goal</label>
                  <input
                    type="text"
                    value={formData.goal}
                    onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-blue-600 dark:focus:ring-neon-primary focus:outline-none text-gray-900 dark:text-white"
                    placeholder="Fitness goal"
                  />
                </div>
              </div>

              {message && (
                <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
                  {message.text}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-lg bg-blue-600 dark:bg-neon-primary text-white dark:text-black font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </NeonCard>

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
                <Brain className="w-5 h-5 text-blue-600 dark:text-neon-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Model Metrics</h2>
                <p className="text-sm text-gray-600 dark:text-white/60 mb-3">View performance metrics and parameters for your personalized ML models.</p>
                <button
                  onClick={() => router.push('/settings/model-metrics')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 dark:bg-neon-primary text-white dark:text-black font-medium hover:opacity-90 transition-opacity text-sm"
                >
                  View Metrics
                </button>
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
