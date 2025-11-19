'use client'

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

export function StatCard({ icon: Icon, label, value, subtitle, color, delay = 0 }: StatCardProps) {
  return (
    <NeonCard
      className="p-6 border-white/10 group hover:border-neon-primary/30 transition-colors"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>

      <div className="text-2xl font-bold mb-1 text-white">{value}</div>
      <div className="text-sm text-white/60 mb-1">{label}</div>
      {subtitle && <div className="text-[10px] uppercase tracking-wider text-white/30">{subtitle}</div>}
    </NeonCard>
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
