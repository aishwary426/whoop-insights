'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import NeonButton from '../ui/NeonButton'

export default function HeroSection() {
    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6">
            {/* Content */}
            <div className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center gap-8 md:gap-10">

                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                    className="text-5xl md:text-[5.6rem] lg:text-[7rem] font-bold tracking-tight text-gray-900 dark:text-white leading-[1.1]"
                >
                    WHOOP tracks. <br />
                    We <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-900 to-gray-500 dark:from-white dark:via-white dark:to-white/50">predict.</span>
                </motion.h1>

                {/* Subheadline */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
                    className="text-lg md:text-xl text-gray-600 dark:text-white/60 max-w-2xl leading-relaxed"
                >
                    Upload your WHOOP data and unlock personalized recovery forecasts, optimal sleep windows, and strain thresholds — all trained on your unique physiology, not population averages.
                </motion.p>

                {/* CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
                    className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
                >
                    <Link href="/signup" className="w-full sm:w-auto">
                        <NeonButton variant="primary" className="w-full sm:w-auto text-base">
                            Get Started Free
                        </NeonButton>
                    </Link>
                    <Link href="#how-it-works" className="w-full sm:w-auto">
                        <NeonButton variant="secondary" className="w-full sm:w-auto text-base">
                            See How It Works
                        </NeonButton>
                    </Link>
                </motion.div>

                {/* Social Proof */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
                    className="text-sm md:text-base text-gray-500 dark:text-white/40 mt-4"
                >
                    Analyzing 50,000+ recovery days for athletes who want more from their data
                </motion.p>
            </div>
        </section>
    )
}
