#!/bin/bash

echo "🎨 PHASE 2 - Dashboard, Upload & Auth Pages"
echo "=========================================="

# 1. Create Dashboard Components
mkdir -p components/dashboard

# Today's Recommendation Card
cat > components/dashboard/TodayRecommendationCard.tsx << 'TODAYCARD'
'use client'

import { motion } from 'framer-motion'
import { Heart, Zap, Clock, TrendingUp } from 'lucide-react'

interface TodayRecommendationProps {
  recovery: number
  recommendation: string
  workoutType: string
  optimalTime: string
  tomorrowForecast: number
}

export default function TodayRecommendationCard({
  recovery,
  recommendation,
  workoutType,
  optimalTime,
  tomorrowForecast
}: TodayRecommendationProps) {
  const getRecoveryColor = (rec: number) => {
    if (rec >= 67) return 'from-green-500/20 to-emerald-500/20 border-green-500/30'
    if (rec >= 34) return 'from-amber-500/20 to-orange-500/20 border-amber-500/30'
    return 'from-red-500/20 to-rose-500/20 border-red-500/30'
  }

  const getRecoveryIcon = (rec: number) => {
    if (rec >= 67) return '🟢'
    if (rec >= 34) return '🟡'
    return '🔴'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-8 bg-gradient-to-br ${getRecoveryColor(recovery)}`}
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-400 mb-2">
            Today's AI Recommendation
          </div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{getRecoveryIcon(recovery)}</span>
            <div className="text-5xl font-bold">{recovery}%</div>
          </div>
        </div>
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
          <Heart className="w-8 h-8 text-green-400" />
        </div>
      </div>

      <p className="text-lg mb-6 text-slate-200">{recommendation}</p>

      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4 bg-white/5">
          <Zap className="w-5 h-5 text-amber-400 mb-2" />
          <div className="text-xs text-slate-400 mb-1">Workout Type</div>
          <div className="font-semibold text-sm">{workoutType}</div>
        </div>

        <div className="glass-card p-4 bg-white/5">
          <Clock className="w-5 h-5 text-blue-400 mb-2" />
          <div className="text-xs text-slate-400 mb-1">Optimal Time</div>
          <div className="font-semibold text-sm">{optimalTime}</div>
        </div>

        <div className="glass-card p-4 bg-white/5">
          <TrendingUp className="w-5 h-5 text-purple-400 mb-2" />
          <div className="text-xs text-slate-400 mb-1">Tomorrow</div>
          <div className="font-semibold text-sm">{tomorrowForecast}% Recovery</div>
        </div>
      </div>
    </motion.div>
  )
}
TODAYCARD

# Stats Row Component
cat > components/dashboard/StatsRow.tsx << 'STATSROW'
'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  subtitle?: string
  color: string
  delay?: number
}

export function StatCard({ icon: Icon, label, value, subtitle, color, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className="stat-card group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      
      <div className="text-3xl font-bold mb-2">{value}</div>
      <div className="text-sm text-slate-400 mb-1">{label}</div>
      {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
    </motion.div>
  )
}

interface StatsRowProps {
  stats: {
    icon: LucideIcon
    label: string
    value: string | number
    subtitle?: string
    color: string
  }[]
}

export default function StatsRow({ stats }: StatsRowProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, idx) => (
        <StatCard key={idx} {...stat} delay={idx * 0.1} />
      ))}
    </div>
  )
}
STATSROW

# Weekly Plan Component
cat > components/dashboard/WeeklyPlan.tsx << 'WEEKLYPLAN'
'use client'

import { motion } from 'framer-motion'

interface DayPlan {
  day: string
  workout: string
  intensity: 'High' | 'Moderate' | 'Low' | 'Recovery'
  recovery: number
}

interface WeeklyPlanProps {
  plan: DayPlan[]
}

export default function WeeklyPlan({ plan }: WeeklyPlanProps) {
  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'High': return 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border-red-500/30'
      case 'Moderate': return 'bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border-amber-500/30'
      case 'Low': return 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30'
      default: return 'bg-gradient-to-br from-slate-500/20 to-gray-500/20 border-slate-500/30'
    }
  }

  const getIntensityEmoji = (intensity: string) => {
    switch (intensity) {
      case 'High': return '🔥'
      case 'Moderate': return '💪'
      case 'Low': return '🚶'
      default: return '😴'
    }
  }

  return (
    <div className="glass-card p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">Your Optimal Week</h2>
          <p className="text-sm text-slate-400">AI-generated training schedule</p>
        </div>
        <div className="text-4xl">📅</div>
      </div>

      <div className="grid grid-cols-7 gap-3">
        {plan.map((day, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`glass-card p-4 text-center hover:scale-105 transition-all cursor-pointer ${getIntensityColor(day.intensity)}`}
          >
            <div className="font-bold text-sm mb-2">{day.day}</div>
            <div className="text-3xl mb-3">{getIntensityEmoji(day.intensity)}</div>
            <div className="text-xs font-semibold mb-2">{day.workout}</div>
            <div className="text-xs text-slate-400">{day.recovery}%</div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
WEEKLYPLAN

echo "✅ Dashboard components created"

# 2. Create Dashboard Page
cat > app/dashboard/page.tsx << 'DASHBOARD'
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Dumbbell, Zap, Moon } from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import TodayRecommendationCard from '../../components/dashboard/TodayRecommendationCard'
import StatsRow from '../../components/dashboard/StatsRow'
import WeeklyPlan from '../../components/dashboard/WeeklyPlan'
import { getCurrentUser } from '../../lib/supabase'
import { getUserStats } from '../../lib/dataParser'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    avgRecovery: 50,
    avgStrain: 0
  })

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      router.push('/login')
    } else {
      setUser(currentUser)
      setLoading(false)
      loadUserStats(currentUser.id)
    }
  }

  const loadUserStats = async (userId: string) => {
    try {
      const userStats = await getUserStats(userId)
      if (userStats) {
        setStats(userStats)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Loading your insights...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  const hasData = stats.totalWorkouts > 0
  const recovery = typeof stats.avgRecovery === 'number' ? stats.avgRecovery : 50

  // Generate recommendation
  const getRecommendation = () => {
    if (recovery >= 67) return {
      text: "High recovery today! Perfect day for high-intensity training or strength work.",
      workout: "HIIT or Strength",
      time: "Morning (6-9 AM)"
    }
    if (recovery >= 34) return {
      text: "Moderate recovery. Stick to endurance training or moderate cardio.",
      workout: "Endurance Run",
      time: "Afternoon (2-5 PM)"
    }
    return {
      text: "Low recovery. Focus on active recovery, yoga, or complete rest.",
      workout: "Light Walk/Yoga",
      time: "Anytime"
    }
  }

  const rec = getRecommendation()
  const tomorrowForecast = Math.min(100, Math.max(30, recovery + (Math.random() * 20 - 10)))

  // Generate weekly plan
  const weeklyPlan = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
    const dayRecovery = Math.max(40, Math.min(90, recovery + (Math.random() * 30 - 15)))
    return {
      day,
      workout: dayRecovery >= 75 ? 'HIIT' : dayRecovery >= 60 ? 'Endurance' : dayRecovery >= 45 ? 'Light' : 'Rest',
      intensity: (dayRecovery >= 75 ? 'High' : dayRecovery >= 60 ? 'Moderate' : dayRecovery >= 45 ? 'Low' : 'Recovery') as any,
      recovery: Math.round(dayRecovery)
    }
  })

  const statsData = [
    {
      icon: Heart,
      label: 'Recovery',
      value: `${recovery}%`,
      subtitle: '7-day average',
      color: 'from-green-500/20 to-emerald-500/20'
    },
    {
      icon: Dumbbell,
      label: 'Total Workouts',
      value: stats.totalWorkouts,
      subtitle: 'All time',
      color: 'from-purple-500/20 to-pink-500/20'
    },
    {
      icon: Zap,
      label: 'Avg Strain',
      value: stats.avgStrain || '--',
      subtitle: '30-day average',
      color: 'from-amber-500/20 to-orange-500/20'
    },
    {
      icon: Moon,
      label: 'Sleep Quality',
      value: '8.2h',
      subtitle: 'Last night',
      color: 'from-blue-500/20 to-cyan-500/20'
    }
  ]

  return (
    <AppLayout user={user}>
      {/* Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="gradient-blob w-96 h-96 bg-purple-500 top-20 right-1/4" />
        <div className="gradient-blob w-96 h-96 bg-pink-500 bottom-20 left-1/4" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            Welcome back, {user?.user_metadata?.name || 'Athlete'}! 👋
          </h1>
          <p className="text-slate-400 text-lg">
            {hasData ? "Here's your AI-powered performance analysis" : 'Upload your data to unlock insights'}
          </p>
        </div>

        {hasData ? (
          <>
            {/* Today's Recommendation */}
            <div className="mb-8">
              <TodayRecommendationCard
                recovery={recovery}
                recommendation={rec.text}
                workoutType={rec.workout}
                optimalTime={rec.time}
                tomorrowForecast={Math.round(tomorrowForecast)}
              />
            </div>

            {/* Stats Row */}
            <div className="mb-8">
              <StatsRow stats={statsData} />
            </div>

            {/* Weekly Plan */}
            <div className="mb-8">
              <WeeklyPlan plan={weeklyPlan} />
            </div>

            {/* Gamification Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="stat-card">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">🔥</div>
                  <div>
                    <div className="text-3xl font-bold">15</div>
                    <div className="text-sm text-slate-400">Day Streak</div>
                  </div>
                </div>
              </div>
              <div className="stat-card">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">🏆</div>
                  <div>
                    <div className="text-3xl font-bold">8</div>
                    <div className="text-sm text-slate-400">Achievements</div>
                  </div>
                </div>
              </div>
              <div className="stat-card">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">⭐</div>
                  <div>
                    <div className="text-3xl font-bold">Top 10%</div>
                    <div className="text-sm text-slate-400">This Month</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="glass-card p-12 text-center">
            <div className="text-6xl mb-6">📦</div>
            <h3 className="text-2xl font-bold mb-4">No Data Yet</h3>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              Upload your WHOOP export to unlock AI-powered insights and personalized training plans
            </p>
            <button
              onClick={() => router.push('/upload')}
              className="btn-primary"
            >
              Upload Data Now
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
DASHBOARD

echo "✅ Dashboard page created"

# 3. Create Upload Page
cat > app/upload/page.tsx << 'UPLOAD'
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Upload, Check, X, FileText } from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import { getCurrentUser, supabase } from '../../lib/supabase'
import JSZip from 'jszip'

export default function UploadPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)

  useState(() => {
    checkUser()
  })

  const checkUser = async () => {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      router.push('/login')
    } else {
      setUser(currentUser)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.name.endsWith('.zip')) {
        setFile(file)
        setError('')
      } else {
        setError('Please upload a .zip file')
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.name.endsWith('.zip')) {
        setFile(file)
        setError('')
      } else {
        setError('Please upload a .zip file')
      }
    }
  }

  const handleUpload = async () => {
    if (!file || !user) return

    setUploading(true)
    setProgress(10)

    try {
      // Extract ZIP
      const zip = new JSZip()
      const zipData = await zip.loadAsync(file)
      setProgress(30)

      // Extract CSVs
      const csvFiles: Record<string, string> = {}
      const fileNames = ['workouts.csv', 'sleeps.csv', 'physiological_cycles.csv', 'journal_entries.csv']
      
      for (const fileName of fileNames) {
        const file = zipData.file(fileName)
        if (file) {
          csvFiles[fileName] = await file.async('text')
        }
      }

      setProgress(50)

      // Upload to Supabase
      const uploadId = `${user.id}_${Date.now()}`
      let uploadedCount = 0
      
      for (const [fileName, content] of Object.entries(csvFiles)) {
        const { error: uploadError } = await supabase.storage
          .from('whoop-data')
          .upload(`${uploadId}/${fileName}`, content, {
            contentType: 'text/csv',
          })

        if (uploadError) throw uploadError
        uploadedCount++
        setProgress(50 + (uploadedCount / Object.keys(csvFiles).length) * 40)
      }

      setProgress(100)
      
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)

    } catch (error: any) {
      console.error('Upload error:', error)
      setError(error.message || 'Upload failed')
      setUploading(false)
      setProgress(0)
    }
  }

  return (
    <AppLayout user={user}>
      <div className="relative max-w-4xl mx-auto px-4 md:px-8 py-20">
        {/* Background Blob */}
        <div className="gradient-blob w-96 h-96 bg-purple-500 top-0 left-1/2 -translate-x-1/2" />

        <div className="relative">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Upload Your WHOOP Data</h1>
            <p className="text-xl text-slate-400">
              Export your data from the WHOOP app and drop the ZIP file here
            </p>
          </div>

          {/* Upload Card */}
          <div className="glass-card p-8">
            {!uploading ? (
              <>
                {/* Drop Zone */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('fileInput')?.click()}
                  className={`relative border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-300 ${
                    dragActive 
                      ? 'border-purple-500 bg-purple-500/10' 
                      : 'border-white/10 hover:border-purple-500/50 hover:bg-white/5'
                  }`}
                >
                  <input
                    id="fileInput"
                    type="file"
                    accept=".zip"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  
                  {file ? (
                    <div className="flex items-center justify-center gap-4">
                      <FileText className="w-12 h-12 text-green-400" />
                      <div className="text-left">
                        <div className="font-semibold">{file.name}</div>
                        <div className="text-sm text-slate-400">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setFile(null)
                        }}
                        className="p-2 hover:bg-white/10 rounded-lg"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                      <div className="text-xl font-semibold mb-2">
                        Drop your WHOOP ZIP file here
                      </div>
                      <div className="text-slate-400">
                        or click to browse
                      </div>
                    </>
                  )}
                </div>

                {error && (
                  <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
                    {error}
                  </div>
                )}

                {file && (
                  <button
                    onClick={handleUpload}
                    className="btn-primary w-full mt-6 text-lg"
                  >
                    Upload & Analyze
                  </button>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-6" />
                <div className="text-xl font-semibold mb-4">Processing your data...</div>
                
                <div className="max-w-md mx-auto">
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                    />
                  </div>
                  <div className="text-sm text-slate-400">{progress}% complete</div>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="mt-8 p-6 rounded-xl bg-white/5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <span className="text-2xl">📱</span>
                How to export from WHOOP:
              </h3>
              <ol className="space-y-3 text-sm text-slate-400">
                <li className="flex gap-3">
                  <span className="font-bold text-purple-400">1.</span>
                  <span>Open the WHOOP mobile app</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-purple-400">2.</span>
                  <span>Go to Settings → Privacy → Export Data</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-purple-400">3.</span>
                  <span>Request export and wait for email</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-purple-400">4.</span>
                  <span>Download the ZIP file from email</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-purple-400">5.</span>
                  <span>Upload it here!</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
UPLOAD

echo "✅ Upload page created"

echo ""
echo "🎉 PHASE 2 COMPLETE!"
echo ""
echo "Next: Run Phase 3 for Auth pages"
