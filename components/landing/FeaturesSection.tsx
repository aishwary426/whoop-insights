'use client'

import { motion } from 'framer-motion'
import { Sparkles, Moon, Gauge, AlertTriangle, Calendar, CheckSquare2 } from 'lucide-react'
import ParallaxSection from '../ui/ParallaxSection'
import NeonCard from '../ui/NeonCard'

const features = [
    {
        icon: Sparkles,
        headline: 'Know tomorrow\'s recovery — today',
        description: 'Our ML model analyzes your strain, sleep, HRV trends, and historical patterns to predict tomorrow\'s recovery score with 85%+ accuracy. Plan your training before your body even tells you.',
        microCopy: 'Predicted recovery: 72% → Safe to push hard tomorrow',
        color: 'text-blue-600 dark:text-neon-primary'
    },
    {
        icon: Moon,
        headline: 'Your optimal bedtime, calculated',
        description: 'Not everyone recovers best at 10 PM. Our algorithm learns YOUR ideal sleep window based on when you actually wake up feeling recovered. Shift your bedtime by 30 minutes and gain 10% better recovery.',
        microCopy: 'Your optimal window: 10:15 PM – 10:45 PM',
        color: 'text-purple-400'
    },
    {
        icon: Gauge,
        headline: 'Find your breaking point — before you break',
        description: 'Everyone has a personal strain ceiling. Push past it and tomorrow\'s recovery tanks. We calculate YOUR threshold so you know exactly when to stop — and when you can safely push harder.',
        microCopy: 'Your safe strain limit: 14.8 — exceeding this increases burnout risk by 60%',
        color: 'text-yellow-400'
    },
    {
        icon: AlertTriangle,
        headline: 'Catch burnout before it catches you',
        description: 'Our anomaly detection spots unusual patterns in your recovery, HRV, and strain — often 2-3 days before you\'d notice symptoms. Get proactive alerts to back off before you\'re forced to.',
        microCopy: '⚠️ Burnout risk elevated — consider a deload day',
        color: 'text-red-400'
    },
    {
        icon: Calendar,
        headline: 'Train when your body is ready',
        description: 'Morning person or evening athlete? We analyze your workout timing patterns against next-day recovery to find YOUR optimal training windows. Some people recover 15% better from morning sessions — are you one of them?',
        microCopy: 'You perform best with morning workouts — 12% higher next-day recovery',
        color: 'text-cyan-400'
    },
    {
        icon: CheckSquare2,
        headline: 'See how your choices affect your body',
        description: 'That glass of wine. The late-night screen time. The skipped meditation. We quantify exactly how YOUR habits impact YOUR recovery — with statistical confidence, not guesswork.',
        microCopy: 'Alcohol lowers your recovery by 18% on average (based on 14 instances)',
        color: 'text-green-400'
    }
]

export default function FeaturesSection() {
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
                        AI that learns YOU
                    </motion.h2>
                    
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                        className="text-lg md:text-xl text-gray-600 dark:text-white/60 max-w-3xl mx-auto leading-relaxed"
                    >
                        Every insight is personalized to your unique physiology, training history, and lifestyle patterns.
                    </motion.p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: index * 0.1 }}
                            className="h-full"
                        >
                            <NeonCard className="h-full p-6 border-gray-200 dark:border-white/10 bg-white/50 dark:bg-[#0A0A0A]/40 dark:hover:bg-[#0A0A0A]/50 transition-colors group">
                                <div className={`w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4 ${feature.color} group-hover:scale-110 transition-transform duration-300`}>
                                    <feature.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white/90 group-hover:text-gray-950 dark:group-hover:text-white transition-colors">
                                    {feature.headline}
                                </h3>
                                <p className="text-gray-600 dark:text-white/60 leading-relaxed mb-4 text-sm">
                                    {feature.description}
                                </p>
                                <div className="pt-4 border-t border-gray-200 dark:border-white/5">
                                    <p className="text-xs md:text-sm text-gray-500 dark:text-white/40 italic">
                                        {feature.microCopy}
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
