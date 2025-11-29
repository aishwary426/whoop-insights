'use client'

import { useEffect, useMemo, useState, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, MoveUpRight, MoveDownLeft, Clock } from 'lucide-react'
import NeonCard from '../ui/NeonCard'
import { usePerformanceMode } from '../../lib/hooks/usePerformanceMode'

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

const DEFAULT_WINDOW = 7
const WINDOW_OPTIONS = [7, 14, 21, 28]

function RecoveryBaselinePanel({ data = defaultData }: RecoveryBaselinePanelProps) {
  const [hoveredBarId, setHoveredBarId] = useState<number | null>(null)
  const [timeWindow, setTimeWindow] = useState(DEFAULT_WINDOW)
  const { reduceAnimations, isMobile } = usePerformanceMode()

  const dataLength = data.length

  const windowSize = useMemo(() => Math.min(timeWindow, dataLength || timeWindow), [dataLength, timeWindow])
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
    <NeonCard className="relative overflow-hidden p-6 md:p-8 border-gray-200 dark:border-white/5 bg-gradient-to-br from-white via-gray-50 to-white dark:from-[#050505]/95 dark:via-[#0b0b0b]/90 dark:to-[#050505]/95 h-full flex flex-col">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between mb-8">
        <div className="space-y-2 max-w-xl">
          <p className="text-[11px] uppercase tracking-[0.45em] text-gray-400 dark:text-white/35">Recovery vs baseline</p>
          <div className="flex items-center gap-2">
            <h3 className="text-3xl font-semibold text-gray-900 dark:text-white">Adaptive baseline</h3>
            <Sparkles className="w-4 h-4 text-neon-primary" />
          </div>
          <p className="text-sm text-gray-600 dark:text-white/60">We pin the last seven days in place so you can compare at a glance—no moving targets.</p>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-2 mb-1">
            <Clock className="w-3 h-3 text-gray-400 dark:text-white/40" />
            <p className="text-[11px] uppercase tracking-[0.45em] text-gray-400 dark:text-white/35">Timeline</p>
          </div>
          <div className="flex items-center justify-end gap-4">
            <input
              type="range"
              min="0"
              max="3"
              step="1"
              value={WINDOW_OPTIONS.indexOf(timeWindow)}
              onChange={(e) => setTimeWindow(WINDOW_OPTIONS[parseInt(e.target.value)])}
              className="w-24 h-1 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer relative z-20 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-neon-primary [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(0,255,143,0.5)]"
            />
            <p className="text-4xl font-semibold text-neon-primary w-[3ch] text-center">{windowSize}d</p>
          </div>
          <p className="text-xs text-gray-600 dark:text-white/60 mt-1">Updated automatically when new recovery data arrives.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)] items-stretch flex-1">
        <div className="relative rounded-[36px] border border-gray-200 dark:border-white/10 bg-gray-100/70 dark:bg-[rgba(5,5,5,0.7)] p-6 pt-8 md:p-8 md:pt-10 backdrop-blur-xl overflow-hidden flex flex-col">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 right-0 h-60 w-60 bg-neon-primary/5 blur-[120px]" />
            <div className="absolute bottom-0 left-4 h-48 w-48 bg-rose-400/5 blur-[120px]" />
          </div>
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.35em] relative z-10">
            <span className="text-gray-500 dark:text-white/45">Baseline {baseline}%</span>
            <span className="text-neon-primary/80">{baselineWindowSize}-day window</span>
          </div>
          <div className="relative mt-8 h-[200px] w-full flex-1 min-h-[200px]">
            {/* Baseline Line - z-30 to sit on top of bars */}
            <div className="absolute inset-x-0 z-30 pointer-events-none" style={{ bottom: `${baseline}%` }}>
              <div className="h-px w-full border-t border-dashed border-gray-400 dark:border-white/50 relative">
                <span className="absolute right-0 -top-5 text-[10px] uppercase tracking-[0.4em] text-gray-800 dark:text-white/80 bg-white/50 dark:bg-black/50 px-1 backdrop-blur-sm rounded">Baseline</span>
              </div>
            </div>

            {/* Bars */}
            <div className="absolute inset-0 flex items-end z-10">
              {processedData.length ? (
                <div
                  className="grid gap-3 w-full h-full items-end pb-10"
                  style={{ gridTemplateColumns: barGridTemplate }}
                >
                  {processedData.map((point) => {
                    // Enforce minimum height of 5% for visibility
                    const height = `${Math.max(point.recovery, 5)}%`

                    const gradient = point.aboveBaseline
                      ? 'from-emerald-400 to-emerald-600/80'
                      : 'from-rose-400 to-rose-600/80'

                    const glow = point.aboveBaseline
                      ? 'shadow-[0_0_20px_rgba(52,211,153,0.3)]'
                      : 'shadow-[0_0_20px_rgba(251,113,133,0.3)]'

                    const isHovered = hoveredBarId === point.id

                    if (reduceAnimations || isMobile) {
                      return (
                        <div
                          key={point.id}
                          className="flex flex-col items-center gap-2 relative group"
                          style={{ height, opacity: 1 }}
                          onTouchStart={() => setHoveredBarId(point.id)}
                          onTouchEnd={() => setHoveredBarId(null)}
                          onMouseEnter={() => !isMobile && setHoveredBarId(point.id)}
                          onMouseLeave={() => !isMobile && setHoveredBarId(null)}
                        >
                          <div
                            className={`w-full max-w-[40px] rounded-t-sm bg-gradient-to-b ${gradient} ${glow} transition-transform duration-150`}
                            style={{ 
                              height: '100%', 
                              filter: isHovered ? 'brightness(1.15)' : 'brightness(1)',
                              transform: 'translateZ(0)',
                              willChange: 'transform, filter',
                              backfaceVisibility: 'hidden'
                            }}
                          />
                          <span className={`text-[10px] tracking-widest ${isHovered ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-white/40'} -rotate-45 origin-top-left translate-y-6 whitespace-nowrap`}>
                            {point.date}
                          </span>
                          {isHovered && (
                            <div className="absolute -top-20 left-1/2 -translate-x-1/2 z-20">
                              <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white/90 dark:bg-black/90 px-4 py-3 text-center shadow-2xl">
                                <p className="text-[11px] uppercase tracking-[0.35em] text-gray-500 dark:text-white/45">{point.date}</p>
                                <p className={`text-2xl font-semibold ${point.aboveBaseline ? 'text-neon-primary' : 'text-rose-400'}`}>
                                  {point.recovery}%
                                </p>
                                <p className="text-[11px] text-gray-500 dark:text-white/50">
                                  {point.delta > 0 ? '+' : ''}{point.delta.toFixed(0)}% vs baseline
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    }
                    
                    return (
                      <motion.div
                        key={point.id}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height, opacity: 1 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="flex flex-col items-center gap-2 relative group"
                        style={{ height }}
                        onMouseEnter={() => setHoveredBarId(point.id)}
                        onMouseLeave={() => setHoveredBarId(null)}
                      >
                        <motion.div
                          className={`w-full max-w-[40px] rounded-t-sm bg-gradient-to-b ${gradient} ${glow}`}
                          style={{ 
                            height: '100%',
                            transform: 'translateZ(0)',
                            willChange: 'filter',
                            backfaceVisibility: 'hidden'
                          }}
                          animate={{
                            filter: isHovered ? 'brightness(1.15)' : 'brightness(1)',
                          }}
                          transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                        />
                        <span className={`text-[10px] tracking-widest ${isHovered ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-white/40'} -rotate-45 origin-top-left translate-y-6 whitespace-nowrap`}>
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
                              <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white/90 dark:bg-black/90 px-4 py-3 text-center shadow-2xl">
                                <p className="text-[11px] uppercase tracking-[0.35em] text-gray-500 dark:text-white/45">{point.date}</p>
                                <p className={`text-2xl font-semibold ${point.aboveBaseline ? 'text-neon-primary' : 'text-rose-400'}`}>
                                  {point.recovery}%
                                </p>
                                <p className="text-[11px] text-gray-500 dark:text-white/50">
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
                <div className="flex items-center justify-center h-full text-sm text-gray-500 dark:text-white/50">
                  Not enough recovery data yet.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 h-full">
          <div className="rounded-[32px] border border-gray-200 dark:border-white/10 bg-gray-100/70 dark:bg-[rgba(5,5,5,0.7)] p-6 backdrop-blur-xl flex-1 flex flex-col justify-center">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.35em] text-gray-400 dark:text-white/40">
              <span>Current baseline</span>
              <span>{baselineWindowSize}-day avg</span>
            </div>
            <div className="flex items-end justify-between mt-6">
              <p className="text-5xl font-semibold tracking-tight text-gray-900 dark:text-white">{baseline}%</p>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-[0.35em] text-gray-400 dark:text-white/40">Variability</p>
                <p className="text-lg font-medium text-gray-900 dark:text-white">{variability}% span</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-500 dark:text-white/55">
              A fixed seven-day view smooths noise but still reacts when your recovery trend shifts.
            </p>
          </div>

          {latest && (
            <div className="relative overflow-hidden rounded-[32px] border border-gray-200 dark:border-white/10 bg-gray-100/80 dark:bg-[rgba(5,5,5,0.8)] p-6 backdrop-blur-xl flex-1 flex flex-col justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-neon-primary/20 via-transparent to-transparent opacity-70" />
              <div className="relative flex items-center justify-between gap-6">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.35em] text-gray-400 dark:text-white/40">Latest day</p>
                  <p className={`text-4xl font-semibold mt-4 ${latest.aboveBaseline ? 'text-neon-primary' : 'text-rose-400'}`}>
                    {latest.recovery}%
                  </p>
                  <p className="text-xs text-gray-500 dark:text-white/55 mt-2">Snaps to the same baseline logic.</p>
                </div>
                <div className="flex flex-col items-end text-sm font-medium whitespace-nowrap">
                  {latest.aboveBaseline ? (
                    <>
                      <span className="inline-flex items-center gap-1 text-neon-primary">
                        <MoveUpRight className="w-4 h-4" /> Above baseline
                      </span>
                      <span className="text-gray-500 dark:text-white/45 text-xs mt-1">+{Math.abs(latest.delta)}% vs avg</span>
                    </>
                  ) : (
                    <>
                      <span className="inline-flex items-center gap-1 text-rose-300/90">
                        <MoveDownLeft className="w-4 h-4" /> Below baseline
                      </span>
                      <span className="text-gray-500 dark:text-white/45 text-xs mt-1">-{Math.abs(latest.delta)}% vs avg</span>
                    </>
                  )}
                </div>
              </div>
              <p className="relative mt-4 text-sm text-gray-600 dark:text-white/60">
                Rebuild the trend by stacking sleep, hydration, and breathwork habits.
              </p>
            </div>
          )}
        </div>
      </div>
    </NeonCard>
  )
}

export default memo(RecoveryBaselinePanel)
