'use client'

import Link from 'next/link'
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion'
import { ArrowRight, Check, Zap, Target, TrendingUp, Shield } from 'lucide-react'
import AppLayout from '../components/layout/AppLayout'
import { useEffect, useState, useRef } from 'react'

export default function LandingPage() {
  const { scrollY } = useScroll()
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  
  // Parallax transforms
  const blob1Y = useTransform(scrollY, [0, 1000], [0, -200])
  const blob2Y = useTransform(scrollY, [0, 1000], [0, 200])
  const blob3Y = useTransform(scrollY, [0, 1000], [0, -150])
  
  // Smooth mouse tracking
  const springConfig = { damping: 50, stiffness: 100 }
  const cursorX = useSpring(mouseX, springConfig)
  const cursorY = useSpring(mouseY, springConfig)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  // Animated counter component
  const AnimatedCounter = ({ value, suffix = '', duration = 2 }: { value: number, suffix?: string, duration?: number }) => {
    const [count, setCount] = useState(0)
    const [isVisible, setIsVisible] = useState(false)
    const ref = useRef<HTMLSpanElement>(null)

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true)
          }
        },
        { threshold: 0.5 }
      )
      if (ref.current) observer.observe(ref.current)
      return () => observer.disconnect()
    }, [isVisible])

    useEffect(() => {
      if (!isVisible) return
      let startTime: number | null = null
      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime
        const progress = Math.min((currentTime - startTime) / (duration * 1000), 1)
        setCount(Math.floor(progress * value))
        if (progress < 1) requestAnimationFrame(animate)
      }
      requestAnimationFrame(animate)
    }, [isVisible, value, duration])

    return <span ref={ref}>{count}{suffix}</span>
  }

  return (
    <AppLayout>
      {/* Animated Background Blobs with Parallax */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          className="gradient-blob w-96 h-96 bg-purple-500 top-0 left-1/4"
          style={{ y: blob1Y }}
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="gradient-blob w-96 h-96 bg-pink-500 bottom-0 right-1/4"
          style={{ y: blob2Y }}
          animate={{
            x: [0, -40, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="gradient-blob w-96 h-96 bg-blue-500 top-1/2 left-1/2"
          style={{ y: blob3Y }}
          animate={{
            x: [0, 60, 0],
            y: [0, -40, 0],
            scale: [1, 0.9, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Interactive cursor glow effect */}
        <motion.div
          className="absolute w-96 h-96 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-3xl pointer-events-none"
          style={{
            x: useTransform(cursorX, (x) => x - 192),
            y: useTransform(cursorY, (y) => y - 192),
          }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div 
                className="inline-block px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.span 
                  className="text-sm font-medium text-purple-300"
                  animate={{ opacity: [1, 0.7, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  AI for WHOOP athletes
                </motion.span>
              </motion.div>
              
              <motion.h1 
                className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                Your Personal AI
                <motion.span 
                  className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent inline-block"
                  animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  style={{
                    backgroundSize: '200% 200%',
                  }}
                >
                  {' '}Recovery & Training{' '}
                </motion.span>
                Coach
              </motion.h1>
              
              <motion.p 
                className="text-xl text-slate-300 mb-8 leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                Upload your WHOOP data and get science-backed training plans, 
                recovery forecasts, and performance insights tailored just for you.
              </motion.p>

              <motion.div 
                className="flex flex-col sm:flex-row gap-4 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <Link href="/signup">
                  <motion.button 
                    className="btn-primary text-lg px-8 py-4 relative overflow-hidden group"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      initial={false}
                    />
                    <span className="relative z-10 flex items-center">
                      Start Free Trial
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </motion.div>
                    </span>
                  </motion.button>
                </Link>
                <motion.button 
                  className="btn-ghost text-lg px-8 py-4"
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  Watch Demo
                </motion.button>
              </motion.div>

              <motion.div 
                className="flex items-center gap-6 text-sm text-slate-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                {['Faster Recovery', 'Smarter Workouts', 'Burnout Prevention'].map((text, idx) => (
                  <motion.span 
                    key={text}
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 + idx * 0.1 }}
                    whileHover={{ scale: 1.1, color: 'rgb(255, 255, 255)' }}
                  >
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: idx * 0.3 }}
                    >
                      <Check className="w-4 h-4 text-green-400" />
                    </motion.div>
                    {text}
                  </motion.span>
                ))}
              </motion.div>
            </motion.div>

            {/* Right: Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
              whileHover={{ scale: 1.02 }}
            >
              <motion.div 
                className="glass-card p-8 relative overflow-hidden"
                whileHover={{ 
                  boxShadow: '0 20px 60px rgba(139, 92, 246, 0.3)',
                }}
              >
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10"
                  animate={{
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                
                <div className="relative space-y-6">
                  <motion.div 
                    className="text-sm font-medium text-slate-400 mb-4"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    Today's Overview
                  </motion.div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <motion.div 
                      className="stat-card"
                      whileHover={{ scale: 1.05, y: -5 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <motion.div 
                        className="text-4xl mb-2"
                        animate={{ 
                          scale: [1, 1.2, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        💚
                      </motion.div>
                      <div className="text-3xl font-bold text-green-400 mb-1">
                        <AnimatedCounter value={87} suffix="%" />
                      </div>
                      <div className="text-sm text-slate-400">Recovery</div>
                    </motion.div>
                    <motion.div 
                      className="stat-card"
                      whileHover={{ scale: 1.05, y: -5 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <motion.div 
                        className="text-4xl mb-2"
                        animate={{ 
                          scale: [1, 1.1, 1],
                          rotate: [0, -10, 10, 0]
                        }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                      >
                        ⚡
                      </motion.div>
                      <div className="text-3xl font-bold text-amber-400 mb-1">
                        <AnimatedCounter value={12} suffix=".4" />
                      </div>
                      <div className="text-sm text-slate-400">Avg Strain</div>
                    </motion.div>
                  </div>

                  <motion.div 
                    className="glass-card p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20"
                    whileHover={{ scale: 1.02 }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <div className="flex items-start gap-3">
                      <motion.div 
                        className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0"
                        animate={{ 
                          rotate: [0, 360],
                          scale: [1, 1.1, 1]
                        }}
                        transition={{ 
                          rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                          scale: { duration: 2, repeat: Infinity }
                        }}
                      >
                        <Zap className="w-4 h-4 text-green-400" />
                      </motion.div>
                      <div>
                        <div className="font-semibold mb-1">High Recovery Day</div>
                        <div className="text-sm text-slate-400">Perfect for HIIT or strength training</div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-20 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-slate-400">Get started in three simple steps</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Target className="w-8 h-8" />,
                title: 'Connect Your Data',
                description: 'Upload your WHOOP export or connect your account securely'
              },
              {
                icon: <Zap className="w-8 h-8" />,
                title: 'AI Analysis',
                description: 'Our neural networks analyze your recovery, strain, and sleep patterns'
              },
              {
                icon: <TrendingUp className="w-8 h-8" />,
                title: 'Get Insights',
                description: 'Receive daily training plans and long-term performance forecasts'
              }
            ].map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="stat-card text-center relative group"
                whileHover={{ y: -10, scale: 1.02 }}
              >
                <motion.div 
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-6 relative overflow-hidden"
                  whileHover={{ scale: 1.1, rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-purple-500/40 to-pink-500/40 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                  <motion.div
                    className="relative z-10"
                    animate={{ 
                      scale: [1, 1.1, 1],
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      delay: idx * 0.3
                    }}
                  >
                    {step.icon}
                  </motion.div>
                </motion.div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-slate-400">{step.description}</p>
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative py-20 bg-white/5 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for Elite Athletes</h2>
            <p className="text-xl text-slate-400">Everything you need to optimize performance</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '🤖', title: 'AI Predictions', desc: '85% accuracy in recovery forecasting' },
              { icon: '🎯', title: 'Smart Training', desc: 'ML-powered workout optimization' },
              { icon: '📊', title: 'Deep Analytics', desc: 'Comprehensive performance insights' },
              { icon: '📅', title: 'Weekly Plans', desc: 'AI-generated training schedules' },
              { icon: '🔥', title: 'Streak Tracking', desc: 'Gamified progress monitoring' },
              { icon: '⚡', title: 'Real-time Sync', desc: 'Instant data processing' }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                viewport={{ once: true }}
                className="stat-card group relative overflow-hidden"
                whileHover={{ y: -8, scale: 1.03 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                />
                <motion.div 
                  className="text-5xl mb-4 relative z-10"
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    delay: idx * 0.2
                  }}
                  whileHover={{ scale: 1.3, rotate: 360 }}
                >
                  {feature.icon}
                </motion.div>
                <h3 className="text-lg font-semibold mb-2 relative z-10">{feature.title}</h3>
                <p className="text-slate-400 text-sm relative z-10">{feature.desc}</p>
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative py-20 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple Pricing</h2>
            <p className="text-xl text-slate-400">Start free. Upgrade when ready.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Free */}
            <motion.div 
              className="glass-card p-8 relative group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
            >
              <h3 className="text-xl font-bold mb-2">Free</h3>
              <motion.div 
                className="text-4xl font-bold mb-6"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", delay: 0.2 }}
              >
                $0
              </motion.div>
              <ul className="space-y-3 mb-8">
                {['Basic dashboard', 'Last 30 days', 'Manual upload'].map((item, idx) => (
                  <motion.li 
                    key={item}
                    className="flex items-center gap-2 text-sm"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + idx * 0.1 }}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: idx * 0.3 }}
                    >
                      <Check className="w-5 h-5 text-green-400" />
                    </motion.div>
                    {item}
                  </motion.li>
                ))}
              </ul>
              <Link href="/signup">
                <motion.button 
                  className="btn-ghost w-full"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Get Started
                </motion.button>
              </Link>
            </motion.div>

            {/* Pro */}
            <motion.div 
              className="glass-card p-8 relative border-2 border-purple-500/50 group"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -15, scale: 1.05 }}
            >
              <motion.div 
                className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-1 rounded-full text-sm font-semibold"
                animate={{ 
                  scale: [1, 1.05, 1],
                  boxShadow: ['0 0 0px rgba(139, 92, 246, 0)', '0 0 20px rgba(139, 92, 246, 0.5)', '0 0 0px rgba(139, 92, 246, 0)']
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Most Popular
              </motion.div>
              <h3 className="text-xl font-bold mb-2">Pro</h3>
              <motion.div 
                className="text-4xl font-bold mb-6"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", delay: 0.3 }}
              >
                $<AnimatedCounter value={10} />
                <span className="text-lg text-slate-400">/mo</span>
              </motion.div>
              <ul className="space-y-3 mb-8">
                {['Everything in Free', 'AI predictions', 'Unlimited history', 'Weekly plans', 'PDF reports'].map((item, idx) => (
                  <motion.li 
                    key={item}
                    className="flex items-center gap-2 text-sm"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + idx * 0.1 }}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: idx * 0.2 }}
                    >
                      <Check className="w-5 h-5 text-green-400" />
                    </motion.div>
                    {item}
                  </motion.li>
                ))}
              </ul>
              <Link href="/signup">
                <motion.button 
                  className="btn-primary w-full relative overflow-hidden"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  />
                  <span className="relative z-10">Start Free Trial</span>
                </motion.button>
              </Link>
            </motion.div>

            {/* Elite */}
            <motion.div 
              className="glass-card p-8 relative group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -10, scale: 1.02 }}
            >
              <h3 className="text-xl font-bold mb-2">Elite</h3>
              <motion.div 
                className="text-4xl font-bold mb-6"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", delay: 0.4 }}
              >
                $<AnimatedCounter value={20} />
                <span className="text-lg text-slate-400">/mo</span>
              </motion.div>
              <ul className="space-y-3 mb-8">
                {['Everything in Pro', 'Custom models', 'API access', 'Priority support'].map((item, idx) => (
                  <motion.li 
                    key={item}
                    className="flex items-center gap-2 text-sm"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 + idx * 0.1 }}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: idx * 0.3 }}
                    >
                      <Check className="w-5 h-5 text-green-400" />
                    </motion.div>
                    {item}
                  </motion.li>
                ))}
              </ul>
              <Link href="/signup">
                <motion.button 
                  className="btn-ghost w-full"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Contact Sales
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-20 z-10">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card p-12 relative overflow-hidden group"
            whileHover={{ scale: 1.02 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20"
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{
                backgroundSize: '200% 200%',
              }}
            />
            <div className="relative z-10">
              <motion.h2 
                className="text-3xl md:text-4xl font-bold mb-6"
                animate={{ 
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{
                  background: 'linear-gradient(90deg, #fff, #a855f7, #ec4899, #fff)',
                  backgroundSize: '200% 200%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Ready to Unlock Your Potential?
              </motion.h2>
              <motion.p 
                className="text-xl text-slate-400 mb-8"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Join elite athletes using AI to reach peak performance
              </motion.p>
              <Link href="/signup">
                <motion.button 
                  className="btn-primary text-lg px-10 py-4 relative overflow-hidden group/btn"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover/btn:opacity-100 transition-opacity"
                  />
                  <span className="relative z-10 flex items-center justify-center">
                    Start Free Today
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </motion.div>
                  </span>
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Target className="w-6 h-6" />
              <span className="font-bold">Whoop Insights Pro</span>
            </div>
            <div className="text-sm text-slate-400">
              © 2025 Whoop Insights Pro. Built for athletes.
            </div>
            <div className="flex gap-6 text-sm text-slate-400">
              <a href="#" className="hover:text-white transition">Privacy</a>
              <a href="#" className="hover:text-white transition">Terms</a>
              <a href="#" className="hover:text-white transition">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </AppLayout>
  )
}
