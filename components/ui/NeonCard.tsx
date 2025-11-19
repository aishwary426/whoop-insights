'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import clsx from 'clsx'

interface NeonCardProps {
  children: ReactNode
  className?: string
  bordered?: boolean
}

export default function NeonCard({ children, className, bordered = true }: NeonCardProps) {
  return (
    <motion.div
      className={clsx(
        'relative overflow-hidden rounded-2xl bg-[#0A0A0A] text-white/85',
        bordered ? 'border border-white/10' : '',
        'shadow-neon-card transition duration-200 ease-apple',
        className
      )}
      whileHover={{ scale: 1.02, y: -3, boxShadow: '0 18px 42px rgba(0,255,143,0.18)' }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute inset-0 opacity-0 mix-blend-screen blur-3xl transition duration-300 group-hover:opacity-70 pointer-events-none" />
      {children}
    </motion.div>
  )
}
