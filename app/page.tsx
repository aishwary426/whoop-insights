'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Check, Zap, Target, TrendingUp, Shield } from 'lucide-react'
import AppLayout from '../components/layout/AppLayout'

export default function LandingPage() {
  return (
    <AppLayout>
      {/* Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="gradient-blob w-96 h-96 bg-purple-500 top-0 left-1/4" />
        <div className="gradient-blob w-96 h-96 bg-pink-500 bottom-0 right-1/4" />
        <div className="gradient-blob w-96 h-96 bg-blue-500 top-1/2 left-1/2" />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-block px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
                <span className="text-sm font-medium text-purple-300">AI for WHOOP athletes</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">
                Your Personal AI
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> Recovery & Training </span>
                Coach
              </h1>
              
              <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                Upload your WHOOP data and get science-backed training plans, 
                recovery forecasts, and performance insights tailored just for you.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="/signup">
                  <button className="btn-primary text-lg px-8 py-4">
                    Start Free Trial
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </button>
                </Link>
                <button className="btn-ghost text-lg px-8 py-4">
                  Watch Demo
                </button>
              </div>

              <div className="flex items-center gap-6 text-sm text-slate-400">
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  Faster Recovery
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  Smarter Workouts
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  Burnout Prevention
                </span>
              </div>
            </motion.div>

            {/* Right: Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="glass-card p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10" />
                
                <div className="relative space-y-6">
                  <div className="text-sm font-medium text-slate-400 mb-4">Today's Overview</div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="stat-card">
                      <div className="text-4xl mb-2">💚</div>
                      <div className="text-3xl font-bold text-green-400 mb-1">87%</div>
                      <div className="text-sm text-slate-400">Recovery</div>
                    </div>
                    <div className="stat-card">
                      <div className="text-4xl mb-2">⚡</div>
                      <div className="text-3xl font-bold text-amber-400 mb-1">12.4</div>
                      <div className="text-sm text-slate-400">Avg Strain</div>
                    </div>
                  </div>

                  <div className="glass-card p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <Zap className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <div className="font-semibold mb-1">High Recovery Day</div>
                        <div className="text-sm text-slate-400">Perfect for HIIT or strength training</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-slate-400">Get started in three simple steps</p>
          </div>

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
                className="stat-card text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-6">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-slate-400">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative py-20 bg-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for Elite Athletes</h2>
            <p className="text-xl text-slate-400">Everything you need to optimize performance</p>
          </div>

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
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                viewport={{ once: true }}
                className="stat-card group"
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{feature.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple Pricing</h2>
            <p className="text-xl text-slate-400">Start free. Upgrade when ready.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Free */}
            <div className="glass-card p-8">
              <h3 className="text-xl font-bold mb-2">Free</h3>
              <div className="text-4xl font-bold mb-6">$0</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-5 h-5 text-green-400" />
                  Basic dashboard
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-5 h-5 text-green-400" />
                  Last 30 days
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-5 h-5 text-green-400" />
                  Manual upload
                </li>
              </ul>
              <Link href="/signup">
                <button className="btn-ghost w-full">Get Started</button>
              </Link>
            </div>

            {/* Pro */}
            <div className="glass-card p-8 relative border-2 border-purple-500/50">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </div>
              <h3 className="text-xl font-bold mb-2">Pro</h3>
              <div className="text-4xl font-bold mb-6">
                $10<span className="text-lg text-slate-400">/mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-5 h-5 text-green-400" />
                  Everything in Free
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-5 h-5 text-green-400" />
                  AI predictions
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-5 h-5 text-green-400" />
                  Unlimited history
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-5 h-5 text-green-400" />
                  Weekly plans
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-5 h-5 text-green-400" />
                  PDF reports
                </li>
              </ul>
              <Link href="/signup">
                <button className="btn-primary w-full">Start Free Trial</button>
              </Link>
            </div>

            {/* Elite */}
            <div className="glass-card p-8">
              <h3 className="text-xl font-bold mb-2">Elite</h3>
              <div className="text-4xl font-bold mb-6">
                $20<span className="text-lg text-slate-400">/mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-5 h-5 text-green-400" />
                  Everything in Pro
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-5 h-5 text-green-400" />
                  Custom models
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-5 h-5 text-green-400" />
                  API access
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-5 h-5 text-green-400" />
                  Priority support
                </li>
              </ul>
              <Link href="/signup">
                <button className="btn-ghost w-full">Contact Sales</button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-20">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Unlock Your Potential?
            </h2>
            <p className="text-xl text-slate-400 mb-8">
              Join elite athletes using AI to reach peak performance
            </p>
            <Link href="/signup">
              <button className="btn-primary text-lg px-10 py-4">
                Start Free Today
                <ArrowRight className="ml-2 w-5 h-5" />
              </button>
            </Link>
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
