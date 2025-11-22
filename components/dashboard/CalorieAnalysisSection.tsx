'use client'

import { motion } from 'framer-motion'
import { Trophy, Activity, Flame, TrendingUp } from 'lucide-react'
import { CalorieAnalysis } from '../../lib/api'

interface Props {
    analysis: CalorieAnalysis | null
}

export default function CalorieAnalysisSection({ analysis }: Props) {
    if (!analysis || !analysis.winner) return null

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12 max-w-4xl mx-auto"
        >
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-blue-600/10 dark:bg-neon-primary/10 border border-blue-600/20 dark:border-neon-primary/20">
                    <Trophy className="w-5 h-5 text-blue-600 dark:text-neon-primary" />
                </div>
                <h2 className="text-2xl font-bold">Efficiency Deep Dive</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Winner Card */}
                <div className="md:col-span-2 glass-card p-6 bg-gradient-to-br from-blue-600/5 dark:from-neon-primary/5 to-transparent border-blue-600/20 dark:border-neon-primary/20">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <div className="text-sm text-blue-600 dark:text-neon-primary font-semibold tracking-wider mb-1">MOST EFFICIENT</div>
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{analysis.winner.sport_type}</h3>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-blue-600 dark:text-neon-primary">{analysis.winner.avg_cal_per_min.toFixed(1)}</div>
                            <div className="text-xs text-gray-500 dark:text-white/50">cal/min</div>
                        </div>
                    </div>

                    <p className="text-gray-700 dark:text-white/80 leading-relaxed text-sm border-t border-gray-200 dark:border-white/10 pt-4 mt-2">
                        {analysis.explanation}
                    </p>

                    <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="bg-gray-100 dark:bg-black/20 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-white/50 mb-1">
                                <Activity className="w-3 h-3" /> Avg HR
                            </div>
                            <div className="text-lg font-semibold text-gray-900 dark:text-white">{analysis.winner.avg_hr.toFixed(0)} <span className="text-xs font-normal text-gray-500 dark:text-white/40">bpm</span></div>
                        </div>
                        <div className="bg-gray-100 dark:bg-black/20 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-white/50 mb-1">
                                <TrendingUp className="w-3 h-3" /> Samples
                            </div>
                            <div className="text-lg font-semibold text-gray-900 dark:text-white">{analysis.winner.sample_size} <span className="text-xs font-normal text-gray-500 dark:text-white/40">sessions</span></div>
                        </div>
                    </div>
                </div>

                {/* Leaderboard */}
                <div className="glass-card p-6">
                    <h4 className="text-sm font-semibold text-gray-500 dark:text-white/60 mb-4 uppercase tracking-wider">Efficiency Ranking</h4>
                    <div className="space-y-4">
                        {analysis.comparison.slice(0, 4).map((item, idx) => (
                            <div key={item.sport_type} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-blue-600 dark:bg-neon-primary text-white dark:text-black' : 'bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-white/60'}`}>
                                        {idx + 1}
                                    </div>
                                    <span className={idx === 0 ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-600 dark:text-white/60'}>{item.sport_type}</span>
                                </div>
                                <div className="text-sm font-mono">
                                    <span className={idx === 0 ? 'text-blue-600 dark:text-neon-primary' : 'text-gray-600 dark:text-white/40'}>{item.avg_cal_per_min.toFixed(1)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
