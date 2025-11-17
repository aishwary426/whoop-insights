'use client'

import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { useState, useEffect, useLayoutEffect } from 'react'
import clsx from 'clsx'

interface ParallaxBlobProps {
  size?: number
  color?: string
  opacity?: number
  className?: string
  oscillate?: number
  delay?: number
  parallax?: number
}

export function ParallaxBlob({
  size = 420,
  color = 'rgba(0,255,143,0.4)',
  opacity = 0.35,
  className,
  oscillate = 20,
  delay = 0,
  parallax = 32,
}: ParallaxBlobProps) {
  const { scrollY } = useScroll()
  const [maxScroll, setMaxScroll] = useState(800)
  
  useLayoutEffect(() => {
    // Calculate max scroll based on document height
    const updateMaxScroll = () => {
      if (typeof window !== 'undefined') {
        const docHeight = document.documentElement.scrollHeight
        const windowHeight = window.innerHeight
        setMaxScroll(Math.max(400, docHeight - windowHeight + 200))
      }
    }
    
    updateMaxScroll()
    window.addEventListener('resize', updateMaxScroll)
    window.addEventListener('scroll', updateMaxScroll)
    // Update on content load
    setTimeout(updateMaxScroll, 100)
    
    return () => {
      window.removeEventListener('resize', updateMaxScroll)
      window.removeEventListener('scroll', updateMaxScroll)
    }
  }, [])
  
  // Use dynamic range that adapts to page height, with fallback for minimal content
  // Add spring for smoother animation
  const yRaw = useTransform(
    scrollY,
    [0, maxScroll],
    [0, -parallax],
    { clamp: false }
  )
  const y = useSpring(yRaw, { stiffness: 50, damping: 20 })

  const gradient = `radial-gradient(circle at 30% 30%, ${color} 0%, rgba(0,255,143,0) 60%)`

  return (
    <motion.div
      style={{ y, width: size, height: size, background: gradient }}
      className={clsx(
        'pointer-events-none absolute rounded-full blur-3xl mix-blend-screen',
        className
      )}
      animate={{
        x: [0, oscillate * 0.6, -oscillate * 0.6, 0],
        y: [0, oscillate * 0.25, -oscillate * 0.25, 0],
        opacity,
      }}
      transition={{
        repeat: Infinity,
        duration: 22 + delay * 2,
        ease: 'easeInOut',
        delay,
      }}
    />
  )
}

interface ParallaxBackgroundProps {
  children?: React.ReactNode
}

export function ParallaxBackground({ children }: ParallaxBackgroundProps) {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      <ParallaxBlob className="-left-12 top-12" opacity={0.4} parallax={40} />
      <ParallaxBlob className="right-6 top-24" size={520} color="rgba(0,255,143,0.25)" delay={4} oscillate={22} parallax={30} opacity={0.3} />
      <ParallaxBlob className="bottom-4 left-1/3" size={460} color="rgba(160,255,220,0.25)" delay={2} parallax={22} opacity={0.3} />
      <NeonStructure />
      {children}
    </div>
  )
}

function NeonStructure() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <motion.div
        className="relative w-[38rem] h-[38rem] max-w-[90vw]"
        aria-hidden
      >
        {['100%', '78%', '58%'].map((size, idx) => (
          <motion.div
            key={size}
            className="absolute inset-0 rounded-full border border-neon-primary/20"
            style={{ inset: `calc((100% - ${size}) / 2)` }}
            animate={{ rotate: 360 }}
            transition={{ duration: 40 + idx * 6, ease: 'linear', repeat: Infinity }}
          />
        ))}
        <motion.div
          className="absolute inset-0 rounded-[32px] border border-neon-primary/15"
          style={{ transform: 'rotate(8deg)' }}
          animate={{ rotate: -360 }}
          transition={{ duration: 48, ease: 'linear', repeat: Infinity }}
        />
        <motion.div
          className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(0,255,143,0.18),transparent_35%)] mix-blend-screen blur-2xl"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 16, ease: 'easeInOut', repeat: Infinity }}
        />
      </motion.div>
    </div>
  )
}
