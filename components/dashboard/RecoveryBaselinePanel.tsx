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

export default function RecoveryBaselinePanel({ data = defaultData }: RecoveryBaselinePanelProps) {
  const [windowDays, setWindowDays] = useState(7)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const dataLength = data.length
  const sliderMin = dataLength ? Math.min(7, dataLength) : 1
  const sliderMax = Math.max(sliderMin, dataLength || 1)

  useEffect(() => {
    setWindowDays((prev) => {
      if (prev > sliderMax) return sliderMax
      if (prev < sliderMin) return sliderMin
      return prev
    })
  }, [sliderMin, sliderMax])

  const baseline = useMemo(() => {
    const window = data.slice(-(dataLength ? Math.min(windowDays, dataLength) : windowDays))
    if (!window.length) return 0
    return Math.round(window.reduce((sum, point) => sum + point.recovery, 0) / window.length)
  }, [data, windowDays, dataLength])

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

  const visibleData = useMemo(() => {
    if (!coloredData.length) return []
    const windowSize = dataLength ? Math.min(windowDays, dataLength) : coloredData.length
    return coloredData.slice(-windowSize)
  }, [coloredData, dataLength, windowDays])

  const latest = coloredData[coloredData.length - 1]

  const chartHeight = 200
  const baselineWindowSize = dataLength ? Math.min(windowDays, dataLength) : windowDays
  const variability = useMemo(() => {
    if (visibleData.length < 2) return 0
    const values = visibleData.map((point) => point.recovery)
    return Math.round(Math.max(...values) - Math.min(...values))
  }, [visibleData])

  return (
    <NeonCard className="p-6 md:p-8 border-white/5 bg-gradient-to-br from-[#050505]/95 via-[#0a0a0a]/90 to-[#050505]/95">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
        <div className="space-y-3 max-w-xl">
          <p className="text-[11px] uppercase tracking-[0.35em] text-white/40">Recovery vs baseline</p>
          <div className="flex items-center gap-2">
            <h3 className="text-3xl font-semibold">Adaptive baseline</h3>
            <Sparkles className="w-4 h-4 text-neon-primary" />
          </div>
          <p className="text-sm text-white/60">
            Slide the window to re-center your baseline instantly. The bars respond with a subtle color flip so you know what is trending above or below.
          </p>
        </div>
        <div className="w-full lg:w-auto">
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3">
            <span className="text-[11px] uppercase tracking-[0.3em] text-white/50">Window</span>
            <input
              type="range"
              min={sliderMin}
              max={sliderMax}
              value={windowDays}
              onChange={(e) => setWindowDays(Number(e.target.value))}
              className="w-full md:w-40 h-1 bg-transparent accent-neon-primary"
              style={{ accentColor: '#15ffb9' }}
            />
            <span className="text-sm font-semibold text-neon-primary">{windowDays}d</span>
          </div>
          <p className="text-[11px] text-white/40 mt-2 text-center lg:text-right">
            {sliderMin}d - {sliderMax}d adaptive window
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-6 items-start">
        <div className="relative rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl overflow-hidden">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.25em]">
            <span className="text-white/45">Baseline {baseline}%</span>
            <span className="text-neon-primary/80">{baselineWindowSize}-day window</span>
          </div>
          <div className="relative mt-8 h-[220px]">
            <div
              className="absolute inset-x-4"
              style={{ top: `${100 - baseline}%` }}
            >
              <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent relative">
                <span className="absolute -top-4 right-0 text-[10px] uppercase tracking-[0.25em] text-white/40">Baseline</span>
              </div>
            </div>
            <div className="absolute inset-x-4 bottom-0 flex items-end gap-4">
              {visibleData.length ? (
                visibleData.map((point, idx) => {
                  const height = Math.max(12, Math.min(chartHeight, (point.recovery / 100) * chartHeight))
                  const gradient = point.aboveBaseline ? 'from-emerald-400/85 to-emerald-500/70' : 'from-rose-400/80 to-rose-500/70'
                  const shadow = point.aboveBaseline
                    ? 'shadow-[0_18px_35px_rgba(21,255,185,0.25)]'
                    : 'shadow-[0_18px_35px_rgba(244,63,94,0.25)]'
                  const isHovered = hoveredIndex === idx
                  return (
                    <motion.div
                      key={point.id}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height, opacity: 1 }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                      className="flex-1 flex flex-col items-center gap-3 relative"
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      <motion.div
                        className={`w-full rounded-[999px] bg-gradient-to-b ${gradient} ${shadow} transition-all duration-200 cursor-pointer`}
                        style={{ height }}
                        animate={{
                          scale: isHovered ? 1.04 : 1,
                          filter: isHovered ? 'brightness(1.15)' : 'brightness(1)',
                        }}
                      />
                      <span className={`text-[11px] uppercase tracking-[0.3em] ${isHovered ? 'text-white' : 'text-white/45'}`}>
                        {point.date}
                      </span>
                      <AnimatePresence>
                        {isHovered && (
                          <motion.div
                            initial={{ opacity: 0, y: -12, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -12, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute -top-16 left-1/2 -translate-x-1/2 z-20"
                          >
                            <div className="bg-[#050505]/95 border border-white/10 rounded-2xl px-3 py-2 shadow-xl backdrop-blur-xl whitespace-nowrap">
                              <p className="text-[11px] text-white/60 mb-0.5">{point.date}</p>
                              <p className={`text-lg font-semibold ${point.aboveBaseline ? 'text-neon-primary' : 'text-rose-400'}`}>
                                {point.recovery}%
                              </p>
                              <p className="text-[11px] text-white/50 mt-0.5">
                                {point.delta > 0 ? '+' : ''}{point.delta.toFixed(0)}% vs baseline
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })
              ) : (
                <div className="flex-1 flex items-center justify-center text-sm text-white/50 h-full">
                  Not enough recovery data yet.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-white/45">
              <span>Current baseline</span>
              <span className="text-white/40">{baselineWindowSize}-day average</span>
            </div>
            <div className="flex items-end justify-between mt-6">
              <p className="text-5xl font-semibold">{baseline}%</p>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">Variability</p>
                <p className="text-lg font-medium text-white">{variability}% span</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-white/55">
              Keep the window narrow to respond faster, or widen it for a calmer baseline.
            </p>
          </div>

          {latest && (
            <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#040404]/90 p-6 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-neon-primary/15 via-transparent to-transparent" />
              <div className="relative flex items-start justify-between gap-6">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">Latest day</p>
                  <p className={`text-4xl font-semibold mt-4 ${latest.aboveBaseline ? 'text-neon-primary' : 'text-rose-400'}`}>
                    {latest.recovery}%
                  </p>
                  <p className="text-xs text-white/55 mt-2">Cards, charts, and deltas stay synced.</p>
                </div>
                <div className="flex flex-col items-end text-sm font-medium">
                  {latest.aboveBaseline ? (
                    <>
                      <span className="inline-flex items-center gap-1 text-neon-primary">
                        <MoveUpRight className="w-4 h-4" /> Above baseline
                      </span>
                      <span className="text-white/45 text-xs mt-1">+{Math.abs(latest.delta)}% vs average</span>
                    </>
                  ) : (
                    <>
                      <span className="inline-flex items-center gap-1 text-rose-300/90">
                        <MoveDownLeft className="w-4 h-4" /> Below baseline
                      </span>
                      <span className="text-white/45 text-xs mt-1">-{Math.abs(latest.delta)}% vs average</span>
                    </>
                  )}
                </div>
              </div>
              <p className="relative mt-4 text-sm text-white/60">
                Nudge your sleep and recovery habits to tilt the next bar back above the line.
              </p>
            </div>
          )}
        </div>
      </div>
    </NeonCard>
  )
}
