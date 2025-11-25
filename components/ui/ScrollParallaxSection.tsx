'use client'

import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { useRef, ReactNode } from 'react'

interface ScrollParallaxSectionProps {
  children: ReactNode
  className?: string
  id?: string
  offset?: number // Offset for when animation starts (0 = center, 0.5 = halfway, 1 = fully scrolled)
}

export default function ScrollParallaxSection({
  children,
  className = '',
  id,
  offset = 0.3, // Start fading in when section is 30% into viewport
}: ScrollParallaxSectionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'], // Track from when section enters viewport to when it leaves
  })

  // Smooth spring animation for better performance
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    mass: 0.5,
  })

  // Calculate opacity based on scroll position
  // Fade in as section enters viewport, fade out as it leaves
  // More gradual fade for smoother transitions
  const opacity = useTransform(
    smoothProgress,
    [0, offset, 1 - offset, 1],
    [0, 1, 1, 0],
    { clamp: true }
  )

  // Parallax Y transform - sections move at different speeds
  // Creates depth effect as sections scroll
  const y = useTransform(
    smoothProgress,
    [0, 0.5, 1],
    [80, 0, -80], // More pronounced movement
    { clamp: true }
  )

  // Scale effect for depth - subtle zoom in/out
  const scale = useTransform(
    smoothProgress,
    [0, offset, 1 - offset, 1],
    [0.92, 1, 1, 0.92],
    { clamp: true }
  )

  return (
    <motion.div
      ref={ref}
      id={id}
      style={{
        opacity,
        y,
        scale,
        willChange: 'opacity, transform',
      }}
      className={`will-change-[opacity,transform] ${className}`}
    >
      {children}
    </motion.div>
  )
}

