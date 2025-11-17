#!/bin/bash

echo "🎨 PREMIUM UI OVERHAUL - Creating Apple/Oura Level Design"
echo "=========================================================="

# 1. Update globals.css with premium styling
cat > app/globals.css << 'PREMIUMCSS'
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply antialiased;
  }
  
  body {
    @apply bg-black text-white;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-feature-settings: "rlig" 1, "calt" 1;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}

@layer components {
  /* Premium Glassmorphism */
  .glass-premium {
    background: rgba(20, 20, 20, 0.6);
    backdrop-filter: blur(40px) saturate(180%);
    -webkit-backdrop-filter: blur(40px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  }

  .glass-card {
    background: linear-gradient(145deg, rgba(30, 30, 30, 0.5) 0%, rgba(20, 20, 20, 0.5) 100%);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  /* Premium Buttons */
  .btn-premium {
    @apply relative px-8 py-4 rounded-full font-semibold text-base transition-all duration-300;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    box-shadow: 0 10px 40px rgba(102, 126, 234, 0.4);
  }

  .btn-premium:hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 50px rgba(102, 126, 234, 0.6);
  }

  .btn-premium:active {
    transform: translateY(0);
  }

  .btn-secondary {
    @apply relative px-8 py-4 rounded-full font-semibold text-base transition-all duration-300 bg-white/5 hover:bg-white/10;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  /* Premium Input Fields */
  .input-premium {
    @apply w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-white/30 focus:bg-white/10 outline-none transition-all duration-300;
  }

  .input-premium:focus {
    box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.05);
  }

  /* Premium Typography */
  .heading-xl {
    @apply text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight;
    letter-spacing: -0.02em;
  }

  .heading-lg {
    @apply text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight;
    letter-spacing: -0.02em;
  }

  .heading-md {
    @apply text-3xl md:text-4xl font-bold tracking-tight;
    letter-spacing: -0.01em;
  }

  .body-lg {
    @apply text-xl md:text-2xl text-white/70;
    line-height: 1.6;
  }

  /* Premium Gradient Text */
  .gradient-premium {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* Premium Cards */
  .stat-card-premium {
    @apply glass-card rounded-3xl p-8 transition-all duration-500 hover:scale-[1.02];
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .stat-card-premium:hover {
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow: 0 20px 60px rgba(102, 126, 234, 0.2);
  }

  /* Mesh Gradient Background */
  .mesh-gradient {
    background: radial-gradient(at 0% 0%, rgba(102, 126, 234, 0.15) 0px, transparent 50%),
                radial-gradient(at 100% 0%, rgba(118, 75, 162, 0.15) 0px, transparent 50%),
                radial-gradient(at 100% 100%, rgba(240, 147, 251, 0.15) 0px, transparent 50%),
                radial-gradient(at 0% 100%, rgba(102, 126, 234, 0.15) 0px, transparent 50%);
  }

  /* Smooth Animations */
  .animate-fade-in {
    animation: fadeIn 0.8s ease-out;
  }

  .animate-slide-up {
    animation: slideUp 0.8s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Premium Scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.02);
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  /* Hero Section */
  .hero-section {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  /* Floating Elements */
  .float {
    animation: float 6s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-20px);
    }
  }

  /* Glow Effect */
  .glow-effect {
    position: relative;
  }

  .glow-effect::before {
    content: '';
    position: absolute;
    inset: -2px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-radius: inherit;
    opacity: 0;
    transition: opacity 0.3s;
    z-index: -1;
    filter: blur(20px);
  }

  .glow-effect:hover::before {
    opacity: 1;
  }
}

/* Utility Classes */
.text-balance {
  text-wrap: balance;
}

.section-padding {
  @apply py-24 md:py-32 lg:py-40;
}

.container-premium {
  @apply max-w-7xl mx-auto px-6 md:px-8 lg:px-12;
}
PREMIUMCSS

echo "✅ Premium CSS created!"

# 2. Create stunning landing page
cat > app/page.js << 'LANDINGPAGE'
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="bg-black min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 transition-all duration-300"
           style={{
             background: scrollY > 50 ? 'rgba(0, 0, 0, 0.8)' : 'transparent',
             backdropFilter: scrollY > 50 ? 'blur(20px)' : 'none',
           }}>
        <div className="container-premium py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
              <span className="text-xl font-bold">Whoop Insights</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-white/70 hover:text-white transition">Features</a>
              <a href="#how-it-works" className="text-white/70 hover:text-white transition">How it Works</a>
              <a href="#pricing" className="text-white/70 hover:text-white transition">Pricing</a>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/login">
                <button className="btn-secondary">Sign In</button>
              </Link>
              <Link href="/signup">
                <button className="btn-premium">Get Started</button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section mesh-gradient">
        <div className="container-premium text-center">
          <div className="animate-slide-up">
            <h1 className="heading-xl mb-8 text-balance">
              Your Personal
              <span className="gradient-premium"> AI Trainer</span>
            </h1>
            
            <p className="body-lg mb-12 max-w-3xl mx-auto">
              Transform your Whoop data into actionable insights. ML-powered predictions, 
              personalized training plans, and performance optimization.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/signup">
                <button className="btn-premium text-lg px-12 py-5">
                  Start Free Trial
                </button>
              </Link>
              <button className="btn-secondary text-lg px-12 py-5">
                Watch Demo →
              </button>
            </div>

            {/* Hero Visual */}
            <div className="mt-20 relative">
              <div className="glass-card rounded-3xl p-2 inline-block glow-effect">
                <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl p-12">
                  <div className="grid grid-cols-3 gap-6 max-w-4xl">
                    {/* Mock Stats */}
                    <div className="stat-card-premium text-left">
                      <div className="text-5xl mb-3">💚</div>
                      <div className="text-4xl font-bold mb-2">87%</div>
                      <div className="text-white/50 text-sm">Recovery</div>
                    </div>
                    <div className="stat-card-premium text-left">
                      <div className="text-5xl mb-3">💪</div>
                      <div className="text-4xl font-bold mb-2">156</div>
                      <div className="text-white/50 text-sm">Workouts</div>
                    </div>
                    <div className="stat-card-premium text-left">
                      <div className="text-5xl mb-3">⚡</div>
                      <div className="text-4xl font-bold mb-2">12.4</div>
                      <div className="text-white/50 text-sm">Avg Strain</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="section-padding">
        <div className="container-premium">
          <div className="text-center mb-20">
            <h2 className="heading-lg mb-6">Built for Athletes</h2>
            <p className="body-lg max-w-2xl mx-auto">
              Everything you need to optimize performance and reach your peak
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '🤖',
                title: 'AI Predictions',
                desc: 'Neural networks trained on YOUR data predict tomorrow\'s recovery with 85% accuracy'
              },
              {
                icon: '🎯',
                title: 'Smart Training',
                desc: 'ML-powered workout optimizer finds the most efficient exercises for your state'
              },
              {
                icon: '📊',
                title: 'Deep Analytics',
                desc: 'Comprehensive insights into sleep, recovery, strain, and performance patterns'
              },
              {
                icon: '📅',
                title: 'Weekly Plans',
                desc: 'AI generates personalized 7-day training schedules based on predicted recovery'
              },
              {
                icon: '🔥',
                title: 'Streak Tracking',
                desc: 'Gamified progress tracking with achievements and performance milestones'
              },
              {
                icon: '📱',
                title: 'Instant Sync',
                desc: 'Upload your Whoop export and get insights in under 60 seconds'
              }
            ].map((feature, idx) => (
              <div key={idx} className="stat-card-premium group">
                <div className="text-6xl mb-6 float">{feature.icon}</div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-white/60 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="section-padding bg-white/5">
        <div className="container-premium">
          <div className="text-center mb-20">
            <h2 className="heading-lg mb-6">Simple. Powerful.</h2>
            <p className="body-lg max-w-2xl mx-auto">
              Get started in minutes
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { num: '01', title: 'Export Data', desc: 'Download your Whoop data from the mobile app' },
              { num: '02', title: 'Upload ZIP', desc: 'Drop your export file into our platform' },
              { num: '03', title: 'AI Training', desc: 'Neural networks train on your patterns' },
              { num: '04', title: 'Get Insights', desc: 'Receive personalized predictions and plans' }
            ].map((step, idx) => (
              <div key={idx} className="text-center">
                <div className="text-6xl font-bold gradient-premium mb-6">{step.num}</div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-white/60">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="section-padding">
        <div className="container-premium">
          <div className="text-center mb-20">
            <h2 className="heading-lg mb-6">Simple Pricing</h2>
            <p className="body-lg max-w-2xl mx-auto">
              Start free. Upgrade when ready.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free */}
            <div className="stat-card-premium p-10">
              <h3 className="text-2xl font-bold mb-4">Free</h3>
              <div className="text-5xl font-bold mb-6">$0</div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <span className="text-green-500">✓</span>
                  <span className="text-white/70">Upload data</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500">✓</span>
                  <span className="text-white/70">Basic dashboard</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500">✓</span>
                  <span className="text-white/70">Last 30 days</span>
                </li>
              </ul>
              <Link href="/signup">
                <button className="btn-secondary w-full">Get Started</button>
              </Link>
            </div>

            {/* Pro */}
            <div className="stat-card-premium p-10 glow-effect relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold mb-4">Pro</h3>
              <div className="text-5xl font-bold mb-2">$10</div>
              <div className="text-white/50 mb-6">/month</div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <span className="text-green-500">✓</span>
                  <span>Everything in Free</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500">✓</span>
                  <span>AI Predictions</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500">✓</span>
                  <span>Unlimited history</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500">✓</span>
                  <span>Weekly optimizer</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500">✓</span>
                  <span>PDF reports</span>
                </li>
              </ul>
              <Link href="/signup">
                <button className="btn-premium w-full">Start Free Trial</button>
              </Link>
            </div>

            {/* Elite */}
            <div className="stat-card-premium p-10">
              <h3 className="text-2xl font-bold mb-4">Elite</h3>
              <div className="text-5xl font-bold mb-2">$20</div>
              <div className="text-white/50 mb-6">/month</div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <span className="text-green-500">✓</span>
                  <span>Everything in Pro</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500">✓</span>
                  <span>Custom AI models</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500">✓</span>
                  <span>API access</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500">✓</span>
                  <span>Priority support</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500">✓</span>
                  <span>Video consultations</span>
                </li>
              </ul>
              <Link href="/signup">
                <button className="btn-secondary w-full">Contact Sales</button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding">
        <div className="container-premium">
          <div className="glass-card rounded-3xl p-16 text-center glow-effect">
            <h2 className="heading-md mb-6">Ready to Optimize?</h2>
            <p className="body-lg mb-10 max-w-2xl mx-auto">
              Join athletes using AI to reach peak performance
            </p>
            <Link href="/signup">
              <button className="btn-premium text-lg px-12 py-5">
                Start Free Today
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="container-premium">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-xl">🎯</span>
              </div>
              <span className="font-bold">Whoop Insights Pro</span>
            </div>
            
            <div className="text-white/40 text-sm">
              © 2025 Whoop Insights Pro. Built for athletes.
            </div>

            <div className="flex gap-6 text-white/40">
              <a href="#" className="hover:text-white transition">Privacy</a>
              <a href="#" className="hover:text-white transition">Terms</a>
              <a href="#" className="hover:text-white transition">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
LANDINGPAGE

echo "✅ Premium landing page created!"
echo ""
echo "🎉 UI OVERHAUL COMPLETE!"
echo ""
echo "Your app now has Apple/Oura level design quality!"
echo "Restart server: npm run dev"
