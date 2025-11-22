'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import NeonButton from '../ui/NeonButton'
import TranscendentalBackground from '../ui/TranscendentalBackground'

export default function HeroSection() {
    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6">
            {/* Background */}
            <TranscendentalBackground />

            {/* Content */}
            <div className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center gap-8 md:gap-10">

                {/* Product Label */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 backdrop-blur-sm"
                >
                    <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-neon animate-pulse"></span>
                    <span className="text-xs md:text-sm font-medium text-gray-800 dark:text-white/80 tracking-wide uppercase">AI for WHOOP Athletes</span>
                </motion.div>

                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                    className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-gray-900 dark:text-white leading-[1.1]"
                >
                    Experience precision <br className="hidden md:block" />
                    in your <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-900 to-gray-500 dark:from-white dark:via-white dark:to-white/50">training & recovery.</span>
                </motion.h1>

                {/* Subheadline */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
                    className="text-lg md:text-xl text-gray-600 dark:text-white/60 max-w-2xl leading-relaxed"
                >
                    Upload your WHOOP data and get AI-powered recovery forecasts,
                    training plans, and performance insights.
                </motion.p>

                {/* CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
                    className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
                >
                    <Link href="/why" className="w-full sm:w-auto">
                        <NeonButton variant="primary" className="w-full sm:w-auto text-base">
                            Why it is needed?
                        </NeonButton>
                    </Link>
                    <Link href="/login" className="w-full sm:w-auto">
                        <NeonButton variant="secondary" className="w-full sm:w-auto text-base">
                            Login
                        </NeonButton>
                    </Link>
                </motion.div>
            </div>
        </section>
    )
}
