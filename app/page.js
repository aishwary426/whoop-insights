'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6">
        <div className="flex justify-between items-center">
          <div className="text-white text-2xl font-bold">
            🎯 Whoop Insights Pro
          </div>
          <div className="space-x-4">
            <Link href="/login" className="text-white hover:text-purple-200 transition">
              Sign In
            </Link>
            <Link href="/signup" className="btn-secondary !text-white !border-white">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white mb-6">
            Unlock Hidden Patterns in<br />Your Whoop Data
          </h1>
          <p className="text-xl text-purple-100 mb-10 max-w-2xl mx-auto">
            AI-powered analysis that tells you exactly what affects your recovery,
            predicts your performance, and optimizes your training.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/signup" className="btn-primary text-lg px-8 py-4">
              Start Free Analysis
            </Link>
            <button className="btn-secondary !text-white !border-white text-lg px-8 py-4">
              See Demo
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <FeatureCard
            icon="🔬"
            title="Recovery Patterns"
            description="Discover what truly affects YOUR recovery. Sleep, strain, lifestyle - we analyze it all."
          />
          <FeatureCard
            icon="🎯"
            title="Calorie-Burn GPS"
            description="Get the most efficient workout for your recovery state. Burn more in less time."
          />
          <FeatureCard
            icon="📊"
            title="Predictive Insights"
            description="Know tomorrow's recovery today. Plan your training week with confidence."
          />
          <FeatureCard
            icon="😴"
            title="Sleep Optimization"
            description="Find your perfect sleep schedule. Quality over quantity, backed by your data."
          />
          <FeatureCard
            icon="💪"
            title="Workout Intelligence"
            description="Which exercises work best for you? When? How long? Let AI figure it out."
          />
          <FeatureCard
            icon="⚡"
            title="Real-Time Recommendations"
            description="Daily action items personalized to YOU. Not generic advice, actual data-driven insights."
          />
        </div>

        {/* How It Works */}
        <div className="mt-32 text-center">
          <h2 className="text-4xl font-bold text-white mb-16">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            <Step
              number="1"
              title="Upload Your Data"
              description="Export your Whoop data as ZIP and upload it. Takes 10 seconds."
            />
            <Step
              number="2"
              title="AI Analysis"
              description="Our ML models analyze your patterns, train on YOUR specific data."
            />
            <Step
              number="3"
              title="Get Insights"
              description="See what drives your recovery, get predictions, optimize everything."
            />
          </div>
        </div>

        {/* CTA */}
        <div className="mt-32 text-center bg-white/10 backdrop-blur-lg rounded-3xl p-12">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to optimize your training?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Join athletes who've already unlocked their potential
          </p>
          <Link href="/signup" className="btn-primary text-lg px-8 py-4 inline-block">
            Start Your Free Analysis →
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-12 text-center text-white/70">
        <p>© 2024 Whoop Insights Pro. Built for athletes, by athletes.</p>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 hover:bg-white/20 transition-all">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
      <p className="text-purple-100">{description}</p>
    </div>
  )
}

function Step({ number, title, description }) {
  return (
    <div className="relative">
      <div className="bg-white text-purple-600 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
        {number}
      </div>
      <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
      <p className="text-purple-100">{description}</p>
    </div>
  )
}
