'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, useScroll } from 'framer-motion'
import { Target, Menu, User, LogOut, Settings } from 'lucide-react'
import { useState, useEffect } from 'react'

interface AppLayoutProps {
  children: React.ReactNode
  user?: {
    name?: string
    email?: string
  }
}

export default function AppLayout({ children, user }: AppLayoutProps) {
  const pathname = usePathname()
  const { scrollY } = useScroll()
  const [isScrolled, setIsScrolled] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    return scrollY.onChange((latest) => {
      setIsScrolled(latest > 50)
    })
  }, [scrollY])

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/upload', label: 'Upload Data' },
    { href: '/calorie-gps', label: 'Calorie GPS' },
  ]

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'glass-nav' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Target className="w-6 h-6 text-white" />
              </div>
              <span className="text-lg font-bold">Whoop Insights Pro</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              {user ? (
                <>
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`text-sm font-medium transition-colors ${
                        pathname === item.href
                          ? 'text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </>
              ) : (
                <>
                  <a href="#features" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                    Features
                  </a>
                  <a href="#pricing" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                    Pricing
                  </a>
                </>
              )}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-semibold text-sm hover:scale-110 transition-transform"
                  >
                    {user.name?.charAt(0) || 'U'}
                  </button>
                  
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute right-0 mt-2 w-48 glass-card p-2"
                    >
                      <div className="px-3 py-2 border-b border-white/10">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                      <button className="w-full px-3 py-2 text-left text-sm hover:bg-white/5 rounded-lg flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Settings
                      </button>
                      <button className="w-full px-3 py-2 text-left text-sm hover:bg-white/5 rounded-lg flex items-center gap-2 text-red-400">
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </div>
              ) : (
                <>
                  <Link href="/login">
                    <button className="btn-ghost">Sign In</button>
                  </Link>
                  <Link href="/signup">
                    <button className="btn-primary">Get Started</button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Main Content */}
      <main className="pt-16">
        {children}
      </main>
    </div>
  )
}
