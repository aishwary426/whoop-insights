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
