'use client'

import { motion } from 'framer-motion'
import { MessageSquare } from 'lucide-react'
import ParallaxSection from '../ui/ParallaxSection'
import NeonCard from '../ui/NeonCard'

const testimonials = [
    {
        quote: 'I\'ve been using WHOOP for 2 years but never understood WHY my recovery tanked on certain days. Whoop Insights showed me my strain threshold was way lower than I thought — I was overtraining every week without knowing it.',
        author: 'Marathon runner',
        detail: '18 months of WHOOP data'
    },
    {
        quote: 'The sleep window feature alone was worth it. Shifted my bedtime 20 minutes earlier and my average recovery went from 58% to 67% in three weeks.',
        author: 'CrossFit athlete',
        detail: 'Competing regionals'
    },
    {
        quote: 'I finally have data on how alcohol actually affects MY body. Turns out one drink drops my recovery 12%, but two drinks drops it 28%. That precision changed my behavior.',
        author: 'Triathlete',
        detail: 'Data-driven training'
    }
]

const metrics = [
    { value: '50,000+', label: 'Recovery days analyzed' },
    { value: '85%+', label: 'Prediction accuracy' },
    { value: '12%', label: 'Average recovery improvement in first month' },
    { value: '500+', label: 'Athletes using the platform' }
]

export default function TestimonialsSection() {
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
                        Athletes are training smarter
                    </motion.h2>
                </div>

                {/* Metrics Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
                >
                    {metrics.map((metric, index) => (
                        <div key={index} className="text-center">
                            <div className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-neon-primary mb-2">
                                {metric.value}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-white/60">
                                {metric.label}
                            </div>
                        </div>
                    ))}
                </motion.div>

                {/* Testimonials */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: index * 0.1 }}
                        >
                            <NeonCard className="h-full p-6 border-gray-200 dark:border-white/10 bg-white/50 dark:bg-[#0A0A0A]/40 dark:hover:bg-[#0A0A0A]/50 transition-colors">
                                <MessageSquare className="w-8 h-8 text-blue-600 dark:text-neon-primary mb-4 opacity-50" />
                                <p className="text-gray-700 dark:text-white/80 leading-relaxed mb-6 italic">
                                    "{testimonial.quote}"
                                </p>
                                <div className="pt-4 border-t border-gray-200 dark:border-white/5">
                                    <p className="font-semibold text-gray-900 dark:text-white/90">
                                        — {testimonial.author}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-white/60">
                                        {testimonial.detail}
                                    </p>
                                </div>
                            </NeonCard>
                        </motion.div>
                    ))}
                </div>
            </div>
        </ParallaxSection>
    )
}
