'use client'

import { motion } from 'framer-motion'
import NeonButton from '../ui/NeonButton'
import { getMetricLabel, getMetricColor } from '../../lib/analytics-utils'

interface AnalyticsControlsProps {
    dateRange: string
    setDateRange: (range: string) => void
    selectedMetrics: string[]
    toggleMetric: (metric: string) => void
    availableMetrics: string[]
    setMetrics: (metrics: string[]) => void
}

const RANGES = ['1W', '1M', '3M', '6M', '1Y', 'ALL']

const PRESETS = [
    { label: 'Recovery', metrics: ['recovery', 'hrv', 'resting_hr'] },
    { label: 'Strain', metrics: ['strain', 'sleep', 'calories'] },
    { label: 'Vitals', metrics: ['spo2', 'respiratory_rate', 'skin_temp'] }
]

export default function AnalyticsControls({
    dateRange,
    setDateRange,
    selectedMetrics,
    toggleMetric,
    availableMetrics,
    setMetrics
}: AnalyticsControlsProps) {
    return (
        <div className="flex flex-col gap-6 p-6 rounded-2xl bg-transparent border-none shadow-none">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Date Range Selector */}
                <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs uppercase tracking-widest text-gray-600 dark:text-white/40 mr-2">Range</span>
                    <div className="flex bg-gray-100 dark:bg-black/40 rounded-lg p-1 border border-gray-200 dark:border-white/5">
                        {RANGES.map((range) => (
                            <button
                                key={range}
                                onClick={() => setDateRange(range)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${dateRange === range
                                    ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/70'
                                    }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Presets */}
                <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-widest text-gray-600 dark:text-white/40 mr-2">Presets</span>
                    {PRESETS.map(preset => (
                        <button
                            key={preset.label}
                            onClick={() => setMetrics(preset.metrics)}
                            className="px-3 py-1.5 text-xs font-medium rounded-full border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Metric Toggles */}
            <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs uppercase tracking-widest text-gray-600 dark:text-white/40 mr-2">Metrics</span>
                {availableMetrics.map((metric) => {
                    const isSelected = selectedMetrics.includes(metric)
                    const color = getMetricColor(metric)

                    return (
                        <motion.button
                            key={metric}
                            onClick={() => toggleMetric(metric)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`
                flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200
                ${isSelected
                                    ? 'bg-opacity-10 border-opacity-50'
                                    : 'bg-white/50 dark:bg-black/50 border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/70 hover:bg-white/80 dark:hover:bg-black/70 hover:border-gray-300 dark:hover:border-white/20'}
              `}
                            style={{
                                backgroundColor: isSelected ? `${color}20` : undefined,
                                borderColor: isSelected ? color : undefined,
                                color: isSelected ? color : undefined
                            }}
                        >
                            <div
                                className={`w-2 h-2 rounded-full ${isSelected ? '' : 'bg-gray-400 dark:bg-white/20'}`}
                                style={{ backgroundColor: isSelected ? color : undefined }}
                            />
                            {getMetricLabel(metric)}
                        </motion.button>
                    )
                })}
            </div>
        </div>
    )
}
