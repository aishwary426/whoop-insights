'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import NeonCard from '../ui/NeonCard'
import { Clock } from 'lucide-react'

interface PerformanceSectionProps {
    strainData: any[]
    sleepData: any[]
}

const WINDOW_OPTIONS = [7, 14, 21, 28]

export default function PerformanceSection({ strainData, sleepData }: PerformanceSectionProps) {
    const [view, setView] = useState<'strain' | 'sleep' | 'compare'>('strain')
    const [timeWindow, setTimeWindow] = useState(7)
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

    // Filter data based on timeWindow
    const filteredStrain = useMemo(() => strainData.slice(-timeWindow), [strainData, timeWindow])
    const filteredSleep = useMemo(() => sleepData.slice(-timeWindow), [sleepData, timeWindow])

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
                <div className="bg-black/90 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-2xl">
                    <p className="text-white/60 text-xs mb-2 font-inter">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.stroke || entry.fill }} />
                            <span className="text-white font-bold text-lg font-inter">
                                {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
                            </span>
                            <span className="text-white/40 text-xs uppercase font-inter">{entry.name}</span>
                        </div>
                    ))}
                </div>
            )
        }
        return null
    }

    const renderDot = (props: any, color: string) => {
        const { cx, cy, payload } = props
        const isHovered = hoveredIndex === payload.index
        return (
            <circle
                cx={cx}
                cy={cy}
                r={isHovered ? 6 : 4}
                fill="#0A0A0A"
                stroke={color}
                strokeWidth={isHovered ? 3 : 2}
                className="transition-all duration-200"
                style={{ filter: isHovered ? `drop-shadow(0 0 8px ${color})` : 'none' }}
            />
        )
    }

    return (
        <section className="relative min-h-screen flex flex-col justify-center py-20 overflow-hidden">
            <div className="container mx-auto px-6 relative z-10">
                {/* Header */}
                <div className="text-center mb-12 space-y-4">
                    <motion.h2
                        initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                        whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-white/50 font-inter"
                    >
                        Performance
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.6 }}
                        className="text-xl text-blue-200/60 max-w-2xl mx-auto font-light tracking-wide font-inter"
                    >
                        Balancing <span className="text-cyan-400 font-medium">Strain</span> and <span className="text-purple-400 font-medium">Sleep</span> is key to long-term progress.
                    </motion.p>
                </div>

                {/* Controls Row */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 max-w-5xl mx-auto w-full gap-6">
                    {/* View Switcher */}
                    <div className="flex bg-white/5 backdrop-blur-md rounded-full p-1 border border-white/10">
                        {['strain', 'compare', 'sleep'].map((v) => (
                            <button
                                key={v}
                                onClick={() => setView(v as any)}
                                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 font-inter ${view === v
                                    ? 'bg-white text-black shadow-lg scale-105'
                                    : 'text-white/60 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {v.charAt(0).toUpperCase() + v.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Time Slider */}
                    <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md rounded-full px-6 py-3 border border-white/10">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-white/40" />
                            <span className="text-xs uppercase tracking-wider text-white/40 font-inter">Timeline</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="3"
                            step="1"
                            value={WINDOW_OPTIONS.indexOf(timeWindow)}
                            onChange={(e) => setTimeWindow(WINDOW_OPTIONS[parseInt(e.target.value)])}
                            className="w-32 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer relative z-20 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-neon-primary [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(0,255,143,0.5)]"
                        />
                        <span className="text-lg font-semibold text-neon-primary w-[3ch] text-center font-inter">{timeWindow}d</span>
                    </div>
                </div>

                {/* Graph Card */}
                <div className="relative h-[500px] w-full max-w-5xl mx-auto">
                    <NeonCard className="w-full h-full bg-black/40 border-white/10 backdrop-blur-xl overflow-hidden relative group">
                        {/* Subtle Glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="absolute inset-0 p-6 md:p-10 flex flex-col">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-1 font-inter">
                                        {view === 'strain' && 'Strain Load'}
                                        {view === 'sleep' && 'Sleep Performance'}
                                        {view === 'compare' && 'Strain vs Sleep'}
                                    </h3>
                                    <p className="text-white/40 text-sm uppercase tracking-wider font-inter">Last {timeWindow} Days</p>
                                </div>
                                {/* Legend */}
                                <div className="flex gap-4">
                                    {(view === 'strain' || view === 'compare') && (
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                                            <span className="text-xs text-white/60 font-inter">Strain</span>
                                        </div>
                                    )}
                                    {(view === 'sleep' || view === 'compare') && (
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                                            <span className="text-xs text-white/60 font-inter">Sleep</span>
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
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                            <XAxis
                                                dataKey="date"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: 'Inter, sans-serif' }}
                                                dy={10}
                                                interval={timeWindow > 14 ? 2 : 0} // Reduce ticks for longer ranges
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: 'Inter, sans-serif' }}
                                            />
                                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />

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
                                                    activeDot={{ r: 6, fill: '#0A0A0A', stroke: '#22d3ee', strokeWidth: 3 }}
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
                                                    activeDot={{ r: 6, fill: '#0A0A0A', stroke: '#a855f7', strokeWidth: 3 }}
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
