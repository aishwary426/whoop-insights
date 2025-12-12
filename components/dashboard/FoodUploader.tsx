'use client'

import { useState, useRef } from 'react'
import type { DragEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Camera, Check, X, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import NeonCard from '../ui/NeonCard'

interface FoodUploaderProps {
  onCaloriesAdded: (calories: number) => void
  userId?: string
}

export default function FoodUploader({ onCaloriesAdded, userId }: FoodUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isLogging, setIsLogging] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [calories, setCalories] = useState<number | null>(null)
  const [protein, setProtein] = useState<number | null>(null)
  const [carbs, setCarbs] = useState<number | null>(null)
  const [fats, setFats] = useState<number | null>(null)
  const [foodName, setFoodName] = useState<string>('')
  const [showResult, setShowResult] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      await processFile(file)
    }
  }

  const handleFile = async (file: File) => {
      await processFile(file)
  }

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return

    // Reset previous states
    setCalories(null)
    setProtein(null)
    setCarbs(null)
    setFats(null)
    setFoodName('')
    setShowResult(false)

    // Preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Start Analysis
    setIsAnalyzing(true)
    
    // Use environment variable or default to localhost
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

    try {
      console.log(`Starting food analysis for file: ${file.name} (${file.size} bytes)`);
      const formData = new FormData()
      formData.append('file', file)

      console.log(`Sending request to: ${apiBaseUrl}/food/analyze`)
      const response = await fetch(`${apiBaseUrl}/food/analyze`, {
        method: 'POST',
        body: formData,
      })

      console.log(`Analysis response status: ${response.status} ${response.statusText}`)

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Analysis failed with status ${response.status}: ${errorText}`);
        throw new Error(`${response.status} ${response.statusText}${errorText ? ` - ${errorText.substring(0, 50)}` : ''}`)
      }

      const data = await response.json()
      console.log("Analysis data received:", data)
      
      setCalories(data.calories)
      setProtein(data.protein)
      setCarbs(data.carbs)
      setFats(data.fats)
      setFoodName(data.description || "Analyzed Food")
      
      // Simulate "Scanning" delay slightly if API is too fast
      setTimeout(() => {
        setIsAnalyzing(false)
        setShowResult(true)
      }, 1500)

    } catch (error: any) {
      console.error("Analysis failed:", error)
      setIsAnalyzing(false)
      // Provide fallback values but indicate error
      setCalories(0)
      setProtein(0)
      setCarbs(0)
      setFats(0)
      // Show actual error in the UI for debugging
      setFoodName(`Error: ${error.message || 'Unknown error'} (${apiBaseUrl})`)
      setShowResult(true)
    }
  }

  const handleAddParams = async () => {
    if (calories === null || calories === 0 || isLogging) return;

    setIsLogging(true)

    try {
        if (!userId) {
            console.error("User ID missing, cannot save meal")
            setIsLogging(false)
            return
        }

        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
        const res = await fetch(`${apiBaseUrl}/meals`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                user_id: userId,
                name: foodName,
                calories: calories,
                protein: protein,
                carbs: carbs,
                fats: fats,
                timestamp: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss")
            })
        })
        
        if (res.ok) {
            // Small delay to show success feedback
            await new Promise(resolve => setTimeout(resolve, 500))
            onCaloriesAdded(calories)
            reset()
        } else {
            console.error("Failed to save meal")
            setIsLogging(false)
        }
    } catch (e) {
        console.error("Error saving meal:", e)
        setIsLogging(false)
    }
  }

  const reset = () => {
    setPreview(null)
    setCalories(null)
    setProtein(null)
    setCarbs(null)
    setFats(null)
    setFoodName('')
    setIsAnalyzing(false)
    setIsLogging(false)
    setShowResult(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  return (
    <NeonCard className="p-6 overflow-hidden relative">
      <AnimatePresence mode="wait">
        {!preview ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              isDragging
                ? 'border-neon bg-neon/10'
                : 'border-gray-300 dark:border-white/20 hover:border-neon dark:hover:border-neon'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <div className="flex flex-col items-center gap-4 cursor-pointer">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                <Camera size={32} className="text-gray-500 dark:text-white/60" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Snap or Upload Food</h3>
                <p className="text-xs text-gray-500 dark:text-white/50 mt-1">
                  AI will detect calories instantly
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center"
          >
             <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-6 bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Food Preview" className="w-full h-full object-contain" />
                
                {isAnalyzing && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                         <div className="w-16 h-1 bg-gray-700 rounded-full overflow-hidden mb-4 w-1/2">
                            <motion.div 
                                className="h-full bg-neon"
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 2, ease: "easeInOut" }}
                            />
                         </div>
                         <div className="text-white font-mono text-sm animate-pulse">Scanning Bio-Markers...</div>
                    </div>
                )}
             </div>

             {calories !== null && !isAnalyzing && (
                 <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="w-full"
                 >
                     <div className="text-center mb-6">
                        <div className="text-sm text-gray-500 dark:text-white/60 uppercase tracking-widest text-xs mb-1">Detected</div>
                        <div className="text-5xl font-bold text-white mb-2">{calories} <span className="text-xl text-neon">kcal</span></div>
                        <div className="text-sm text-white/80 italic mb-3">"{foodName}"</div>
                        <div className="text-xs text-neon border border-neon/30 bg-neon/10 px-3 py-1 rounded-full inline-block">
                             High Confidence Match
                        </div>
                     </div>

                     {/* Logging Progress Bar */}
                     {isLogging && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-4 w-full"
                        >
                            <div className="w-full h-2 bg-gray-700 dark:bg-white/10 rounded-full overflow-hidden">
                                <motion.div 
                                    className="h-full bg-neon"
                                    initial={{ width: "0%" }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 1.5, ease: "easeInOut" }}
                                />
                            </div>
                            <div className="text-center mt-2 text-sm text-gray-400 dark:text-white/60 flex items-center justify-center gap-2">
                                <Loader2 size={14} className="animate-spin" />
                                <span>Logging meal...</span>
                            </div>
                        </motion.div>
                     )}

                     <div className="flex gap-3">
                        <button 
                            onClick={reset}
                            disabled={isLogging}
                            className="flex-1 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Retake
                        </button>
                        <button 
                            onClick={handleAddParams}
                            disabled={isLogging}
                            className="flex-1 py-3 rounded-xl bg-neon text-black font-bold hover:bg-neon-hover transition-colors shadow-[0_0_20px_rgba(0,255,143,0.3)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLogging ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>Logging...</span>
                                </>
                            ) : (
                                <>
                                    <Check size={18} />
                                    <span>Log Meal</span>
                                </>
                            )}
                        </button>
                     </div>
                 </motion.div>
             )}
          </motion.div>
        )}
      </AnimatePresence>
    </NeonCard>
  )
}
