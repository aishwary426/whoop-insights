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
