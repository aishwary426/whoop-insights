'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import ParallaxSection from '../ui/ParallaxSection'
import NeonCard from '../ui/NeonCard'
import NeonButton from '../ui/NeonButton'
import Link from 'next/link'

const proFeatures = [
    'Multi-day recovery forecasting (7 days)',
    'Personalized sleep windows',
    'Workout timing optimization',
    'Habit impact quantification',
    'Burnout early warning system',
    'Unlimited historical data',
    'Priority support'
]

const freeFeatures = [
    'Recovery prediction (next day)',
    'Basic sleep analysis',
    'Strain threshold detection',
    '30-day data limit'
]

export default function PricingSection() {
    return (
        <ParallaxSection id="pricing" className="bg-transparent">
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
                        Simple pricing. Serious insights.
                    </motion.h2>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Free Tier */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <NeonCard className="h-full p-8 border-gray-200 dark:border-white/10 bg-white/50 dark:bg-[#0A0A0A]/40 dark:hover:bg-[#0A0A0A]/50 transition-colors">
                            <div className="text-center mb-8">
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                    Free
                                </h3>
                                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                                    $0<span className="text-lg text-gray-600 dark:text-white/60">/month</span>
                                </div>
                            </div>
                            <ul className="space-y-4 mb-8">
                                {freeFeatures.map((feature, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <Check className="w-5 h-5 text-green-600 dark:text-neon-primary flex-shrink-0 mt-0.5" />
                                        <span className="text-gray-700 dark:text-white/80">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            <Link href="/signup" className="block">
                                <NeonButton variant="secondary" className="w-full">
                                    Get Started Free
                                </NeonButton>
                            </Link>
                        </NeonCard>
                    </motion.div>

                    {/* Pro Tier */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                    >
                        <NeonCard className="h-full p-8 border-2 border-blue-600 dark:border-neon-primary bg-white/50 dark:bg-[#0A0A0A]/40 dark:hover:bg-[#0A0A0A]/50 transition-colors relative">
                            <div className="absolute top-0 right-0 bg-blue-600 dark:bg-neon-primary text-white dark:text-black px-4 py-1 text-sm font-semibold rounded-bl-lg">
                                POPULAR
                            </div>
                            <div className="text-center mb-8">
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                    Pro
                                </h3>
                                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                                    $9<span className="text-lg text-gray-600 dark:text-white/60">/month</span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-white/60">
                                    or $79/year (save 27%)
                                </p>
                            </div>
                            <div className="mb-4">
                                <p className="text-sm text-gray-600 dark:text-white/60 mb-4">
                                    Everything in Free, plus:
                                </p>
                                <ul className="space-y-4 mb-8">
                                    {proFeatures.map((feature, index) => (
                                        <li key={index} className="flex items-start gap-3">
                                            <Check className="w-5 h-5 text-green-600 dark:text-neon-primary flex-shrink-0 mt-0.5" />
                                            <span className="text-gray-700 dark:text-white/80">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <Link href="/signup" className="block">
                                <NeonButton variant="primary" className="w-full">
                                    Upgrade to Pro
                                </NeonButton>
                            </Link>
                        </NeonCard>
                    </motion.div>
                </div>

                {/* Pricing FAQ */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                    className="mt-12 max-w-3xl mx-auto"
                >
                    <div className="space-y-4 text-center text-sm text-gray-600 dark:text-white/60">
                        <p>
                            <strong className="text-gray-900 dark:text-white">Is my data secure?</strong> Yes. We never store your raw WHOOP data on our servers. Models are trained client-side and only aggregated insights are saved.
                        </p>
                        <p>
                            <strong className="text-gray-900 dark:text-white">Can I cancel anytime?</strong> Yes. No contracts, no commitments. Cancel with one click.
                        </p>
                        <p>
                            <strong className="text-gray-900 dark:text-white">What if I have less than 30 days of data?</strong> The platform works with 14+ days, but accuracy improves significantly with 30+ days.
                        </p>
                    </div>
                </motion.div>
            </div>
        </ParallaxSection>
    )
}
