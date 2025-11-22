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
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Correlation Analysis</h3>
                <div className="text-right ml-4 flex-shrink-0">
                    <p className="text-xs uppercase tracking-widest text-gray-600 dark:text-white/40 mb-0.5 leading-tight">Correlation</p>
                    <p className={`text-2xl font-bold leading-tight ${Math.abs(correlation) > 0.5 ? 'text-blue-600 dark:text-neon-primary' : 'text-gray-500 dark:text-white/50'}`}>
                        {correlation.toFixed(2)}
                    </p>
                </div>
            </div>

            {/* Metric Selectors */}
            <div className="flex flex-wrap items-start gap-3 mb-3">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 dark:text-white/60 whitespace-nowrap w-[50px]">X-Axis:</span>
                        <select
                            value={metricX}
                            onChange={(e) => {
                                const newMetric = e.target.value
                                if (newMetric !== metricY) {
                                    setMetricX(newMetric)
                                }
                            }}
                            className="px-2 py-1 text-xs rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-neon-primary min-w-[120px]"
                        >
                            {allMetrics.map(metric => (
                                <option key={metric} value={metric} disabled={metric === metricY}>
                                    {getMetricLabel(metric)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <span className="text-[10px] text-gray-500 dark:text-white/50 italic pl-[58px]">
                        Independent variable (influencer)
                    </span>
                </div>
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 dark:text-white/60 whitespace-nowrap w-[50px]">Y-Axis:</span>
                        <select
                            value={metricY}
                            onChange={(e) => {
                                const newMetric = e.target.value
                                if (newMetric !== metricX) {
                                    setMetricY(newMetric)
                                }
                            }}
                            className="px-2 py-1 text-xs rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-neon-primary min-w-[120px]"
                        >
                            {allMetrics.map(metric => (
                                <option key={metric} value={metric} disabled={metric === metricX}>
                                    {getMetricLabel(metric)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <span className="text-[10px] text-gray-500 dark:text-white/50 italic pl-[58px]">
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

            <p className="text-xs text-gray-600 dark:text-white/40 mt-3 leading-relaxed">
                <strong className="text-gray-700 dark:text-white/80">Tip:</strong> Put the metric you think <em>influences</em> the other on X-axis, and the one you're trying to <em>understand</em> on Y-axis. Correlation measures relationship strength: <span className="text-blue-600 dark:text-neon-primary">+1.0</span> = rise together, <span className="text-red-400">-1.0</span> = opposite movement.
            </p>
        </NeonCard>
    )
}
