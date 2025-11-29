'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { Heart, Zap, Clock, TrendingUp, Flame } from 'lucide-react'
import NeonCard from '../ui/NeonCard'

interface TodayRecommendationProps {
  recovery: number
  recommendation: string
  workoutType: string
  optimalTime: string
  tomorrowForecast: number
  calories?: number
  title?: string
}

function TodayRecommendationCard({
  recovery,
  recommendation,
  workoutType,
  optimalTime,
  tomorrowForecast,
  calories,
  title = "Today's AI Recommendation"
}: TodayRecommendationProps) {
  const getRecoveryColor = (rec: number) => {
    if (rec >= 67) return 'text-blue-600 dark:text-green-400'
    if (rec >= 34) return 'text-amber-400'
    return 'text-red-400'
  }

  const getRecoveryGradient = (rec: number) => {
    if (rec >= 67) return 'from-blue-600/10 dark:from-green-500/10 to-blue-500/5 dark:to-emerald-500/5'
    if (rec >= 34) return 'from-amber-500/10 to-orange-500/5'
    return 'from-red-500/10 to-rose-500/5'
  }

  return (
    <NeonCard
      className={`p-8 bg-gradient-to-br ${getRecoveryGradient(recovery)} border-gray-200 dark:border-white/10 h-full`}
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-white/50 mb-2">
            {title}
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className={`text-6xl font-bold ${getRecoveryColor(recovery)}`}>{recovery}%</div>
          </div>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center border border-gray-200 dark:border-white/10">
          <Heart className={`w-6 h-6 ${getRecoveryColor(recovery)}`} />
        </div>
      </div>

      <p className="text-lg mb-8 text-gray-700 dark:text-white/80 leading-relaxed">{recommendation}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/5">
          <Zap className="w-4 h-4 text-blue-600 dark:text-amber-400 mb-2" />
          <div className="text-[10px] uppercase tracking-wider text-gray-600 dark:text-white/40 mb-1">Type</div>
          <div className="font-medium text-sm text-gray-900 dark:text-white/90">{workoutType}</div>
        </div>

        <div className="p-4 rounded-xl bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/5">
          <Clock className="w-4 h-4 text-blue-400 mb-2" />
          <div className="text-[10px] uppercase tracking-wider text-gray-600 dark:text-white/40 mb-1">Time</div>
          <div className="font-medium text-sm text-gray-900 dark:text-white/90">{optimalTime}</div>
        </div>

        <div className="p-4 rounded-xl bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/5">
          <TrendingUp className="w-4 h-4 text-purple-400 mb-2" />
          <div className="text-[10px] uppercase tracking-wider text-gray-600 dark:text-white/40 mb-1">Forecast</div>
          <div className="font-medium text-sm text-gray-900 dark:text-white/90">{tomorrowForecast}%</div>
        </div>

        {calories && (
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/5">
            <Flame className="w-4 h-4 text-orange-500 mb-2" />
            <div className="text-[10px] uppercase tracking-wider text-gray-600 dark:text-white/40 mb-1">Calorie Target</div>
            <div className="font-medium text-sm text-gray-900 dark:text-white/90">{calories} kcal</div>
          </div>
        )}
      </div>
    </NeonCard>
  )
}

export default memo(TodayRecommendationCard)
