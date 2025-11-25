'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Brain, Moon, Activity, AlertTriangle, Clock, TrendingUp, Target, Zap } from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import NeonCard from '../../components/ui/NeonCard'
import NeonButton from '../../components/ui/NeonButton'

const features = [
    {
        icon: Brain,
        title: 'Recovery Prediction',
        tagline: 'Know tomorrow\'s recovery score — tonight',
        description: 'Stop waking up to surprise red days. Our machine learning model analyzes your strain, sleep timing, HRV trends, and historical patterns to predict tomorrow\'s recovery with 85%+ accuracy.',
        capabilities: [
            'Next-day recovery prediction with confidence intervals',
            'Key factors driving each prediction explained',
            'Actionable recommendations to improve your score',
            'Multi-day forecasting (up to 7 days on Pro)'
        ],
        example: 'Tomorrow\'s predicted recovery: 68% (±5%). Main factors: High strain today (16.2), optimal sleep timing. Recommendation: Keep strain below 12 tomorrow for best recovery trajectory.',
        color: 'text-blue-600 dark:text-neon-primary'
    },
    {
        icon: Moon,
        title: 'Personalized Sleep Windows',
        tagline: 'Your optimal bedtime, calculated to the minute',
        description: 'Generic advice says "sleep by 10 PM." But your body has its own rhythm. We analyze your historical sleep data against next-day recovery outcomes to find YOUR ideal sleep window — often different from what you\'d expect.',
        capabilities: [
            'Personalized optimal bedtime range',
            'Wake time optimization',
            'Weekend vs. weekday pattern analysis',
            'Sleep debt tracking and recovery projections'
        ],
        example: 'Your optimal sleep window: 10:15 PM – 10:45 PM. Sleeping in this window correlates with 12% higher next-day recovery compared to your current average bedtime of 11:30 PM.',
        color: 'text-purple-400'
    },
    {
        icon: Activity,
        title: 'Strain Threshold Detection',
        tagline: 'Find your breaking point — before you break',
        description: 'Everyone has a personal strain ceiling. Push past it, and tomorrow\'s recovery tanks. We calculate YOUR specific threshold based on your historical data — not population averages.',
        capabilities: [
            'Personal strain ceiling calculation',
            'Recovery-adjusted daily strain targets',
            'Overtraining risk alerts',
            'Strain capacity trend over time'
        ],
        example: 'Your safe strain threshold: 14.8. Exceeding this increases burnout risk by 60%. Today\'s recommended max strain: 13.2 (based on current 62% recovery).',
        color: 'text-blue-400'
    },
    {
        icon: AlertTriangle,
        title: 'Burnout Early Warning',
        tagline: 'Catch burnout before it catches you',
        description: 'Our anomaly detection algorithm spots unusual patterns in your recovery, HRV, and strain — often 2-3 days before you\'d notice symptoms. Get proactive alerts to back off before you\'re forced to.',
        capabilities: [
            'Real-time anomaly detection',
            'Multi-factor burnout risk scoring',
            'Historical burnout pattern recognition',
            'Personalized deload recommendations'
        ],
        example: '⚠️ Burnout Risk: HIGH (78%). Detected: Declining HRV trend (-8% over 5 days), elevated resting HR (+4 bpm), recovery below baseline for 3 consecutive days. Recommendation: Deload for 2-3 days.',
        color: 'text-red-400'
    },
    {
        icon: Clock,
        title: 'Workout Timing Optimization',
        tagline: 'Train when your body is actually ready',
        description: 'Morning person or evening athlete? We analyze your workout timing patterns against next-day recovery outcomes to identify YOUR optimal training windows.',
        capabilities: [
            'Optimal workout time detection',
            'Recovery impact by training time',
            'Day-of-week performance patterns',
            'Circadian rhythm alignment scoring'
        ],
        example: 'You recover 15% better from morning workouts (before 9 AM) compared to evening sessions. Your peak performance days: Tuesday and Thursday. Consider scheduling key workouts then.',
        color: 'text-yellow-400'
    },
    {
        icon: TrendingUp,
        title: 'Habit Impact Analysis',
        tagline: 'Quantify how your choices affect your body',
        description: 'That glass of wine. The late-night screen time. The skipped meditation. We analyze your WHOOP journal entries to calculate exactly how YOUR habits impact YOUR recovery — with statistical confidence.',
        capabilities: [
            'Per-habit recovery impact calculation',
            'Statistical significance indicators',
            'Habit stacking correlation analysis',
            'Trend tracking over time'
        ],
        example: 'Alcohol impact: -18% recovery (based on 14 instances, statistically significant). Late screen time (after 10 PM): -8% recovery. Meditation: +6% recovery.',
        color: 'text-cyan-400'
    },
    {
        icon: Target,
        title: 'Dynamic Baseline Adaptation',
        tagline: 'Thresholds that evolve as you do',
        description: 'Your fitness changes over time — your baselines should too. We track rolling 30-day windows to detect when your HRV, recovery capacity, and strain tolerance are trending up or down.',
        capabilities: [
            'Personal recovery baseline tracking',
            'HRV trend analysis with improvement percentages',
            'Fitness trajectory visualization',
            'Baseline deviation alerts'
        ],
        example: 'Your HRV baseline has improved 12% over the past 30 days (from 52ms to 58ms). Your recovery baseline is up 8%. Your fitness is trending upward — consider gradually increasing training load.',
        color: 'text-green-400'
    },
    {
        icon: Zap,
        title: 'Performance Windows',
        tagline: 'Know your peak days before they arrive',
        description: 'Some days you\'re just ON. We identify the patterns that predict your peak performance days so you can schedule important workouts, races, or competitions accordingly.',
        capabilities: [
            'Peak performance day prediction',
            'Recovery-to-performance correlation mapping',
            'Event scheduling recommendations',
            'Historical peak pattern analysis'
        ],
        example: '',
        color: 'text-pink-400'
    }
]

