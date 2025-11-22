'use client'

import { useMemo } from 'react'
import { ArrowUp, ArrowDown, Minus } from 'lucide-react'
import NeonCard from '../ui/NeonCard'
import { getMetricLabel, getMetricUnit } from '../../lib/analytics-utils'

interface ComparativeStatsProps {
    data: any[]
    metrics: string[]
    period: 'week' | 'month' | 'year'
}

export default function ComparativeStats({ data, metrics, period }: ComparativeStatsProps) {
    // Calculate stats
    const stats = useMemo(() => {
        if (!data || data.length === 0) return []

        // Determine split point based on period
        // This is a simplified logic assuming 'data' is already filtered to the relevant range (e.g. 2 weeks for week comparison)
        // Ideally, we'd want the full dataset and slice it here.
        // For now, let's assume 'data' contains enough history.

        const midPoint = Math.floor(data.length / 2)
        const currentPeriodData = data.slice(midPoint)
        const previousPeriodData = data.slice(0, midPoint)

        return metrics.map(metric => {
            const currentAvg = currentPeriodData.reduce((sum, d) => sum + (Number(d[metric]) || 0), 0) / (currentPeriodData.length || 1)
            const previousAvg = previousPeriodData.reduce((sum, d) => sum + (Number(d[metric]) || 0), 0) / (previousPeriodData.length || 1)

            const diff = currentAvg - previousAvg
            const percentChange = previousAvg !== 0 ? (diff / previousAvg) * 100 : 0

            return {
                metric,
                currentAvg,
                previousAvg,
                diff,
                percentChange
            }
        })
    }, [data, metrics, period])

    const periodLabel = period === 'week' ? 'Last Week' : period === 'month' ? 'Last Month' : 'Last Year'

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
                <NeonCard key={stat.metric} className="p-4 border-gray-200 dark:border-white/10">
                    <p className="text-xs uppercase tracking-widest text-gray-500 dark:text-white/50 mb-2">
                        {getMetricLabel(stat.metric)}
                    </p>

                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {stat.currentAvg.toFixed(1)}
                                <span className="text-sm font-normal text-gray-500 dark:text-white/50 ml-1">
                                    {getMetricUnit(stat.metric)}
                                </span>
                            </p>
                            <p className="text-xs text-gray-500 dark:text-white/50 mt-1">
                                vs {stat.previousAvg.toFixed(1)} {periodLabel}
                            </p>
                        </div>

                        <div className={`flex items-center gap-1 text-sm font-medium ${stat.percentChange > 0 ? 'text-emerald-500' : stat.percentChange < 0 ? 'text-rose-500' : 'text-gray-400'
                            }`}>
                            {stat.percentChange > 0 ? (
                                <ArrowUp className="w-4 h-4" />
                            ) : stat.percentChange < 0 ? (
                                <ArrowDown className="w-4 h-4" />
                            ) : (
                                <Minus className="w-4 h-4" />
                            )}
                            {Math.abs(stat.percentChange).toFixed(1)}%
                        </div>
                    </div>
                </NeonCard>
            ))}
        </div>
    )
}
