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
            // Filter out null/undefined/NaN values and calculate average only from valid data points
            const currentValidValues = currentPeriodData
                .map(d => Number(d[metric]))
                .filter(val => !isNaN(val) && val !== null && val !== undefined)
            
            const previousValidValues = previousPeriodData
                .map(d => Number(d[metric]))
                .filter(val => !isNaN(val) && val !== null && val !== undefined)
            
            const currentAvg = currentValidValues.length > 0
                ? currentValidValues.reduce((sum, val) => sum + val, 0) / currentValidValues.length
                : 0
            
            const previousAvg = previousValidValues.length > 0
                ? previousValidValues.reduce((sum, val) => sum + val, 0) / previousValidValues.length
                : 0

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
                <NeonCard key={stat.metric} className="p-5 border-gray-200 dark:border-white/10">
                    <p className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-white/80 mb-3">
                        {getMetricLabel(stat.metric)}
                    </p>

                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                                {stat.currentAvg.toFixed(1)}
                                <span className="text-base font-semibold text-gray-600 dark:text-white/70 ml-1">
                                    {getMetricUnit(stat.metric)}
                                </span>
                            </p>
                            <p className="text-sm text-gray-600 dark:text-white/70 font-medium">
                                vs {stat.previousAvg.toFixed(1)} {periodLabel}
                            </p>
                        </div>

                        <div className={`flex items-center gap-1 text-base font-bold ${stat.percentChange > 0 ? 'text-emerald-500' : stat.percentChange < 0 ? 'text-rose-500' : 'text-gray-600 dark:text-gray-400'
                            }`}>
                            {stat.percentChange > 0 ? (
                                <ArrowUp className="w-5 h-5" />
                            ) : stat.percentChange < 0 ? (
                                <ArrowDown className="w-5 h-5" />
                            ) : (
                                <Minus className="w-5 h-5" />
                            )}
                            {Math.abs(stat.percentChange).toFixed(1)}%
                        </div>
                    </div>
                </NeonCard>
            ))}
        </div>
    )
}
