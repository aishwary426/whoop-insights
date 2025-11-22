'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Flame, Target, TrendingUp, Activity } from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import NeonCard from '../../components/ui/NeonCard'
import NeonButton from '../../components/ui/NeonButton'
import TranscendentalBackground from '../../components/ui/TranscendentalBackground'
import { getCurrentUser } from '../../lib/supabase'
import CalorieAnalysisSection from '../../components/dashboard/CalorieAnalysisSection'
import InteractiveChart from '../../components/dashboard/InteractiveChart'

export default function CalorieGPSPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [recovery, setRecovery] = useState(70)
  const [targetCalories, setTargetCalories] = useState(500)
  const [results, setResults] = useState<any>(null)
  const [isPersonalized, setIsPersonalized] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)
  const [trends, setTrends] = useState<any>(null)
  const [journalInsights, setJournalInsights] = useState<any[]>([])

  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/login')
      } else {
        setUser(currentUser)
        // Fetch real data to personalize
        try {
          const { api } = await import('../../lib/api')
          const summary = await api.getDashboardSummary()
          if (summary?.today?.recovery_score) {
            setRecovery(Math.round(summary.today.recovery_score))
            setIsPersonalized(true)
          }
          if (summary?.recommendation?.calories) {
            setTargetCalories(summary.recommendation.calories)
          }

          // Fetch deep dive analysis
          const [analysisData, trendsData, journalData] = await Promise.all([
            api.getCalorieAnalysis(),
            api.getTrends(),
            api.getJournalInsights()
          ])
          setAnalysis(analysisData)
          setTrends(trendsData)
          setJournalInsights(journalData)
        } catch (e) {
          console.error("Failed to fetch personalized data", e)
        }
      }
    }
    checkUser()
  }, [router])

  useEffect(() => {
    calculateResults()
  }, [recovery, targetCalories])

  const calculateResults = () => {
    // ML-inspired calculation: base efficiency modulated by recovery
    const neutralEfficiency = 10 // neutral baseline at 50% recovery
    const recoveryBonus = ((recovery - 50) / 50) * 3
    const baselineEfficiency = neutralEfficiency + recoveryBonus
    const baselineTime = targetCalories / baselineEfficiency

    const workoutShapes = [
      {
        name: 'High-Intensity Training',
        emoji: '🔥',
        timeFactor: 0.8,
        efficiencyFactor: 1.25,
        color: 'from-pink-500/20 to-rose-500/20 border-pink-500/30',
        optimal: recovery >= 67
      },
      {
        name: 'Moderate Training',
        emoji: '💪',
        timeFactor: 1,
        efficiencyFactor: 1,
        color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
        optimal: recovery >= 34 && recovery < 67
      },
      {
        name: 'Long Endurance',
        emoji: '🚴',
        timeFactor: 1.2,
        efficiencyFactor: 0.83,
        color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
        optimal: false
      },
      {
        name: 'Light Activity/Walking',
        emoji: '🚶',
        timeFactor: 1.8,
        efficiencyFactor: 0.55,
        color: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
        optimal: recovery < 34
      }
    ]

    const workouts = workoutShapes.map((w) => {
      const efficiency = baselineEfficiency * w.efficiencyFactor
      const time = baselineTime * w.timeFactor
      // improvement shown vs neutral baseline to reflect slider changes
      const improvement = ((efficiency - neutralEfficiency) / neutralEfficiency) * 100
      return {
        ...w,
        time,
        efficiency,
        improvement: Math.round(improvement * 10) / 10
      }
    })

    setResults(workouts)
  }

  const deltaColor = (val: number) => {
    if (val > 0) return 'text-green-400'
    if (val < 0) return 'text-red-400'
    return 'text-slate-400'
  }

  const getRecoveryColor = () => {
    if (recovery >= 67) return 'text-green-400'
    if (recovery >= 34) return 'text-amber-400'
    return 'text-red-400'
  }

  const getRecoveryLabel = () => {
    if (recovery >= 67) return 'Green'
    if (recovery >= 34) return 'Yellow'
    return 'Red'
  }


  return (
    <AppLayout user={user}>
      <TranscendentalBackground />
      <div className="relative min-h-screen text-gray-900 dark:text-white">
        <div className="relative z-10 w-full px-6 md:px-8 pt-28 pb-12 space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-3"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neon-primary/30 bg-neon-primary/10 text-xs font-semibold text-gray-700 dark:text-white/80">
              <Target className="w-4 h-4 text-neon-primary" />
              ML-powered optimizer
            </div>

            <h1 className="text-[clamp(2.4rem,6vw,3.6rem)] font-semibold leading-tight">
              Calorie-Burn GPS
            </h1>
            <p className="text-gray-600 dark:text-white/60 max-w-2xl mx-auto text-[15px]">
              Minimal, neon-clear optimizer tuned to your recovery state.
              {isPersonalized && <span className="text-neon-primary ml-2">● Synced with your data</span>}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="grid md:grid-cols-2 gap-6 mb-12 max-w-4xl mx-auto"
          >
            <NeonCard className="p-6 border-gray-200 dark:border-white/10 bg-white/80 dark:bg-[#0A0A0A]">
              <div className="flex items-center justify-between mb-4">
                <label className="text-lg font-semibold">Recovery today</label>
                <div className={`text-3xl font-semibold ${getRecoveryColor()}`}>
                  {recovery}%
                </div>
              </div>

              <div className="relative mb-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={recovery}
                  onChange={(e) => setRecovery(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-200 dark:bg-white/10"
                  style={{
                    background: `linear-gradient(to right, 
                      ${recovery >= 67 ? '#00FF8F' : recovery >= 34 ? '#F59E0B' : '#EF4444'} ${recovery}%, 
                      rgba(255,255,255,0.1) ${recovery}%)`
                  }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-gray-500 dark:text-white/50">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>

              <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${recovery >= 67 ? 'bg-neon-primary/20 text-neon-primary' :
                recovery >= 34 ? 'bg-amber-500/20 text-amber-300' :
                  'bg-red-500/20 text-red-300'
                }`}>
                <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                {getRecoveryLabel()} Zone
              </div>
            </NeonCard>

            <NeonCard className="p-6 border-gray-200 dark:border-white/10 bg-white/80 dark:bg-[#0A0A0A]">
              <div className="flex items-center justify-between mb-4">
                <label className="text-lg font-semibold">Target calories</label>
                <div className="text-3xl font-semibold text-neon-primary">
                  {targetCalories}
                </div>
              </div>

              <div className="relative mb-3">
                <input
                  type="range"
                  min="100"
                  max="1500"
                  step="50"
                  value={targetCalories}
                  onChange={(e) => setTargetCalories(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-200 dark:bg-white/10"
                  style={{
                    background: `linear-gradient(to right, 
                      #00FF8F ${((targetCalories - 100) / 1400) * 100}%, 
                      rgba(255,255,255,0.1) ${((targetCalories - 100) / 1400) * 100}%)`
                  }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-gray-500 dark:text-white/50">
                <span>100</span>
                <span>750</span>
                <span>1500</span>
              </div>

              <div className="mt-4 text-sm text-gray-600 dark:text-white/60">
                Target set to your calorie goal. Adjust to see shapes update instantly.
              </div>
            </NeonCard>
          </motion.div>

          {/* Results */}
          {results && (
            <>
              {/* Optimal Choice */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-8"
              >
                {results.find((w: any) => w.optimal) && (
                  <div className={`glass-card p-8 bg-gradient-to-br ${results.find((w: any) => w.optimal).color} border-2`}>
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sm font-medium mb-3">
                          <TrendingUp className="w-4 h-4" />
                          OPTIMAL CHOICE
                        </div>
                        <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                          <span className="text-5xl">{results.find((w: any) => w.optimal).emoji}</span>
                          {results.find((w: any) => w.optimal).name}
                        </h2>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="glass-card p-4 bg-white/5">
                        <div className="text-4xl font-bold mb-1">
                          {results.find((w: any) => w.optimal).time.toFixed(1)}
                        </div>
                        <div className="text-sm text-slate-400">minutes needed</div>
                      </div>

                      <div className="glass-card p-4 bg-white/5">
                        <div className="text-4xl font-bold mb-1">
                          {results.find((w: any) => w.optimal).efficiency.toFixed(1)}
                        </div>
                        <div className="text-sm text-slate-400">cal/min efficiency</div>
                      </div>

                      <div className="glass-card p-4 bg-white/5">
                        <div className={`text-4xl font-bold mb-1 ${deltaColor(results.find((w: any) => w.optimal).improvement)}`}>
                          {results.find((w: any) => w.optimal).improvement > 0 ? '+' : ''}
                          {results.find((w: any) => w.optimal).improvement}%
                        </div>
                        <div className="text-sm text-slate-400">vs your baseline</div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Alternative Options */}
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-6">Alternative Options</h3>

                <div className="grid md:grid-cols-3 gap-6">
                  {results.filter((w: any) => !w.optimal).map((workout: any, idx: number) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + idx * 0.1 }}
                      className={`glass-card p-6 hover:scale-105 transition-all bg-gradient-to-br ${workout.color}`}
                    >
                      <div className="text-5xl mb-4">{workout.emoji}</div>
                      <h3 className="text-xl font-bold mb-4">{workout.name}</h3>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-400">Time</span>
                          <span className="font-bold">{workout.time.toFixed(1)} min</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-400">Efficiency</span>
                          <span className="font-bold">{workout.efficiency.toFixed(1)} cal/min</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-400">vs Baseline</span>
                          <span className={`font-bold ${deltaColor(workout.improvement)}`}>
                            {workout.improvement > 0 ? '+' : ''}{workout.improvement}%
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Info Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="glass-card p-6 bg-purple-500/5 border-purple-500/20"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Activity className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">How This Works</h4>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Our ML model analyzes your recovery state and predicts the most efficient workout type for burning your target calories.
                      Higher recovery enables more intense, time-efficient workouts. Lower recovery suggests longer, lower-intensity activities
                      to avoid overtraining while still hitting your calorie goals.
                    </p>
                  </div>
                </div>
              </motion.div>
            </>
          )}



          {/* Journal Insights / Recovery Drivers */}
          {journalInsights.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mb-12"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-neon-primary rounded-full"></span>
                Recovery Drivers
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {journalInsights.map((insight, i) => (
                  <NeonCard key={i} className="p-6 border-gray-200 dark:border-white/10 bg-white/80 dark:bg-[#0A0A0A] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-gray-900 dark:text-white/90">{insight.title}</h3>
                        <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wider ${insight.data.impact_val > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                          {insight.data.impact_val > 0 ? '+' : ''}{insight.data.impact_val.toFixed(1)}% Recovery
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-white/60 mb-4">{insight.description}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-white/40 mt-auto pt-4 border-t border-gray-200 dark:border-white/5">
                      <div>
                        <span className="block text-gray-400 dark:text-white/20 uppercase tracking-wider mb-1">With</span>
                        <span className="text-gray-800 dark:text-white/80 font-mono text-sm">{insight.data.avg_with.toFixed(0)}%</span>
                      </div>
                      <div>
                        <span className="block text-gray-400 dark:text-white/20 uppercase tracking-wider mb-1">Without</span>
                        <span className="text-gray-800 dark:text-white/80 font-mono text-sm">{insight.data.avg_without.toFixed(0)}%</span>
                      </div>
                    </div>
                  </NeonCard>
                ))}
              </div>
            </motion.div>
          )}

          {/* Deep Dive Analysis */}
          <CalorieAnalysisSection analysis={analysis} />
        </div>
      </div>
    </AppLayout>
  )
}
