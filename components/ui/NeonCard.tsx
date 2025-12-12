'use client'

import { motion } from 'framer-motion'
import { ReactNode, memo } from 'react'
import clsx from 'clsx'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { usePerformanceMode } from '../../lib/hooks/usePerformanceMode'

interface NeonCardProps {
  children: ReactNode
  className?: string
  bordered?: boolean
  onClick?: () => void
}

function NeonCard({ children, className, bordered = true, onClick }: NeonCardProps) {
  const { theme } = useTheme()
  const { reduceAnimations } = usePerformanceMode()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && theme === 'dark'
  const hoverShadow = isDark
    ? '0 18px 42px rgba(0,255,143,0.18)'
    : '0 18px 42px rgba(0,102,255,0.25)'

  // Disable hover animations if performance mode is on
  if (reduceAnimations) {
    return (
      <div
        className={clsx(
          'relative overflow-hidden rounded-2xl bg-white/40 dark:bg-[#0A0A0A]/30 backdrop-blur-md text-gray-800 dark:text-white/85 neon-card',
          bordered ? 'border border-gray-200 dark:border-white/10' : '',
          'shadow-lg dark:shadow-neon-card transition-colors duration-150',
          className
        )}
        onClick={onClick}
      >
        {children}
      </div>
    )
  }

  return (
    <motion.div
      className={clsx(
        'relative overflow-hidden rounded-2xl bg-white/40 dark:bg-[#0A0A0A]/30 text-gray-800 dark:text-white/85 neon-card',
        // Reduce blur for performance, especially during animation
        'backdrop-blur-sm', 
        bordered ? 'border border-gray-200 dark:border-white/10' : '',
        'shadow-lg dark:shadow-neon-card transition-colors duration-150 ease-apple',
        className
      )}
      whileHover={{ scale: 1.005, y: -1 }} // Reduced movement for smoother feel
      transition={{ duration: 0.2, ease: "easeOut" }} // Simpler easing
      layout={false}
      onClick={onClick}
      style={{ willChange: 'transform, opacity' }}
    >
      {children}
    </motion.div>
  )
}

export default memo(NeonCard)
