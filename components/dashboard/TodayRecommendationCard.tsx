'use client'

import { motion } from 'framer-motion'
import { Heart, Zap, Clock, TrendingUp } from 'lucide-react'
import NeonCard from '../ui/NeonCard'

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
    if (rec >= 67) return 'text-green-400'
    if (rec >= 34) return 'text-amber-400'
    return 'text-red-400'
  }

  const getRecoveryGradient = (rec: number) => {
    if (rec >= 67) return 'from-green-500/10 to-emerald-500/5'
    if (rec >= 34) return 'from-amber-500/10 to-orange-500/5'
    return 'from-red-500/10 to-rose-500/5'
  }

  return (
    <NeonCard
      className={`p-8 bg-gradient-to-br ${getRecoveryGradient(recovery)} border-white/10`}
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-white/50 mb-2">
            Today's AI Recommendation
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className={`text-6xl font-bold ${getRecoveryColor(recovery)}`}>{recovery}%</div>
          </div>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
          <Heart className={`w-6 h-6 ${getRecoveryColor(recovery)}`} />
        </div>
      </div>

      <p className="text-lg mb-8 text-white/80 leading-relaxed">{recommendation}</p>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-black/40 border border-white/5">
          <Zap className="w-4 h-4 text-amber-400 mb-2" />
          <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Type</div>
          <div className="font-medium text-sm text-white/90">{workoutType}</div>
        </div>

        <div className="p-4 rounded-xl bg-black/40 border border-white/5">
          <Clock className="w-4 h-4 text-blue-400 mb-2" />
          <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Time</div>
          <div className="font-medium text-sm text-white/90">{optimalTime}</div>
        </div>

        <div className="p-4 rounded-xl bg-black/40 border border-white/5">
          <TrendingUp className="w-4 h-4 text-purple-400 mb-2" />
          <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Forecast</div>
          <div className="font-medium text-sm text-white/90">{tomorrowForecast}%</div>
        </div>
      </div>
    </NeonCard>
  )
}
