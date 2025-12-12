'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { usePerformanceMode } from '../../lib/hooks/usePerformanceMode'

interface KineticTypewriterProps {
  words: string[]
  className?: string
}

export default function KineticTypewriter({ words, className = '' }: KineticTypewriterProps) {
  const { reduceAnimations } = usePerformanceMode()
  const [displayText, setDisplayText] = useState('')
  const [isCursorVisible, setIsCursorVisible] = useState(true)
  
  // State refs to avoid dependency loops in timeouts
  const stateRef = useRef({
    wordIndex: 0,
    charIndex: 0,
    isDeleting: false,
    isPaused: false
  })

  useEffect(() => {
    if (reduceAnimations) {
      setDisplayText(words[0])
      return
    }

    let timeoutId: NodeJS.Timeout

    const type = () => {
      const { wordIndex, charIndex, isDeleting, isPaused } = stateRef.current
      const currentWord = words[wordIndex]

      // Typing Speed Configuration
      const typingSpeed = 100 + Math.random() * 50 // 100-150ms
      const deletingSpeed = 50 + Math.random() * 30 // 50-80ms
      const pauseEnd = 2000 // Pause at end of word
      const pauseStart = 500 // Pause before typing next word

      if (isPaused) {
        // Handle pauses
        if (isDeleting) {
          // Finished deleting, move to next word
          stateRef.current.isPaused = false
          stateRef.current.isDeleting = false
          stateRef.current.wordIndex = (wordIndex + 1) % words.length
          timeoutId = setTimeout(type, pauseStart)
        } else {
          // Finished typing, start deleting
          stateRef.current.isPaused = false
          stateRef.current.isDeleting = true
          timeoutId = setTimeout(type, pauseEnd)
        }
        return
      }

      if (isDeleting) {
        // Deleting characters
        if (charIndex > 0) {
          setDisplayText(currentWord.substring(0, charIndex - 1))
          stateRef.current.charIndex = charIndex - 1
          timeoutId = setTimeout(type, deletingSpeed)
        } else {
          // Word deleted completely
          stateRef.current.isPaused = true
          timeoutId = setTimeout(type, 100) // Brief pause before switching state logic
        }
      } else {
        // Typing characters
        if (charIndex < currentWord.length) {
          setDisplayText(currentWord.substring(0, charIndex + 1))
          stateRef.current.charIndex = charIndex + 1
          timeoutId = setTimeout(type, typingSpeed)
        } else {
          // Word typed completely
          stateRef.current.isPaused = true
          timeoutId = setTimeout(type, 100)
        }
      }
    }

    // Start the loop
    timeoutId = setTimeout(type, 500)

    // Cursor blinking effect
    const cursorInterval = setInterval(() => {
      setIsCursorVisible(prev => !prev)
    }, 530)

    return () => {
      clearTimeout(timeoutId)
      clearInterval(cursorInterval)
    }
  }, [words, reduceAnimations])

  return (
    <span className={`inline-block font-mono ${className}`}>
      <span className="relative">
        {displayText}
        {/* Blinking Cursor */}
        <motion.span
          animate={{ opacity: isCursorVisible ? 1 : 0 }}
          transition={{ duration: 0.1 }}
          className="inline-block w-[0.1em] h-[1em] bg-blue-600 dark:bg-neon ml-1 align-middle"
        />
      </span>
    </span>
  )
}
