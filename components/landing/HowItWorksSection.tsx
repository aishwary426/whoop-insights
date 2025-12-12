'use client'

import { motion } from 'framer-motion'
import { Download, Brain, Sparkles } from 'lucide-react'
import ParallaxSection from '../ui/ParallaxSection'
import NeonCard from '../ui/NeonCard'
import NeonButton from '../ui/NeonButton'
import Link from 'next/link'

const steps = [
    {
        icon: Download,
        number: '1',
        headline: 'Export your WHOOP data',
        description: 'Download your data export from the WHOOP app (takes 30 seconds). We accept the standard CSV export — no API access or password sharing required.',
        timeIndicator: '30 seconds',
        color: 'text-blue-600 dark:text-neon-primary'
    },
    {
        icon: Brain,
        number: '2',
        headline: 'Upload & train your personal AI',
        description: 'Our ML models analyze your unique patterns — sleep rhythms, strain responses, recovery velocity. The more data you have, the more accurate your predictions. 30+ days recommended.',
        timeIndicator: '2 minutes',
        color: 'text-purple-400'
    },
    {
        icon: Sparkles,
        number: '3',
        headline: 'Get personalized predictions & insights',
        description: 'Access your dashboard with recovery forecasts, optimal timing recommendations, strain thresholds, and trend analysis — all calibrated to YOUR physiology.',
        timeIndicator: 'Instant',
        color: 'text-green-400'
    }
]

export default function HowItWorksSection() {
    return (
        <ParallaxSection id="how-it-works" className="bg-transparent">
            <div className="max-w-6xl mx-auto">
                {/* Section Header */}
                <div className="text-center mb-12 md:mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight"
                    >
                        From data to insights in 3 steps
                    </motion.h2>
                </div>

                {/* Steps */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: index * 0.15 }}
                        >
                            <NeonCard className="h-full p-8 border-gray-200 dark:border-white/10 bg-white/50 dark:bg-[#0A0A0A]/40 dark:hover:bg-[#0A0A0A]/50 transition-colors text-center">
                                <div className="flex flex-col items-center">
                                    <div className={`w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-6 ${step.color} relative`}>
                                        <step.icon className="w-8 h-8" />
                                        <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-blue-600 dark:bg-neon text-white dark:text-black text-sm font-bold flex items-center justify-center">
                                            {step.number}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white/90">
                                        {step.headline}
                                    </h3>
                                    <p className="text-gray-600 dark:text-white/60 leading-relaxed mb-4 text-sm">
                                        {step.description}
                                    </p>
                                    <div className="mt-auto pt-4">
                                        <span className="text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                                            {step.timeIndicator}
                                        </span>
                                    </div>
                                </div>
                            </NeonCard>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
                    className="text-center"
                >
                    <Link href="/signup">
                        <NeonButton variant="primary" className="text-base">
                            Get Started Free
                        </NeonButton>
                    </Link>
                    <p className="text-sm text-gray-500 dark:text-white/40 mt-4">
                        No credit card required
                    </p>
                </motion.div>
            </div>
        </ParallaxSection>
    )
}
