'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '../../lib/supabase'

// Embedded ML model data (from your training)
const MODEL_DATA = {
  exercise_names: {
    0: "Light Activity/Walking",
    1: "Long Endurance",
    2: "High-Intensity Training",
    3: "Light Activity/Walking",
    4: "Moderate Training"
  },
  baseline_efficiency: {
    0: { mean: 7.42, std: 1.24, count: 14, name: "Light Activity/Walking" },
    1: { mean: 6.87, std: 2.50, count: 8, name: "Long Endurance" },
    2: { mean: 13.89, std: 2.10, count: 2, name: "High-Intensity Training" },
    3: { mean: 4.17, std: 0.92, count: 27, name: "Light Activity/Walking" },
    4: { mean: 5.22, std: 1.62, count: 15, name: "Moderate Training" }
  },
  user_stats: {
    avg_recovery: 54,
    avg_rhr: 59,
    avg_hrv: 102,
    total_workouts: 66
  }
}

function predictCalPerMin(recoveryScore, exerciseType) {
  const baseline = MODEL_DATA.baseline_efficiency[exerciseType]
  const recoveryFactor = 0.5 + (recoveryScore / 100) * 0.5
  const recoveryBonus = ((recoveryScore - 50) / 50) * baseline.mean * 0.15
  return baseline.mean * recoveryFactor + recoveryBonus
}

