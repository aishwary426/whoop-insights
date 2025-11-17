'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { Target } from 'lucide-react'

interface AuthCardProps {
  children: ReactNode
  title: string
  subtitle: string
}

export default function AuthCard({ children, title, subtitle }: AuthCardProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0">
        <div className="gradient-blob w-96 h-96 bg-purple-500 top-0 left-1/4" />
        <div className="gradient-blob w-96 h-96 bg-pink-500 bottom-0 right-1/4" />
        <div className="gradient-blob w-96 h-96 bg-blue-500 top-1/2 right-1/3" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Target className="w-7 h-7 text-white" />
          </div>
          <span className="text-xl font-bold">Whoop Insights Pro</span>
        </Link>

        {/* Card */}
        <div className="glass-card p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">{title}</h1>
            <p className="text-slate-400">{subtitle}</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
