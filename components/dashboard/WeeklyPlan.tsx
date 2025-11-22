'use client'

import { motion } from 'framer-motion'
import NeonCard from '../ui/NeonCard'

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
      case 'High': return 'bg-red-500/10 border-red-500/20 text-red-200'
      case 'Moderate': return 'bg-amber-500/10 border-amber-500/20 text-amber-200'
      case 'Low': return 'bg-blue-500/10 border-blue-500/20 text-blue-200'
      default: return 'bg-white/5 border-white/10 text-white/40'
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
    <NeonCard className="p-8 border-white/10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-semibold mb-1">Your Optimal Week</h2>
          <p className="text-sm text-white/60">AI-generated training schedule based on your trends</p>
        </div>
        <div className="text-4xl opacity-50">📅</div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {plan.map((day, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`p-4 rounded-xl border text-center transition-all hover:scale-105 cursor-default ${getIntensityColor(day.intensity)}`}
          >
            <div className="font-bold text-xs mb-3 opacity-70">{day.day}</div>
            <div className="text-2xl mb-3">{getIntensityEmoji(day.intensity)}</div>
            <div className="text-[10px] uppercase tracking-wider font-semibold mb-1">{day.workout}</div>
            <div className="text-[10px] opacity-50">{day.recovery}% Rec</div>
          </motion.div>
        ))}
      </div>
    </NeonCard>
  )
}
