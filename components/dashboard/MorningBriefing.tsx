'use client'

import { useState, useEffect, useRef, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Square, Volume2, VolumeX } from 'lucide-react'
import { DashboardSummary } from '../../lib/api'
import { getRelativeDateLabel, formatFullDate } from '../../lib/formatters'
import NeonCard from '../ui/NeonCard'
import { usePerformanceMode } from '../../lib/hooks/usePerformanceMode'

interface MorningBriefingProps {
  summary: DashboardSummary
}

function MorningBriefing({ summary }: MorningBriefingProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)
  const [isSupported, setIsSupported] = useState(true)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const isPlayingRef = useRef(false)
  const currentVoiceRef = useRef<SpeechSynthesisVoice | null>(null)
  const { reduceAnimations } = usePerformanceMode()

  // Lazy load speech synthesis only when user clicks play
  const [voicesLoaded, setVoicesLoaded] = useState(false)
  
  const loadVoicesRef = useRef<() => void>()
  
  loadVoicesRef.current = () => {
    if (voicesLoaded || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return
    }
    
    if (!synthRef.current) {
      synthRef.current = window.speechSynthesis
    }
    
    const availableVoices = synthRef.current.getVoices() || []
    if (availableVoices.length === 0) {
      // Try again after a delay if voices aren't loaded yet
      setTimeout(() => loadVoicesRef.current?.(), 200)
      return
    }
    
    setVoices(availableVoices)
    setVoicesLoaded(true)
    
    // Prioritize high-quality natural voices
    const preferred = availableVoices.find(v => 
        (v.name.includes('Neural') || v.name.includes('neural')) && v.lang.startsWith('en')
    ) || availableVoices.find(v => 
        (v.name.includes('Enhanced') || v.name.includes('Premium')) && v.lang.startsWith('en')
    ) || availableVoices.find(v => 
        v.name.includes('Samantha') || 
        v.name.includes('Alex') ||
        v.name.includes('Victoria') ||
        v.name.includes('Daniel')
    ) || availableVoices.find(v => 
        (v.name.includes('Google US English') || v.name.includes('Microsoft')) && v.lang.startsWith('en')
    ) || availableVoices.find(v => v.lang.startsWith('en'))
    
    const voiceToUse = preferred || availableVoices[0]
    if (voiceToUse) {
      setSelectedVoice(voiceToUse)
      currentVoiceRef.current = voiceToUse
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if speech synthesis is supported
      if (!('speechSynthesis' in window)) {
        setIsSupported(false)
        return
      }
      
      setIsSupported(true)
      synthRef.current = window.speechSynthesis
      
      // Only set up voice loading listener, don't load immediately
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => loadVoicesRef.current?.()
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

    const dateLabel = getRelativeDateLabel(today.date)
    if (dateLabel !== 'Today') {
        sentences.push(`Reviewing your data from ${dateLabel === 'Yesterday' ? 'yesterday' : formatFullDate(today.date)}.`)
    }
    
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
        sentences.push(`Honestly? You're primed to crush it today.`)
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
    if (!synthRef.current) {
      console.error('Speech synthesis not available')
      return
    }

    // Cancel any ongoing speech
    if (isPlayingRef.current) {
      synthRef.current.cancel()
      isPlayingRef.current = false
      setIsPlaying(false)
      setProgress(0)
      return
    }

    // Lazy load voices when user clicks play
    if (!voicesLoaded) {
      loadVoicesRef.current?.()
      // Wait a bit for voices to load
      await new Promise(resolve => setTimeout(resolve, 300))
    }

    // Ensure we have a voice selected
    const voiceToUse = currentVoiceRef.current || selectedVoice || (voices.length > 0 ? voices[0] : null)
    if (!voiceToUse) {
      // Try to reload voices one more time
      const availableVoices = synthRef.current.getVoices()
      if (availableVoices.length > 0) {
        currentVoiceRef.current = availableVoices[0]
        setSelectedVoice(availableVoices[0])
        setVoices(availableVoices)
        setVoicesLoaded(true)
      } else {
        alert('No speech voices available. Please check your browser settings.')
        return
      }
    }

    // Cancel any existing speech before starting
    synthRef.current.cancel()
    
    // Small delay to ensure cancellation is processed
    await new Promise(resolve => setTimeout(resolve, 100))

    isPlayingRef.current = true
    setIsPlaying(true)
    setProgress(0)
    const sentences = generateScript()
    
    if (sentences.length === 0) {
      console.error('No sentences to speak')
      isPlayingRef.current = false
      setIsPlaying(false)
      return
    }
    
    // Sequential playback with pauses
    for (let i = 0; i < sentences.length; i++) {
        // Check if cancelled using ref (state might be stale)
        if (!isPlayingRef.current) break
        
        const text = sentences[i]
        if (!text || text.trim() === '') continue
        
        const utterance = new SpeechSynthesisUtterance(text)
        utteranceRef.current = utterance
        
        // Use the voice from ref
        const voice = currentVoiceRef.current || selectedVoice
        if (voice) {
          utterance.voice = voice
        }
        
        // More human-like speech parameters
        // Slightly faster rate for more natural conversation pace
        utterance.rate = 1
        
        // Slight pitch variation between sentences (0.95-1.05) adds naturalness
        // Vary pitch slightly: lower for statements, slightly higher for questions/excitement
        const isQuestion = text.includes('?')
        const isExcited = text.includes('!') || text.toLowerCase().includes('crush') || text.toLowerCase().includes('primed')
        utterance.pitch = isQuestion ? 1.05 : isExcited ? 1.02 : 0.98
        
        utterance.volume = isMuted ? 0 : 1
        utterance.lang = 'en-US'
        
        // Wrap in promise to await completion
        await new Promise<void>(resolve => {
            let resolved = false
            const cleanup = () => {
              if (!resolved) {
                resolved = true
                resolve()
              }
            }
            
            utterance.onend = () => {
                setProgress(((i + 1) / sentences.length) * 100)
                cleanup()
            }
            utterance.onerror = (e) => {
                console.error('Speech synthesis error:', e, 'for text:', text)
                cleanup()
            }
            utterance.onstart = () => {
              // Speech started
            }
            
            // Start speaking
            try {
              synthRef.current?.speak(utterance)
              // Fallback timeout in case onend/onerror don't fire
              setTimeout(() => {
                if (!resolved) {
                  cleanup()
                }
              }, 15000) // 15 second timeout per sentence
            } catch (error) {
              console.error('Error starting speech:', error)
              cleanup()
            }
        })

        // Check again if cancelled before pause
        if (!isPlayingRef.current) break

        // Add natural pause between sentences (longer pauses feel more human)
        // Vary pause length slightly for more natural rhythm
        if (i < sentences.length - 1) {
            // Longer pause after questions or longer sentences
            const isLongSentence = text.length > 80
            const pauseLength = isQuestion ? 700 : isLongSentence ? 600 : 500
            await new Promise(r => setTimeout(r, pauseLength))
        }
    }
    
    isPlayingRef.current = false
    setIsPlaying(false)
    setProgress(100)
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
                        if (v) {
                          setSelectedVoice(v)
                          currentVoiceRef.current = v
                        }
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
            {isPlaying && !reduceAnimations && (
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
            {isPlaying && reduceAnimations && (
                <div className="absolute inset-0 rounded-full border-2 border-cyan-500/50 animate-pulse" />
            )}
            
            {/* Play Button */}
            <button
                onClick={handlePlay}
                disabled={!isSupported || voices.length === 0}
                className="relative z-10 w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg transition-all overflow-hidden group active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed before:absolute before:-inset-[2px] before:rounded-full before:bg-gradient-to-r before:from-cyan-400/0 before:via-cyan-400/80 before:to-blue-400/0 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300 before:animate-border-glow before:-z-10"
            >
                <span className="relative z-10">
                    {isPlaying ? <Square size={20} fill="white" /> : <Play size={24} fill="white" className="ml-1" />}
                </span>
            </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
            {reduceAnimations ? (
                <div 
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            ) : (
                <motion.div 
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ type: 'tween', ease: 'linear' }}
                />
            )}
        </div>

        <p className="text-sm text-gray-400 text-center italic">
            {!isSupported 
              ? "Speech synthesis not supported in this browser" 
              : voices.length === 0 
                ? "Loading voices..." 
                : isPlaying 
                  ? "Generating insights..." 
                  : "Ready for your daily update"}
        </p>
      </div>
    </NeonCard>
  )
}

export default memo(MorningBriefing)
