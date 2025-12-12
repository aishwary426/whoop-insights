'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays, addDays, isSameDay, parseISO, startOfDay, endOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Flame, Utensils, Droplets, Activity, Plus, X, Loader2 } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import CalorieRing from '../../components/dashboard/CalorieRing';
import NeonCard from '../../components/ui/NeonCard';
import ScrollReveal from '../../components/ui/ScrollReveal';
import { useUser } from '../../lib/contexts/UserContext';
import { api } from '../../lib/api'; // Assuming there is an api helper or I fetch directly

// Types
interface Meal {
  id: number;
  name: string;
  calories: number;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
  image_url: string | null;
  timestamp: string;
}

interface TrendPoint {
    date: string;
    value: number | null;
}

interface TrendsResponse {
    series: {
        calories: TrendPoint[]; // Burnt calories
        // ... other fields ignore
    }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export default function DailyLogPage() {
  const { user, isLoading: userLoading } = useUser();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [meals, setMeals] = useState<Meal[]>([]);
  const [burntCalories, setBurntCalories] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Derived totals
  const totalConsumed = meals.reduce((acc, meal) => acc + meal.calories, 0);
  const totalProtein = meals.reduce((acc, meal) => acc + (meal.protein || 0), 0);
  const totalCarbs = meals.reduce((acc, meal) => acc + (meal.carbs || 0), 0);
  const totalFats = meals.reduce((acc, meal) => acc + (meal.fats || 0), 0);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    
    try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        
        // 1. Fetch Meals
        // Use precision timestamps to handle timezones correctly
        // We want 00:00:00 to 23:59:59 in the USER'S LOCAL TIME, converted to ISO (which includes timezone)
        // Date-fns startOfDay/endOfDay works on the local date object provided
        
        const startIso = format(startOfDay(selectedDate), "yyyy-MM-dd'T'HH:mm:ss");
        const endIso = format(endOfDay(selectedDate), "yyyy-MM-dd'T'HH:mm:ss");

        // Add timestamp to prevent caching
        const mealsRes = await fetch(`${API_BASE_URL}/meals/?user_id=${user.id}&start_time=${startIso}&end_time=${endIso}&_t=${new Date().getTime()}`, {
            headers: {
                 'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        let mealsData: Meal[] = [];
        if (mealsRes.ok) {
            mealsData = await mealsRes.json();
        }
        setMeals(mealsData);

        // 2. Fetch Daily Metrics (Burnt Calories) via Trends
        try {
            const trendsData = await api.getTrends(dateStr, dateStr);
            let burnt = 0;
            if (trendsData.series.calories && trendsData.series.calories.length > 0) {
                 const point = trendsData.series.calories.find(p => p.date === dateStr);
                 if (point && point.value) {
                     burnt = point.value;
                 }
            }
            setBurntCalories(burnt);
        } catch (err) {
            console.error("Failed to fetch trends", err);
        }

    } catch (error) {
        console.error("Error fetching daily log data:", error);
    } finally {
        setLoading(false);
    }
  }, [user?.id, selectedDate]);

  const handleDeleteMeal = async (mealId: number) => {
    if (!confirm('Are you sure you want to delete this meal?')) return;

    try {
        const res = await fetch(`${API_BASE_URL}/meals/${mealId}?user_id=${user?.id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (res.ok) {
            setMeals(prev => prev.filter(m => m.id !== mealId));
        } else {
            console.error("Failed to delete meal");
            alert("Failed to delete meal. Please try again.");
        }
    } catch (err) {
        console.error("Error deleting meal:", err);
        alert("Error deleting meal.");
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePrevDay = () => setSelectedDate(prev => subDays(prev, 1));
  const handleNextDay = () => {
      const next = addDays(selectedDate, 1);
      if (next <= new Date()) { // Prevent going to future? Or allow it but it will be empty.
          setSelectedDate(next);
      }
  };

  if (userLoading) {
      return (
          <AppLayout user={user}>
              <div className="flex items-center justify-center min-h-[60vh]">
                  <div className="animate-pulse text-neon font-mono">Loading user...</div>
              </div>
          </AppLayout>
      );
  }

  return (
    <AppLayout user={user}>
      <div className="relative z-10 w-full px-4 md:px-6 lg:px-8 pt-24 md:pt-32 lg:pt-32 max-w-5xl mx-auto space-y-8 pb-20">
        
        {/* Date Navigation Header */}
        <div className="flex items-center justify-between mb-8">
            <button 
                onClick={handlePrevDay}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all active:scale-95"
            >
                <ChevronLeft size={24} />
            </button>
            
            <div className="text-center">
                <h1 className="text-2xl font-bold text-white uppercase tracking-tight flex items-center gap-2 justify-center">
                    <Calendar className="text-neon" size={20} />
                    {isSameDay(selectedDate, new Date()) ? 'Today' : format(selectedDate, 'MMMM d, yyyy')}
                </h1>
                <p className="text-sm text-gray-400 mt-1">{format(selectedDate, 'EEEE')}</p>
            </div>

            <button 
                onClick={handleNextDay}
                disabled={isSameDay(selectedDate, new Date())} // Disable future if strictly limiting
                className={`p-2 rounded-xl border border-white/10 text-white transition-all active:scale-95 ${
                    isSameDay(selectedDate, new Date()) 
                        ? 'bg-transparent text-gray-600 border-transparent cursor-not-allowed' 
                        : 'bg-white/5 hover:bg-white/10'
                }`}
            >
                <ChevronRight size={24} />
            </button>
        </div>

        {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse opacity-50">
                 <div className="h-96 w-full bg-white/5 rounded-3xl" />
                 <div className="space-y-4">
                     <div className="h-32 w-full bg-white/5 rounded-2xl" />
                     <div className="h-32 w-full bg-white/5 rounded-2xl" />
                 </div>
             </div>
        ) : (
            <>
                {/* Visual Summary Section - Top */}
                <ScrollReveal>
                    <NeonCard className="py-8 px-4 flex flex-col items-center justify-center bg-white/50 dark:bg-black/40 border-gray-200 dark:border-white/5 backdrop-blur-xl mb-8 relative overflow-hidden">
                        
                        {/* Macro Summary - Floating or positioned differently on Mobile? 
                            Let's put Macors below Ring for mobile, and left/right for desktop if space permits
                            Or reuse the ring layout.
                        */}
                        
                        <div className="flex flex-col lg:flex-row items-center justify-center w-full gap-8 lg:gap-16">
                            
                            {/* Left Macros */}
                            <div className="hidden lg:flex flex-col gap-4 min-w-[120px]">
                                <MacroMiniCard label="Protein" value={totalProtein} unit="g" color="text-blue-400" />
                                <MacroMiniCard label="Carbs" value={totalCarbs} unit="g" color="text-yellow-400" />
                            </div>

                            <div className="relative">
                                <CalorieRing consumed={totalConsumed} burnt={burntCalories} goal={2500} />
                            </div>

                            {/* Right Macros (or Fat only, balanced?) 
                                Actually let's put Fat here and maybe Total count
                            */}
                            <div className="hidden lg:flex flex-col gap-4 min-w-[120px]">
                                <MacroMiniCard label="Fats" value={totalFats} unit="g" color="text-red-400" />
                                <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                                    <div className="text-xs text-gray-500 uppercase font-bold">Meals</div>
                                    <div className="text-xl font-mono text-white">{meals.length}</div>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Macros Row */}
                        <div className="flex lg:hidden flex-wrap items-center justify-center gap-3 mt-8 w-full px-2">
                             <MacroMiniCard label="Protein" value={totalProtein} unit="g" color="text-blue-400" isMobile />
                             <MacroMiniCard label="Carbs" value={totalCarbs} unit="g" color="text-yellow-400" isMobile />
                             <MacroMiniCard label="Fats" value={totalFats} unit="g" color="text-red-400" isMobile />
                        </div>

                    </NeonCard>
                </ScrollReveal>

                {/* Meals Timeline / List */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Utensils className="text-neon" size={20} />
                        Meals Consumed
                    </h2>

                    {meals.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 bg-white/5 rounded-3xl border border-dashed border-white/10">
                            <p>No meals logged for this day.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <AnimatePresence>
                                {meals.map((meal, index) => (
                                    <motion.div
                                        key={meal.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <MealCard meal={meal} onDelete={() => handleDeleteMeal(meal.id)} />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </>
        )}

      </div>
    </AppLayout>
  );
}

function MacroMiniCard({ label, value, unit, color, isMobile }: { label: string, value: number, unit: string, color: string, isMobile?: boolean }) {
    return (
        <div className={`
            ${isMobile ? 'flex-1 min-w-[90px]' : 'w-full'} 
            p-3 bg-white/5 rounded-xl border border-white/5 text-center backdrop-blur-sm
        `}>
            <div className={`text-xs text-gray-500 uppercase font-bold mb-1`}>{label}</div>
            <div className={`text-lg font-mono font-bold ${color}`}>
                {Math.round(value)}{unit}
            </div>
        </div>
    )
}

function MealCard({ meal, onDelete }: { meal: Meal, onDelete: () => void }) {
    const [isDeleting, setIsDeleting] = useState(false);
    // Parse time
    const timeStr = meal.timestamp ? format(parseISO(meal.timestamp), 'h:mm a') : '';

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsDeleting(true);
        await onDelete();
        setIsDeleting(false);
    }

    return (
        <div className="group relative overflow-hidden rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:border-neon/30 p-4 flex gap-4">
             {/* Delete Button */}
             <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="absolute top-2 right-2 p-2 rounded-full bg-black/40 text-gray-300 hover:text-white hover:bg-red-500/80 transition-all z-10"
                title="Delete meal"
             >
                {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <X size={18} />}
             </button>

             {/* Image or Placeholder */}
             <div className="w-20 h-20 rounded-xl bg-black/40 flex-shrink-0 relative overflow-hidden">
                 {meal.image_url ? (
                     <img src={meal.image_url} alt={meal.name} className="w-full h-full object-cover" />
                 ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <Utensils size={20} />
                    </div>
                 )}
             </div>

             <div className="flex-1 min-w-0">
                 <div className="flex justify-between items-start mb-1 pr-10">
                     <h3 className="font-bold text-white truncate pr-2">{meal.name}</h3>
                     <span className="text-xs text-gray-500 font-mono flex-shrink-0">{timeStr}</span>
                 </div>
                 
                 <div className="text-neon font-bold text-lg mb-2">
                     {meal.calories} <span className="text-xs text-neon/60 font-normal">kcal</span>
                 </div>

                 {/* Macros line */}
                 <div className="flex items-center gap-3 text-xs text-gray-400">
                     <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400"></span> {meal.protein}g P</span>
                     <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400"></span> {meal.carbs}g C</span>
                     <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400"></span> {meal.fats}g F</span>
                 </div>
             </div>
        </div>
    )
}
