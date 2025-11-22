'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import NeonCard from '../ui/NeonCard'
import { Clock } from 'lucide-react'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  return isMobile
}

interface PerformanceSectionProps {
    strainData: any[]
    sleepData: any[]
}

const WINDOW_OPTIONS = [7, 14, 21, 28]

import { useTheme } from 'next-themes'

export default function PerformanceSection({ strainData, sleepData }: PerformanceSectionProps) {
    const [view, setView] = useState<'strain' | 'sleep' | 'compare'>('strain')
    const [timeWindow, setTimeWindow] = useState(7)
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const { theme } = useTheme()
    const isMobile = useIsMobile()

    // Filter data based on timeWindow, excluding today (T-1)
    const filteredStrain = useMemo(() => strainData.slice(-timeWindow - 1, -1), [strainData, timeWindow])
    const filteredSleep = useMemo(() => sleepData.slice(-timeWindow - 1, -1), [sleepData, timeWindow])

    // Combine for compare view
    const chartData = useMemo(() => {
        if (view === 'compare') {
            return filteredStrain.map((d, i) => ({
                ...d,
                strain: d.value,
                sleep: filteredSleep[i]?.value,
                index: i
            }))
        }
        const data = view === 'strain' ? filteredStrain : filteredSleep
        return data.map((d, i) => ({ ...d, index: i }))
    }, [view, filteredStrain, filteredSleep])

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/90 dark:bg-black/90 backdrop-blur-md border border-gray-200 dark:border-white/10 p-4 rounded-xl shadow-2xl">
                    <p className="text-gray-600 dark:text-white/60 text-xs mb-2 font-inter">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.stroke || entry.fill }} />
                            <span className="text-gray-900 dark:text-white font-bold text-lg font-inter">
                                {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
                            </span>
                            <span className="text-gray-400 dark:text-white/40 text-xs uppercase font-inter">{entry.name}</span>
                        </div>
                    ))}
                </div>
            )
        }
        return null
    }

    const dotFill = theme === 'dark' ? '#0A0A0A' : '#ffffff'
    const tickColor = theme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'
    const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
    const cursorColor = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'

    const renderDot = (props: any, color: string) => {
        const { cx, cy, payload } = props
        const isHovered = hoveredIndex === payload.index
        return (
            <circle
                cx={cx}
                cy={cy}
                r={isHovered ? 6 : 4}
                fill={isMobile ? 'transparent' : dotFill}
                stroke={color}
                strokeWidth={isHovered ? 3 : 2}
                className="transition-all duration-200"
                style={{ filter: isHovered ? `drop-shadow(0 0 8px ${color})` : 'none' }}
            />
        )
    }

    return (
        <section className="relative min-h-screen flex flex-col justify-center py-12 md:py-20 overflow-hidden">
            <div className="container mx-auto px-4 md:px-6 relative z-10">
                {/* Header */}
                <div className="text-center mb-8 md:mb-12 space-y-3 md:space-y-4">
                    <motion.h2
                        initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                        whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="text-3xl md:text-4xl lg:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-blue-600 to-gray-500 dark:from-white dark:via-blue-100 dark:to-white/50 font-inter"
                    >
                        Performance
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.6 }}
                        className="text-base md:text-xl text-blue-600/60 dark:text-blue-200/60 max-w-2xl mx-auto font-light tracking-wide font-inter px-4"
                    >
                        Balancing <span className="text-cyan-600 dark:text-cyan-400 font-medium">Strain</span> and <span className="text-purple-600 dark:text-purple-400 font-medium">Sleep</span> is key to long-term progress.
                    </motion.p>
                </div>

                {/* Controls Row */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 md:mb-8 max-w-5xl mx-auto w-full gap-4 md:gap-6 px-4">
                    {/* View Switcher */}
                    <div className="flex bg-gray-100 dark:bg-white/5 backdrop-blur-md rounded-full p-0.5 md:p-1 border border-gray-200 dark:border-white/10 w-full md:w-auto">
                        {['strain', 'compare', 'sleep'].map((v) => (
                            <button
                                key={v}
                                onClick={() => setView(v as any)}
                                className={`flex-1 md:flex-none px-4 md:px-6 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all duration-300 font-inter ${view === v
                                    ? 'bg-white text-black shadow-lg scale-105'
                                    : 'text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/5'
                                    }`}
                            >
                                {v.charAt(0).toUpperCase() + v.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Time Slider */}
                    <div className="flex items-center gap-2 md:gap-4 bg-gray-100 dark:bg-white/5 backdrop-blur-md rounded-full px-4 md:px-6 py-2 md:py-3 border border-gray-200 dark:border-white/10 w-full md:w-auto">
                        <div className="flex items-center gap-1.5 md:gap-2">
                            <Clock className="w-3.5 md:w-4 h-3.5 md:h-4 text-gray-400 dark:text-white/40" />
                            <span className="text-[10px] md:text-xs uppercase tracking-wider text-gray-400 dark:text-white/40 font-inter">Timeline</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="3"
                            step="1"
                            value={WINDOW_OPTIONS.indexOf(timeWindow)}
                            onChange={(e) => setTimeWindow(WINDOW_OPTIONS[parseInt(e.target.value)])}
                            className="flex-1 md:w-32 h-1 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer relative z-20 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 md:[&::-webkit-slider-thumb]:w-4 md:[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-neon-primary [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(0,255,143,0.5)]"
                        />
                        <span className="text-base md:text-lg font-semibold text-neon-primary w-[3ch] text-center font-inter">{timeWindow}d</span>
                    </div>
                </div>

                {/* Graph Card */}
                <div className="relative h-[400px] md:h-[500px] w-full max-w-5xl mx-auto px-4">
                    <NeonCard className="w-full h-full bg-white/40 dark:bg-black/40 border-gray-200 dark:border-white/10 backdrop-blur-xl overflow-hidden relative group">
                        {/* Subtle Glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="absolute inset-0 p-4 md:p-6 lg:p-10 flex flex-col">
                            <div className="flex flex-col md:flex-row justify-between items-start mb-4 md:mb-6 gap-2">
                                <div>
                                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1 font-inter">
                                        {view === 'strain' && 'Strain Load'}
                                        {view === 'sleep' && 'Sleep Performance'}
                                        {view === 'compare' && 'Strain vs Sleep'}
                                    </h3>
                                    <p className="text-gray-400 dark:text-white/40 text-xs md:text-sm uppercase tracking-wider font-inter">Last {timeWindow} Days</p>
                                </div>
                                {/* Legend */}
                                <div className="flex gap-4">
                                    {(view === 'strain' || view === 'compare') && (
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                                            <span className="text-xs text-gray-600 dark:text-white/60 font-inter">Strain</span>
                                        </div>
                                    )}
                                    {(view === 'sleep' || view === 'compare') && (
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                                            <span className="text-xs text-gray-600 dark:text-white/60 font-inter">Sleep</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 w-full min-h-0">
                                <motion.div
                                    key={`${view}-${timeWindow}`} // Re-trigger animation on view/time change
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    className="w-full h-full"
                                >
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart
                                            data={chartData}
                                            margin={{ top: 10, right: 25, bottom: 45, left: 5 }}
                                            onMouseMove={(e: any) => {
                                                if (e && e.activeTooltipIndex !== undefined) {
                                                    setHoveredIndex(e.activeTooltipIndex)
                                                }
                                            }}
                                            onMouseLeave={() => setHoveredIndex(null)}
                                        >
                                            <defs>
                                                <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
                                                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} />
                                                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                                            <XAxis
                                                dataKey="date"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: tickColor, fontSize: isMobile ? 8 : 10, fontFamily: 'Inter, sans-serif' }}
                                                dy={isMobile ? 5 : 10}
                                                interval={isMobile ? Math.ceil(chartData.length / 3) : (timeWindow > 14 ? 2 : 0)}
                                                height={isMobile ? 50 : 55}
                                                tickMargin={isMobile ? 4 : 8}
                                                padding={{ left: 5, right: 15 }}
                                                angle={isMobile ? -45 : 0}
                                                textAnchor={isMobile ? 'end' : 'middle'}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: tickColor, fontSize: 12, fontFamily: 'Inter, sans-serif' }}
                                            />
                                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: cursorColor, strokeWidth: 2 }} />

                                            {(view === 'strain' || view === 'compare') && (
                                                <Area
                                                    type="monotone"
                                                    dataKey={view === 'compare' ? 'strain' : 'value'}
                                                    name="Strain"
                                                    stroke="#22d3ee"
                                                    strokeWidth={3}
                                                    fill="url(#cyanGradient)"
                                                    animationDuration={0} // Disable internal animation for fade-in effect
                                                    dot={(props) => renderDot(props, '#22d3ee')}
                                                    activeDot={{ r: 6, fill: isMobile ? 'transparent' : dotFill, stroke: '#22d3ee', strokeWidth: 3 }}
                                                />
                                            )}

                                            {(view === 'sleep' || view === 'compare') && (
                                                <Area
                                                    type="monotone"
                                                    dataKey={view === 'compare' ? 'sleep' : 'value'}
                                                    name="Sleep"
                                                    stroke="#a855f7"
                                                    strokeWidth={3}
                                                    fill="url(#purpleGradient)"
                                                    animationDuration={0} // Disable internal animation for fade-in effect
                                                    dot={(props) => renderDot(props, '#a855f7')}
                                                    activeDot={{ r: 6, fill: isMobile ? 'transparent' : dotFill, stroke: '#a855f7', strokeWidth: 3 }}
                                                />
                                            )}
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </motion.div>
                            </div>
                        </div>
                    </NeonCard>
                </div>
            </div>
        </section>
    )
}
