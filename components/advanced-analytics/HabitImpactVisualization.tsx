'use client'

import { useMemo, useState } from 'react'
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Cell,
    Legend
} from 'recharts'
import NeonCard from '../ui/NeonCard'
import { useTheme } from 'next-themes'
import { TrendingDown, TrendingUp, AlertCircle, CheckCircle2, Sparkles, Activity } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import RecoveryTrajectoryChart from './RecoveryTrajectoryChart'
import XAIExplanations from './XAIExplanations'
import ScrollReveal from '../ui/ScrollReveal'

interface HabitImpactData {
    factor: string
    impact_val: number
    impact_percent: number
    avg_with: number
    avg_without: number
    instance_count: number
    total_days: number
    p_value: number
    t_statistic: number
    is_significant: boolean
    ci_with: [number, number]
    ci_without: [number, number]
    with_recovery_scores: number[]
    without_recovery_scores: number[]
    with_dates: string[]
    without_dates: string[]
    factor_key?: string
}

interface HabitImpactVisualizationProps {
    insights: Array<{
        title: string
        description: string
        confidence: number
        data: HabitImpactData
    }>
}

export default function HabitImpactVisualization({ insights }: HabitImpactVisualizationProps) {
    const { theme } = useTheme()
    const isDark = theme === 'dark'
    // Auto-select first insight by default to show ML features
    const [selectedInsight, setSelectedInsight] = useState<number | null>(insights.length > 0 ? 0 : null)

    // Prepare bar chart data
    const barChartData = useMemo(() => {
        return insights.map((insight, idx) => {
            const d = insight.data
            return {
                factor: insight.title,
                'With Factor': d.avg_with,
                'Without Factor': d.avg_without,
                ciWithLower: d.ci_with[0],
                ciWithUpper: d.ci_with[1],
                ciWithoutLower: d.ci_without[0],
                ciWithoutUpper: d.ci_without[1],
                impact: d.impact_val,
                isNegativeFactor: d.impact_val < 0,
                isSignificant: d.is_significant,
                instanceCount: d.instance_count,
                pValue: d.p_value,
                index: idx
            }
        })
    }, [insights])

    // Prepare scatter plot data for selected insight
    const scatterData = useMemo(() => {
        if (selectedInsight === null || !insights[selectedInsight]) return []

        const insight = insights[selectedInsight]
        const d = insight.data

        const withPoints = d.with_recovery_scores.map((score, i) => ({
            date: d.with_dates[i],
            recovery: score,
            group: 'With Factor',
            x: 1
        }))

        const withoutPoints = d.without_recovery_scores.map((score, i) => ({
            date: d.without_dates[i],
            recovery: score,
            group: 'Without Factor',
            x: 0
        }))

        return [...withPoints, ...withoutPoints]
    }, [selectedInsight, insights])

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload
            return (
                <div className="bg-white/90 dark:bg-[#0A0A0A]/90 border border-gray-200 dark:border-white/10 rounded-xl p-4 shadow-2xl backdrop-blur-xl text-xs min-w-[200px]">
                    <p className="font-bold text-gray-900 dark:text-white mb-3 text-sm border-b border-gray-100 dark:border-white/10 pb-2">
                        {data.factor}
                    </p>
                    {payload.map((entry: any, idx: number) => {
                        const data = entry.payload
                        const isWith = entry.dataKey === 'With Factor'
                        const ci = isWith ? [data.ciWithLower, data.ciWithUpper] : [data.ciWithoutLower, data.ciWithoutUpper]
                        return (
                            <div key={idx} className="mb-3 last:mb-0">
                                <div className="flex items-center justify-between gap-4 mb-1">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.2)]"
                                            style={{ backgroundColor: entry.color, boxShadow: `0 0 8px ${entry.color}` }}
                                        />
                                        <span className="font-medium text-gray-700 dark:text-white/80">{entry.name}</span>
                                    </div>
                                    <span className="font-mono font-bold text-gray-900 dark:text-white text-sm">{entry.value.toFixed(1)}%</span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-white/40 pl-4">
                                    <span>Typical Range</span>
                                    <span className="font-mono">{ci[0].toFixed(1)}% - {ci[1].toFixed(1)}%</span>
                                </div>
                            </div>
                        )
                    })}
                    {data.isSignificant && (
                        <div className="mt-3 pt-2 border-t border-gray-100 dark:border-white/10 flex items-center gap-2">
                            <Sparkles className="w-3 h-3 text-purple-500" />
                            <p className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 px-2 py-0.5 rounded-full">
                                Statistically Significant
                            </p>
                        </div>
                    )}
                    <p className="text-[10px] text-gray-400 dark:text-white/30 mt-2 text-right">
                        {data.instanceCount} days observed
                    </p>
                </div>
            )
        }
        return null
    }


    // Modern Neon Colors
    const colors = {
        positive: isDark ? '#00FF94' : '#10B981', // Bright Neon Green
        negative: isDark ? '#FF2E5B' : '#EF4444', // Bright Neon Red
        neutral: isDark ? '#A855F7' : '#8B5CF6',  // Purple
        grid: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        text: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
        barBg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
    }

    return (
        <div className="space-y-8">
            {/* Info Banner */}
            <ScrollReveal>
                <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Activity className="w-24 h-24 text-blue-500" />
                    </div>
                    <div className="relative z-10 flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">AI-Powered Insights</h3>
                            <p className="text-sm text-gray-600 dark:text-white/70 max-w-2xl">
                                Select any factor below to see how it impacts your recovery. Our models analyze your data to find significant patterns and predict outcomes.
                            </p>
                        </div>
                    </div>
                </div>
            </ScrollReveal>

            {/* Summary Cards */}
            <ScrollReveal delay={0.1}>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {insights.map((insight, idx) => {
                            const d = insight.data
                            const isPositive = d.impact_val > 0
                            const ImpactIcon = isPositive ? TrendingUp : TrendingDown
                            const isSelected = selectedInsight === idx

                            // Dynamic gradients based on impact
                            const cardGradient = isSelected
                                ? isPositive
                                    ? 'from-green-500/20 via-emerald-500/10 to-transparent'
                                    : 'from-red-500/20 via-rose-500/10 to-transparent'
                                : 'from-gray-500/5 to-transparent'

                            const borderColor = isSelected
                                ? isPositive ? 'border-green-500/50' : 'border-red-500/50'
                                : 'border-gray-200 dark:border-white/10'

                            return (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => setSelectedInsight(isSelected ? null : idx)}
                                    className="group"
                                >
                                    <div className={`
                                        relative h-full p-6 rounded-2xl cursor-pointer transition-all duration-300
                                        bg-white dark:bg-[#0A0A0A] border ${borderColor}
                                        hover:shadow-lg hover:-translate-y-1
                                        ${isSelected ? 'shadow-xl ring-1 ring-offset-0 ' + (isPositive ? 'ring-green-500/30' : 'ring-red-500/30') : ''}
                                    `}>
                                        {/* Background Gradient */}
                                        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${cardGradient} opacity-50`} />

                                        <div className="relative z-10">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`
                                                        w-12 h-12 rounded-xl flex items-center justify-center
                                                        ${isPositive
                                                            ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'
                                                            : 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'}
                                                    `}>
                                                        <ImpactIcon className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">
                                                            {insight.title}
                                                        </h3>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            {d.is_significant && (
                                                                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/10 px-2 py-0.5 rounded-full">
                                                                    <Sparkles className="w-3 h-3" /> Significant
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mb-6">
                                                <div className="flex items-baseline gap-2 mb-2">
                                                    <span className={`text-4xl font-bold tracking-tight ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                                        }`}>
                                                        {isPositive ? '+' : ''}{d.impact_percent.toFixed(1)}%
                                                    </span>
                                                    <span className="text-sm font-medium text-gray-500 dark:text-white/50">impact</span>
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-white/60 line-clamp-2">
                                                    {insight.description}
                                                </p>
                                            </div>

                                            {/* Mini Stats Grid */}
                                            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
                                                <div className="p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                                                    <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-white/40 font-semibold mb-1">With</div>
                                                    <div className="text-lg font-mono font-bold text-gray-900 dark:text-white">
                                                        {d.avg_with.toFixed(0)}%
                                                    </div>
                                                </div>
                                                <div className="p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                                                    <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-white/40 font-semibold mb-1">Without</div>
                                                    <div className="text-lg font-mono font-bold text-gray-900 dark:text-white">
                                                        {d.avg_without.toFixed(0)}%
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                </div>
            </ScrollReveal>

            {/* Main Bar Chart */}
            {barChartData.length > 0 && (
                <ScrollReveal delay={0.2}>
                    <NeonCard className="p-8 h-[500px] bg-gradient-to-b from-white to-gray-50 dark:from-[#0A0A0A] dark:to-[#0A0A0A]/50 border-gray-200 dark:border-white/10">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                    Recovery Impact Overview
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-white/60">
                                    Comparing average recovery scores with vs. without each factor
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
                                    <span className="text-sm text-gray-600 dark:text-white/70">Positive Impact</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"></span>
                                    <span className="text-sm text-gray-600 dark:text-white/70">Negative Impact</span>
                                </div>
                            </div>
                        </div>

                        <div className="w-full h-[380px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={barChartData}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                                    barGap={12}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                        stroke={colors.grid}
                                    />
                                    <XAxis
                                        dataKey="factor"
                                        axisLine={false}
                                        tickLine={false}
                                        dy={10}
                                        tick={{
                                            fill: isDark ? 'rgba(255,255,255,0.6)' : '#6B7280',
                                            fontSize: 12,
                                            fontWeight: 500
                                        }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        dx={-10}
                                        domain={[0, 100]}
                                        tick={{
                                            fill: isDark ? 'rgba(255,255,255,0.4)' : '#9CA3AF',
                                            fontSize: 11
                                        }}
                                    />
                                    <Tooltip
                                        content={<CustomTooltip />}
                                        cursor={{ fill: colors.barBg, radius: 8 }}
                                    />
                                    <Bar
                                        dataKey="With Factor"
                                        name="With Factor"
                                        radius={[6, 6, 6, 6]}
                                        maxBarSize={40}
                                    >
                                        {barChartData.map((entry, index) => {
                                            const color = entry.isNegativeFactor ? colors.negative : colors.positive
                                            return (
                                                <Cell
                                                    key={`cell-with-${index}`}
                                                    fill={color}
                                                    fillOpacity={entry.isSignificant ? 1 : 0.6}
                                                    stroke={color}
                                                    strokeWidth={entry.isSignificant ? 0 : 1}
                                                    style={{
                                                        filter: entry.isSignificant ? `drop-shadow(0 0 4px ${color}40)` : 'none'
                                                    }}
                                                />
                                            )
                                        })}
                                    </Bar>
                                    <Bar
                                        dataKey="Without Factor"
                                        name="Without Factor"
                                        radius={[6, 6, 6, 6]}
                                        maxBarSize={40}
                                    >
                                        {barChartData.map((entry, index) => {
                                            const color = entry.isNegativeFactor ? colors.positive : colors.negative
                                            return (
                                                <Cell
                                                    key={`cell-without-${index}`}
                                                    fill={color}
                                                    fillOpacity={entry.isSignificant ? 1 : 0.6}
                                                    stroke={color}
                                                    strokeWidth={entry.isSignificant ? 0 : 1}
                                                    style={{
                                                        filter: entry.isSignificant ? `drop-shadow(0 0 4px ${color}40)` : 'none'
                                                    }}
                                                />
                                            )
                                        })}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </NeonCard>
                </ScrollReveal>
            )}

            {/* Recovery Trajectory Prediction */}
            <AnimatePresence mode="wait">
                {selectedInsight !== null && insights[selectedInsight] && (
                    <ScrollReveal key="trajectory" delay={0.1}>
                        <RecoveryTrajectoryChart
                            factorKey={insights[selectedInsight].data.factor_key || insights[selectedInsight].data.factor || insights[selectedInsight].title.toLowerCase().replace(/\s+/g, '_')}
                            factorName={insights[selectedInsight].title}
                            currentRecovery={insights[selectedInsight].data.avg_with}
                        />
                    </ScrollReveal>
                )}
            </AnimatePresence>

            {/* XAI Explanations */}
            <AnimatePresence mode="wait">
                {selectedInsight !== null && insights[selectedInsight] && (
                    <ScrollReveal key="xai" delay={0.2}>
                        <XAIExplanations
                            factorKey={insights[selectedInsight].data.factor_key || insights[selectedInsight].data.factor || insights[selectedInsight].title.toLowerCase().replace(/\s+/g, '_')}
                            factorName={insights[selectedInsight].title}
                        />
                    </ScrollReveal>
                )}
            </AnimatePresence>

            {/* Detailed Distribution for Selected Insight */}
            <AnimatePresence mode="wait">
                {selectedInsight !== null && scatterData.length > 0 && (
                    <ScrollReveal key="distribution" delay={0.3}>
                        <NeonCard className="p-8 border-gray-200 dark:border-white/10 bg-gradient-to-br from-purple-50/50 dark:from-[#0A0A0A]/50 to-transparent">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                        Detailed Distribution: {insights[selectedInsight].title}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-white/60">
                                        See how your recovery changes when this factor is present vs. absent
                                    </p>
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="p-6 rounded-2xl bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur-sm">
                                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                        Statistical Significance
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center p-4 rounded-xl bg-gray-50 dark:bg-white/5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-700 dark:text-white/70">Impact Size</span>
                                                <span className="text-xs text-gray-500 dark:text-white/50 mt-0.5">Magnitude of effect</span>
                                            </div>
                                            <span className={`font-mono font-bold text-xl ${insights[selectedInsight].data.impact_val > 0
                                                ? 'text-green-600 dark:text-green-400'
                                                : 'text-red-600 dark:text-red-400'
                                                }`}>
                                                {insights[selectedInsight].data.impact_val > 0 ? '+' : ''}
                                                {insights[selectedInsight].data.impact_percent.toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center p-4 rounded-xl bg-gray-50 dark:bg-white/5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-700 dark:text-white/70">Reliability</span>
                                                <span className="text-xs text-gray-500 dark:text-white/50 mt-0.5">
                                                    {insights[selectedInsight].data.is_significant
                                                        ? 'Statistically significant result'
                                                        : 'More data needed for certainty'}
                                                </span>
                                            </div>
                                            <span className={`text-sm font-bold px-3 py-1 rounded-full ${insights[selectedInsight].data.is_significant
                                                ? 'text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-500/20'
                                                : 'text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-500/20'
                                                }`}>
                                                {insights[selectedInsight].data.is_significant ? 'High Confidence' : 'Low Confidence'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 rounded-2xl bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur-sm">
                                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        Data Points
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/5">
                                            <div>
                                                <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-white/50 font-semibold mb-1">Observed Days</div>
                                                <div className="text-2xl font-mono font-bold text-gray-900 dark:text-white">
                                                    {insights[selectedInsight].data.instance_count}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-white/50 font-semibold mb-1">Total Days</div>
                                                <div className="text-2xl font-mono font-bold text-gray-900 dark:text-white">
                                                    {insights[selectedInsight].data.total_days}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </NeonCard>
                    </ScrollReveal>
                )}
            </AnimatePresence>
        </div>
    )
}

