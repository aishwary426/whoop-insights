'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, MoveUpRight, MoveDownLeft } from 'lucide-react'
import NeonCard from '../ui/NeonCard'

type RecoveryPoint = {
  date: string
  recovery: number
}

interface RecoveryBaselinePanelProps {
  data?: RecoveryPoint[]
}

const defaultData: RecoveryPoint[] = [
  { date: 'Mon', recovery: 62 },
  { date: 'Tue', recovery: 68 },
  { date: 'Wed', recovery: 71 },
  { date: 'Thu', recovery: 77 },
  { date: 'Fri', recovery: 73 },
  { date: 'Sat', recovery: 84 },
  { date: 'Sun', recovery: 79 },
  { date: 'Mon', recovery: 76 },
  { date: 'Tue', recovery: 69 },
  { date: 'Wed', recovery: 74 },
  { date: 'Thu', recovery: 81 },
  { date: 'Fri', recovery: 70 },
  { date: 'Sat', recovery: 83 },
  { date: 'Sun', recovery: 77 },
]

export default function RecoveryBaselinePanel({ data = defaultData }: RecoveryBaselinePanelProps) {
  const [windowDays, setWindowDays] = useState(7)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const baseline = useMemo(() => {
    const window = data.slice(-windowDays)
    if (!window.length) return 0
    return Math.round(window.reduce((sum, point) => sum + point.recovery, 0) / window.length)
  }, [data, windowDays])

  const coloredData = useMemo(
    () =>
      data.map((point, idx) => ({
        ...point,
        id: idx,
        aboveBaseline: point.recovery > baseline,
        delta: point.recovery - baseline,
      })),
    [data, baseline]
  )

  const latest = coloredData[coloredData.length - 1]

  const chartHeight = 200

  return (
    <NeonCard className="p-6 md:p-8 border-white/10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">Recovery vs baseline</p>
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-semibold">Adaptive baseline</h3>
            <Sparkles className="w-4 h-4 text-neon-primary" />
          </div>
          <p className="text-sm text-white/60">Move the window—baseline updates instantly, and colors flip with it.</p>
        </div>
        <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-full px-4 py-2">
          <span className="text-xs text-white/60">Window</span>
          <input
            type="range"
            min={5}
            max={data.length}
            value={windowDays}
            onChange={(e) => setWindowDays(Number(e.target.value))}
            className="w-36 accent-neon-primary"
          />
          <span className="text-sm font-semibold text-neon-primary">{windowDays}d</span>
        </div>
      </div>

      <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-6 items-start">
        <div className="relative rounded-2xl border border-white/10 bg-black/40 p-4 overflow-hidden">
          <div className="flex items-center justify-between text-xs text-white/50">
            <span>Baseline {baseline}%</span>
            <span className="flex items-center gap-1 text-neon-primary">{windowDays}-day window</span>
          </div>
          <div className="relative mt-6 h-[220px]">
            <div
              className="absolute inset-x-2"
              style={{ top: `${100 - baseline}%` }}
            >
              <div className="h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            </div>
            <div className="absolute inset-x-2 bottom-0 flex items-end gap-3">
              {coloredData.map((point, idx) => {
                const height = Math.max(12, Math.min(chartHeight, (point.recovery / 100) * chartHeight))
                const color = point.aboveBaseline ? 'bg-[rgba(0,255,143,0.8)]' : 'bg-rose-400/80'
                const isHovered = hoveredIndex === idx
                return (
                  <motion.div
                    key={point.id}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height, opacity: 1 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="flex-1 flex flex-col items-center gap-2 relative"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <motion.div
                      className={`w-full rounded-full ${color} shadow-neon-card transition-all duration-200 cursor-pointer`}
                      style={{ height }}
                      animate={{
                        scale: isHovered ? 1.05 : 1,
                        filter: isHovered ? 'brightness(1.2)' : 'brightness(1)',
                      }}
                    />
                    <span className={`text-[11px] transition-colors ${isHovered ? 'text-white font-semibold' : 'text-white/50'}`}>
                      {point.date}
                    </span>
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.9 }}
                          transition={{ duration: 0.2 }}
                          className="absolute -top-12 left-1/2 -translate-x-1/2 z-20"
                        >
                          <div className="bg-black/95 border border-neon-primary/30 rounded-lg px-3 py-2 shadow-neon-card backdrop-blur-xl whitespace-nowrap">
                            <p className="text-xs text-white/60 mb-0.5">{point.date}</p>
                            <p className={`text-base font-semibold ${point.aboveBaseline ? 'text-neon-primary' : 'text-rose-400'}`}>
                              {point.recovery}%
                            </p>
                            <p className="text-[10px] text-white/50 mt-0.5">
                              {point.delta > 0 ? '+' : ''}{point.delta.toFixed(0)}% vs baseline
                            </p>
                          </div>
                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-neon-primary/30" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          <NeonCard className="p-4 border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">Current baseline</p>
                <p className="text-3xl font-semibold">{baseline}%</p>
              </div>
              <div className="text-sm text-white/60">
                {windowDays}-day average, updates on slider change
              </div>
            </div>
          </NeonCard>

          {latest && (
            <NeonCard className="p-4 border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/50">Latest day</p>
                  <p className={`text-3xl font-semibold ${latest.aboveBaseline ? 'text-neon-primary' : 'text-rose-400'}`}>
                    {latest.recovery}%
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {latest.aboveBaseline ? (
                    <span className="inline-flex items-center gap-1 text-neon-primary">
                      <MoveUpRight className="w-4 h-4" /> Above baseline by {Math.abs(latest.delta)}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-rose-300/90">
                      <MoveDownLeft className="w-4 h-4" /> Below baseline by {Math.abs(latest.delta)}%
                    </span>
                  )}
                </div>
              </div>
              <p className="mt-2 text-xs text-white/60">
                Cards, charts, and deltas all follow the same logic (green for &gt; baseline, red for ≤ baseline).
              </p>
            </NeonCard>
          )}
        </div>
      </div>
    </NeonCard>
  )
}
