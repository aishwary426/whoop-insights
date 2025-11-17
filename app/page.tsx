'use client'

import Link from 'next/link'
<<<<<<< HEAD
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion'
import { ArrowRight, Check, Zap, Target, TrendingUp, Shield } from 'lucide-react'
import AppLayout from '../components/layout/AppLayout'
import { useEffect, useState, useRef } from 'react'
=======
import { motion } from 'framer-motion'
import { ArrowUpRight, Play, Activity, HeartPulse, BarChart3, Users } from 'lucide-react'
import AppLayout from '../components/layout/AppLayout'
import NeonButton from '../components/ui/NeonButton'
import NeonCard from '../components/ui/NeonCard'
import { ParallaxBackground } from '../components/ui/ParallaxBlob'

const ease = [0.16, 1, 0.3, 1]

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 0.6, delay, ease },
})

const features = [
  { title: 'Readiness', desc: 'HRV, RHR, sleep, and strain fused into a single green-or-not signal.', icon: Activity },
  { title: 'Load guardrails', desc: 'Acute:chronic and deload prompts so you push without digging a hole.', icon: BarChart3 },
  { title: 'Recovery cues', desc: 'Precise bedtime, hydration, and breathwork nudges from your WHOOP trends.', icon: HeartPulse },
]

const personas = [
  { name: 'Endurance athlete', copy: 'Plan long blocks without red-lining HRV.', accent: 'from-emerald-500/20 to-cyan-500/10' },
  { name: 'Strength athlete', copy: 'Balance CNS strain with real-time readiness.', accent: 'from-green-500/20 to-lime-500/10' },
  { name: 'Busy founder', copy: 'Sleep + stress guardrails that fit 5 a.m. to midnight calendars.', accent: 'from-amber-500/15 to-neon-primary/10' },
]

const insightCards = [
  { label: 'Recovery', value: 84, baseline: 76 },
  { label: 'Strain', value: 62, baseline: 58 },
  { label: 'Sleep', value: 7.8, baseline: 7.1, suffix: 'h' },
]
>>>>>>> 57703a5 (Initial commit - Whoop Insights Pro)

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
<<<<<<< HEAD
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
=======
      <ParallaxBackground />
      <main className="relative min-h-screen bg-[#050505] text-white">
        <HeroSection />
        <WhatSection />
        <Features />
        <Insights />
        <Personas />
        <Pricing />
        <Footer />
      </main>
>>>>>>> 57703a5 (Initial commit - Whoop Insights Pro)
    </AppLayout>
  )
}

