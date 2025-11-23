'use client'

import { motion } from 'framer-motion'
import ParallaxSection from '../ui/ParallaxSection'
import NeonCard from '../ui/NeonCard'

const painPoints = [
    {
        title: 'Recovery surprises',
        description: 'Wake up expecting green, get yellow. No explanation.'
    },
    {
        title: 'Guessing game',
        description: 'Should you push hard today or rest? The app says "moderate" — but what does that mean for YOU?'
    },
    {
        title: 'No personalization',
        description: 'Same advice whether you\'re a marathon runner or a CrossFitter.'
    },
    {
        title: 'Reactive, not proactive',
        description: 'You find out you\'re burnt out AFTER it happens.'
    }
]

export default function ProblemSection() {
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
                        Your WHOOP data is powerful.<br />
                        But you're only seeing half the picture.
                    </motion.h2>
                    
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                        className="text-lg md:text-xl text-gray-600 dark:text-white/60 max-w-3xl mx-auto leading-relaxed"
                    >
                        WHOOP is incredible at tracking what happened yesterday — your recovery score, strain, sleep performance. But it treats you like everyone else. Generic thresholds. Population-based recommendations. One-size-fits-all insights.
                    </motion.p>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                        className="text-lg md:text-xl text-gray-600 dark:text-white/60 max-w-3xl mx-auto leading-relaxed mt-4"
                    >
                        The problem? You're not average. Your optimal bedtime isn't 10 PM just because that's what works for most people. Your strain threshold isn't 14.0 just because that's the app's default. <strong className="text-gray-900 dark:text-white">You need insights trained on YOUR data.</strong>
                    </motion.p>
                </div>

                {/* Pain Points */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8">
                    {painPoints.map((point, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: index * 0.1 }}
                            className="h-full"
                        >
                            <NeonCard className="h-full p-8 md:p-10 border border-gray-200/50 dark:border-white/20 bg-white/50 dark:bg-[#0A0A0A]/40 hover:bg-white/60 dark:hover:bg-[#0A0A0A]/50 transition-colors rounded-2xl">
                                <div className="flex flex-col h-full">
                                    <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                                        {point.title}
                                    </h3>
                                    <p className="text-base md:text-lg text-gray-600 dark:text-white/70 leading-relaxed flex-grow">
                                        {point.description}
                                    </p>
                                </div>
                            </NeonCard>
                        </motion.div>
                    ))}
                </div>

                {/* Transition Line */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
                    className="text-center mt-12"
                >
                    <p className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white">
                        What if your data could tell you what's coming — before it happens?
                    </p>
                </motion.div>
            </div>
        </ParallaxSection>
    )
}
