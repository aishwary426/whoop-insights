'use client'

import { useState, useEffect } from 'react'
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ReferenceLine
} from 'recharts'
import NeonCard from '../ui/NeonCard'
import { useTheme } from 'next-themes'
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { api } from '../../lib/api'

interface RecoveryTrajectoryChartProps {
    factorKey: string
    factorName: string
    currentRecovery?: number
}

export default function RecoveryTrajectoryChart({
    factorKey,
    factorName,
    currentRecovery
}: RecoveryTrajectoryChartProps) {
    const { theme } = useTheme()
    const isDark = theme === 'dark'
    const [loading, setLoading] = useState(true)
    const [trajectory, setTrajectory] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        loadTrajectory()
    }, [factorKey])

    const loadTrajectory = async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await api.getRecoveryTrajectory(factorKey)
            if (data.error) {
                setError(data.error)
            } else {
                setTrajectory(data)
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load trajectory prediction')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <NeonCard className="p-6 border-gray-200 dark:border-white/10">
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-neon-primary" />
                    <span className="ml-3 text-gray-600 dark:text-white/60">Loading trajectory prediction...</span>
                </div>
            </NeonCard>
        )
    }

    if (error) {
        return (
            <NeonCard className="p-6 border-gray-200 dark:border-white/10">
                <div className="text-center py-8">
                    <p className="text-sm text-gray-500 dark:text-white/50">{error}</p>
                    <p className="text-xs text-gray-400 dark:text-white/40 mt-2">
                        Need more data to generate trajectory predictions
                    </p>
                </div>
            </NeonCard>
        )
    }

    if (!trajectory || !trajectory.trajectory) {
        return null
    }

    // Prepare chart data
    const chartData = [
        {
            day: 'Today',
            recovery: currentRecovery || trajectory.trajectory[0],
            type: 'current'
        },
        ...trajectory.trajectory.map((value: number, idx: number) => ({
            day: `Day ${idx + 1}`,
            recovery: value,
            type: 'predicted'
        }))
    ]

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload
            return (
                <div className="bg-[#0A0A0A]/98 border border-white/20 rounded-xl p-4 shadow-2xl backdrop-blur-xl text-xs">
                    <p className="font-bold text-white mb-2">{data.day}</p>
                    <p className="text-white/80">
                        Recovery: <span className="font-mono font-bold text-white">{data.recovery.toFixed(1)}%</span>
                    </p>
                    {data.type === 'predicted' && (
                        <p className="text-white/50 mt-2 text-[10px]">
                            Model confidence: {(trajectory.confidence * 100).toFixed(0)}%
                        </p>
                    )}
                </div>
            )
        }
        return null
    }

    const avgRecovery = trajectory.trajectory.reduce((a: number, b: number) => a + b, 0) / trajectory.trajectory.length
    const isImproving = trajectory.trajectory[trajectory.trajectory.length - 1] > trajectory.trajectory[0]

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
        >
            <NeonCard className="p-6 border-gray-200 dark:border-white/10 bg-gradient-to-br from-purple-50/50 dark:from-[#0A0A0A]/50 to-transparent">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                            Recovery Trajectory Prediction
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-white/60">
                            Predicted recovery over next 3 days after {factorName}
                        </p>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                        isImproving
                            ? 'bg-green-500/10 dark:bg-green-500/20 border border-green-500/20 dark:border-green-500/30'
                            : 'bg-yellow-500/10 dark:bg-yellow-500/20 border border-yellow-500/20 dark:border-yellow-500/30'
                    }`}>
                        {isImproving ? (
                            <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                        ) : (
                            <TrendingDown className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                        )}
                        <span className={`text-xs font-semibold ${
                            isImproving
                                ? 'text-green-700 dark:text-green-400'
                                : 'text-yellow-700 dark:text-yellow-400'
                        }`}>
                            {isImproving ? 'Improving' : 'Declining'}
                        </span>
                    </div>
                </div>

                <div className="h-[300px] -mx-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}
                            />
                            <XAxis
                                dataKey="day"
                                tick={{ fill: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', fontSize: 11 }}
                                tickLine={{ stroke: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}
                            />
                            <YAxis
                                domain={[0, 100]}
                                label={{
                                    value: 'Recovery (%)',
                                    angle: -90,
                                    position: 'insideLeft',
                                    fill: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                                    fontSize: 11
                                }}
                                tick={{ fill: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', fontSize: 10 }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <ReferenceLine y={67} stroke={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'} strokeDasharray="5 5" />
                            <Line
                                type="monotone"
                                dataKey="recovery"
                                stroke={isDark ? '#00FF8F' : '#0066FF'}
                                strokeWidth={3}
                                dot={{ fill: isDark ? '#00FF8F' : '#0066FF', r: 5 }}
                                activeDot={{ r: 7 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <div className="text-xs text-gray-500 dark:text-white/50 mb-1">Day 1</div>
                            <div className="text-lg font-bold font-mono text-gray-900 dark:text-white">
                                {trajectory.trajectory[0]?.toFixed(1) || '—'}%
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-xs text-gray-500 dark:text-white/50 mb-1">Day 2</div>
                            <div className="text-lg font-bold font-mono text-gray-900 dark:text-white">
                                {trajectory.trajectory[1]?.toFixed(1) || '—'}%
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-xs text-gray-500 dark:text-white/50 mb-1">Day 3</div>
                            <div className="text-lg font-bold font-mono text-gray-900 dark:text-white">
                                {trajectory.trajectory[2]?.toFixed(1) || '—'}%
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 text-center">
                        <p className="text-xs text-gray-500 dark:text-white/50">
                            Average predicted recovery: <span className="font-mono font-semibold text-gray-900 dark:text-white">{avgRecovery.toFixed(1)}%</span>
                        </p>
                        <p className="text-xs text-gray-400 dark:text-white/40 mt-1">
                            Model: {trajectory.model_type} • Confidence: {(trajectory.confidence * 100).toFixed(0)}%
                        </p>
                    </div>
                </div>
            </NeonCard>
        </motion.div>
    )
}


















