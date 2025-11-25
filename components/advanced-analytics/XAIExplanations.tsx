'use client'

import { useState, useEffect } from 'react'
import NeonCard from '../ui/NeonCard'
import { useTheme } from 'next-themes'
import { Brain, TrendingUp, TrendingDown, Loader2, Info, BarChart3, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { api } from '../../lib/api'

interface XAIExplanationsProps {
    factorKey: string
    factorName: string
}

export default function XAIExplanations({ factorKey, factorName }: XAIExplanationsProps) {
    const { theme } = useTheme()
    const isDark = theme === 'dark'
    const [activeTab, setActiveTab] = useState<'shap' | 'lime' | 'interactions'>('shap')
    const [loading, setLoading] = useState(true)
    const [shapData, setShapData] = useState<any>(null)
    const [limeData, setLimeData] = useState<any>(null)
    const [interactionsData, setInteractionsData] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        loadSHAP()
    }, [factorKey])

    const loadSHAP = async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await api.getXAIExplanations(factorKey, 'shap')
            if (data.error) {
                setError(data.error)
            } else {
                setShapData(data)
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load SHAP explanations')
        } finally {
            setLoading(false)
        }
    }

    const loadLIME = async () => {
        if (limeData) return // Already loaded
        try {
            const data = await api.getXAIExplanations(factorKey, 'lime')
            if (!data.error) {
                setLimeData(data)
            }
        } catch (err: any) {
            console.error('Failed to load LIME:', err)
        }
    }

    const loadInteractions = async () => {
        if (interactionsData) return // Already loaded
        try {
            const data = await api.getXAIExplanations(factorKey, 'interactions')
            if (!data.error) {
                setInteractionsData(data)
            }
        } catch (err: any) {
            console.error('Failed to load interactions:', err)
        }
    }

    const handleTabChange = (tab: 'shap' | 'lime' | 'interactions') => {
        setActiveTab(tab)
        if (tab === 'lime') loadLIME()
        if (tab === 'interactions') loadInteractions()
    }

    if (loading && !shapData) {
        return (
            <NeonCard className="p-6 border-gray-200 dark:border-white/10">
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-green-600 dark:text-green-400" />
                    <span className="ml-3 text-sm text-gray-600 dark:text-white/60">Analyzing factor importance...</span>
                </div>
            </NeonCard>
        )
    }

    if (error && !shapData) {
        return (
            <NeonCard className="p-6 border-gray-200 dark:border-white/10">
                <div className="text-center py-8">
                    <p className="text-sm text-gray-500 dark:text-white/50">{error}</p>
                </div>
            </NeonCard>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
        >
            <NeonCard className="p-6 md:p-8 border-gray-200 dark:border-white/10 bg-gradient-to-br from-blue-50/50 dark:from-[#0A0A0A]/80 to-transparent backdrop-blur-sm">
                <div className="flex items-start justify-between mb-8">
                    <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-green-500/20 dark:from-blue-500/30 dark:to-green-500/30 flex items-center justify-center border border-blue-500/20 dark:border-green-500/30">
                                <Brain className="w-5 h-5 text-blue-600 dark:text-green-400" />
                            </div>
                            Why This Matters
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-white/70 leading-relaxed ml-[52px]">
                            Learn why {factorName} affects your recovery and what you can do about it
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-8 border-b border-gray-200 dark:border-white/10 relative">
                    <button
                        onClick={() => handleTabChange('shap')}
                        className={`relative px-6 py-3 text-sm font-semibold transition-all duration-300 ${activeTab === 'shap'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white/70'
                            }`}
                    >
                        What Matters Most
                        {activeTab === 'shap' && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                    </button>
                    <button
                        onClick={() => handleTabChange('lime')}
                        className={`relative px-6 py-3 text-sm font-semibold transition-all duration-300 ${activeTab === 'lime'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white/70'
                            }`}
                    >
                        Your Specific Case
                        {activeTab === 'lime' && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                    </button>
                    <button
                        onClick={() => handleTabChange('interactions')}
                        className={`relative px-6 py-3 text-sm font-semibold transition-all duration-300 ${activeTab === 'interactions'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white/70'
                            }`}
                    >
                        How Factors Work Together
                        {activeTab === 'interactions' && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                    </button>
                </div>

                {/* SHAP Content */}
                {activeTab === 'shap' && shapData && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        <div className="p-5 rounded-xl bg-gradient-to-br from-white/60 to-white/40 dark:from-white/10 dark:to-white/5 border border-gray-200/50 dark:border-white/10 backdrop-blur-sm">
                            <p className="text-sm text-gray-700 dark:text-white/80 leading-relaxed">
                                {shapData.explanation || `${factorName} has an impact on your recovery. Here's how it compares to other factors.`}
                            </p>
                        </div>

                        <div>
                            <h4 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-green-600 dark:text-green-400" />
                                What Affects Your Recovery Most
                            </h4>
                            <div className="space-y-3">
                                {shapData.sorted_importance?.slice(0, 5).map(([name, importance]: [string, number], idx: number) => {
                                    const cleanName = name.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
                                    const isFactor = name.includes(factorKey)
                                    const maxImportance = shapData.sorted_importance[0][1]
                                    const percentage = (importance / maxImportance) * 100

                                    return (
                                        <motion.div
                                            key={name}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className={`flex items-center gap-4 p-3 rounded-lg border transition-all ${isFactor
                                                ? 'bg-green-50/50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30'
                                                : 'bg-white/50 dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                                                }`}
                                        >
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 ${isFactor
                                                ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 dark:from-green-500/30 dark:to-emerald-500/30 border-green-400/50 dark:border-green-400/50'
                                                : 'bg-gradient-to-br from-gray-200 to-gray-100 dark:from-white/10 dark:to-white/5 border-gray-300 dark:border-white/20'
                                                }`}>
                                                <span className={`text-sm font-bold ${isFactor ? 'text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-white/70'
                                                    }`}>
                                                    #{idx + 1}
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className={`text-sm font-semibold ${isFactor ? 'text-green-700 dark:text-green-400' : 'text-gray-800 dark:text-white/90'}`}>
                                                        {cleanName}
                                                        {isFactor && <span className="ml-2 text-xs font-normal text-green-600 dark:text-green-500">(This Factor)</span>}
                                                    </span>
                                                    <span className={`text-xs font-mono ${isFactor ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-white/60'}`}>
                                                        {importance.toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="w-full h-2.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${percentage}%` }}
                                                        transition={{ duration: 0.5, delay: idx * 0.1 }}
                                                        className={`h-full rounded-full ${isFactor
                                                            ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                                                            : 'bg-gradient-to-r from-gray-400 to-gray-500 dark:from-white/30 dark:to-white/40'
                                                            }`}
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        </div>

                        {shapData.factor_rank && (
                            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50/80 to-blue-100/50 dark:from-blue-500/15 dark:to-blue-500/5 border border-blue-200/60 dark:border-blue-500/30">
                                <p className="text-sm text-blue-700 dark:text-blue-400 flex items-center gap-2">
                                    <Info className="w-4 h-4 flex-shrink-0" />
                                    <span>{factorName} is the #{shapData.factor_rank} most important factor affecting your recovery.</span>
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* LIME Content */}
                {activeTab === 'lime' && (
                    <div>
                        {loading && !limeData ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-6 h-6 animate-spin text-green-600 dark:text-green-400" />
                                <span className="ml-3 text-sm text-gray-600 dark:text-white/60">Generating explanation...</span>
                            </div>
                        ) : limeData ? (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                <div className="p-5 rounded-xl bg-gradient-to-br from-white/60 to-white/40 dark:from-white/10 dark:to-white/5 border border-gray-200/50 dark:border-white/10 backdrop-blur-sm min-h-[120px]">
                                    <p className="text-sm text-gray-700 dark:text-white/80 leading-relaxed">
                                        {limeData.explanation_text || `Here's how ${factorName} specifically impacts your recovery based on your personal data patterns.`}
                                    </p>
                                </div>

                                {(!limeData.top_positive_features?.length && !limeData.top_negative_features?.length) ? (
                                    <div className="p-8 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-center">
                                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-500/20 mb-4">
                                            <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <h4 className="text-base font-bold text-gray-900 dark:text-white mb-2">Stable Recovery Pattern</h4>
                                        <p className="text-sm text-gray-600 dark:text-white/60 max-w-md mx-auto">
                                            Your recovery in this instance appears balanced, with no single factor exerting a strong positive or negative pull. This suggests a stable baseline.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.2 }}
                                            className="p-5 rounded-xl bg-gradient-to-br from-green-500/90 to-emerald-600/90 dark:from-green-600/20 dark:to-emerald-700/20 border-2 border-green-400/50 dark:border-green-500/40 hover:border-green-500 dark:hover:border-green-400 transition-all duration-300 cursor-pointer group"
                                        >
                                            <h4 className="text-xs font-bold text-green-50 dark:text-green-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                                                <TrendingUp className="w-4 h-4" />
                                                What Helps Your Recovery
                                            </h4>
                                            <div className="space-y-3">
                                                {limeData.top_positive_features?.slice(0, 3).map(([name, value]: [string, number]) => (
                                                    <div key={name} className="flex items-center justify-between p-2 rounded-lg bg-white/10 dark:bg-white/5 group-hover:bg-white/20 transition-colors">
                                                        <span className="text-xs font-medium text-green-50 dark:text-green-300">
                                                            {name.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                                        </span>
                                                        <span className="text-xs font-bold text-green-100 dark:text-green-400">
                                                            +{value.toFixed(1)} pts
                                                        </span>
                                                    </div>
                                                ))}
                                                {(!limeData.top_positive_features || limeData.top_positive_features.length === 0) && (
                                                    <div className="flex flex-col items-center justify-center py-4 text-green-100/60 dark:text-green-400/60">
                                                        <span className="text-xs italic">No strong positive factors</span>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>

                                        <motion.div
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className="p-5 rounded-xl bg-gradient-to-br from-red-500/90 to-rose-600/90 dark:from-red-600/20 dark:to-rose-700/20 border-2 border-red-400/50 dark:border-red-500/40 hover:border-red-500 dark:hover:border-red-400 transition-all duration-300 cursor-pointer group"
                                        >
                                            <h4 className="text-xs font-bold text-red-50 dark:text-red-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                                                <TrendingDown className="w-4 h-4" />
                                                What Hurts Your Recovery
                                            </h4>
                                            <div className="space-y-3">
                                                {limeData.top_negative_features?.slice(0, 3).map(([name, value]: [string, number]) => (
                                                    <div key={name} className="flex items-center justify-between p-2 rounded-lg bg-white/10 dark:bg-white/5 group-hover:bg-white/20 transition-colors">
                                                        <span className="text-xs font-medium text-red-50 dark:text-red-300">
                                                            {name.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                                        </span>
                                                        <span className="text-xs font-bold text-red-100 dark:text-red-400">
                                                            {value.toFixed(1)} pts
                                                        </span>
                                                    </div>
                                                ))}
                                                {(!limeData.top_negative_features || limeData.top_negative_features.length === 0) && (
                                                    <div className="flex flex-col items-center justify-center py-4 text-red-100/60 dark:text-red-400/60">
                                                        <span className="text-xs italic">No strong negative factors</span>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    </div>
                                )}

                                {limeData.factor_contribution && (
                                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50/80 to-blue-100/50 dark:from-blue-500/15 dark:to-blue-500/5 border border-blue-200/60 dark:border-blue-500/30">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                                                {factorName} contribution:
                                            </span>
                                            <span className={`text-base font-mono font-bold ${limeData.factor_contribution < 0
                                                ? 'text-red-600 dark:text-red-400'
                                                : 'text-green-600 dark:text-green-400'
                                                }`}>
                                                {limeData.factor_contribution > 0 ? '+' : ''}{limeData.factor_contribution.toFixed(1)} points
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 mb-4">
                                    <Info className="w-6 h-6 text-gray-400 dark:text-white/40" />
                                </div>
                                <p className="text-sm text-gray-500 dark:text-white/50">Could not generate explanation for your specific case</p>
                                <p className="text-xs text-gray-400 dark:text-white/40 mt-1">Try refreshing or selecting a different factor</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Interactions Content */}
                {activeTab === 'interactions' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        {loading && !interactionsData ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-6 h-6 animate-spin text-green-600 dark:text-green-400" />
                                <span className="ml-3 text-sm text-gray-600 dark:text-white/60">Analyzing interactions...</span>
                            </div>
                        ) : interactionsData?.top_interactions ? (
                            <div className="space-y-6">
                                <div className="p-5 rounded-xl bg-gradient-to-br from-white/60 to-white/40 dark:from-white/10 dark:to-white/5 border border-gray-200/50 dark:border-white/10 backdrop-blur-sm">
                                    <p className="text-sm text-gray-700 dark:text-white/80 leading-relaxed flex items-start gap-3">
                                        <Sparkles className="w-5 h-5 text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                        <span>
                                            These factors work together with <span className="font-bold text-green-600 dark:text-green-400">{factorName}</span> to change your recovery.
                                            Complex interactions can amplify or dampen individual effects.
                                        </span>
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    {interactionsData.top_interactions.slice(0, 5).map(([feature, data]: [string, any], idx: number) => {
                                        const cleanName = feature.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
                                        const interactionEffect = data.interaction_effect
                                        const isPositive = interactionEffect > 0

                                        return (
                                            <motion.div
                                                key={feature}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.1 }}
                                                className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 transition-all duration-300"
                                            >
                                                {/* Gradient Background Glow */}
                                                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-r ${isPositive ? 'from-green-500 to-emerald-500' : 'from-red-500 to-pink-500'
                                                    }`} />

                                                <div className="relative p-5">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isPositive
                                                                ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'
                                                                : 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                                                                }`}>
                                                                {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                                            </div>
                                                            <div>
                                                                <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                                    {cleanName}
                                                                    <span className="text-gray-400 dark:text-white/40 text-xs font-normal">+ {factorName}</span>
                                                                </h4>
                                                                <div className="text-xs text-gray-500 dark:text-white/50">Combined Effect</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className={`text-2xl font-bold tracking-tight ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                                                } drop-shadow-sm`}>
                                                                {isPositive ? '+' : ''}{interactionEffect.toFixed(1)}%
                                                            </div>
                                                            <div className="text-xs font-medium text-gray-500 dark:text-white/40 uppercase tracking-wider">Synergy</div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100 dark:border-white/5">
                                                        <div className="space-y-1">
                                                            <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-white/40 font-semibold truncate" title={`Impact of only ${factorName}`}>
                                                                Only {factorName}
                                                            </div>
                                                            <div className="text-sm font-mono font-medium text-gray-700 dark:text-white/80">
                                                                {data.recovery_with_factor_only.toFixed(1)}%
                                                            </div>
                                                            <div className="h-1 w-full bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                                                                <div className="h-full bg-blue-500/50 rounded-full" style={{ width: `${Math.min(100, Math.abs(data.recovery_with_factor_only))}%` }} />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-white/40 font-semibold truncate" title={`Impact of only ${cleanName}`}>
                                                                Only {cleanName}
                                                            </div>
                                                            <div className="text-sm font-mono font-medium text-gray-700 dark:text-white/80">
                                                                {data.recovery_without_factor.toFixed(1)}%
                                                            </div>
                                                            <div className="h-1 w-full bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                                                                <div className="h-full bg-gray-400/50 rounded-full" style={{ width: `${Math.min(100, Math.abs(data.recovery_without_factor))}%` }} />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-white/40 font-semibold truncate">
                                                                Combined Impact
                                                            </div>
                                                            <div className="text-sm font-mono font-bold text-gray-900 dark:text-white">
                                                                {data.recovery_with_both_high.toFixed(1)}%
                                                            </div>
                                                            <div className="h-1 w-full bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                                                                <div className={`h-full rounded-full ${isPositive ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, Math.abs(data.recovery_with_both_high))}%` }} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 mb-4">
                                    <Info className="w-6 h-6 text-gray-400 dark:text-white/40" />
                                </div>
                                <p className="text-sm text-gray-500 dark:text-white/50">Could not analyze factor interactions</p>
                                <p className="text-xs text-gray-400 dark:text-white/40 mt-1">Try selecting a different factor</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </NeonCard>
        </motion.div>
    )
}




