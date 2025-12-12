'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import NeonCard from '../ui/NeonCard'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  subtitle?: string
  color: string
  delay?: number
}

export const StatCard = memo(function StatCard({ icon: Icon, label, value, subtitle, color, delay = 0 }: StatCardProps) {
  return (
    <NeonCard
      className="p-3 md:p-6 border-gray-200 dark:border-white/10 group hover:border-blue-600/30 dark:hover:border-neon-primary/30 transition-colors duration-150"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 md:gap-3 flex-1 min-w-0">
          <div 
            className={`w-7 h-7 md:w-10 md:h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center group-hover:scale-105 transition-transform duration-150 flex-shrink-0`}
            style={{ transform: 'translateZ(0)', willChange: 'transform' }}
          >
            <Icon className="w-3.5 h-3.5 md:w-5 md:h-5 text-gray-800 dark:text-white" />
          </div>
          <div className="text-xs md:text-sm text-gray-600 dark:text-white/60 flex-1">{label}</div>
        </div>
        <div className="flex flex-col items-end flex-shrink-0">
          <div className="text-base md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white whitespace-nowrap">{value}</div>
          {subtitle && <div className="text-[9px] md:text-[10px] uppercase tracking-wider text-gray-600 dark:text-white/30 mt-0.5 md:mt-1">{subtitle}</div>}
        </div>
      </div>
    </NeonCard>
  )
})

interface StatsRowProps {
  stats: {
    icon: LucideIcon
    label: string
    value: string | number
    subtitle?: string
    color: string
  }[]
}

function StatsRow({ stats }: StatsRowProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
      {stats.map((stat, idx) => (
        <StatCard key={idx} {...stat} delay={idx * 0.1} />
      ))}
    </div>
  )
}

export default memo(StatsRow)
