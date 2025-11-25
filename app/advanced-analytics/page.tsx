'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '../../components/layout/AppLayout'
import AnalyticsControls from '../../components/advanced-analytics/AnalyticsControls'
import AdvancedChart from '../../components/advanced-analytics/AdvancedChart'
import CorrelationScatterPlot from '../../components/advanced-analytics/CorrelationScatterPlot'
import DistributionHistogram from '../../components/advanced-analytics/DistributionHistogram'
import ComparativeStats from '../../components/advanced-analytics/ComparativeStats'
import HabitImpactVisualization from '../../components/advanced-analytics/HabitImpactVisualization'
import { api, type TrendsResponse } from '../../lib/api'
import { getCurrentUser } from '../../lib/auth'
import { filterDataByRange } from '../../lib/analytics-utils'
import { motion } from 'framer-motion'
import ScrollReveal from '../../components/ui/ScrollReveal'

const AVAILABLE_METRICS = [
    'recovery',
    'strain',
    'sleep',
    'hrv',
    'resting_hr',
    'spo2',
    'respiratory_rate',
    'skin_temp',
    'calories'
]

export default function AdvancedAnalyticsPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [trends, setTrends] = useState<TrendsResponse | null>(null)
    const [journalInsights, setJournalInsights] = useState<any[]>([])

    // Filter State
    const [dateRange, setDateRange] = useState('1M')
    const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['recovery', 'strain'])
    const [comparisonPeriod, setComparisonPeriod] = useState<'week' | 'month' | 'year'>('week')

    useEffect(() => {
        checkUser()
    }, [])

    const checkUser = async () => {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
            router.push('/login')
        } else {
            setUser(currentUser)
            loadData()
        }
    }

    const loadData = async () => {
        try {
            const [trendsData, insightsData] = await Promise.all([
                api.getTrends(),
                api.getJournalInsights().catch(() => []) // Gracefully handle if no journal data
            ])
            setTrends(trendsData)
            setJournalInsights(insightsData)
        } catch (error) {
            console.error('Error loading analytics data:', error)
        } finally {
            setLoading(false)
        }
    }

    const toggleMetric = (metric: string) => {
        setSelectedMetrics(prev => {
            if (prev.includes(metric)) {
                // Don't allow deselecting the last metric
                if (prev.length === 1) return prev
                return prev.filter(m => m !== metric)
            } else {
                // Allow selecting any number of metrics
                return [...prev, metric]
            }
        })
    }

    // Transform and Filter Data
    const filteredData = useMemo(() => {
        if (!trends || !trends.series) return []

        // Merge all series into a single array of objects by date
        // Assuming all series have the same dates for simplicity, or we map by date key
        const dateMap: Record<string, any> = {}

        // Helper to merge series
        const mergeSeries = (key: string, data: any[]) => {
            if (!data) return
            data.forEach(point => {
                if (!dateMap[point.date]) {
                    dateMap[point.date] = { date: point.date }
                }
                dateMap[point.date][key] = point.value
            })
        }

        AVAILABLE_METRICS.forEach(metric => {
            // @ts-ignore - dynamic access to series
            mergeSeries(metric, trends.series[metric])
        })

        const mergedData = Object.values(dateMap).sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        )
        return filterDataByRange(mergedData, dateRange)
    }, [trends, dateRange])

    if (loading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="w-14 h-14 border-4 border-blue-600/15 dark:border-neon-primary/15 border-t-blue-600 dark:border-t-neon-primary rounded-full animate-spin" />
                </div>
            </AppLayout>
        )
    }

    return (
        <AppLayout user={user}>
            <div className="relative z-10 container mx-auto px-4 py-8 pt-24 space-y-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-3">Advanced Analytics</h1>
                        <p className="text-base text-gray-700 dark:text-white/80 leading-relaxed">Deep dive into your biometric trends and correlations.</p>
                    </div>
                </div>

                <AnalyticsControls
                    dateRange={dateRange}
                    setDateRange={setDateRange}
                    selectedMetrics={selectedMetrics}
                    toggleMetric={toggleMetric}
                    availableMetrics={AVAILABLE_METRICS}
                    setMetrics={setSelectedMetrics}
                />

                {filteredData.length > 0 ? (
                    <div className="space-y-8">
                        {/* Comparative Stats */}
                        <ScrollReveal>
                            <ComparativeStats
                                data={filteredData}
                                metrics={selectedMetrics}
                                period={comparisonPeriod}
                            />
                        </ScrollReveal>

                        {/* Main Chart */}
                        <ScrollReveal>
                            <AdvancedChart data={filteredData} selectedMetrics={selectedMetrics} />
                        </ScrollReveal>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Correlation */}
                            <ScrollReveal delay={0.1}>
                                <CorrelationScatterPlot
                                    data={filteredData}
                                    metrics={selectedMetrics}
                                    availableMetrics={AVAILABLE_METRICS}
                                />
                            </ScrollReveal>

                            {/* Distribution */}
                            <ScrollReveal delay={0.2}>
                                <DistributionHistogram
                                    data={filteredData}
                                    metrics={selectedMetrics}
                                    availableMetrics={AVAILABLE_METRICS}
                                />
                            </ScrollReveal>
                        </div>

                        {/* Habit Impact Analysis */}
                        {journalInsights.length > 0 && (
                            <ScrollReveal delay={0.3} className="mt-12">
                                <div className="mb-6">
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                        Habit Impact Analysis
                                    </h2>
                                    <p className="text-base text-gray-700 dark:text-white/80">
                                        Quantify how journal entries (alcohol, stress, travel) affect your recovery with statistical significance.
                                    </p>
                                </div>
                                <HabitImpactVisualization insights={journalInsights} />
                            </ScrollReveal>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-gray-500 dark:text-white/50">No data available for the selected range.</p>
                    </div>
                )}
            </div>
        </AppLayout>
    )
}
