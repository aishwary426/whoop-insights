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
    Cell
} from 'recharts'
import NeonCard from '../ui/NeonCard'
import { getMetricLabel, getMetricColor, calculateHistogram } from '../../lib/analytics-utils'
import { useTheme } from 'next-themes'

interface DistributionHistogramProps {
    data: any[]
    metrics: string[]
}

export default function DistributionHistogram({ data, metrics }: DistributionHistogramProps) {
    const { theme } = useTheme()
    const isDark = theme === 'dark'

    // Default to first metric or 'recovery'
    const [selectedMetric, setSelectedMetric] = useState(metrics[0] || 'recovery')

    // Update if props change
    useMemo(() => {
        if (!metrics.includes(selectedMetric) && metrics.length > 0) {
            setSelectedMetric(metrics[0])
        }
    }, [metrics, selectedMetric])

    const histogramData = useMemo(() =>
        calculateHistogram(data, selectedMetric, 12), // 12 bins
        [data, selectedMetric]
    )

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const d = payload[0].payload
            return (
                <div className="bg-white/95 dark:bg-black/90 border border-gray-200 dark:border-white/10 rounded-lg p-3 shadow-xl backdrop-blur-md text-xs">
                    <p className="font-medium text-gray-900 dark:text-white mb-1">Range: {d.label}</p>
                    <p className="text-gray-600 dark:text-white/60">
                        Count: <span className="font-mono text-gray-900 dark:text-white">{d.count}</span> days
                    </p>
                </div>
            )
        }
        return null
    }

    return (
        <NeonCard className="p-6 h-[400px] border-gray-200 dark:border-white/10 flex flex-col">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Distribution Analysis</h3>
                    <p className="text-sm text-gray-500 dark:text-white/50">
                        Frequency of {getMetricLabel(selectedMetric)} values
                    </p>
                    <p className="text-xs text-gray-400 dark:text-white/40 mt-2 max-w-[250px] leading-relaxed">
                        Shows your typical range. Taller bars mean that value occurs more often. Useful for spotting consistency or outliers.
                    </p>
                </div>

                {metrics.length > 1 && (
                    <select
                        value={selectedMetric}
                        onChange={(e) => setSelectedMetric(e.target.value)}
                        className="bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-md text-xs px-2 py-1 text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-neon-primary"
                    >
                        {metrics.map(m => (
                            <option key={m} value={m}>{getMetricLabel(m)}</option>
                        ))}
                    </select>
                )}
            </div>

            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={histogramData} margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} vertical={false} />
                        <XAxis
                            dataKey="label"
                            tick={{ fill: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                            interval={2} // Skip some labels if crowded
                            angle={-45}
                            textAnchor="end"
                        />
                        <YAxis
                            tick={{ fill: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} content={<CustomTooltip />} />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                            {histogramData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getMetricColor(selectedMetric)} fillOpacity={0.8} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </NeonCard>
    )
}
