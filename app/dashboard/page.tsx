'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '../../components/layout/AppLayout'
import CalorieRing from '../../components/dashboard/CalorieRing'
import FoodUploader from '../../components/dashboard/FoodUploader'
import NeonCard from '../../components/ui/NeonCard'
import DashboardSkeleton from '../../components/dashboard/DashboardSkeleton'
import { useDashboardSummary } from '../../lib/hooks/useDashboardData'
import { useUser } from '../../lib/contexts/UserContext'
import { Flame, Utensils, Activity, RefreshCw, Trash2 } from 'lucide-react'
import ScrollReveal from '../../components/ui/ScrollReveal'
import { api } from '../../lib/api'
import { format } from 'date-fns'
import ErrorBoundary from '../../components/ErrorBoundary'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading: userLoading } = useUser()
  const { summary, isLoading: summaryLoading, mutate: refreshSummary } = useDashboardSummary(user?.id)

  const [consumedCalories, setConsumedCalories] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
    // Reset Daily Data
    const handleReset = useCallback(async () => {
        if (!confirm('Are you sure you want to clear all food logs for today?')) return;
        
        try {
            let apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
            if (apiBaseUrl.endsWith('/api')) {
                apiBaseUrl = `${apiBaseUrl}/v1`;
            }
            const today = format(new Date(), 'yyyy-MM-dd');
            // Ensure trailing slash to prevent 307 Redirects
            const res = await fetch(`${apiBaseUrl}/meals/reset/?user_id=${user?.id}&date_filter=${today}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (res.ok) {
                setConsumedCalories(0);
                setSyncMessage({ type: 'success', text: 'Daily log cleared successfully.' });
                setTimeout(() => setSyncMessage(null), 3000);
            }
        } catch (err) {
            console.error("Failed to reset meals", err);
            setSyncMessage({ type: 'error', text: 'Failed to clear log.' });
        }
    }, [user?.id]);

  // Sync Whoop data
  const handleSyncWhoop = useCallback(async () => {
    if (!user?.id || isSyncing) return
    
    setIsSyncing(true)
    setSyncMessage(null)
    
    try {
      const result = await api.syncWhoopDataNow()
      
      // Clear cache and refresh dashboard data
      let apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
      if (apiBaseUrl.endsWith('/api')) {
          apiBaseUrl = `${apiBaseUrl}/v1`;
      }
      
      // Ensure trailing slash to prevent 307 Redirects
      await fetch(`${apiBaseUrl}/dashboard/clear-cache/`, { method: 'POST' }).catch(() => {})
      await refreshSummary()
      
      setSyncMessage({
        type: 'success',
        text: `Synced successfully! ${result.metrics_upserted || 0} metrics updated.`
      })
      
      // Clear message after 5 seconds
      setTimeout(() => setSyncMessage(null), 5000)
    } catch (error: any) {
      setSyncMessage({
        type: 'error',
        text: error.message || 'Failed to sync Whoop data. Please try again.'
      })
      
      // Clear error message after 5 seconds
      setTimeout(() => setSyncMessage(null), 5000)
    } finally {
      setIsSyncing(false)
    }
  }, [user?.id, isSyncing, refreshSummary])
  
  // Fetch consumed calories from API
  const fetchMeals = useCallback(async () => {
    if (!user?.id) return

    try {
        let apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
        if (apiBaseUrl.endsWith('/api')) {
            apiBaseUrl = `${apiBaseUrl}/v1`;
        }
        const today = format(new Date(), 'yyyy-MM-dd');
        // Add timestamp to prevent caching & Ensure trailing slash
        const res = await fetch(`${apiBaseUrl}/meals/?user_id=${user.id}&date_filter=${today}&_t=${new Date().getTime()}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}` 
            }
        })
        if (res.ok) {
            const meals = await res.json()
            const total = meals.reduce((acc: number, meal: any) => acc + meal.calories, 0)
            setConsumedCalories(total)
        }
    } catch (err) {
        console.error("Failed to fetch meals", err)
    }
  }, [user?.id])

  // Handle new calories added (Optimistic Update)
  const handleCaloriesAdded = useCallback((addedCalories: number) => {
      // Optimistic update
      setConsumedCalories(prev => prev + addedCalories)
      
      // Delay fetch slightly to ensure backend processing is complete
      setTimeout(() => {
          fetchMeals()
      }, 1000)
  }, [fetchMeals])

  useEffect(() => {
    fetchMeals()
    
    // Optional: Poll every 30s for updates (e.g. from WhatsApp)
    const interval = setInterval(fetchMeals, 30000)
    return () => clearInterval(interval)
  }, [fetchMeals])

  // Get Burnt Calories from Whoop Data (Summary)
  const burntCalories = useMemo(() => {
      return summary?.today?.calories || 0
  }, [summary])

  const isLoading = userLoading || summaryLoading

  if (isLoading) {
    return (
      <AppLayout user={user}>
        <DashboardSkeleton />
      </AppLayout>
    )
  }

  return (
    <AppLayout user={user}>
      <ErrorBoundary>
        <div className="relative z-10 w-full px-4 md:px-6 lg:px-8 pt-24 md:pt-32 lg:pt-32 max-w-5xl mx-auto space-y-8">
            
            {/* Header */}
            <div className="text-center space-y-2">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                    <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                        Calorie<span className="text-neon">GPS</span>
                    </h1>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSyncWhoop}
                            disabled={isSyncing}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neon/10 hover:bg-neon/20 border border-neon/30 text-neon font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-neon/20"
                            title="Sync Whoop data now"
                        >
                            <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
                            <span>Sync Now</span>
                        </button>
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 font-semibold text-sm transition-all shadow-lg hover:shadow-red-500/20"
                            title="Reset daily log"
                        >
                            <Trash2 size={18} />
                            <span>Reset</span>
                        </button>
                    </div>
                </div>
                <p className="text-gray-500 dark:text-white/60">Real-time Energy Flux Monitoring</p>
                {syncMessage && (
                    <div className={`mt-2 px-4 py-2 rounded-lg text-sm font-medium max-w-md mx-auto ${
                        syncMessage.type === 'success' 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                        {syncMessage.text}
                    </div>
                )}
            </div>

            {/* Main Ring */}
            <ScrollReveal>
                <NeonCard className="py-12 px-4 flex flex-col items-center justify-center bg-white/50 dark:bg-black/40 border-gray-200 dark:border-white/5 backdrop-blur-xl">
                    <CalorieRing consumed={Number(consumedCalories) || 0} burnt={Number(burntCalories) || 0} goal={2500} />
                    
                    <div className="grid grid-cols-2 gap-8 mt-12 w-full max-w-sm">
                        <div className="text-center p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20">
                            <div className="flex items-center justify-center gap-2 text-orange-500 mb-2">
                                <Utensils size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">In</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(consumedCalories)}</div>
                        </div>
                        <div className="text-center p-4 rounded-2xl bg-neon/10 border border-neon/20">
                            <div className="flex items-center justify-center gap-2 text-neon mb-2">
                                <Activity size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">Out</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(burntCalories)}</div>
                        </div>
                    </div>
                </NeonCard>
            </ScrollReveal>

            {/* Action Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ScrollReveal delay={0.1}>
                    <ErrorBoundary>
                        <FoodUploader onCaloriesAdded={handleCaloriesAdded} userId={user?.id} />
                    </ErrorBoundary>
                </ScrollReveal>

                <ScrollReveal delay={0.2}>
                    <NeonCard className="p-6 h-full flex flex-col justify-center bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Flame className="text-neon" />
                            Insights
                        </h3>
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-black/20 border border-white/5">
                                <div className="text-sm text-gray-400 mb-1">Net Balance</div>
                                <div className={`text-lg font-semibold ${consumedCalories > burntCalories ? 'text-orange-400' : 'text-neon'}`}>
                                    {consumedCalories > burntCalories ? 'Surplus' : 'Deficit'} of {Math.abs(Math.round(consumedCalories - burntCalories))} kcal
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-black/20 border border-white/5">
                                <div className="text-sm text-gray-400 mb-1">Recommendation</div>
                                <div className="text-sm font-medium text-white/80">
                                    {consumedCalories > burntCalories 
                                        ? "You're in a surplus. Great for recovery, but watch the late snacks." 
                                        : "You're in a deficit. Ensure you fuel up for tomorrow's strain."}
                                </div>
                            </div>
                        </div>
                    </NeonCard>
                </ScrollReveal>
            </div>

        </div>
      </ErrorBoundary>
    </AppLayout>
  )
}