export default function FeaturesPage() {
    return (
        <AppLayout>
            <div className="relative z-10 min-h-screen py-24 px-6 md:px-12">
                <div className="max-w-6xl mx-auto space-y-16">
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
                            Everything your WHOOP app doesn't tell you
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-xl text-gray-600 dark:text-white/60 max-w-3xl mx-auto"
                        >
                            Personalized predictions, optimal timing, and early warnings — all trained on YOUR unique physiology.
                        </motion.p>
                    </div>

                    {/* Features Grid */}
                    <div className="space-y-12">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <NeonCard className="p-8 md:p-12 border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A]/80">
                                    <div className="flex items-start gap-6 mb-6">
                                        <div className={`w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center flex-shrink-0 ${feature.color}`}>
                                            <feature.icon className="w-8 h-8" />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                                {feature.title}
                                            </h2>
                                            <p className="text-lg text-gray-600 dark:text-white/60 italic mb-4">
                                                {feature.tagline}
                                            </p>
                                            <p className="text-gray-700 dark:text-white/80 leading-relaxed mb-6">
                                                {feature.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="ml-22 md:ml-24 space-y-4">
                                        <h3 className="font-semibold text-gray-900 dark:text-white">Key capabilities:</h3>
                                        <ul className="space-y-2 list-disc list-inside text-gray-700 dark:text-white/70">
                                            {feature.capabilities.map((cap, i) => (
                                                <li key={i}>{cap}</li>
                                            ))}
                                        </ul>

                                        {feature.example && (
                                            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                                <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">Example output:</p>
                                                <p className="text-sm text-blue-800 dark:text-blue-300 italic">
                                                    "{feature.example}"
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </NeonCard>
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
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                            Ready to unlock all features?
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-white/60 max-w-2xl mx-auto">
                            Get started free with your WHOOP data. No credit card required. Works with 14+ days of data.
                        </p>
                        <div className="pt-2">
                            <Link href="/signup">
                                <NeonButton variant="primary" className="px-8 py-4 text-lg">
                                    Get Started Free
                                </NeonButton>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        </AppLayout>
    )
}

