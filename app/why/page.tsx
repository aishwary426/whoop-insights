'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Brain, TrendingUp, Activity, Zap, Target, MessageSquare, Layers, LayoutDashboard } from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import NeonCard from '../../components/ui/NeonCard'
import NeonButton from '../../components/ui/NeonButton'

const points = [
    {
        icon: Brain,
        title: 'From "Here’s your data" to "Here’s what to do"',
        description: 'The WHOOP app shows recovery scores, HRV, and trends. But it rarely answers "What should I do differently today?". Whoop-Insights turns every data point into actionable advice in plain language.',
        color: 'text-blue-600 dark:text-neon-primary'
    },
    {
        icon: Target,
        title: 'Not just averages — personal strategy',
        description: 'Most apps stop at summaries. We identify the top reasons your recovery drops, the habits ruining your sleep, and how to adjust your lifestyle on any given day. WHOOP is the monitor; we are the strategist.',
        color: 'text-purple-400'
    },
    {
        icon: Layers,
        title: 'One place for your whole life',
        description: 'Your body isn’t just HRV. We bring together workouts, sleep, food, caffeine, steps, stress, and travel. Instead of isolated charts, see how your entire life affects your body.',
        color: 'text-blue-400'
    },
    {
        icon: MessageSquare,
        title: 'From passive tracking to an interactive coach',
        description: 'The WHOOP app doesn’t answer "Why am I tired on Tuesdays?". Whoop-Insights acts like a data analyst sitting on top of your data. Ask questions, get explanations, and see patterns you’d miss.',
        color: 'text-pink-400'
    },
    {
        icon: TrendingUp,
        title: 'Don’t just look back — look ahead',
        description: 'Most health apps are backward-looking. We add recovery forecasts ("If you sleep X hours → expect Y% recovery") and early warning signals before you burn out. It’s about what’s likely to happen next.',
        color: 'text-yellow-400'
    },
    {
        icon: Activity,
        title: 'Built around your goal, not generic metrics',
        description: 'Whether chasing fat loss, muscle gain, or peak performance, Whoop-Insights adapts insights, nudges, and weekly breakdowns to your specific goal, not just generic numbers.',
        color: 'text-red-400'
    },
    {
        icon: Zap,
        title: 'Storytelling instead of noise',
        description: 'Most dashboards overwhelm. We focus on clarity with weekly report cards, "Top 5 reasons your recovery dipped", and plain-language breakdowns. You’re not just tracking your life – you’re understanding it.',
        color: 'text-cyan-400'
    },
    {
        icon: LayoutDashboard,
        title: 'A pro-level dashboard',
        description: 'For the 0.1% who want to go deeper. Unlock strain vs steps correlations, sleep debt vs performance, and stress vs HRV over time. Custom views built for serious optimization.',
        color: 'text-orange-400'
    },
    {
        icon: Brain, // Using Brain again as a fallback for "Design" or maybe something else? Let's use a different one if possible, or reuse.
        title: 'Designed to feel as good as it works',
        description: 'Interactive, magnetic visuals. A cosmic, responsive background. A dashboard that feels like NASA mission control for your body. If you look at it every day, it should feel premium.',
        color: 'text-white'
    }
]

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
}

export default function WhyPage() {
    return (
        <AppLayout>
            <div className="relative min-h-screen pt-24 pb-20 px-6 md:px-8 z-10">

                <div className="relative z-10 max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-16 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <Link href="/" className="inline-flex items-center gap-2 text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white transition-colors mb-8">
                                <ArrowLeft className="w-4 h-4" />
                                Back to Home
                            </Link>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="text-4xl md:text-6xl font-bold leading-tight text-gray-900 dark:text-white"
                        >
                            Why Whoop-Insights Exists <br />
                            <span className="text-gray-400 dark:text-white/40 text-2xl md:text-4xl block mt-2">(When WHOOP Already Does)</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-xl text-gray-700 dark:text-white/80 max-w-3xl mx-auto leading-relaxed"
                        >
                            WHOOP is great at tracking. <br />
                            <span className="text-blue-600 dark:text-neon-primary font-medium">Whoop-Insights is built for people who actually want to change.</span>
                        </motion.p>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="text-gray-600 dark:text-white/60 max-w-2xl mx-auto"
                        >
                            We don't replace the WHOOP app — we sit on top of it and turn raw numbers into clear decisions, daily.
                        </motion.p>
                    </div>

                    {/* Grid */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {points.map((point, index) => (
                            <motion.div key={index} variants={itemVariants} className="h-full">
                                <NeonCard className="h-full p-8 border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A]/80 dark:hover:bg-[#0A0A0A] transition-colors group">
                                    <div className={`w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-6 ${point.color} group-hover:scale-110 transition-transform duration-300`}>
                                        <point.icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white/90 group-hover:text-gray-950 dark:group-hover:text-white transition-colors">
                                        {point.title}
                                    </h3>
                                    <p className="text-gray-600 dark:text-white/60 leading-relaxed text-sm">
                                        {point.description}
                                    </p>
                                </NeonCard>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Bottom CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="mt-24 pt-16 pb-20 text-center space-y-6"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Ready to upgrade your insights?</h2>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                            <Link href="/signup">
                                <NeonButton variant="primary" className="px-8 py-4 text-lg">
                                    Start Your Journey
                                </NeonButton>
                            </Link>
                            <Link href="/login">
                                <NeonButton variant="ghost" className="px-8 py-4 text-lg">
                                    Login
                                </NeonButton>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        </AppLayout>
    )
}
