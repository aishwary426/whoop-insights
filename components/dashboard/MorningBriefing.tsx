'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Square, Volume2, VolumeX } from 'lucide-react'
import { DashboardSummary } from '../../lib/api'
import NeonCard from '../ui/NeonCard'

interface MorningBriefingProps {
  summary: DashboardSummary
}

export default function MorningBriefing({ summary }: MorningBriefingProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis
      
      const loadVoices = () => {
        const availableVoices = synthRef.current?.getVoices() || []
        setVoices(availableVoices)
        
        // Prioritize "Enhanced" or "Premium" voices (macOS/Chrome high quality)
        const preferred = availableVoices.find(v => 
            (v.name.includes('Enhanced') || v.name.includes('Premium') || v.name.includes('Neural')) && v.lang.startsWith('en')
        ) || availableVoices.find(v => 
            v.name.includes('Google US English') || 
            v.name.includes('Samantha')
        )
        
        if (preferred) setSelectedVoice(preferred)
        else setSelectedVoice(availableVoices[0])
      }

      loadVoices()
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices
      }
    }
  }, [])

  const generateScript = () => {
    const { today, recommendation } = summary
    const sleepHours = today.sleep_hours || 0
    const recovery = today.recovery_score || 0
    const rem = today.rem_sleep_min || 0
    const deep = today.deep_sleep_min || 0
    
    // Split into distinct sentences for pacing
    const sentences = []
    
    // Intro
    const greetings = ["Good morning.", "Rise and shine.", "Hello there."]
    sentences.push(greetings[Math.floor(Math.random() * greetings.length)])
    
    // Sleep
    const hours = Math.floor(sleepHours)
    const minutes = Math.round((sleepHours % 1) * 60)
    sentences.push(`You clocked in ${hours} hours and ${minutes} minutes of sleep.`)
    
    const totalSleepMin = sleepHours * 60
    if (totalSleepMin > 0) {
        if (rem / totalSleepMin < 0.20) {
            sentences.push(`I noticed your REM sleep was a bit light. Take it easy this morning if you feel groggy.`)
        } else if (deep / totalSleepMin < 0.15) {
            sentences.push(`Your deep sleep was slightly low. This might affect your physical recovery.`)
        } else {
            sentences.push(`Your sleep quality looks solid.`)
        }
    }

    // Recovery
    sentences.push(`Your recovery score is sitting at ${Math.round(recovery)}%.`)
    if (recovery > 66) {
        sentences.push(`Honestly? You are primed to crush it today.`)
    } else if (recovery < 33) {
        sentences.push(`Listen to your body today. It's asking for rest.`)
    } else {
        sentences.push(`You're in the green zone. Steady and ready.`)
    }

    // Recommendation
    if (recommendation.notes) {
        sentences.push(`Here is my advice: ${recommendation.notes}`)
    }

    return sentences
  }

  const speakSentence = (text: string, index: number, total: number) => {
    if (!synthRef.current || !selectedVoice) return

    const utterance = new SpeechSynthesisUtterance(text)
    utteranceRef.current = utterance
    utterance.voice = selectedVoice
    utterance.rate = 0.95
    utterance.pitch = 1.0
    utterance.volume = isMuted ? 0 : 1

    utterance.onend = () => {
        if (index < total - 1) {
            // Natural pause between sentences
            setTimeout(() => {
                if (isPlaying) { // Check if still playing (wasn't cancelled)
                     // This logic needs to be handled by the orchestrator loop
                }
            }, 400)
        } else {
            setIsPlaying(false)
            setProgress(100)
        }
    }
    
    synthRef.current.speak(utterance)
  }

  const handlePlay = async () => {
    if (!synthRef.current) return

    if (isPlaying) {
      synthRef.current.cancel()
      setIsPlaying(false)
      setProgress(0)
      return
    }

    setIsPlaying(true)
    const sentences = generateScript()
    
    // Sequential playback with pauses
    for (let i = 0; i < sentences.length; i++) {
        if (!synthRef.current.speaking && !isPlaying) break // Stop if cancelled
        
        const text = sentences[i]
        const utterance = new SpeechSynthesisUtterance(text)
        utteranceRef.current = utterance
        if (selectedVoice) utterance.voice = selectedVoice
        utterance.rate = 0.95
        utterance.volume = isMuted ? 0 : 1
        
        // Wrap in promise to await completion
        await new Promise<void>(resolve => {
            utterance.onend = () => {
                setProgress(((i + 1) / sentences.length) * 100)
                resolve()
            }
            utterance.onerror = () => resolve() // Continue even on error
            synthRef.current?.speak(utterance)
        })

        // Add natural pause
        if (i < sentences.length - 1) {
            await new Promise(r => setTimeout(r, 400))
        }
    }
    
    setIsPlaying(false)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    if (utteranceRef.current && isPlaying) {
        // Note: Changing volume mid-speech is tricky in Web Speech API, usually requires restart
        // For MVP, we'll just update state for next play
    }
  }

  return (
    <NeonCard className="relative overflow-hidden p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
          Morning Briefing
        </h3>
        <div className="flex items-center gap-2">
            {voices.length > 0 && (
                <select 
                    className="bg-gray-800 text-xs text-gray-300 rounded border border-gray-700 p-1 max-w-[100px] truncate"
                    value={selectedVoice?.name || ''}
                    onChange={(e) => {
                        const v = voices.find(voice => voice.name === e.target.value)
                        if (v) setSelectedVoice(v)
                    }}
                >
                    {voices.map(v => (
                        <option key={v.name} value={v.name}>{v.name}</option>
                    ))}
                </select>
            )}
            <button onClick={toggleMute} className="text-gray-400 hover:text-white transition-colors">
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center space-y-6">
        {/* Visualizer Circle */}
        <div className="relative w-32 h-32 flex items-center justify-center">
            {/* Pulsing rings */}
            {isPlaying && (
                <>
                    <motion.div
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 rounded-full border-2 border-cyan-500/30"
                    />
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.8, 0.2, 0.8] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                        className="absolute inset-0 rounded-full border border-blue-500/50"
                    />
                </>
            )}
            
            {/* Play Button */}
            <button
                onClick={handlePlay}
                className="z-10 w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg hover:shadow-cyan-500/50 transition-all active:scale-95"
            >
                {isPlaying ? <Square size={24} fill="white" /> : <Play size={28} fill="white" className="ml-1" />}
            </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
            <motion.div 
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ type: 'tween', ease: 'linear' }}
            />
        </div>

        <p className="text-sm text-gray-400 text-center italic">
            {isPlaying ? "Generating insights..." : "Ready for your daily update"}
        </p>
      </div>
    </NeonCard>
  )
}
