'use client'

import { motion } from 'framer-motion'
import ParallaxSection from '../ui/ParallaxSection'
import NeonButton from '../ui/NeonButton'
import Link from 'next/link'

export default function FinalCTASection() {
    return (
        <ParallaxSection className="bg-transparent pb-20">
            <div className="max-w-4xl mx-auto text-center">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight"
                >
                    Stop guessing. Start predicting.
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                    className="text-lg md:text-xl text-gray-600 dark:text-white/60 max-w-2xl mx-auto leading-relaxed mb-6"
                >
                    Your WHOOP data holds the answers to better recovery, smarter training, and fewer burnout days. Let's unlock them together.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                    className="flex flex-col items-center gap-4 pt-2"
                >
                    <Link href="/signup">
                        <NeonButton variant="primary" className="text-lg px-8 py-4">
                            Get Started Free
                        </NeonButton>
                    </Link>
                    <p className="text-sm text-gray-500 dark:text-white/40">
                        No credit card required • Takes 2 minutes • Works with 14+ days of data
                    </p>
                </motion.div>
            </div>
        </ParallaxSection>
    )
}
