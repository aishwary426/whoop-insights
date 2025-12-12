'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { LogOut, Settings, Menu, X, PenTool } from 'lucide-react'
import { useState, useEffect } from 'react'
import { signOut } from '../../lib/auth'
import NeonButton from '../ui/NeonButton'
import ThemeToggle from '../ui/ThemeToggle'
import Footer from './Footer'


interface AppLayoutProps {
  children: React.ReactNode
  user?: {
    name?: string
    email?: string
    user_metadata?: {
      name?: string
    }
  }
}

export default function AppLayout({ children, user }: AppLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { scrollY } = useScroll()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Optimize scroll animations using transforms instead of state to prevent re-renders
  const navBackgroundOpacity = useTransform(scrollY, [0, 20], [0, 0.8])
  const navBorderOpacity = useTransform(scrollY, [0, 20], [0, 1])
  const navPadding = useTransform(scrollY, [0, 20], ["1.5rem", "1rem"]) // py-6 (24px) to py-4 (16px)
  const navBackdropBlur = useTransform(scrollY, [0, 20], ["blur(0px)", "blur(12px)"])

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/daily-log', label: 'Daily Log' },
    { href: '/advanced-analytics', label: 'Advanced Analytics' },
    { href: '/upload', label: 'Upload' },
    { href: '/gps-burn-analytics', label: 'Calorie Burn Analytics' },
    { href: '/zenith', label: 'Zenith' },
  ]

  return (
    <div className="min-h-screen bg-transparent text-gray-900 dark:text-white font-sans selection:bg-blue-600 dark:selection:bg-neon selection:text-white dark:selection:text-black">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          paddingTop: navPadding,
          paddingBottom: navPadding,
        }}
        className="fixed top-0 left-0 right-0 z-50 transition-colors duration-300"
      >
        {/* Animated Background Layer */}
        <motion.div
          className="absolute inset-0 bg-white dark:bg-bgDark border-b border-gray-200 dark:border-white/5"
          style={{
            opacity: navBackgroundOpacity,
            backdropFilter: navBackdropBlur,
            borderColor: `rgba(255, 255, 255, ${navBorderOpacity})` // This might need adjustment for dark/light mode border colors
          }}
        />

        {/* Content Layer */}
        <div className="relative w-full px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Left Side: Logo */}
            <div className="flex items-center gap-4 md:gap-12">
              {/* Logo */}
              <Link href="/dashboard" className="flex items-center gap-2 md:gap-3 group" aria-label="Data insights dashboard">
                <span className="text-xl md:text-2xl font-bold tracking-wide text-neon-light dark:text-neon transition-colors">
                  DATA INSIGHTS
                </span>
              </Link>
            </div>

            {/* Right side: Desktop Navigation + Mobile Menu Button + Theme Toggle + User Menu */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Desktop Navigation */}
              {pathname !== '/' && (
                <div className="hidden md:flex items-center gap-8">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`text-sm font-medium transition-colors uppercase ${pathname === item.href ? 'text-neon-light dark:text-neon' : 'text-gray-700 dark:text-white/60 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
              {/* Mobile Menu Button */}
              {pathname !== '/' && (
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden w-9 h-9 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                  aria-label="Menu"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              )}
              <ThemeToggle />
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center font-medium text-xs text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-colors uppercase"
                    aria-label="User menu"
                  >
                    {(user.user_metadata?.name || user.name)?.split(' ')[0]?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                  </button>

                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden p-1"
                    >
                      <div className="px-3 py-2 border-b border-gray-100 dark:border-white/5 mb-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{user.user_metadata?.name || user.name || 'User'}</p>
                        <p className="text-xs text-gray-600 dark:text-white/40 truncate">{user.email}</p>
                      </div>
                      {/* Admin Menu - Admin Only */}
                      {user.email?.toLowerCase() === 'ctaishwary@gmail.com' && (
                        <button
                          onClick={() => {
                            setShowUserMenu(false)
                            router.push('/admin/blog')
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-blue-600 dark:text-neon-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg flex items-center gap-2 transition-colors"
                        >
                          <PenTool className="w-4 h-4" />
                          Write blog
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setShowUserMenu(false)
                          router.push('/settings')
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-white/70 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg flex items-center gap-2 transition-colors"
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
                        className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                      >
                        <LogOut className="w-4 h-4" />
                        {isSigningOut ? 'Signing out...' : 'Sign Out'}
                      </button>
                    </motion.div>
                  )}
                </div>
              ) : (
                <Link href="/login">
                  <NeonButton className="text-xs md:text-sm px-3 md:px-5 py-2 md:py-2.5" variant="primary">
                    Login
                  </NeonButton>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t border-gray-200 dark:border-white/10 bg-white dark:bg-bgDark backdrop-blur-xl"
            >
              <div className="px-6 py-4 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors uppercase ${pathname === item.href
                      ? 'text-neon-light dark:text-neon bg-gray-100 dark:bg-white/10'
                      : 'text-gray-700 dark:text-white/60 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
                      }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Main Content */}
      <main>
        {children}
      </main>
      {pathname !== '/zenith' && <Footer />}
    </div>
  )
}
