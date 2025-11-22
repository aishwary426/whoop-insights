'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface AuthCardProps {
  children: ReactNode
  title: string
  subtitle: string
}

export default function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-white/90 dark:bg-[#0A0A0A]/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Subtle neon glow effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 dark:bg-neon/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{title}</h1>
            {subtitle && <p className="text-gray-600 dark:text-white/60 text-sm">{subtitle}</p>}
          </div>
          {children}
        </div>
      </motion.div>
    </div>
  )
}
