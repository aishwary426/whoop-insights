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
    Legend,
    ReferenceLine
} from 'recharts'
import NeonCard from '../ui/NeonCard'
import { useTheme } from 'next-themes'
import { TrendingDown, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'

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
    const [selectedInsight, setSelectedInsight] = useState<number | null>(null)

    // Prepare bar chart data
    const barChartData = useMemo(() => {
        return insights.map((insight, idx) => {
            const d = insight.data
            const ciWithMargin = (d.ci_with[1] - d.ci_with[0]) / 2
            const ciWithoutMargin = (d.ci_without[1] - d.ci_without[0]) / 2
            
            return {
                factor: insight.title,
                'With Factor': d.avg_with,
                'Without Factor': d.avg_without,
                ciWithLower: d.ci_with[0],
                ciWithUpper: d.ci_with[1],
                ciWithoutLower: d.ci_without[0],
                ciWithoutUpper: d.ci_without[1],
                impact: d.impact_val,
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
                <div className="bg-white/95 dark:bg-black/90 border border-gray-200 dark:border-white/10 rounded-lg p-3 shadow-xl backdrop-blur-md text-xs">
                    <p className="font-medium text-gray-900 dark:text-white mb-2">{data.factor}</p>
                    {payload.map((entry: any, idx: number) => {
                        const data = entry.payload
                        const isWith = entry.dataKey === 'With Factor'
                        const ci = isWith ? [data.ciWithLower, data.ciWithUpper] : [data.ciWithoutLower, data.ciWithoutUpper]
                        return (
                            <p key={idx} className="text-gray-600 dark:text-white/60 mb-1">
                                <span style={{ color: entry.color }}>●</span> {entry.name}:{' '}
                                <span className="font-mono text-gray-900 dark:text-white">{entry.value.toFixed(1)}%</span>
                                <span className="text-xs text-gray-500 dark:text-white/40 ml-2">
                                    (95% CI: {ci[0].toFixed(1)}-{ci[1].toFixed(1)}%)
                                </span>
                            </p>
                        )
                    })}
                    {data.isSignificant && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-2 pt-2 border-t border-gray-200 dark:border-white/10">
                            ✓ Statistically significant (p &lt; 0.05)
                        </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-white/40 mt-1">
                        Based on {data.instanceCount} instance{data.instanceCount !== 1 ? 's' : ''}
                    </p>
                </div>
            )
        }
        return null
    }


    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {insights.map((insight, idx) => {
                    const d = insight.data
                    const isPositive = d.impact_val > 0
                    const ImpactIcon = isPositive ? TrendingUp : TrendingDown
                    
                    return (
                        <NeonCard
                            key={idx}
                            className={`p-5 cursor-pointer transition-all duration-300 ${
                                selectedInsight === idx 
                                    ? 'ring-2 ring-blue-500 dark:ring-neon-primary' 
                                    : 'hover:shadow-lg'
                            }`}
                            onClick={() => setSelectedInsight(selectedInsight === idx ? null : idx)}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                                    {insight.title}
                                </h3>
                                {d.is_significant ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0" />
                                ) : (
                                    <AlertCircle className="w-4 h-4 text-yellow-500 dark:text-yellow-400 flex-shrink-0" />
                                )}
                            </div>
                            
                            <div className="flex items-baseline gap-2 mb-2">
                                <ImpactIcon 
                                    className={`w-5 h-5 flex-shrink-0 ${
                                        isPositive 
                                            ? 'text-green-500 dark:text-green-400' 
                                            : 'text-red-500 dark:text-red-400'
                                    }`}
                                />
                                <span className={`text-2xl font-bold ${
                                    isPositive 
                                        ? 'text-green-600 dark:text-green-400' 
                                        : 'text-red-600 dark:text-red-400'
                                }`}>
                                    {isPositive ? '+' : ''}{d.impact_percent.toFixed(1)}%
                                </span>
                            </div>
                            
                            <p className="text-xs text-gray-600 dark:text-white/60 mb-3">
                                {insight.description}
                            </p>
                            
                            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200 dark:border-white/10">
                                <div>
                                    <div className="text-xs text-gray-500 dark:text-white/40 uppercase tracking-wider mb-1">
                                        With
                                    </div>
                                    <div className="text-sm font-mono text-gray-900 dark:text-white">
                                        {d.avg_with.toFixed(1)}%
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-white/40">
                                        CI: {d.ci_with[0].toFixed(1)}-{d.ci_with[1].toFixed(1)}%
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 dark:text-white/40 uppercase tracking-wider mb-1">
                                        Without
                                    </div>
                                    <div className="text-sm font-mono text-gray-900 dark:text-white">
                                        {d.avg_without.toFixed(1)}%
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-white/40">
                                        CI: {d.ci_without[0].toFixed(1)}-{d.ci_without[1].toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-white/10">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500 dark:text-white/40">
                                        {d.instance_count} instance{d.instance_count !== 1 ? 's' : ''}
                                    </span>
                                    <span className={`font-mono ${
                                        d.is_significant 
                                            ? 'text-green-600 dark:text-green-400' 
                                            : 'text-yellow-600 dark:text-yellow-400'
                                    }`}>
                                        p = {d.p_value.toFixed(3)}
                                    </span>
                                </div>
                            </div>
                        </NeonCard>
                    )
                })}
            </div>

            {/* Bar Chart with Confidence Intervals */}
            {barChartData.length > 0 && (
                <NeonCard className="px-4 pt-3 pb-4 h-[500px] border-gray-200 dark:border-white/10 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            Recovery Impact Comparison
                        </h3>
                        <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-3 h-3 text-green-500 dark:text-green-400" />
                                <span className="text-gray-600 dark:text-white/60">Statistically Significant</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-3 h-3 text-yellow-500 dark:text-yellow-400" />
                                <span className="text-gray-600 dark:text-white/60">Not Significant</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 w-full min-h-0 -mx-7">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={barChartData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                            >
                                <CartesianGrid 
                                    strokeDasharray="3 3" 
                                    stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} 
                                />
                                <XAxis
                                    dataKey="factor"
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                    tick={{ fill: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: 11 }}
                                    tickLine={{ stroke: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                                />
                                <YAxis
                                    label={{ 
                                        value: 'Recovery Score (%)', 
                                        angle: -90, 
                                        position: 'insideLeft',
                                        fill: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                                        fontSize: 11
                                    }}
                                    domain={[0, 100]}
                                    tick={{ fill: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: 10 }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend 
                                    wrapperStyle={{ paddingTop: '20px' }}
                                    iconType="square"
                                />
                                <Bar 
                                    dataKey="With Factor" 
                                    fill="#3b82f6" 
                                    name="With Factor"
                                    radius={[4, 4, 0, 0]}
                                >
                                    {barChartData.map((entry, index) => (
                                        <Cell 
                                            key={`cell-with-${index}`} 
                                            fill={entry.isSignificant ? "#3b82f6" : "#9ca3af"}
                                        />
                                    ))}
                                </Bar>
                                <Bar 
                                    dataKey="Without Factor" 
                                    fill="#ef4444" 
                                    name="Without Factor"
                                    radius={[4, 4, 0, 0]}
                                >
                                    {barChartData.map((entry, index) => (
                                        <Cell 
                                            key={`cell-without-${index}`} 
                                            fill={entry.isSignificant ? "#ef4444" : "#9ca3af"}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <p className="text-sm text-gray-700 dark:text-white/80 mt-3 leading-relaxed">
                        <strong className="font-bold text-gray-900 dark:text-white">Note:</strong> 95% confidence intervals are shown in the tooltip and detail cards. 
                        Bright colored bars indicate statistically significant results (p &lt; 0.05). 
                        Click on a card above to see detailed statistical distribution.
                    </p>
                </NeonCard>
            )}

            {/* Detailed Distribution for Selected Insight */}
            {selectedInsight !== null && scatterData.length > 0 && (
                <NeonCard className="px-4 pt-3 pb-4 border-gray-200 dark:border-white/10">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        Recovery Distribution: {insights[selectedInsight].title}
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-white/80 mb-3">
                                Statistical Summary
                            </h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-white/60">Impact:</span>
                                    <span className={`font-mono font-semibold ${
                                        insights[selectedInsight].data.impact_val > 0 
                                            ? 'text-green-600 dark:text-green-400' 
                                            : 'text-red-600 dark:text-red-400'
                                    }`}>
                                        {insights[selectedInsight].data.impact_val > 0 ? '+' : ''}
                                        {insights[selectedInsight].data.impact_percent.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-white/60">P-value:</span>
                                    <span className={`font-mono ${
                                        insights[selectedInsight].data.is_significant 
                                            ? 'text-green-600 dark:text-green-400' 
                                            : 'text-yellow-600 dark:text-yellow-400'
                                    }`}>
                                        {insights[selectedInsight].data.p_value.toFixed(4)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-white/60">T-statistic:</span>
                                    <span className="font-mono text-gray-900 dark:text-white">
                                        {insights[selectedInsight].data.t_statistic.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-white/60">Instances:</span>
                                    <span className="font-mono text-gray-900 dark:text-white">
                                        {insights[selectedInsight].data.instance_count}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-white/60">Control days:</span>
                                    <span className="font-mono text-gray-900 dark:text-white">
                                        {insights[selectedInsight].data.total_days}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-white/80 mb-3">
                                Recovery Scores
                            </h4>
                            <div className="space-y-3">
                                <div>
                                    <div className="text-xs text-gray-500 dark:text-white/40 mb-1">
                                        With Factor ({insights[selectedInsight].data.with_recovery_scores.length} days)
                                    </div>
                                    <div className="text-sm font-mono text-gray-900 dark:text-white">
                                        Mean: {insights[selectedInsight].data.avg_with.toFixed(1)}% 
                                        (95% CI: {insights[selectedInsight].data.ci_with[0].toFixed(1)}-{insights[selectedInsight].data.ci_with[1].toFixed(1)}%)
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 dark:text-white/40 mb-1">
                                        Without Factor ({insights[selectedInsight].data.without_recovery_scores.length} days)
                                    </div>
                                    <div className="text-sm font-mono text-gray-900 dark:text-white">
                                        Mean: {insights[selectedInsight].data.avg_without.toFixed(1)}% 
                                        (95% CI: {insights[selectedInsight].data.ci_without[0].toFixed(1)}-{insights[selectedInsight].data.ci_without[1].toFixed(1)}%)
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </NeonCard>
            )}
        </div>
    )
}

