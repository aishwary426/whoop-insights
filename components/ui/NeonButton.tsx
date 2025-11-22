'use client'

import { ReactNode } from 'react'
import clsx from 'clsx'

type Variant = 'primary' | 'secondary' | 'ghost' | 'subtle'

interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: Variant
  fullWidth?: boolean
}

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
      'bg-neon text-black shadow-neon-soft px-4 py-2 md:px-8 md:py-4 text-sm md:text-base border border-neon/80 hover:shadow-neon-soft hover:scale-105 active:scale-95',
    secondary:
      'bg-transparent text-gray-900 dark:text-white px-4 py-2 md:px-8 md:py-4 text-sm md:text-base border border-gray-300 dark:border-neon/50 hover:bg-gray-100 dark:hover:bg-neon/10 hover:border-gray-400 dark:hover:border-neon hover:text-gray-900 dark:hover:text-neon active:scale-95',
    ghost:
      'bg-transparent text-gray-600 dark:text-white/70 px-3 py-1.5 md:px-6 md:py-3 text-sm md:text-base hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5',
    subtle:
      'bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base border border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-neon/50 hover:text-gray-900 dark:hover:text-neon/90',
  }

  return (
    <button
      {...rest}
      className={clsx(base, variants[variant], fullWidth && 'w-full', className)}
    >
      {children}
    </button>
  )
}
