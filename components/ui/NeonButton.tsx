'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import { ReactNode } from 'react'
import clsx from 'clsx'

type Variant = 'primary' | 'secondary' | 'ghost' | 'subtle'

interface NeonButtonProps extends HTMLMotionProps<"button"> {
  children: ReactNode
  variant?: Variant
  fullWidth?: boolean
}

const ease: any = [0.16, 1, 0.3, 1]

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
      'bg-neon text-black shadow-neon-soft px-8 py-4 border border-neon/80 hover:shadow-neon-soft hover:scale-105 active:scale-95',
    secondary:
      'bg-transparent text-white px-8 py-4 border border-neon/50 hover:bg-neon/10 hover:border-neon hover:text-neon active:scale-95',
    ghost:
      'bg-transparent text-white/70 px-6 py-3 hover:text-white hover:bg-white/5',
    subtle:
      'bg-white/5 text-white px-4 py-2 border border-white/5 hover:border-neon/50 hover:text-neon/90',
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
