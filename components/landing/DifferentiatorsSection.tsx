'use client'

import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import ParallaxSection from '../ui/ParallaxSection'
import NeonCard from '../ui/NeonCard'

const comparison = [
    {
        feature: 'Recovery prediction',
        whoop: 'Shows today only',
        insights: 'Predicts tomorrow'
    },
    {
        feature: 'Thresholds',
        whoop: 'Generic / population-based',
        insights: 'Personalized to YOU'
    },
    {
        feature: 'Sleep optimization',
        whoop: 'General recommendations',
        insights: 'YOUR optimal window'
    },
    {
        feature: 'Burnout detection',
        whoop: 'After the fact',
        insights: '2-3 days early warning'
    },
    {
        feature: 'Habit impact',
        whoop: 'Correlations only',
        insights: 'Quantified % impact'
    },
    {
        feature: 'Training timing',
        whoop: 'No personalization',
        insights: 'YOUR best windows'
    }
]

export default function DifferentiatorsSection() {
    return (
        <ParallaxSection className="bg-transparent">
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
                        Why this isn't just another dashboard
                    </motion.h2>
                </div>

                {/* Comparison Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                    <NeonCard className="p-6 border-gray-200 dark:border-white/10 bg-white/50 dark:bg-[#0A0A0A]/40 overflow-x-auto">
                        <div className="min-w-full">
                            {/* Header */}
                            <div className="grid grid-cols-3 gap-4 pb-4 mb-4 border-b border-gray-200 dark:border-white/10">
                                <div className="font-semibold text-gray-900 dark:text-white/90">Feature</div>
                                <div className="font-semibold text-gray-900 dark:text-white/90">WHOOP App</div>
                                <div className="font-semibold text-green-600 dark:text-neon-primary">Whoop Insights</div>
                            </div>

                            {/* Rows */}
                            {comparison.map((item, index) => (
                                <div
                                    key={index}
                                    className="grid grid-cols-3 gap-4 py-4 border-b border-gray-100 dark:border-white/5 last:border-0"
                                >
                                    <div className="font-medium text-gray-900 dark:text-white/90">
                                        {item.feature}
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-white/60">
                                        <X className="w-4 h-4 text-red-400" />
                                        <span>{item.whoop}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-green-600 dark:text-neon-primary">
                                        <Check className="w-4 h-4" />
                                        <span>{item.insights}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </NeonCard>
                </motion.div>

                {/* Bottom Line */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                    className="text-center mt-12"
                >
                    <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white italic">
                        "WHOOP tracks. We predict."
                    </p>
                </motion.div>
            </div>
        </ParallaxSection>
    )
}
