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
    metrics: string[] // Expecting exactly 2 metrics for correlation
}

export default function CorrelationScatterPlot({ data, metrics }: CorrelationScatterPlotProps) {
    const { theme } = useTheme()
    const isDark = theme === 'dark'

    const [metricX, setMetricX] = useState(metrics[0] || 'strain')
    const [metricY, setMetricY] = useState(metrics[1] || 'recovery')

    // Update local state if props change and current selection is invalid
    useMemo(() => {
        if (!metrics.includes(metricX)) setMetricX(metrics[0] || 'strain')
        if (!metrics.includes(metricY)) setMetricY(metrics[1] || 'recovery')
    }, [metrics, metricX, metricY])

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
        <NeonCard className="p-6 h-[400px] border-gray-200 dark:border-white/10 flex flex-col">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Correlation Analysis</h3>
                    <p className="text-sm text-gray-500 dark:text-white/50">
                        {getMetricLabel(metricX)} vs {getMetricLabel(metricY)}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-white/40 mt-2 max-w-[250px] leading-relaxed">
                        Measures relationship strength. <span className="text-blue-600 dark:text-neon-primary">+1.0</span> means they rise together, <span className="text-red-400">-1.0</span> means one falls as the other rises.
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-xs uppercase tracking-widest text-gray-600 dark:text-white/40">Correlation</p>
                    <p className={`text-2xl font-bold ${Math.abs(correlation) > 0.5 ? 'text-blue-600 dark:text-neon-primary' : 'text-gray-500 dark:text-white/50'}`}>
                        {correlation.toFixed(2)}
                    </p>
                </div>
            </div>

            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                        <XAxis
                            type="number"
                            dataKey="x"
                            name={getMetricLabel(metricX)}
                            tick={{ fill: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                            label={{ value: getMetricLabel(metricX), position: 'bottom', offset: 0, fill: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: 10 }}
                        />
                        <YAxis
                            type="number"
                            dataKey="y"
                            name={getMetricLabel(metricY)}
                            tick={{ fill: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                            label={{ value: getMetricLabel(metricY), angle: -90, position: 'left', offset: 0, fill: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: 10 }}
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
        </NeonCard>
    )
}
