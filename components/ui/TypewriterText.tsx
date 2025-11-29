'use client'

import { useState, useEffect, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePerformanceMode } from '../../lib/hooks/usePerformanceMode'

interface TypewriterTextProps {
    words: string[]
}

function TypewriterText({ words }: TypewriterTextProps) {
  const { reduceAnimations } = usePerformanceMode()
  const [currentWordIndex, setCurrentWordIndex] = useState(0)

  // If animations are reduced, just show the first word statically
  useEffect(() => {
    if (reduceAnimations) {
      return
    }

    // Oscillate between words
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % words.length)
    }, 3000) // Change word every 3 seconds

    return () => clearInterval(interval)
  }, [words, reduceAnimations])

  if (reduceAnimations) {
    return <span className="inline-block">{words[0] || ''}</span>
  }

  const currentWord = words[currentWordIndex] || words[0] || ''

  return (
    <span className="inline-block relative min-w-[200px] md:min-w-[300px] lg:min-w-[400px]">
      <AnimatePresence mode="wait">
        <motion.span
          key={currentWord}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{
            duration: 0.5,
            ease: [0.16, 1, 0.3, 1]
          }}
          className="inline-block"
        >
          {currentWord}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

export default memo(TypewriterText)
