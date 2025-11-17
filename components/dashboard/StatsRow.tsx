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
