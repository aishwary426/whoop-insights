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
import { getMetricLabel, getMetricColor, getMetricUnit, calculateHistogram } from '../../lib/analytics-utils'
import { useTheme } from 'next-themes'

interface DistributionHistogramProps {
    data: any[]
    metrics: string[] // Previously selected metrics (for backward compatibility)
    availableMetrics?: string[] // All available metrics to choose from
}

export default function DistributionHistogram({ data, metrics, availableMetrics }: DistributionHistogramProps) {
    const { theme } = useTheme()
    const isDark = theme === 'dark'

    // Use availableMetrics if provided, otherwise fall back to metrics prop
    const allMetrics = availableMetrics || metrics

    // Default to first metric or 'recovery'
    const [selectedMetric, setSelectedMetric] = useState(allMetrics[0] || 'recovery')

    // Update if props change
    useMemo(() => {
        if (!allMetrics.includes(selectedMetric) && allMetrics.length > 0) {
            setSelectedMetric(allMetrics[0])
        }
    }, [allMetrics, selectedMetric])

    const histogramData = useMemo(() => {
        const bins = calculateHistogram(data, selectedMetric, 12) // 12 bins
        // Format labels to show midpoint for cleaner display
        return bins.map(bin => ({
            ...bin,
            midpoint: ((bin.binStart + bin.binEnd) / 2).toFixed(1),
            shortLabel: `${bin.binStart.toFixed(1)}-${bin.binEnd.toFixed(1)}`
        }))
    }, [data, selectedMetric])

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const d = payload[0].payload
            const unit = getMetricUnit(selectedMetric)
            return (
                <div className="bg-white/95 dark:bg-black/90 border border-gray-200 dark:border-white/10 rounded-lg p-3 shadow-xl backdrop-blur-md text-xs">
                    <p className="font-medium text-gray-900 dark:text-white mb-2">
                        {getMetricLabel(selectedMetric)} Range
                    </p>
                    <p className="text-gray-600 dark:text-white/60 mb-1">
                        <span className="font-mono text-gray-900 dark:text-white">{d.binStart.toFixed(1)}{unit ? ' ' + unit : ''}</span> to <span className="font-mono text-gray-900 dark:text-white">{d.binEnd.toFixed(1)}{unit ? ' ' + unit : ''}</span>
                    </p>
                    <p className="text-gray-600 dark:text-white/60">
                        Frequency: <span className="font-mono font-semibold text-gray-900 dark:text-white">{d.count}</span> {d.count === 1 ? 'day' : 'days'}
                    </p>
                </div>
            )
        }
        return null
    }

    return (
        <NeonCard className="px-4 pt-3 pb-4 h-[450px] border-gray-200 dark:border-white/10 flex flex-col">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Distribution Analysis</h3>

                    {/* Metric Selector */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-700 dark:text-white/80">Metric:</span>
                        <select
                            value={selectedMetric}
                            onChange={(e) => setSelectedMetric(e.target.value)}
                            className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-neon-primary"
                        >
                            {allMetrics.map(m => (
                                <option key={m} value={m}>{getMetricLabel(m)}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="flex-1 w-full min-h-0 flex items-center justify-center -mx-7">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={histogramData}
                        margin={{ top: 0, right: 5, bottom: 15, left: 33 }}
                        barCategoryGap="5%"
                        barGap={2}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} vertical={false} />
                        <XAxis
                            dataKey="midpoint"
                            tick={{ fill: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', fontSize: 10 }}
                            tickLine={false}
                            axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                            interval={0}
                            angle={-45}
                            textAnchor="end"
                            height={40}
                            label={{
                                value: getMetricLabel(selectedMetric) + ' Range',
                                position: 'insideBottom',
                                offset: -5,
                                fill: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                                fontSize: 10
                            }}
                        />
                        <YAxis
                            tick={{ fill: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', fontSize: 10 }}
                            tickLine={false}
                            axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                            width={30}
                            label={{
                                value: 'Frequency (Days)',
                                angle: -90,
                                position: 'insideLeft',
                                offset: 10,
                                fill: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                                fontSize: 10,
                                style: { textAnchor: 'middle' }
                            }}
                        />
                        <Tooltip cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} content={<CustomTooltip />} />
                        <Bar
                            dataKey="count"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={60}
                        >
                            {histogramData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getMetricColor(selectedMetric)} fillOpacity={0.8} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <p className="text-sm text-gray-700 dark:text-white/80 mt-3 leading-relaxed">
                Shows your typical range. Taller bars mean that value occurs more often. Useful for spotting consistency or outliers.
            </p>
        </NeonCard>
    )
}
