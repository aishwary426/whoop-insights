'use client'

import { useEffect, useMemo, useState } from 'react'
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

const WINDOW_DAYS = 7

export default function RecoveryBaselinePanel({ data = defaultData }: RecoveryBaselinePanelProps) {
  const [hoveredBarId, setHoveredBarId] = useState<number | null>(null)

  const dataLength = data.length

  const windowSize = useMemo(() => Math.min(WINDOW_DAYS, dataLength || WINDOW_DAYS), [dataLength])
  const activeWindow = useMemo(() => {
    if (!dataLength) return []
    return data.slice(-windowSize)
  }, [data, dataLength, windowSize])

  const baseline = useMemo(() => {
    if (!activeWindow.length) return 0
    return Math.round(activeWindow.reduce((sum, point) => sum + point.recovery, 0) / activeWindow.length)
  }, [activeWindow])

  const processedData = useMemo(
    () =>
      activeWindow.map((point, idx) => ({
        ...point,
        id: idx,
        aboveBaseline: point.recovery > baseline,
        delta: point.recovery - baseline,
      })),
    [activeWindow, baseline]
  )

  useEffect(() => setHoveredBarId(null), [processedData])

  const barGridTemplate = useMemo(
    () => `repeat(${Math.max(processedData.length, 1)}, minmax(0, 1fr))`,
    [processedData.length]
  )

  const latest = processedData[processedData.length - 1]

  const chartHeight = 200
  const baselineWindowSize = windowSize
  const variability = useMemo(() => {
    if (processedData.length < 2) return 0
    const values = processedData.map((point) => point.recovery)
    return Math.round(Math.max(...values) - Math.min(...values))
  }, [processedData])

  return (
    <NeonCard className="relative overflow-hidden p-6 md:p-8 border-white/5 bg-gradient-to-br from-[#050505]/95 via-[#0b0b0b]/90 to-[#050505]/95">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between mb-8">
        <div className="space-y-2 max-w-xl">
          <p className="text-[11px] uppercase tracking-[0.45em] text-white/35">Recovery vs baseline</p>
          <div className="flex items-center gap-2">
            <h3 className="text-3xl font-semibold">Adaptive baseline</h3>
            <Sparkles className="w-4 h-4 text-neon-primary" />
          </div>
          <p className="text-sm text-white/60">We pin the last seven days in place so you can compare at a glance—no moving targets.</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-[0.45em] text-white/35">7-day window</p>
          <p className="text-4xl font-semibold text-neon-primary">{baselineWindowSize}d</p>
          <p className="text-xs text-white/60 mt-1">Updated automatically when new recovery data arrives.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)] items-start">
        <div className="relative rounded-[36px] border border-white/10 bg-[rgba(5,5,5,0.7)] p-6 pt-8 md:p-8 md:pt-10 backdrop-blur-xl overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 right-0 h-60 w-60 bg-neon-primary/5 blur-[120px]" />
            <div className="absolute bottom-0 left-4 h-48 w-48 bg-rose-400/5 blur-[120px]" />
          </div>
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.35em] relative z-10">
            <span className="text-white/45">Baseline {baseline}%</span>
            <span className="text-neon-primary/80">{baselineWindowSize}-day window</span>
          </div>
          <div className="relative mt-8 h-[240px]">
            <div className="absolute inset-x-6" style={{ top: `${100 - baseline}%` }}>
              <div className="h-px bg-white/10">
                <span className="float-right text-[10px] uppercase tracking-[0.4em] text-white/35 -translate-y-2">Baseline</span>
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 px-6 pb-6">
              {processedData.length ? (
                <div
                  className="grid gap-5"
                  style={{ gridTemplateColumns: barGridTemplate }}
                >
                  {processedData.map((point) => {
                    const height = Math.max(14, Math.min(chartHeight, (point.recovery / 100) * chartHeight))
                    const gradient = point.aboveBaseline
                      ? 'from-emerald-400 via-emerald-500/90 to-emerald-300/80'
                      : 'from-rose-400 via-rose-500/80 to-rose-300/80'
                    const glow = point.aboveBaseline
                      ? 'shadow-[0_16px_50px_rgba(21,255,185,0.25)]'
                      : 'shadow-[0_16px_50px_rgba(244,63,94,0.25)]'
                    const isHovered = hoveredBarId === point.id
                    return (
                      <motion.div
                        key={point.id}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height, opacity: 1 }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                        className="flex flex-col items-center gap-3 relative"
                        onMouseEnter={() => setHoveredBarId(point.id)}
                        onMouseLeave={() => setHoveredBarId(null)}
                      >
                        <motion.div
                          className={`w-8 md:w-10 rounded-[999px] bg-gradient-to-b ${gradient} ${glow} transition-all duration-200`}
                          style={{ height }}
                          animate={{
                            scale: isHovered ? 1.05 : 1,
                            filter: isHovered ? 'brightness(1.1)' : 'brightness(1)',
                          }}
                        />
                        <span className={`text-[11px] tracking-[0.35em] ${isHovered ? 'text-white' : 'text-white/40'}`}>
                          {point.date}
                        </span>
                        <AnimatePresence>
                          {isHovered && (
                            <motion.div
                              initial={{ opacity: 0, y: -10, scale: 0.9 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -10, scale: 0.9 }}
                              transition={{ duration: 0.2 }}
                              className="absolute -top-20 left-1/2 -translate-x-1/2 z-20"
                            >
                              <div className="rounded-2xl border border-white/10 bg-black/90 px-4 py-3 text-center shadow-2xl">
                                <p className="text-[11px] uppercase tracking-[0.35em] text-white/45">{point.date}</p>
                                <p className={`text-2xl font-semibold ${point.aboveBaseline ? 'text-neon-primary' : 'text-rose-400'}`}>
                                  {point.recovery}%
                                </p>
                                <p className="text-[11px] text-white/50">
                                  {point.delta > 0 ? '+' : ''}{point.delta.toFixed(0)}% vs baseline
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-white/50">
                  Not enough recovery data yet.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[32px] border border-white/10 bg-[rgba(5,5,5,0.7)] p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.35em] text-white/40">
              <span>Current baseline</span>
              <span>{baselineWindowSize}-day avg</span>
            </div>
            <div className="flex items-end justify-between mt-6">
              <p className="text-5xl font-semibold tracking-tight">{baseline}%</p>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-[0.35em] text-white/40">Variability</p>
                <p className="text-lg font-medium text-white">{variability}% span</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-white/55">
              A fixed seven-day view smooths noise but still reacts when your recovery trend shifts.
            </p>
          </div>

          {latest && (
            <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[rgba(5,5,5,0.8)] p-6 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-neon-primary/20 via-transparent to-transparent opacity-70" />
              <div className="relative flex items-start justify-between gap-6">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.35em] text-white/40">Latest day</p>
                  <p className={`text-4xl font-semibold mt-4 ${latest.aboveBaseline ? 'text-neon-primary' : 'text-rose-400'}`}>
                    {latest.recovery}%
                  </p>
                  <p className="text-xs text-white/55 mt-2">Snaps to the same baseline logic.</p>
                </div>
                <div className="flex flex-col items-end text-sm font-medium">
                  {latest.aboveBaseline ? (
                    <>
                      <span className="inline-flex items-center gap-1 text-neon-primary">
                        <MoveUpRight className="w-4 h-4" /> Above baseline
                      </span>
                      <span className="text-white/45 text-xs mt-1">+{Math.abs(latest.delta)}% vs avg</span>
                    </>
                  ) : (
                    <>
                      <span className="inline-flex items-center gap-1 text-rose-300/90">
                        <MoveDownLeft className="w-4 h-4" /> Below baseline
                      </span>
                      <span className="text-white/45 text-xs mt-1">-{Math.abs(latest.delta)}% vs avg</span>
                    </>
                  )}
                </div>
              </div>
              <p className="relative mt-4 text-sm text-white/60">
                Rebuild the trend by stacking sleep, hydration, and breathwork habits.
              </p>
            </div>
          )}
        </div>
      </div>
    </NeonCard>
  )
}
