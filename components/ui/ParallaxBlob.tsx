'use client'

import { motion, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate } from 'framer-motion'
import { useState, useLayoutEffect, useEffect } from 'react'
import clsx from 'clsx'
import { useTheme } from 'next-themes'
import { useIsMobile } from '../../lib/hooks/useIsMobile'

interface ParallaxBlobProps {
  size?: number
  color?: string
  opacity?: number
  className?: string
  oscillate?: number
  delay?: number
  parallax?: number
  mouseX: any
  mouseY: any
}

export function ParallaxBlob({
  size = 420,
  color,
  opacity = 0.35,
  className,
  oscillate = 20,
  delay = 0,
  parallax = 32,
  mouseX,
  mouseY,
}: ParallaxBlobProps) {
  const { theme } = useTheme()
  const { scrollY } = useScroll()
  const isMobile = useIsMobile()
  const [maxScroll, setMaxScroll] = useState(800)
  const effectiveColor = color || (theme === 'dark' ? 'rgba(0,255,143,0.4)' : 'rgba(0,102,255,0.4)')

  useLayoutEffect(() => {
    let resizeTimeout: NodeJS.Timeout
    let scrollTimeout: NodeJS.Timeout

    const updateMaxScroll = () => {
      if (typeof window !== 'undefined') {
        const docHeight = document.documentElement.scrollHeight
        const windowHeight = window.innerHeight
        setMaxScroll(Math.max(400, docHeight - windowHeight + 200))
      }
    }

    const throttledResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(updateMaxScroll, 150)
    }

    const throttledScroll = () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(updateMaxScroll, 200)
    }

    updateMaxScroll()
    window.addEventListener('resize', throttledResize, { passive: true })
    window.addEventListener('scroll', throttledScroll, { passive: true })
    setTimeout(updateMaxScroll, 100)

    return () => {
      clearTimeout(resizeTimeout)
      clearTimeout(scrollTimeout)
      window.removeEventListener('resize', throttledResize)
      window.removeEventListener('scroll', throttledScroll)
    }
  }, [])

  const yRaw = useTransform(
    scrollY,
    [0, maxScroll],
    [0, -parallax],
    { clamp: true }
  )
  const y = useSpring(yRaw, { stiffness: 50, damping: 20, restDelta: 0.01 })

  // Mouse parallax effect
  const xMouse = useTransform(mouseX, [0, 1], [-20, 20])
  const yMouse = useTransform(mouseY, [0, 1], [-20, 20])
  const xSpring = useSpring(xMouse, { stiffness: 20, damping: 15 })
  const ySpring = useSpring(yMouse, { stiffness: 20, damping: 15 })

  const gradientEnd = theme === 'dark' ? 'rgba(0,255,143,0)' : 'rgba(0,102,255,0)'
  const gradient = `radial-gradient(circle at 30% 30%, ${effectiveColor} 0%, ${gradientEnd} 60%)`

  return (
    <motion.div
      style={{
        y,
        x: xSpring,
        width: size,
        height: size,
        background: gradient
      }}
      className={clsx(
        'pointer-events-none absolute rounded-full blur-3xl mix-blend-screen will-change-transform',
        className
      )}
      animate={isMobile ? undefined : {
        x: [0, oscillate * 0.6, -oscillate * 0.6, 0],
        y: [0, oscillate * 0.25, -oscillate * 0.25, 0],
        opacity: [opacity, opacity * 0.8, opacity],
        scale: [1, 1.05, 0.95, 1],
      }}
      transition={{
        repeat: Infinity,
        duration: 22 + delay * 2,
        ease: 'easeInOut',
        delay,
        times: [0, 0.33, 0.66, 1],
      }}
      initial={false}
      layout={false}
    />
  )
}



// ... existing imports ...

// ... ParallaxBlob component ...

function FloatingParticles({ mouseX, mouseY }: { mouseX: any, mouseY: any }) {
  const particleCount = 25
  const { theme } = useTheme()
  const isMobile = useIsMobile()
  const isLight = theme === 'light'

  if (isMobile) return null

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(particleCount)].map((_, i) => (
        <Particle key={i} index={i} mouseX={mouseX} mouseY={mouseY} isLight={isLight} />
      ))}
    </div>
  )
}

