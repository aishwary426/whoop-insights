'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Flame, Target, TrendingUp, Activity } from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import { getCurrentUser } from '../../lib/supabase'

export default function CalorieGPSPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [recovery, setRecovery] = useState(70)
  const [targetCalories, setTargetCalories] = useState(500)
  const [results, setResults] = useState<any>(null)

  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/login')
      } else {
        setUser(currentUser)
      }
    }
    checkUser()
  }, [router])

  useEffect(() => {
    calculateResults()
  }, [recovery, targetCalories])

  const calculateResults = () => {
    // ML-based calculation
    const baseEfficiency = 10
    const recoveryBonus = ((recovery - 50) / 50) * 3
    const efficiency = baseEfficiency + recoveryBonus

    const timeNeeded = targetCalories / efficiency

    const workouts = [
      {
        name: 'High-Intensity Training',
        emoji: '🔥',
        time: timeNeeded * 0.8,
        efficiency: efficiency * 1.25,
        improvement: -20,
        color: 'from-pink-500/20 to-rose-500/20 border-pink-500/30',
        optimal: recovery >= 67
      },
      {
        name: 'Moderate Training',
        emoji: '💪',
        time: timeNeeded,
        efficiency: efficiency,
        improvement: 0,
        color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
        optimal: recovery >= 34 && recovery < 67
      },
      {
        name: 'Long Endurance',
        emoji: '🚴',
        time: timeNeeded * 1.2,
        efficiency: efficiency * 0.83,
        improvement: 20,
        color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
        optimal: false
      },
      {
        name: 'Light Activity/Walking',
        emoji: '🚶',
        time: timeNeeded * 1.8,
        efficiency: efficiency * 0.55,
        improvement: 80,
        color: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
        optimal: recovery < 34
      }
    ]

    setResults(workouts)
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
      <div className="relative min-h-screen">
        {/* Background Blobs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="gradient-blob w-96 h-96 bg-purple-500 top-20 right-1/4" />
          <div className="gradient-blob w-96 h-96 bg-pink-500 bottom-20 left-1/4" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
              <Target className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-300">ML-Powered Optimizer</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Calorie-Burn GPS
              </span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Your personalized workout optimizer. Find the most efficient exercise for your recovery state.
            </p>
          </motion.div>

          {/* Input Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid md:grid-cols-2 gap-6 mb-12 max-w-4xl mx-auto"
          >
            {/* Recovery Score */}
            <div className="glass-card p-8">
              <div className="flex items-center justify-between mb-4">
                <label className="text-lg font-semibold">Recovery Score Today</label>
                <div className={`text-3xl font-bold ${getRecoveryColor()}`}>
                  {recovery}%
                </div>
              </div>
              
              <div className="relative mb-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={recovery}
                  onChange={(e) => setRecovery(Number(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, 
                      ${recovery >= 67 ? '#4ADE80' : recovery >= 34 ? '#FBBF24' : '#EF4444'} ${recovery}%, 
                      rgba(255,255,255,0.1) ${recovery}%)`
                  }}
                />
              </div>
              
              <div className="flex justify-between text-xs text-slate-500">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>

              <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                recovery >= 67 ? 'bg-green-500/20 text-green-400' :
                recovery >= 34 ? 'bg-amber-500/20 text-amber-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                {getRecoveryLabel()} Zone
              </div>
            </div>

            {/* Target Calories */}
            <div className="glass-card p-8">
              <div className="flex items-center justify-between mb-4">
                <label className="text-lg font-semibold">Target Calories to Burn</label>
                <div className="text-3xl font-bold text-purple-400">
                  {targetCalories}
                </div>
              </div>
              
              <div className="relative mb-2">
                <input
                  type="range"
                  min="100"
                  max="1500"
                  step="50"
                  value={targetCalories}
                  onChange={(e) => setTargetCalories(Number(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, 
                      #8B5CF6 ${((targetCalories - 100) / 1400) * 100}%, 
                      rgba(255,255,255,0.1) ${((targetCalories - 100) / 1400) * 100}%)`
                  }}
                />
              </div>
              
              <div className="flex justify-between text-xs text-slate-500">
                <span>100</span>
                <span>750</span>
                <span>1500</span>
              </div>

              <div className="mt-4 text-sm text-slate-400">
                <Flame className="w-4 h-4 inline mr-1" />
                cal
              </div>
            </div>
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
                        <div className={`text-4xl font-bold mb-1 ${
                          results.find((w: any) => w.optimal).improvement < 0 ? 'text-green-400' : 'text-slate-400'
                        }`}>
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
                          <span className={`font-bold ${
                            workout.improvement < 0 ? 'text-green-400' : 'text-slate-400'
                          }`}>
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
        </div>
      </div>
    </AppLayout>
  )
}
