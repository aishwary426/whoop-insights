'use client'

import { useMemo, useState } from 'react'
import {
    ResponsiveContainer,
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    ZAxis,
    CartesianGrid,
    Tooltip,
    Cell
} from 'recharts'
import NeonCard from '../ui/NeonCard'
import { getMetricLabel, getMetricColor, calculateCorrelation } from '../../lib/analytics-utils'
import { useTheme } from 'next-themes'

interface CorrelationScatterPlotProps {
    data: any[]
    metrics: string[] // Previously selected metrics (for backward compatibility)
    availableMetrics?: string[] // All available metrics to choose from
}

export default function CorrelationScatterPlot({ data, metrics, availableMetrics }: CorrelationScatterPlotProps) {
    const { theme } = useTheme()
    const isDark = theme === 'dark'

    // Use availableMetrics if provided, otherwise fall back to metrics prop
    const allMetrics = availableMetrics || metrics

    const [metricX, setMetricX] = useState(allMetrics[0] || 'strain')
    const [metricY, setMetricY] = useState(allMetrics[1] || 'recovery')

    // Update local state if available metrics change and current selection is invalid
    useMemo(() => {
        if (!allMetrics.includes(metricX)) setMetricX(allMetrics[0] || 'strain')
        if (!allMetrics.includes(metricY)) setMetricY(allMetrics[1] || 'recovery')
    }, [allMetrics, metricX, metricY])

    const correlation = useMemo(() =>
        calculateCorrelation(data, metricX, metricY),
        [data, metricX, metricY]
    )

    const scatterData = useMemo(() =>
        data.map(d => ({
            x: Number(d[metricX]) || 0,
            y: Number(d[metricY]) || 0,
            date: d.date,
            z: 1 // uniform size for now
        })).filter(d => d.x > 0 && d.y > 0),
        [data, metricX, metricY]
    )

    // Calculate domain with padding to ensure all data points are visible
    const xDomain = useMemo(() => {
        if (scatterData.length === 0) return [0, 100]
        const values = scatterData.map(d => d.x).filter(v => !isNaN(v) && isFinite(v))
        if (values.length === 0) return [0, 100]
        const min = Math.min(...values)
        const max = Math.max(...values)
        const padding = (max - min) * 0.1 || max * 0.1 || 1
        return [Math.max(0, min - padding), max + padding]
    }, [scatterData])

    const yDomain = useMemo(() => {
        if (scatterData.length === 0) return [0, 100]
        const values = scatterData.map(d => d.y).filter(v => !isNaN(v) && isFinite(v))
        if (values.length === 0) return [0, 100]
        const min = Math.min(...values)
        const max = Math.max(...values)
        const padding = (max - min) * 0.1 || max * 0.1 || 1
        return [Math.max(0, min - padding), max + padding]
    }, [scatterData])

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const d = payload[0].payload
            return (
                <div className="bg-white/95 dark:bg-black/90 border border-gray-200 dark:border-white/10 rounded-lg p-3 shadow-xl backdrop-blur-md text-xs">
                    <p className="font-medium text-gray-900 dark:text-white mb-1">{new Date(d.date).toLocaleDateString()}</p>
                    <p className="text-gray-600 dark:text-white/60">
                        {getMetricLabel(metricX)}: <span className="font-mono text-gray-900 dark:text-white">{d.x.toFixed(1)}</span>
                    </p>
                    <p className="text-gray-600 dark:text-white/60">
                        {getMetricLabel(metricY)}: <span className="font-mono text-gray-900 dark:text-white">{d.y.toFixed(1)}</span>
                    </p>
                </div>
            )
        }
        return null
    }

    return (
        <NeonCard className="px-4 pt-3 pb-4 h-[450px] border-gray-200 dark:border-white/10 flex flex-col">
            {/* Title and Correlation Row */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Correlation Analysis</h3>
                <div className="text-right ml-4 flex-shrink-0">
                    <p className="text-sm font-semibold uppercase tracking-wider text-gray-700 dark:text-white/80 mb-1">Correlation</p>
                    <p className={`text-3xl font-bold leading-tight ${Math.abs(correlation) > 0.5 ? 'text-blue-600 dark:text-neon-primary' : 'text-gray-600 dark:text-white/70'}`}>
                        {correlation.toFixed(2)}
                    </p>
                </div>
            </div>

            {/* Metric Selectors */}
            <div className="flex flex-wrap items-start gap-4 mb-4">
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-700 dark:text-white/80 whitespace-nowrap w-[60px]">X-Axis:</span>
                        <select
                            value={metricX}
                            onChange={(e) => {
                                const newMetric = e.target.value
                                if (newMetric !== metricY) {
                                    setMetricX(newMetric)
                                }
                            }}
                            className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-neon-primary min-w-[140px]"
                        >
                            {allMetrics.map(metric => (
                                <option key={metric} value={metric} disabled={metric === metricY}>
                                    {getMetricLabel(metric)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <span className="text-xs text-gray-600 dark:text-white/60 italic pl-[68px]">
                        Independent variable (influencer)
                    </span>
                </div>
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-700 dark:text-white/80 whitespace-nowrap w-[60px]">Y-Axis:</span>
                        <select
                            value={metricY}
                            onChange={(e) => {
                                const newMetric = e.target.value
                                if (newMetric !== metricX) {
                                    setMetricY(newMetric)
                                }
                            }}
                            className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-neon-primary min-w-[140px]"
                        >
                            {allMetrics.map(metric => (
                                <option key={metric} value={metric} disabled={metric === metricX}>
                                    {getMetricLabel(metric)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <span className="text-xs text-gray-600 dark:text-white/60 italic pl-[68px]">
                        Dependent variable (outcome)
                    </span>
                </div>
            </div>

            <div className="flex-1 w-full min-h-0 -mx-7">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 0, right: 5, bottom: 15, left: 33 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                        <XAxis
                            type="number"
                            dataKey="x"
                            name={getMetricLabel(metricX)}
                            domain={xDomain}
                            tick={{ fill: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: 10 }}
                            tickLine={{ stroke: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                            axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}
                            label={{
                                value: getMetricLabel(metricX),
                                position: 'bottom',
                                offset: 5,
                                fill: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                                fontSize: 11,
                                fontWeight: 500
                            }}
                        />
                        <YAxis
                            type="number"
                            dataKey="y"
                            name={getMetricLabel(metricY)}
                            domain={yDomain}
                            tick={{ fill: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: 10 }}
                            tickLine={{ stroke: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                            axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}
                            label={{
                                value: getMetricLabel(metricY),
                                angle: -90,
                                position: 'left',
                                offset: 5,
                                fill: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                                fontSize: 11,
                                fontWeight: 500,
                                style: { textAnchor: 'middle' }
                            }}
                        />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                        <Scatter name="Correlation" data={scatterData} fill={getMetricColor(metricX)}>
                            {scatterData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getMetricColor(metricX)} fillOpacity={0.6} />
                            ))}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
            </div>

            <p className="text-sm text-gray-700 dark:text-white/80 mt-3 leading-relaxed">
                <strong className="font-bold text-gray-900 dark:text-white">Tip:</strong> Put the metric you think <em>influences</em> the other on X-axis, and the one you're trying to <em>understand</em> on Y-axis. Correlation measures relationship strength: <span className="text-blue-600 dark:text-neon-primary font-semibold">+1.0</span> = rise together, <span className="text-red-400 font-semibold">-1.0</span> = opposite movement.
            </p>
        </NeonCard>
    )
}
