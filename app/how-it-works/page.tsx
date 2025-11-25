'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Upload, Brain, BarChart3, CheckCircle2 } from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import NeonCard from '../../components/ui/NeonCard'
import NeonButton from '../../components/ui/NeonButton'

const steps = [
    {
        number: 1,
        icon: Upload,
        title: 'Export Your WHOOP Data',
        time: '30 seconds',
        description: 'Open your WHOOP app, navigate to Settings → Data Export, and download your data as a CSV file. This contains your complete history — recovery scores, strain, sleep, HRV, and journal entries.',
        requirements: [
            'WHOOP app (iOS or Android)',
            'At least 14 days of data (30+ recommended for best accuracy)',
            'Your email to receive the export'
        ],
        tip: 'The more data you have, the more accurate your predictions. Users with 60+ days see the best results.',
        color: 'text-blue-600 dark:text-neon-primary'
    },
    {
        number: 2,
        icon: Brain,
        title: 'Upload & Train Your Personal AI',
        time: '2 minutes',
        description: 'Drag and drop your CSV file into our secure upload portal. Our machine learning models immediately begin analyzing your unique patterns — sleep rhythms, strain responses, recovery velocity, and more.',
        processes: [
            'Data validation and cleaning',
            'Feature extraction (50+ metrics derived from your data)',
            'Model training on YOUR specific patterns',
            'Baseline calculation and threshold detection'
        ],
        privacy: 'Your raw data is processed and immediately discarded. We only store aggregated model outputs — never your personal metrics.',
        color: 'text-purple-400'
    },
    {
        number: 3,
        icon: BarChart3,
        title: 'Access Your Personalized Dashboard',
        time: 'Instant',
        description: 'Your dashboard is ready immediately. Access recovery predictions, optimal timing recommendations, strain thresholds, habit impact scores, and trend analysis — all calibrated to YOUR unique physiology.',
        features: [
            'Tomorrow\'s predicted recovery score',
            'Your personal strain threshold',
            'Optimal sleep window',
            'Best workout timing for your body',
            'Habit impact quantification',
            'Burnout risk indicator',
            'Long-term trend analysis'
        ],
        color: 'text-green-400'
    }
]

export default function HowItWorksPage() {
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
                            From raw data to personalized insights in minutes
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-xl text-gray-600 dark:text-white/60 max-w-3xl mx-auto"
                        >
                            No API access needed. No password sharing. Just your data export and our AI.
                        </motion.p>
                    </div>

                    {/* Steps */}
                    <div className="space-y-12">
                        {steps.map((step, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.2 }}
                            >
                                <NeonCard className="p-8 md:p-12 border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A]/80">
                                    <div className="flex items-start gap-6 mb-6">
                                        <div className={`w-20 h-20 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center flex-shrink-0 ${step.color} border-4 border-gray-200 dark:border-white/10`}>
                                            <step.icon className="w-10 h-10" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-4 mb-2">
                                                <span className="text-sm font-semibold text-gray-500 dark:text-white/40 bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-full">
                                                    STEP {step.number}
                                                </span>
                                                <span className="text-sm font-medium text-gray-600 dark:text-white/60">
                                                    Time: {step.time}
                                                </span>
                                            </div>
                                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                                                {step.title}
                                            </h2>
                                            <p className="text-gray-700 dark:text-white/80 leading-relaxed mb-6">
                                                {step.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="ml-28 md:ml-32 space-y-4">
                                        {step.requirements && (
                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">What you need:</h3>
                                                <ul className="space-y-2 list-disc list-inside text-gray-700 dark:text-white/70">
                                                    {step.requirements.map((req, i) => (
                                                        <li key={i}>{req}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {step.processes && (
                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">What happens behind the scenes:</h3>
                                                <ul className="space-y-2 list-disc list-inside text-gray-700 dark:text-white/70">
                                                    {step.processes.map((proc, i) => (
                                                        <li key={i}>{proc}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {step.features && (
                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">What you'll see:</h3>
                                                <ul className="space-y-2 list-disc list-inside text-gray-700 dark:text-white/70">
                                                    {step.features.map((feat, i) => (
                                                        <li key={i}>{feat}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {step.tip && (
                                            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                                                    <strong>Pro tip:</strong> {step.tip}
                                                </p>
                                            </div>
                                        )}

                                        {step.privacy && (
                                            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                                <p className="text-sm text-blue-800 dark:text-blue-300">
                                                    <strong>Privacy note:</strong> {step.privacy}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </NeonCard>
                            </motion.div>
                        ))}
                    </div>

                    {/* Keeping Fresh Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <NeonCard className="p-8 md:p-12 border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A]/80">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                Keeping Your Insights Fresh
                            </h2>
                            <p className="text-gray-700 dark:text-white/80 leading-relaxed mb-6">
                                Your predictions improve over time. Upload new data exports weekly or monthly to keep your models current. The more data you feed, the smarter your insights become.
                            </p>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    <span className="text-gray-700 dark:text-white/70"><strong>Casual users:</strong> Monthly</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    <span className="text-gray-700 dark:text-white/70"><strong>Serious athletes:</strong> Weekly</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    <span className="text-gray-700 dark:text-white/70"><strong>Competition prep:</strong> Every 3-4 days</span>
                                </div>
                            </div>
                        </NeonCard>
                    </motion.div>

                    {/* Technical Requirements */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <NeonCard className="p-8 md:p-12 border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A]/80">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                Technical Requirements
                            </h2>
                            <ul className="space-y-2 list-disc list-inside text-gray-700 dark:text-white/70">
                                <li>Any modern web browser (Chrome, Safari, Firefox, Edge)</li>
                                <li>WHOOP data export in CSV format</li>
                                <li>Minimum 14 days of data (30+ recommended)</li>
                                <li>Works with WHOOP 3.0, 4.0, and future versions</li>
                            </ul>
                        </NeonCard>
                    </motion.div>

                    {/* Bottom CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center space-y-6 pt-16 pb-20"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                            Ready to get started?
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-white/60 max-w-2xl mx-auto">
                            Takes less than 3 minutes
                        </p>
                        <div className="pt-2">
                            <Link href="/signup">
                                <NeonButton variant="primary" className="px-8 py-4 text-lg">
                                    Get Started Now
                                </NeonButton>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        </AppLayout>
    )
}

