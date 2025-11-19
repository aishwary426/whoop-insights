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
      setIsScrolled(latest > 20)
    })
  }, [scrollY])

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/upload', label: 'Upload' },
    { href: '/calorie-gps', label: 'Calorie GPS' },
  ]

  return (
    <div className="min-h-screen bg-bgDark text-white font-sans selection:bg-neon selection:text-black">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-bgDark/80 backdrop-blur-md border-b border-white/5 py-4' : 'bg-transparent py-6'
          }`}
      >
        <div className="w-full px-6 md:px-8">
          <div className="flex items-center justify-between">
            {/* Left Side: Logo + Navigation */}
            <div className="flex items-center gap-12">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-3 group" aria-label="Whoop Insights Pro home">
                <div className="w-8 h-8 rounded-full bg-neon/10 flex items-center justify-center group-hover:bg-neon/20 transition-colors">
                  <Target className="w-4 h-4 text-neon" />
                </div>
                <span className="text-sm font-medium tracking-wide text-white/90 group-hover:text-white transition-colors">Whoop Insights Pro</span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-8">
                {user
                  ? navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`text-sm font-medium transition-colors ${pathname === item.href ? 'text-white' : 'text-white/60 hover:text-white'
                        }`}
                    >
                      {item.label}
                    </Link>
                  ))
                  : null
                }
              </div>
            </div>

            {/* Right side: User Menu */}
            <div className="flex items-center gap-4">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-medium text-xs text-white hover:bg-white/20 transition-colors"
                    aria-label="User menu"
                  >
                    {user.name?.charAt(0) || 'U'}
                  </button>

                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className="absolute right-0 mt-2 w-56 bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden p-1"
                    >
                      <div className="px-3 py-2 border-b border-white/5 mb-1">
                        <p className="text-sm font-medium text-white">{user.name}</p>
                        <p className="text-xs text-white/40 truncate">{user.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          setShowUserMenu(false)
                          router.push('/settings')
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2 transition-colors"
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
                        className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                      >
                        <LogOut className="w-4 h-4" />
                        {isSigningOut ? 'Signing out...' : 'Sign Out'}
                      </button>
                    </motion.div>
                  )}
                </div>
              ) : (
                <Link href="/signup">
                  <NeonButton className="text-sm px-5 py-2.5" variant="primary">
                    Get Started
                  </NeonButton>
                </Link>
              )}
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  )
}