function Particle({ index, mouseX, mouseY, isLight }: { index: number, mouseX: any, mouseY: any, isLight: boolean }) {
  const size = 2 + (index % 3)
  const initialX = (index * 17) % 100
  const initialY = (index * 23) % 100
  const duration = 20 + (index % 10) * 2
  const delay = index * 0.5

  // Reactive movement based on mouse
  // Particles move slightly away from cursor
  const xOffset = useTransform(mouseX, [0, 1], [index % 2 === 0 ? -30 : 30, index % 2 === 0 ? 30 : -30])
  const yOffset = useTransform(mouseY, [0, 1], [index % 3 === 0 ? -30 : 30, index % 3 === 0 ? 30 : -30])

  const xSpring = useSpring(xOffset, { stiffness: 15, damping: 20 })
  const ySpring = useSpring(yOffset, { stiffness: 15, damping: 20 })

  return (
    <motion.div
      className={clsx(
        "absolute rounded-full",
        isLight ? "bg-gray-900/10" : "bg-white/20",
        "will-change-transform"
      )}
      style={{
        width: size,
        height: size,
        left: `${initialX}%`,
        top: `${initialY}%`,
        x: xSpring,
        y: ySpring,
      }}
      animate={{
        y: [0, -100, 0],
        opacity: [0, 0.5, 0],
        scale: [0, 1, 0],
      }}
      transition={{
        y: {
          duration,
          repeat: Infinity,
          delay,
          ease: "linear",
        },
        opacity: {
          duration: duration * 0.5,
          repeat: Infinity,
          delay,
          ease: "easeInOut"
        },
        scale: {
          duration: duration * 0.5,
          repeat: Infinity,
          delay,
          ease: "easeInOut"
        }
      }}
    />
  )
}

function DynamicGrid({ mouseX, mouseY }: { mouseX: any, mouseY: any }) {
  const { theme } = useTheme()
  const isLight = theme === 'light'

  const maskImage = useMotionTemplate`radial-gradient(
    400px circle at ${mouseX}px ${mouseY}px,
    black,
    transparent
  )`

  const gridColor = isLight ? '#000000' : '#ffffff'

  // Simple grid pattern
  return (
    <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
      style={{
        backgroundImage: `linear-gradient(to right, ${gridColor} 1px, transparent 1px), linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }}
    />
  )
}


interface ParallaxBackgroundProps {
  children?: React.ReactNode
}

export function ParallaxBackground({ children }: ParallaxBackgroundProps) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const mouseXPx = useMotionValue(0)
  const mouseYPx = useMotionValue(0)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e
      const { innerWidth, innerHeight } = window
      mouseX.set(clientX / innerWidth)
      mouseY.set(clientY / innerHeight)
      mouseXPx.set(clientX)
      mouseYPx.set(clientY)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY, mouseXPx, mouseYPx])

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      <div className="absolute inset-0 bg-gray-50 dark:bg-[#050505] transition-colors duration-300" />
      <DynamicGrid mouseX={mouseXPx} mouseY={mouseYPx} />

      <ParallaxBlob
        className="-left-12 top-12"
        opacity={0.4}
        parallax={40}
        mouseX={mouseX}
        mouseY={mouseY}
      />
      <ParallaxBlob
        className="right-6 top-24"
        size={520}
        delay={4}
        oscillate={22}
        parallax={30}
        opacity={0.3}
        mouseX={mouseX}
        mouseY={mouseY}
      />
      <ParallaxBlob
        className="bottom-4 left-1/3"
        size={460}
        delay={2}
        parallax={22}
        opacity={0.3}
        mouseX={mouseX}
        mouseY={mouseY}
      />

      <NeonStructure mouseX={mouseX} mouseY={mouseY} />
      {children}
    </div>
  )
}

function NeonStructure({ mouseX, mouseY }: { mouseX: any, mouseY: any }) {
  const { theme } = useTheme()
  const isMobile = useIsMobile()
  if (isMobile) return null
  const rotateX = useTransform(mouseY, [0, 1], [5, -5])
  const rotateY = useTransform(mouseX, [0, 1], [-5, 5])

  return (
    <div className="absolute inset-0 flex items-center justify-center perspective-1000">
      <motion.div
        className="relative w-[38rem] h-[38rem] max-w-[90vw] will-change-transform"
        style={{ rotateX, rotateY }}
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
          className="absolute inset-0 mix-blend-screen blur-2xl"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${theme === 'dark' ? 'rgba(0,255,143,0.18)' : 'rgba(0,102,255,0.18)'}, transparent 35%)`
          }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 16, ease: 'easeInOut', repeat: Infinity }}
        />
      </motion.div>
    </div>
  )
}
