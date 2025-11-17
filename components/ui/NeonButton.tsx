'use client'

import { motion } from 'framer-motion'
import { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

type Variant = 'primary' | 'ghost' | 'subtle'

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: Variant
  fullWidth?: boolean
}

const ease = [0.16, 1, 0.3, 1]

export default function NeonButton({
  children,
  variant = 'primary',
  fullWidth = false,
  className,
  ...rest
}: NeonButtonProps) {
  const base = 'relative inline-flex items-center justify-center gap-2 rounded-full font-semibold transition duration-200 ease-apple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black'

  const variants: Record<Variant, string> = {
    primary:
      'bg-neon-primary text-black shadow-neon-soft px-5 py-3 border border-neon-primary/80 hover:shadow-neon-soft hover:-translate-y-0.5 active:translate-y-0',
    ghost:
      'bg-black/60 text-white px-5 py-3 border border-white/10 hover:border-neon-primary/60 hover:text-neon-primary',
    subtle:
      'bg-white/5 text-white px-4 py-2 border border-white/5 hover:border-neon-primary/50 hover:text-neon-primary/90',
  }

  return (
    <motion.button
      {...rest}
      className={clsx(base, variants[variant], fullWidth && 'w-full', className)}
      whileHover={{ scale: 1.03, transition: { duration: 0.18, ease } }}
      whileTap={{ scale: 0.96, transition: { duration: 0.12, ease } }}
    >
      {children}
    </motion.button>
  )
}
