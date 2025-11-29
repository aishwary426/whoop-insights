'use client'

import { useState, useEffect, useRef, memo } from 'react'

interface HelloTypewriterProps {
  className?: string
}

const WORDS = ['Aishwary', 'superhuman', 'athlete']

function HelloTypewriter({ className = '' }: HelloTypewriterProps) {
  const [displayText, setDisplayText] = useState('')
  const [isCursorVisible, setIsCursorVisible] = useState(true)
  
  const animationRef = useRef<{
    wordIndex: number
    charIndex: number
    isDeleting: boolean
    timeoutId: NodeJS.Timeout | null
  }>({
    wordIndex: 0,
    charIndex: 0,
    isDeleting: false,
    timeoutId: null
  })

  useEffect(() => {
    const animate = () => {
      const anim = animationRef.current
      const currentWord = WORDS[anim.wordIndex]

      if (anim.isDeleting) {
        // Backspace animation - erase character by character
        if (anim.charIndex > 0) {
          anim.charIndex--
          setDisplayText(currentWord.substring(0, anim.charIndex))
          
          // Natural backspace speed with variation
          const deletingSpeed = 40 + Math.random() * 30 // 40-70ms
          anim.timeoutId = setTimeout(animate, deletingSpeed)
        } else {
          // Word deleted completely, move to next word
          anim.isDeleting = false
          anim.wordIndex = (anim.wordIndex + 1) % WORDS.length
          anim.charIndex = 0
          
          // Brief pause before typing next word
          anim.timeoutId = setTimeout(animate, 800)
        }
      } else {
        // Typing animation - add character by character
        if (anim.charIndex < currentWord.length) {
          anim.charIndex++
          setDisplayText(currentWord.substring(0, anim.charIndex))
          
          // Natural typing speed with slight random variations
          const typingSpeed = 80 + Math.random() * 60 // 80-140ms
          anim.timeoutId = setTimeout(animate, typingSpeed)
        } else {
          // Word typed completely, pause then start deleting
          const pauseDuration = 2500 // Pause after completing word
          anim.isDeleting = true
          anim.timeoutId = setTimeout(animate, pauseDuration)
        }
      }
    }

    // Start animation after initial delay
    animationRef.current.timeoutId = setTimeout(animate, 300)

    // Cursor blinking effect - always blinking
    const cursorInterval = setInterval(() => {
      setIsCursorVisible(prev => !prev)
    }, 530)

    return () => {
      if (animationRef.current.timeoutId) {
        clearTimeout(animationRef.current.timeoutId)
      }
      clearInterval(cursorInterval)
    }
  }, [])

  return (
    <div className={`flex flex-col md:flex-row items-center md:items-center text-center md:text-left ${className}`}>
      {/* Constant "hello, " text - above on mobile, left on desktop */}
      <span className="text-black dark:text-white font-mono font-semibold tracking-tight">
        hello,
      </span>
      
      {/* Spacing - only on desktop */}
      <span className="hidden md:inline-block w-2" />
      
      {/* Typewriter area - centered on mobile, left on desktop */}
      <span className="relative inline-block min-w-[120px] text-center md:text-left">
        {/* Typed text - blue in light mode, green in dark mode */}
        <span className="text-blue-600 dark:text-green-400 font-mono font-semibold tracking-tight">
          {displayText}
        </span>
        
        {/* Blinking cursor - vertical bar */}
        <span
          className={`inline-block text-blue-600 dark:text-green-400 font-mono font-semibold ml-0 ${
            isCursorVisible ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            transition: 'opacity 0.15s ease-in-out'
          }}
        >
          |
        </span>
      </span>
    </div>
  )
}

export default memo(HelloTypewriter)
