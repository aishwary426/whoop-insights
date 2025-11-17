'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { motion, useScroll } from 'framer-motion'
import { Target, LogOut, Settings } from 'lucide-react'
import { useState, useEffect } from 'react'
import { signOut } from '../../lib/supabase'
import NeonButton from '../ui/NeonButton'

interface AppLayoutProps {
  children: React.ReactNode
  user?: {
    name?: string
    email?: string
  }
}

export default function AppLayout({ children, user }: AppLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { scrollY } = useScroll()
  const [isScrolled, setIsScrolled] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    return scrollY.onChange((latest) => {
      setIsScrolled(latest > 50)
    })
  }, [scrollY])

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/upload', label: 'Upload' },
    { href: '/calorie-gps', label: 'Calorie GPS' },
  ]

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'glass-nav border-white/5' : 'bg-[#050505]/70'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-14 md:h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group" aria-label="Whoop Insights Pro home">
              <div className="w-9 h-9 rounded-xl bg-neon-primary/15 border border-neon-primary/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Target className="w-5 h-5 text-neon-primary" />
              </div>
              <span className="text-sm md:text-base font-semibold tracking-tight">Whoop Insights Pro</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              {user
                ? navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`text-sm font-medium transition-colors ${
                        pathname === item.href ? 'text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))
                : (
                  <>
                    <Link href="#story" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                      What it does
                    </Link>
                    <Link href="#pricing" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                      Pricing
                    </Link>
                  </>
                )
              }
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="w-9 h-9 rounded-full bg-neon-primary/20 border border-neon-primary/40 flex items-center justify-center font-semibold text-sm text-neon-primary hover:scale-105 transition-transform"
                    aria-label="User menu"
                  >
                    {user.name?.charAt(0) || 'U'}
                  </button>
                  
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute right-0 mt-2 w-52 glass-card p-2"
                    >
                      <div className="px-3 py-2 border-b border-white/10">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          setShowUserMenu(false)
                          router.push('/settings')
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-white/5 rounded-lg flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </button>
                      <button
                        disabled={isSigningOut}
                        onClick={async () => {
                          setIsSigningOut(true)
                          try {
                            await signOut()
                            setShowUserMenu(false)
                            router.push('/login')
                          } catch (err) {
                            console.error('Sign out failed', err)
                          } finally {
                            setIsSigningOut(false)
                          }
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-white/5 rounded-lg flex items-center gap-2 text-red-400 disabled:opacity-70"
                      >
                        <LogOut className="w-4 h-4" />
                        {isSigningOut ? 'Signing out...' : 'Sign Out'}
                      </button>
                    </motion.div>
                  )}
                </div>
              ) : (
                <Link href="/signup" className="hidden sm:inline-block">
                  <NeonButton className="text-sm px-4 py-2" variant="primary">
                    Get Started
                  </NeonButton>
                </Link>
              )}
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Main Content */}
      <main className="pt-16 md:pt-20">
        {children}
      </main>
    </div>
  )
}
