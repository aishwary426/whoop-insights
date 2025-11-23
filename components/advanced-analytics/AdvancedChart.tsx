'use client'

import { useMemo } from 'react'
import {
    ResponsiveContainer,
    ComposedChart,
    Line,
    Bar,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts'
import NeonCard from '../ui/NeonCard'
import { getMetricLabel, getMetricColor, getMetricUnit } from '../../lib/analytics-utils'
import { useTheme } from 'next-themes'

interface AdvancedChartProps {
    data: any[]
    selectedMetrics: string[]
}

export default function AdvancedChart({ data, selectedMetrics }: AdvancedChartProps) {
    const { theme } = useTheme()
    const isDark = theme === 'dark'

    // Determine which axis to use for each metric
    // We'll group metrics by unit to share axes
    const axisGroups = useMemo(() => {
        const groups: Record<string, string[]> = {}
        selectedMetrics.forEach(metric => {
            const unit = getMetricUnit(metric)
            if (!groups[unit]) groups[unit] = []
            groups[unit].push(metric)
        })
        return groups
    }, [selectedMetrics])

    const axes = Object.keys(axisGroups)

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/95 dark:bg-black/90 border border-gray-200 dark:border-white/10 rounded-lg p-4 shadow-xl backdrop-blur-md">
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{label}</p>
                    <div className="space-y-1">
                        {payload.map((entry: any) => (
                            <div key={entry.dataKey} className="flex items-center gap-2 text-xs">
                                <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-gray-600 dark:text-white/60">
                                    {getMetricLabel(entry.dataKey)}:
                                </span>
                                <span className="font-mono font-medium" style={{ color: entry.color }}>
                                    {Number(entry.value).toFixed(1)} {getMetricUnit(entry.dataKey)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )
        }
        return null
    }

    return (
        <NeonCard className="p-6 h-[500px] border-gray-200 dark:border-white/10">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Multi-Metric Analysis</h3>
                <p className="text-base text-gray-700 dark:text-white/80 leading-relaxed">
                    Visualize relationships between different health metrics over time.
                </p>
            </div>

            <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                        <defs>
                            {selectedMetrics.map(metric => (
                                <linearGradient key={metric} id={`gradient-${metric}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={getMetricColor(metric)} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={getMetricColor(metric)} stopOpacity={0} />
                                </linearGradient>
                            ))}
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
                            vertical={false}
                        />
                        <XAxis
                            dataKey="date"
                            tick={{ fill: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)', fontSize: 12, fontWeight: 500 }}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={30}
                            tickFormatter={(value) => {
                                const date = new Date(value)
                                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            }}
                        />

                        {axes.map((unit, index) => (
                            <YAxis
                                key={unit}
                                yAxisId={unit}
                                orientation={index % 2 === 0 ? 'left' : 'right'}
                                tick={{ fill: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)', fontSize: 12, fontWeight: 500 }}
                                tickLine={false}
                                axisLine={false}
                                unit={unit}
                                width={40}
                            />
                        ))}

                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />

                        {selectedMetrics.map((metric, index) => {
                            const unit = getMetricUnit(metric)
                            const color = getMetricColor(metric)

                            // Use different chart types for variety if needed, but Line/Area is usually best for trends
                            // We'll use Area for the first metric and Line for others to reduce visual clutter
                            if (index === 0) {
                                return (
                                    <Area
                                        key={metric}
                                        yAxisId={unit}
                                        type="monotone"
                                        dataKey={metric}
                                        name={getMetricLabel(metric)}
                                        stroke={color}
                                        fill={`url(#gradient-${metric})`}
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 6 }}
                                    />
                                )
                            }

                            return (
                                <Line
                                    key={metric}
                                    yAxisId={unit}
                                    type="monotone"
                                    dataKey={metric}
                                    name={getMetricLabel(metric)}
                                    stroke={color}
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 6 }}
                                />
                            )
                        })}
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </NeonCard>
    )
}
