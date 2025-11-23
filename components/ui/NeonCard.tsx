'use client'

import { motion } from 'framer-motion'
import { ReactNode, memo } from 'react'
import clsx from 'clsx'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

interface NeonCardProps {
  children: ReactNode
  className?: string
  bordered?: boolean
}

function NeonCard({ children, className, bordered = true }: NeonCardProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const isDark = mounted && theme === 'dark'
  const hoverShadow = isDark 
    ? '0 18px 42px rgba(0,255,143,0.18)' 
    : '0 18px 42px rgba(0,102,255,0.25)'
  
  return (
    <motion.div
      className={clsx(
        'relative overflow-hidden rounded-2xl bg-white/40 dark:bg-[#0A0A0A]/30 backdrop-blur-xl text-gray-800 dark:text-white/85',
        bordered ? 'border border-gray-200 dark:border-white/10' : '',
        'shadow-lg dark:shadow-neon-card transition-colors duration-200 ease-apple',
        className
      )}
      whileHover={{ scale: 1.02, y: -3, boxShadow: hoverShadow }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      layout={false}
    >
      <div className="absolute inset-0 opacity-0 mix-blend-screen blur-3xl transition duration-300 group-hover:opacity-70 pointer-events-none" />
      {children}
    </motion.div>
  )
}

export default memo(NeonCard)
