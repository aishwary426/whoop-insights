'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Target, Heart, Eye, Shield } from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import NeonCard from '../../components/ui/NeonCard'

const values = [
    {
        icon: Shield,
        title: 'Your data belongs to you',
        description: 'We\'ll never sell it, share it, or use it for anything other than helping you perform better.'
    },
    {
        icon: Target,
        title: 'Personalization beats generalization',
        description: 'Your optimal is different from everyone else\'s. Our models learn YOUR patterns.'
    },
    {
        icon: Eye,
        title: 'Prediction beats reaction',
        description: 'Knowing what\'s coming lets you make better decisions. We help you see around corners.'
    },
    {
        icon: Heart,
        title: 'Transparency builds trust',
        description: 'We show you WHY we make every recommendation. No black boxes.'
    }
]

export default function AboutPage() {
    return (
        <AppLayout>
            <div className="relative z-10 min-h-screen py-24 px-6 md:px-12">
                <div className="max-w-4xl mx-auto space-y-16">
                    {/* Header */}
                    <div className="text-center space-y-6">
                        <Link href="/" className="inline-flex items-center gap-2 text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white transition-colors mb-8">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Home
                        </Link>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white"
                        >
                            Built by athletes, for athletes
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-xl text-gray-600 dark:text-white/60 max-w-3xl mx-auto"
                        >
                            We got tired of generic fitness advice. So we built something better.
                        </motion.p>
                    </div>

                    {/* Our Story */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <NeonCard className="p-8 md:p-12 border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A]/80">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                                Our Story
                            </h2>
                            <div className="space-y-4 text-gray-700 dark:text-white/80 leading-relaxed">
                                <p>
                                    Whoop Insights started with a simple frustration: after years of wearing a WHOOP, we still couldn't predict when we'd wake up feeling terrible.
                                </p>
                                <p>
                                    The WHOOP app is great at showing you what happened. Recovery score: 45%. Strain: 16.2. Sleep: 6.8 hours. But it never told us WHY. And it definitely didn't tell us what tomorrow would look like.
                                </p>
                                <p>
                                    We're engineers who love data. So we started exporting our WHOOP data and building our own models. What we found was surprising: with enough historical data, we could predict next-day recovery with remarkable accuracy. We could identify our personal strain thresholds. We could pinpoint the exact habits that were killing our recovery.
                                </p>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                    Whoop Insights is what happened when we realized other athletes needed this too.
                                </p>
                            </div>
                        </NeonCard>
                    </motion.div>

                    {/* Our Mission */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <NeonCard className="p-8 md:p-12 border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A]/80">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                                Our Mission
                            </h2>
                            <p className="text-xl text-gray-700 dark:text-white/80 leading-relaxed">
                                To give every athlete insights as personalized as a professional sports team's analytics department — without the $100k budget.
                            </p>
                            <p className="text-lg text-gray-600 dark:text-white/60 mt-4 leading-relaxed">
                                We believe your wearable data should work harder for you. Not generic thresholds. Not population averages. Insights trained on YOUR body, YOUR patterns, YOUR life.
                            </p>
                        </NeonCard>
                    </motion.div>

                    {/* What We Believe */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                            What We Believe
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {values.map((value, index) => (
                                <NeonCard key={index} className="p-6 border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A]/80">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center flex-shrink-0 text-blue-600 dark:text-neon-primary">
                                            <value.icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                                {value.title}
                                            </h3>
                                            <p className="text-gray-700 dark:text-white/70">
                                                {value.description}
                                            </p>
                                        </div>
                                    </div>
                                </NeonCard>
                            ))}
                        </div>
                    </motion.div>

                    {/* The Team */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center"
                    >
                        <NeonCard className="p-8 md:p-12 border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A]/80">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                                The Team
                            </h2>
                            <p className="text-gray-700 dark:text-white/80 leading-relaxed">
                                We're a small team of engineers and athletes who believe data should be actionable, not just interesting. Combined, we've logged 10,000+ hours wearing WHOOP and other wearables.
                            </p>
                        </NeonCard>
                    </motion.div>

                    {/* Contact */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center space-y-4"
                    >
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Contact
                        </h2>
                        <div className="space-y-2 text-gray-700 dark:text-white/70">
                            <p>
                                <strong>General inquiries:</strong>{' '}
                                <a href="mailto:contact@data-insights.cloud" className="text-blue-600 dark:text-neon-primary hover:underline">
                                    contact@data-insights.cloud
                                </a>
                            </p>
                            <p>
                                <strong>Support:</strong>{' '}
                                <a href="mailto:contact@data-insights.cloud" className="text-blue-600 dark:text-neon-primary hover:underline">
                                    contact@data-insights.cloud
                                </a>
                            </p>
                            <p>
                                <strong>Press:</strong>{' '}
                                <a href="mailto:contact@data-insights.cloud" className="text-blue-600 dark:text-neon-primary hover:underline">
                                    contact@data-insights.cloud
                                </a>
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </AppLayout>
    )
}