function HeroSection() {
  return (
    <section className="relative z-10 overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 md:px-6 pt-14 pb-16 md:pt-24 md:pb-24 grid md:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
        <div className="space-y-6">
          <motion.div {...fadeUp()}>
            <span className="inline-flex items-center gap-2 rounded-full border border-neon-primary/30 bg-neon-primary/10 px-3 py-1 text-xs font-medium text-white/85">
              <span className="h-1.5 w-1.5 rounded-full bg-neon-primary" />
              WHOOP Insights Pro · AI layer
            </span>
          </motion.div>

          <motion.h1
            {...fadeUp(0.05)}
            className="text-[clamp(2.4rem,6vw,3.8rem)] font-semibold leading-[1.05] tracking-tight"
          >
            Ultra-clear readiness, training guardrails, and coaching—designed for the green zone.
          </motion.h1>

          <motion.p
            {...fadeUp(0.12)}
            className="text-[clamp(1rem,2.5vw,1.25rem)] text-white/70 max-w-2xl"
          >
            Matte-black minimalism with neon focus. Every motion, CTA, and color is tied to the signal that matters: how ready you are today.
          </motion.p>

          <motion.div
            {...fadeUp(0.18)}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-3"
          >
            <Link href="/login" className="w-full sm:w-auto">
              <NeonButton className="w-full sm:w-auto" variant="primary">
                Login <ArrowUpRight className="w-4 h-4" />
              </NeonButton>
            </Link>
            <Link href="/demo" className="w-full sm:w-auto">
              <NeonButton variant="ghost" className="w-full sm:w-auto">
                <Play className="w-4 h-4" /> Watch demo
              </NeonButton>
            </Link>
          </motion.div>
        </div>

        <motion.div
          {...fadeUp(0.25)}
          className="relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-8 shadow-neon-card"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-neon-primary/5 to-transparent rounded-3xl" />
          <div className="relative space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">Today</p>
                <p className="text-4xl font-semibold text-neon-primary leading-tight">84%</p>
              </div>
              <div className="text-xs text-white/60">Recovery · WHOOP feed</div>
            </div>
            <div className="h-40 rounded-2xl border border-white/10 bg-black/40 p-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(0,255,143,0.05),transparent_35%)]" />
              <div className="absolute inset-x-3 top-1/2 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              <svg viewBox="0 0 320 140" className="w-full h-full text-neon-primary/70">
                <defs>
                  <linearGradient id="recoveryArea" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="rgba(0,255,143,0.35)" />
                    <stop offset="100%" stopColor="rgba(0,255,143,0)" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 90 C40 78, 80 70, 120 92 S200 130, 240 88 S320 64, 320 64 V140 H0 Z"
                  fill="url(#recoveryArea)"
                  className="animate-pulse-slow"
                />
                <path
                  d="M0 90 C40 78, 80 70, 120 92 S200 130, 240 88 S320 64, 320 64"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                  className="drop-shadow-[0_0_12px_rgba(0,255,143,0.25)]"
                />
                {[0, 40, 80, 120, 200, 240, 320].map((cx, idx) => {
                  const cyPoints = [90, 78, 70, 92, 130, 88, 64]
                  const cy = cyPoints[idx]
                  return (
                    <circle
                      key={cx}
                      cx={cx}
                      cy={cy}
                      r="5"
                      fill="#0A0A0A"
                      stroke={cy < 90 ? '#00FF8F' : '#f87171'}
                      strokeWidth="2"
                    />
                  )
                })}
              </svg>
              <div className="absolute bottom-3 right-4 text-[11px] text-white/60">Baseline auto-updates</div>
            </div>
            <div className="flex items-center justify-between text-sm text-white/70">
              <span>Baseline updates live as you adjust the window.</span>
              <span className="inline-flex items-center gap-2 text-neon-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-neon-primary" /> Real-time AI
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function WhatSection() {
  return (
    <section id="story" className="relative z-10 py-16 md:py-20">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <motion.div {...fadeUp()}>
          <h2 className="text-[clamp(2rem,4vw,2.8rem)] font-semibold tracking-tight text-white">
            What it does
          </h2>
          <p className="mt-4 text-[clamp(1rem,2.2vw,1.2rem)] text-white/70 leading-relaxed max-w-3xl">
            Whoop Insights Pro is a premium AI layer that cleans up the noise: crisp readiness cues, steady load guardrails, and tailored coaching moments that respect your real recovery baseline.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

function Features() {
  return (
    <section className="relative z-10 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6 grid gap-6 md:grid-cols-3">
        {features.map((f, i) => (
          <motion.div key={f.title} {...fadeUp(i * 0.06)}>
            <NeonCard className="p-6 border-white/10 group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <f.icon className="w-5 h-5 text-neon-primary" />
                  <h3 className="text-lg font-semibold text-white">{f.title}</h3>
                </div>
                <ArrowUpRight className="w-4 h-4 text-white/60 group-hover:text-neon-primary transition-colors" />
              </div>
              <p className="mt-3 text-sm text-white/70 leading-relaxed">{f.desc}</p>
            </NeonCard>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

function Insights() {
  return (
    <section className="relative z-10 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <motion.div {...fadeUp()}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-[clamp(1.6rem,3vw,2.2rem)] font-semibold">Insights preview</h3>
              <p className="text-sm text-white/60">Baseline visible. Recovery values flip green/red based on the latest window.</p>
            </div>
            <Link href="/dashboard">
              <NeonButton variant="subtle">Open dashboard</NeonButton>
            </Link>
          </div>
        </motion.div>
        <div className="grid sm:grid-cols-3 gap-4">
          {insightCards.map((card, idx) => {
            const above = card.value > card.baseline
            return (
              <motion.div key={card.label} {...fadeUp(idx * 0.08)}>
                <NeonCard className="p-5">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/50">
                    <span>{card.label}</span>
                    <span className="flex items-center gap-1">
                      baseline <span className="text-white/70">{card.baseline}{card.suffix || '%'}</span>
                    </span>
                  </div>
                  <div className="mt-2 flex items-end gap-2">
                    <span className={`text-4xl font-semibold ${above ? 'text-neon-primary' : 'text-rose-400'}`}>
                      {card.value}{card.suffix || '%'}
                    </span>
                    <span className={`text-sm flex items-center gap-1 ${above ? 'text-neon-primary' : 'text-rose-300/80'}`}>
                      {above ? '↑' : '↓'} {Math.abs(card.value - card.baseline)} {card.suffix || ''}
                    </span>
                  </div>
                </NeonCard>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function Personas() {
  return (
    <section className="relative z-10 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <motion.div {...fadeUp()}>
          <h3 className="text-[clamp(1.6rem,3vw,2.2rem)] font-semibold mb-6">For whom</h3>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-4">
          {personas.map((p, idx) => (
            <motion.div key={p.name} {...fadeUp(idx * 0.06)}>
              <NeonCard className={`p-5 bg-gradient-to-br ${p.accent}`}>
                <h4 className="text-lg font-semibold">{p.name}</h4>
                <p className="mt-2 text-sm text-white/70 leading-relaxed">{p.copy}</p>
              </NeonCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Pricing() {
  return (
    <section id="pricing" className="relative z-10 py-16 md:py-24">
      <div className="mx-auto max-w-4xl px-4 md:px-6">
        <motion.div
          {...fadeUp()}
          className="rounded-3xl border border-neon-primary/25 bg-white/5 backdrop-blur p-8 md:p-10 shadow-neon-card"
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-sm uppercase tracking-[0.2em] text-neon-primary">Pro</div>
              <div className="mt-2 text-4xl font-semibold text-white">$12<span className="text-sm text-white/60">/mo</span></div>
              <p className="mt-2 text-sm text-white/70 max-w-xl">
                Precision insights, weekly strategy, and recovery forecasting tuned to your WHOOP data. Built for athletes who want Apple-level polish, not dashboards.
              </p>
            </div>
            <Link href="/login">
              <NeonButton className="w-full sm:w-auto">Login</NeonButton>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-white/10 py-6 text-xs text-white/60">
      <div className="mx-auto max-w-6xl px-4 md:px-6 flex items-center justify-between">
        <span>© 2024 Whoop Insights Pro</span>
        <span className="text-neon-primary">Train smarter, stay neon</span>
      </div>
    </footer>
  )
}
