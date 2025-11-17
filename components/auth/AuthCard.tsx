'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { Target } from 'lucide-react'
import { ParallaxBackground } from '../ui/ParallaxBlob'

interface AuthCardProps {
  children: ReactNode
  title: string
  subtitle: string
}

export default function AuthCard({ children, title, subtitle }: AuthCardProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-[#050505]">
      <ParallaxBackground />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(0,255,143,0.08),transparent_35%)]" />

      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-11 h-11 rounded-xl border border-neon-primary/40 bg-neon-primary/10 flex items-center justify-center shadow-neon-card">
            <Target className="w-6 h-6 text-neon-primary" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Whoop Insights Pro</span>
        </Link>

        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-neon-card">
          <div className="text-center mb-7 space-y-2">
            <h1 className="text-3xl font-semibold">{title}</h1>
            <p className="text-white/60 text-sm leading-relaxed max-w-md mx-auto">{subtitle}</p>
            <div className="inline-flex items-center gap-2 rounded-full border border-neon-primary/30 bg-neon-primary/10 px-3 py-1 text-[11px] font-semibold text-white/80">
              <span className="h-1.5 w-1.5 rounded-full bg-neon-primary animate-pulse" /> Secure · Private · AI-ready
            </div>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