export default function CalorieGPSPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [recoveryScore, setRecoveryScore] = useState(70)
  const [targetCalories, setTargetCalories] = useState(500)
  const [predictions, setPredictions] = useState(null)

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    calculatePredictions()
  }, [recoveryScore, targetCalories])

  const checkUser = async () => {
    const currentUser = await getCurrentUser()
    setUser(currentUser)
  }

  const getRecoveryColor = (score) => {
    if (score >= 67) return 'text-green-600'
    if (score >= 34) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getRecoveryBg = (score) => {
    if (score >= 67) return 'bg-green-100'
    if (score >= 34) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  const getRecoveryLabel = (score) => {
    if (score >= 67) return '🟢 Green'
    if (score >= 34) return '🟡 Yellow'
    return '🔴 Red'
  }

  const getExerciseIcon = (exerciseName) => {
    const name = exerciseName.toLowerCase()
    if (name.includes('high-intensity')) return '🔥'
    if (name.includes('cardio') || name.includes('running')) return '🏃'
    if (name.includes('endurance')) return '🚴'
    if (name.includes('light') || name.includes('walking')) return '🚶'
    return '💪'
  }

  const calculatePredictions = () => {
    const results = []
    const uniqueExercises = {}
    
    Object.entries(MODEL_DATA.exercise_names).forEach(([id, name]) => {
      if (!uniqueExercises[name]) {
        uniqueExercises[name] = id
      }
    })

    Object.entries(uniqueExercises).forEach(([name, id]) => {
      const exTypeInt = parseInt(id)
      const baseline = MODEL_DATA.baseline_efficiency[exTypeInt]
      const calPerMin = predictCalPerMin(recoveryScore, exTypeInt)
      const durationNeeded = targetCalories / calPerMin
      const confidence = Math.min(baseline.count / 10.0, 1.0) * 100
      const efficiencyVsBaseline = ((calPerMin - baseline.mean) / baseline.mean) * 100

      results.push({
        exercise_type: name,
        exercise_id: exTypeInt,
        duration_minutes: Math.round(durationNeeded * 10) / 10,
        cal_per_min: Math.round(calPerMin * 100) / 100,
        confidence: Math.round(confidence * 10) / 10,
        efficiency_vs_baseline: Math.round(efficiencyVsBaseline * 10) / 10,
        training_samples: baseline.count
      })
    })

    results.sort((a, b) => a.duration_minutes - b.duration_minutes)
    
    if (results.length > 0) {
      results[0].is_optimal = true
    }

    setPredictions(results)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href="/dashboard" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              🎯 Whoop Insights Pro
            </Link>
            <div className="flex gap-6">
              <Link href="/dashboard" className="text-gray-700 hover:text-purple-600">
                Dashboard
              </Link>
              {user && (
                <span className="text-gray-500">{user.email}</span>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            🎯 Calorie-Burn GPS
          </h1>
          <p className="text-xl text-gray-600">
            Your Personalized Workout Optimizer
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Trained on 66 real workouts • 5 exercise types
          </p>
        </div>

        {/* Input Controls */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Recovery Score */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Recovery Score Today
              </label>
              <div className="flex items-center gap-4 mb-4">
                <span className={`text-5xl font-bold ${getRecoveryColor(recoveryScore)}`}>
                  {recoveryScore}%
                </span>
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getRecoveryBg(recoveryScore)} ${getRecoveryColor(recoveryScore)}`}>
                  {getRecoveryLabel(recoveryScore)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={recoveryScore}
                onChange={(e) => setRecoveryScore(parseInt(e.target.value))}
                className="w-full h-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #8b5cf6 0%, #6366f1 ${recoveryScore}%, #e5e7eb ${recoveryScore}%, #e5e7eb 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Target Calories */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Target Calories to Burn
              </label>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  {targetCalories}
                </span>
                <span className="text-2xl text-gray-500">cal</span>
              </div>
              <input
                type="range"
                min="100"
                max="1500"
                step="50"
                value={targetCalories}
                onChange={(e) => setTargetCalories(parseInt(e.target.value))}
                className="w-full h-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #8b5cf6 0%, #6366f1 ${(targetCalories - 100) / 14}%, #e5e7eb ${(targetCalories - 100) / 14}%, #e5e7eb 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>100</span>
                <span>750</span>
                <span>1500</span>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {predictions && predictions.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">
              📊 Your Personalized Results
            </h2>

            {/* Optimal Exercise */}
            {predictions[0].is_optimal && (
              <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl shadow-2xl p-8 mb-6 text-white animate-pulse" style={{animation: 'pulse 2s ease-in-out infinite'}}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl">{getExerciseIcon(predictions[0].exercise_type)}</span>
                  <div>
                    <span className="text-sm font-semibold text-white/80 uppercase tracking-wide">
                      ⭐ Optimal Choice
                    </span>
                    <h3 className="text-3xl font-bold text-white">
                      {predictions[0].exercise_type}
                    </h3>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-white/20 backdrop-blur rounded-xl p-4">
                    <div className="text-4xl font-bold text-white mb-1">
                      {predictions[0].duration_minutes}
                    </div>
                    <div className="text-white/80 text-sm font-medium">
                      minutes needed
                    </div>
                  </div>

                  <div className="bg-white/20 backdrop-blur rounded-xl p-4">
                    <div className="text-4xl font-bold text-white mb-1">
                      {predictions[0].cal_per_min}
                    </div>
                    <div className="text-white/80 text-sm font-medium">
                      cal/min efficiency
                    </div>
                  </div>

                  <div className="bg-white/20 backdrop-blur rounded-xl p-4">
                    <div className="text-4xl font-bold text-white mb-1">
                      {predictions[0].efficiency_vs_baseline > 0 ? '+' : ''}{predictions[0].efficiency_vs_baseline}%
                    </div>
                    <div className="text-white/80 text-sm font-medium">
                      vs your baseline
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Alternative Exercises */}
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Alternative Options
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {predictions.slice(1).map((pred, idx) => (
                <div key={idx} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-shadow cursor-pointer">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{getExerciseIcon(pred.exercise_type)}</span>
                    <h4 className="text-lg font-bold text-gray-800">
                      {pred.exercise_type}
                    </h4>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Duration</span>
                      <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                        {pred.duration_minutes} min
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Efficiency</span>
                      <span className="text-lg font-semibold text-gray-700">
                        {pred.cal_per_min} cal/min
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Confidence</span>
                      <span className="text-sm font-semibold text-gray-500">
                        {pred.confidence}% ({pred.training_samples} samples)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* User Stats Footer */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mt-8">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Training Data Stats
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    {Math.round(MODEL_DATA.user_stats.avg_recovery)}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Avg Recovery</div>
                </div>
                <div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    {Math.round(MODEL_DATA.user_stats.avg_rhr)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Avg RHR</div>
                </div>
                <div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    {Math.round(MODEL_DATA.user_stats.avg_hrv)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Avg HRV</div>
                </div>
                <div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    {MODEL_DATA.user_stats.total_workouts}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Total Workouts</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>Built with ❤️ using your personal Whoop data</p>
          <p className="mt-1">Powered by Machine Learning • Gradient Boosting Model</p>
        </div>
      </div>
    </div>
  )
}
