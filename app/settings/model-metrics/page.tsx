'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Brain, TrendingUp, BarChart3, Users, Zap, Activity, Clock, Heart, Flame, Target } from 'lucide-react'
import AppLayout from '../../../components/layout/AppLayout'
import NeonCard from '../../../components/ui/NeonCard'
import { getCurrentUser } from '../../../lib/auth'
import { api } from '../../../lib/api'

interface ModelMetrics {
  [key: string]: {
    model_type?: string
    r2?: number
    mae?: number
    accuracy?: number
    sample_size?: number
    feature_importance?: { [key: string]: number }
    available?: boolean
  }
}

export default function ModelMetricsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [metrics, setMetrics] = useState<ModelMetrics>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/login')
      } else {
        setUser(currentUser)
        loadMetrics()
      }
    }
    checkUser()
  }, [router])

  const loadMetrics = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getModelMetrics()
      console.log('Model metrics loaded:', data)
      setMetrics(data || {})
    } catch (err: any) {
      console.error('Error loading model metrics:', err)
      setError(err?.message || 'Failed to load model metrics')
    } finally {
      setLoading(false)
    }
  }

  const getModelIcon = (modelName: string) => {
    const icons: { [key: string]: any } = {
      calorie_gps: Target,
      recovery_velocity: Heart,
      strain_tolerance: Flame,
      workout_timing: Clock,
      sleep_optimizer: Activity,
      recovery_forecast: TrendingUp,
      burnout_risk: BarChart3,
    }
    return icons[modelName] || Brain
  }

  const getModelColor = (modelName: string) => {
    const colors: { [key: string]: string } = {
      calorie_gps: 'from-cyan-500/10 to-blue-500/10 border-cyan-500/20',
      recovery_velocity: 'from-green-500/10 to-emerald-500/10 border-green-500/20',
      strain_tolerance: 'from-red-500/10 to-rose-500/10 border-red-500/20',
      workout_timing: 'from-purple-500/10 to-indigo-500/10 border-purple-500/20',
      sleep_optimizer: 'from-blue-500/10 to-cyan-500/10 border-blue-500/20',
      recovery_forecast: 'from-amber-500/10 to-orange-500/10 border-amber-500/20',
      burnout_risk: 'from-pink-500/10 to-rose-500/10 border-pink-500/20',
    }
    return colors[modelName] || 'from-gray-500/10 to-slate-500/10 border-gray-500/20'
  }

  const formatModelName = (name: string) => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const getModelDescription = (modelName: string): string => {
    const descriptions: { [key: string]: string } = {
      calorie_gps: 'Predicts the most efficient workout type and duration to burn target calories based on your current recovery state. Optimizes for time efficiency while preventing overtraining.',
      recovery_velocity: 'Predicts how many days it will take to recover from a low recovery state to a target recovery level (67%). Helps plan training schedules and rest periods.',
      strain_tolerance: 'Learns your personal safe strain thresholds to prevent burnout. Identifies the maximum strain you can handle before recovery significantly drops.',
      workout_timing: 'Determines the optimal time of day for workouts based on your historical performance patterns. Maximizes recovery and performance outcomes.',
      sleep_optimizer: 'Predicts your optimal bedtime based on strain, recovery, and day of week. Helps optimize sleep quality and recovery.',
      recovery_forecast: 'Predicts tomorrow\'s recovery score using your current metrics (strain, sleep, HRV, etc.). Used for daily recommendations and planning.',
      burnout_risk: 'Classifies your risk of burnout based on training load, recovery patterns, and physiological markers. Helps prevent overtraining.',
    }
    return descriptions[modelName] || 'Personalized ML model trained on your WHOOP data to provide insights and predictions.'
  }

  const getModelFeatures = (modelName: string): string[] => {
    const features: { [key: string]: string[] } = {
      calorie_gps: ['Recovery Score', 'Target Calories', 'Strain Score', 'Sleep Hours', 'HRV', 'Resting HR', 'Acute/Chronic Ratio', 'Sleep Debt', 'Consistency Score'],
      recovery_velocity: ['Current Recovery', 'Strain Score', 'Sleep Hours', 'HRV', 'Acute/Chronic Ratio', 'HRV Trend'],
      strain_tolerance: ['Strain Score', 'Recovery Score', 'Sleep Hours', 'HRV', 'Acute/Chronic Ratio'],
      workout_timing: ['Recovery Score', 'Strain Score', 'Day of Week', 'Historical Performance'],
      sleep_optimizer: ['Strain Score', 'Recovery Score', 'Day of Week', 'Historical Sleep Patterns'],
      recovery_forecast: ['Strain Score', 'Sleep Hours', 'HRV', 'Acute/Chronic Ratio', 'Sleep Debt', 'Consistency Score'],
      burnout_risk: ['Strain Score', 'Recovery Score', 'Sleep Hours', 'HRV', 'Acute/Chronic Ratio', 'Training Load'],
    }
    return features[modelName] || []
  }

  const getModelUsage = (modelName: string): string => {
    const usage: { [key: string]: string } = {
      calorie_gps: 'Used in Calorie Burn Analytics page to recommend optimal workouts for burning target calories efficiently.',
      recovery_velocity: 'Shown in Personalization Insights to predict recovery timelines from low recovery states.',
      strain_tolerance: 'Displayed in Personalization Insights to show your safe strain threshold and prevent burnout.',
      workout_timing: 'Used in daily recommendations to suggest optimal workout times based on your patterns.',
      sleep_optimizer: 'Integrated into daily recommendations to suggest optimal bedtime windows.',
      recovery_forecast: 'Powers the "Tomorrow\'s Forecast" card on your dashboard with recovery predictions.',
      burnout_risk: 'Used in health scores and risk flags to identify potential overtraining and burnout.',
    }
    return usage[modelName] || 'Active model used throughout the application for personalized insights.'
  }

  const getPerformanceNote = (modelName: string, modelData: any): string => {
    if (modelData.r2 !== undefined && modelData.r2 !== null) {
      if (modelData.r2 >= 0.8) {
        return 'This model shows excellent predictive performance and can be relied upon for accurate predictions.'
      } else if (modelData.r2 >= 0.6) {
        return 'This model shows good performance. Predictions are generally reliable but may vary with unusual patterns.'
      } else if (modelData.r2 >= 0.4) {
        return 'This model shows moderate performance. Consider it as a guide rather than an absolute prediction.'
      } else {
        return 'This model is still learning your patterns. Performance will improve as more data is collected.'
      }
    }
    if (modelData.accuracy !== undefined && modelData.accuracy !== null) {
      if (modelData.accuracy >= 0.8) {
        return 'This classifier shows high accuracy in identifying patterns. Classifications are reliable.'
      } else if (modelData.accuracy >= 0.7) {
        return 'This classifier shows good accuracy. Most classifications will be correct.'
      } else {
        return 'This classifier is still learning. Accuracy will improve with more training data.'
      }
    }
    return 'Model is active and ready to use. Performance metrics will be available after more training data is collected.'
  }

  const getQualityLabel = (r2?: number) => {
    if (r2 === undefined || r2 === null) return 'N/A'
    if (r2 >= 0.8) return 'Excellent'
    if (r2 >= 0.6) return 'Good'
    if (r2 >= 0.4) return 'Fair'
    return 'Poor'
  }

  const getQualityColor = (r2?: number) => {
    if (r2 === undefined || r2 === null) return 'text-slate-800 dark:text-slate-400'
    if (r2 >= 0.8) return 'text-green-600 dark:text-green-400'
    if (r2 >= 0.6) return 'text-cyan-600 dark:text-cyan-400'
    if (r2 >= 0.4) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }

  if (loading) {
    return (
      <AppLayout user={user}>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-14 h-14 border-4 border-blue-600/15 dark:border-neon-primary/15 border-t-blue-600 dark:border-t-neon-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-800 dark:text-white/60 text-sm">Loading model metrics...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  const hasModels = Object.keys(metrics).length > 0

  return (
    <AppLayout user={user}>
      <div className="relative z-10 w-full px-6 md:px-8 pt-28 pb-16 text-gray-950 dark:text-white">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3 mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-600/30 dark:border-neon-primary/30 bg-blue-600/10 dark:bg-neon-primary/10 text-xs font-semibold text-gray-900 dark:text-white/80">
            <Brain className="w-4 h-4 text-blue-600 dark:text-neon-primary" />
            ML Model Performance
          </div>
          <h1 className="text-[clamp(2.2rem,5vw,3.2rem)] font-semibold leading-tight text-gray-950 dark:text-white">
            Trained Model Parameters
          </h1>
          <p className="text-gray-800 dark:text-white/60 max-w-2xl mx-auto text-[15px]">
            View performance metrics and parameters for all your personalized ML models
          </p>
        </motion.div>

        {error && (
          <NeonCard className="p-6 mb-8 border-red-500/30 bg-red-500/10">
            <div className="text-red-400">{error}</div>
          </NeonCard>
        )}

        {!hasModels && !loading && (
          <NeonCard className="p-12 text-center border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0A0A0A]">
            <div className="text-6xl mb-6">🤖</div>
            <h3 className="text-2xl font-bold mb-4 text-gray-950 dark:text-white">No Models Trained Yet</h3>
            <p className="text-gray-800 dark:text-white/60 mb-8 max-w-md mx-auto">
              Upload your WHOOP data to train personalized ML models. Model metrics will appear here once training is complete.
            </p>
          </NeonCard>
        )}

        {hasModels && (
          <div className="grid grid-cols-1 gap-y-4 mb-8">
            {Object.entries(metrics).map(([modelName, modelData], idx) => {
              const Icon = getModelIcon(modelName)
              const colorClass = getModelColor(modelName)

              return (
                <motion.div
                  key={modelName}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <NeonCard className={`p-6 border-gray-200 dark:border-white/10 bg-white/80 dark:bg-[#0A0A0A] bg-gradient-to-br ${colorClass}`}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-blue-600/20 dark:bg-neon-primary/20 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-blue-600 dark:text-neon-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-950 dark:text-white">
                          {formatModelName(modelName)}
                        </h3>
                        <p className="text-sm text-gray-800 dark:text-white/60">
                          {modelData.model_type || 'ML Model'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {/* R² Score or Accuracy */}
                      {(modelData.r2 !== undefined && modelData.r2 !== null) ? (
                        <div className="glass-card p-4 bg-white/5">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-cyan-400" />
                            <span className="text-xs font-medium text-slate-800 dark:text-slate-400 uppercase tracking-wider">R² Score</span>
                          </div>
                          <div className={`text-3xl font-bold mb-1 ${getQualityColor(modelData.r2)}`}>
                            {(modelData.r2 * 100).toFixed(1)}%
                          </div>
                          <div className="text-xs text-slate-700 dark:text-slate-500">
                            {getQualityLabel(modelData.r2)} fit
                          </div>
                        </div>
                      ) : modelData.accuracy !== undefined && modelData.accuracy !== null ? (
                        <div className="glass-card p-4 bg-white/5">
                          <div className="flex items-center gap-2 mb-2">
                            <BarChart3 className="w-4 h-4 text-purple-400" />
                            <span className="text-xs font-medium text-slate-800 dark:text-slate-400 uppercase tracking-wider">Accuracy</span>
                          </div>
                          <div className="text-3xl font-bold text-purple-400 mb-1">
                            {(modelData.accuracy * 100).toFixed(1)}%
                          </div>
                          <div className="text-xs text-slate-700 dark:text-slate-500">
                            Classification accuracy
                          </div>
                        </div>
                      ) : modelData.available ? (
                        <div className="glass-card p-4 bg-white/5">
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-4 h-4 text-green-400" />
                            <span className="text-xs font-medium text-slate-800 dark:text-slate-400 uppercase tracking-wider">Status</span>
                          </div>
                          <div className="text-2xl font-bold text-green-400 mb-1">
                            Active
                          </div>
                          <div className="text-xs text-slate-700 dark:text-slate-500">
                            Model available
                          </div>
                        </div>
                      ) : null}

                      {/* MAE */}
                      {modelData.mae !== undefined && modelData.mae !== null ? (
                        <div className="glass-card p-4 bg-white/5">
                          <div className="flex items-center gap-2 mb-2">
                            <BarChart3 className="w-4 h-4 text-purple-400" />
                            <span className="text-xs font-medium text-slate-800 dark:text-slate-400 uppercase tracking-wider">MAE</span>
                          </div>
                          <div className="text-3xl font-bold text-purple-400 mb-1">
                            {modelData.mae.toFixed(2)}
                          </div>
                          <div className="text-xs text-slate-700 dark:text-slate-500">
                            Mean absolute error
                          </div>
                        </div>
                      ) : null}

                      {/* Sample Size */}
                      {modelData.sample_size !== undefined && modelData.sample_size !== null ? (
                        <div className="glass-card p-4 bg-white/5">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="w-4 h-4 text-green-400" />
                            <span className="text-xs font-medium text-slate-800 dark:text-slate-400 uppercase tracking-wider">Samples</span>
                          </div>
                          <div className="text-3xl font-bold text-green-400 mb-1">
                            {modelData.sample_size}
                          </div>
                          <div className="text-xs text-slate-700 dark:text-slate-500">
                            Training data points
                          </div>
                        </div>
                      ) : null}

                      {/* Fill empty space with additional info cards */}
                      {(() => {
                        // Count how many metric cards we have
                        const hasR2 = modelData.r2 !== undefined && modelData.r2 !== null
                        const hasAccuracy = modelData.accuracy !== undefined && modelData.accuracy !== null
                        const hasMAE = modelData.mae !== undefined && modelData.mae !== null
                        const hasSampleSize = modelData.sample_size !== undefined && modelData.sample_size !== null
                        const hasStatus = modelData.available && !hasR2 && !hasAccuracy && !hasMAE && !hasSampleSize

                        const metricCount = [hasR2, hasAccuracy, hasMAE, hasSampleSize, hasStatus].filter(Boolean).length

                        // If we have an odd number of metrics (1 or 3), fill the empty slot
                        if (metricCount % 2 === 1) {
                          return (
                            <div className="glass-card p-4 bg-white/5">
                              <div className="flex items-center gap-2 mb-2">
                                <Target className="w-4 h-4 text-amber-400" />
                                <span className="text-xs font-medium text-slate-800 dark:text-slate-400 uppercase tracking-wider">Usage</span>
                              </div>
                              <div className="text-xs text-slate-800 dark:text-slate-300 leading-relaxed">
                                {getModelUsage(modelName)}
                              </div>
                            </div>
                          )
                        }
                        return null
                      })()}
                    </div>

                    {/* Model Description Section - Show for all models */}
                    <div className="mt-6 pt-6 border-t border-white/10">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-950 dark:text-white mb-2 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-blue-600 dark:text-neon-primary" />
                            Model Purpose
                          </h4>
                          <p className="text-xs text-gray-800 dark:text-white/60 leading-relaxed">
                            {getModelDescription(modelName)}
                          </p>
                        </div>

                        {getModelFeatures(modelName).length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-950 dark:text-white mb-2 flex items-center gap-2">
                              <Zap className="w-4 h-4 text-amber-400" />
                              Features Used
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {getModelFeatures(modelName).map((feature, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs px-2 py-1 rounded-md bg-white/5 text-slate-800 dark:text-slate-300 border border-white/10"
                                >
                                  {feature}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Usage Information */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-950 dark:text-white mb-2 flex items-center gap-2">
                            <Target className="w-4 h-4 text-cyan-400" />
                            Where It's Used
                          </h4>
                          <p className="text-xs text-gray-800 dark:text-white/60 leading-relaxed">
                            {getModelUsage(modelName)}
                          </p>
                        </div>

                        {/* Model Performance Note */}
                        {(modelData.r2 || modelData.accuracy) && (
                          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                            <p className="text-xs text-blue-300 leading-relaxed">
                              <span className="font-semibold">Note:</span> {getPerformanceNote(modelName, modelData)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Feature Importance */}
                    {modelData.feature_importance && Object.keys(modelData.feature_importance).length > 0 && (
                      <div className="mt-6 pt-6 border-t border-white/10">
                        <h4 className="text-sm font-semibold text-gray-950 dark:text-white mb-4 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-cyan-400" />
                          Top Feature Importance
                        </h4>
                        <div className="space-y-2">
                          {Object.entries(modelData.feature_importance)
                            .sort(([, a], [, b]) => (b as number) - (a as number))
                            .slice(0, 5)
                            .map(([feature, importance]) => (
                              <div key={feature} className="flex items-center gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-slate-800 dark:text-slate-300 capitalize">
                                      {feature.replace(/_/g, ' ').replace(/is /g, '')}
                                    </span>
                                    <span className="text-xs text-slate-700 dark:text-slate-500">
                                      {((importance as number) * 100).toFixed(1)}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-700/50 rounded-full h-1.5">
                                    <div
                                      className="bg-gradient-to-r from-cyan-400 to-blue-400 h-1.5 rounded-full"
                                      style={{ width: `${((importance as number) * 100)}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </NeonCard>
                </motion.div>
              )
            })}
          </div>
        )}

        {hasModels && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <button
              onClick={loadMetrics}
              className="px-6 py-3 rounded-xl bg-blue-600/20 dark:bg-neon-primary/20 hover:bg-blue-600/30 dark:hover:bg-neon-primary/30 border border-blue-600/30 dark:border-neon-primary/30 text-blue-600 dark:text-neon-primary font-semibold transition-all"
            >
              Refresh Metrics
            </button>
          </motion.div>
        )}
      </div>
    </AppLayout>
  )
}

