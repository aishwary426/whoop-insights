'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Clock, Calendar, Lightbulb } from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import NeonCard from '../../components/ui/NeonCard'
import NeonButton from '../../components/ui/NeonButton'

const roadmapItems = [
    {
        category: 'Recently Shipped',
        icon: CheckCircle2,
        color: 'text-green-500',
        items: [
            { title: 'Recovery Prediction Engine', date: 'November 2025', description: 'ML-powered next-day recovery predictions with 85%+ accuracy.' },
            { title: 'Personalized Sleep Windows', date: 'November 2025', description: 'Optimal bedtime calculation based on your historical recovery data.' },
            { title: 'Strain Threshold Detection', date: 'November 2025', description: 'Personal strain ceiling calculation to prevent overtraining.' },
            { title: 'Burnout Early Warning', date: 'November 2025', description: 'Anomaly detection that spots burnout risk 2-3 days early.' }
        ]
    },
    {
        category: 'In Progress',
        icon: Clock,
        color: 'text-blue-500',
        items: [
            { title: 'Multi-Day Recovery Forecasting', date: 'December 2025', description: 'Predict recovery 3-7 days ahead, not just tomorrow. Plan your training week with confidence.', status: 'In development, 70% complete' },
            { title: 'Injury Risk Early Warning', date: 'December 2025', description: 'Detect early warning signs of potential injury using acute:chronic workload ratios and HRV trends.', status: 'In development, 40% complete' },
            { title: 'Workout Type Recommendations', date: 'January 2026', description: 'Suggest specific workout types (Zone 2, HIIT, strength, rest) based on your current recovery state.', status: 'Design phase' }
        ]
    },
    {
        category: 'Planned',
        icon: Calendar,
        color: 'text-purple-500',
        items: [
            { title: 'Native Mobile Apps', date: 'Q1 2026', description: 'iOS and Android apps with push notifications for daily insights and alerts.' },
            { title: 'Direct WHOOP Integration', date: 'Q1 2026', description: 'OAuth-based connection to sync data automatically (pending WHOOP API access).' },
            { title: 'Team Dashboard', date: 'Q2 2026', description: 'Multi-athlete view for coaches, trainers, and sports teams.' },
            { title: 'Garmin / Apple Watch Integration', date: 'Q2 2026', description: 'Expand beyond WHOOP to support other wearables.' },
            { title: 'AI Training Plan Generator', date: 'Q3 2026', description: 'Automatically generate personalized weekly training plans based on your goals, recovery patterns, and schedule.' }
        ]
    },
    {
        category: 'Under Consideration',
        icon: Lightbulb,
        color: 'text-yellow-500',
        items: [
            { title: 'Nutrition tracking integration', description: 'Correlate nutrition data with recovery patterns.' },
            { title: 'Menstrual cycle correlation analysis', description: 'Understand how hormonal cycles affect recovery and performance.' },
            { title: 'Competition taper optimization', description: 'AI-powered taper recommendations for peak performance on race day.' },
            { title: 'Social features / community', description: 'Connect with other athletes and share insights (anonymized).' },
            { title: 'Slack / Discord integrations', description: 'Get daily insights delivered to your team channels.' }
        ]
    }
]

export default function RoadmapPage() {
    return (
        <AppLayout>
            <div className="relative z-10 min-h-screen py-24 px-6 md:px-12">
                <div className="max-w-5xl mx-auto space-y-16">
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
                            What we're building next
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-xl text-gray-600 dark:text-white/60 max-w-3xl mx-auto"
                        >
                            Our product roadmap is shaped by user feedback. Here's where we're headed.
                        </motion.p>
                    </div>

                    {/* Roadmap Sections */}
                    <div className="space-y-12">
                        {roadmapItems.map((section, sectionIndex) => (
                            <motion.div
                                key={sectionIndex}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: sectionIndex * 0.1 }}
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <section.icon className={`w-6 h-6 ${section.color}`} />
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {section.category}
                                    </h2>
                                </div>
                                <div className="space-y-4">
                                    {section.items.map((item, index) => (
                                        <NeonCard key={index} className="p-6 border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A]/80">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                            {item.title}
                                                        </h3>
                                                        {item.date && (
                                                            <span className="text-xs font-medium text-gray-500 dark:text-white/40 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded">
                                                                {item.date}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-gray-700 dark:text-white/70 mb-2">
                                                        {item.description}
                                                    </p>
                                                    {item.status && (
                                                        <p className="text-sm text-blue-600 dark:text-blue-400 italic">
                                                            Status: {item.status}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </NeonCard>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Bottom CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center space-y-6 pt-16 pb-20"
                    >
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Have a feature request?
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-white/60 max-w-2xl mx-auto leading-relaxed">
                            We build what users need. Email your ideas to contact@data-insights.cloud or vote on existing requests in our community.
                        </p>
                        <div className="pt-2">
                            <Link href="/contact">
                                <NeonButton variant="primary" className="px-10 py-4 text-lg">
                                    Submit Feature Request
                                </NeonButton>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        </AppLayout>
    )
}

