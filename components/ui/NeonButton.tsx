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
  const base = 'relative inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-300 ease-apple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/60 dark:focus-visible:ring-neon-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black overflow-hidden group'

  const variants: Record<Variant, string> = {
    primary:
      'bg-blue-600 dark:bg-neon text-white dark:text-black shadow-neon-soft-light dark:shadow-neon-soft px-3 py-1.5 md:px-5 md:py-2.5 text-sm md:text-base border border-blue-600/80 dark:border-neon/80 before:absolute before:-inset-[2px] before:rounded-full before:bg-gradient-to-r before:from-blue-400/0 before:via-blue-400/80 before:to-blue-400/0 dark:before:from-neon/0 dark:before:via-neon/80 dark:before:to-neon/0 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300 before:animate-border-glow before:-z-10 active:scale-95',
    secondary:
      'bg-transparent text-gray-900 dark:text-white px-3 py-1.5 md:px-5 md:py-2.5 text-sm md:text-base border border-gray-300 dark:border-neon/50 hover:bg-gray-100 dark:hover:bg-neon/10 hover:text-blue-600 dark:hover:text-neon before:absolute before:-inset-[2px] before:rounded-full before:bg-gradient-to-r before:from-blue-400/0 before:via-blue-400/70 before:to-blue-400/0 dark:before:from-neon/0 dark:before:via-neon/70 dark:before:to-neon/0 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300 before:animate-border-glow before:-z-10 active:scale-95',
    ghost:
      'bg-transparent text-gray-600 dark:text-white/70 px-2.5 py-1 md:px-4 md:py-1.5 text-sm md:text-base hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 before:absolute before:-inset-[1px] before:rounded-full before:bg-gradient-to-r before:from-gray-400/0 before:via-gray-400/50 before:to-gray-400/0 dark:before:from-white/0 dark:before:via-white/50 dark:before:to-white/0 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300 before:animate-border-glow before:-z-10 active:scale-95',
    subtle:
      'bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white px-2.5 py-1 md:px-3.5 md:py-1.5 text-sm md:text-base border border-gray-200 dark:border-white/5 hover:text-blue-600 dark:hover:text-neon/90 before:absolute before:-inset-[1px] before:rounded-full before:bg-gradient-to-r before:from-blue-400/0 before:via-blue-400/60 before:to-blue-400/0 dark:before:from-neon/0 dark:before:via-neon/60 dark:before:to-neon/0 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300 before:animate-border-glow before:-z-10 active:scale-95',
  }

  return (
    <button
      {...rest}
      className={clsx(base, variants[variant], fullWidth && 'w-full', className)}
    >
      <span className="relative z-10">{children}</span>
    </button>
  )
}
