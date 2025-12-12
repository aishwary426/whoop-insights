'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Check, X } from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import NeonCard from '../../components/ui/NeonCard'
import NeonButton from '../../components/ui/NeonButton'

const tiers = [
    {
        name: 'FREE',
        price: '$0',
        period: 'month — forever',
        description: 'Best for: Trying out the platform, casual WHOOP users',
        features: [
            'Next-day recovery prediction',
            'Basic strain threshold detection',
            'Sleep pattern analysis',
            '30-day data limit',
            'Weekly dashboard refresh'
        ],
        cta: 'Get Started Free',
        highlight: false
    },
    {
        name: 'PRO',
        price: '$9',
        period: 'month or $79/year (save 27%)',
        description: 'Best for: Serious athletes, data-driven training',
        features: [
            'Everything in Free, plus:',
            'Multi-day recovery forecasting (up to 7 days)',
            'Personalized sleep window optimization',
            'Workout timing optimization',
            'Habit impact quantification',
            'Burnout early warning system',
            'Dynamic baseline adaptation',
            'Performance window detection',
            'Unlimited historical data',
            'Daily dashboard refresh',
            'Priority email support'
        ],
        cta: 'Start 14-Day Free Trial',
        highlight: true
    },
    {
        name: 'TEAM',
        price: 'Contact us',
        period: '',
        description: 'Best for: Coaches, sports teams, performance centers',
        features: [
            'Everything in Pro, plus:',
            'Multi-athlete dashboard',
            'Team-wide trend analysis',
            'Comparative benchmarking',
            'Coach-specific alerts',
            'API access',
            'Dedicated support'
        ],
        cta: 'Join Waitlist',
        highlight: false,
        comingSoon: true
    }
]

const faqs = [
    {
        q: 'Can I try Pro before paying?',
        a: 'Yes. Every Pro subscription starts with a 14-day free trial. No credit card required to start.'
    },
    {
        q: 'What happens when my trial ends?',
        a: 'You\'ll be prompted to enter payment details. If you don\'t, you\'ll be automatically downgraded to the Free tier — no charges, no hassle.'
    },
    {
        q: 'Can I cancel anytime?',
        a: 'Absolutely. Cancel with one click from your account settings. No contracts, no cancellation fees, no questions asked.'
    },
    {
        q: 'What payment methods do you accept?',
        a: 'All major credit cards (Visa, Mastercard, American Express) and PayPal. All payments processed securely via Stripe.'
    },
    {
        q: 'Is there a refund policy?',
        a: 'Yes. 30-day money-back guarantee. If you\'re not seeing value, email us and we\'ll refund your payment — no questions asked.'
    },
    {
        q: 'Do you offer student or military discounts?',
        a: 'Yes. Email contact@data-insights.cloud with verification and we\'ll apply a 30% discount to your account.'
    }
]

const comparisonFeatures = [
    { feature: 'Next-day recovery prediction', free: true, pro: true },
    { feature: 'Multi-day forecasting (7 days)', free: false, pro: true },
    { feature: 'Strain threshold detection', free: 'Basic', pro: 'Advanced' },
    { feature: 'Sleep window optimization', free: false, pro: true },
    { feature: 'Workout timing optimization', free: false, pro: true },
    { feature: 'Habit impact analysis', free: false, pro: true },
    { feature: 'Burnout early warning', free: false, pro: true },
    { feature: 'Dynamic baselines', free: false, pro: true },
    { feature: 'Historical data limit', free: '30 days', pro: 'Unlimited' },
    { feature: 'Dashboard refresh', free: 'Weekly', pro: 'Daily' },
    { feature: 'Support', free: 'Community', pro: 'Priority email' }
]

export default function PricingPage() {
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
                            Simple pricing. Serious insights.
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-xl text-gray-600 dark:text-white/60 max-w-3xl mx-auto"
                        >
                            Start free. Upgrade when you're ready for more.
                        </motion.p>
                    </div>

                    {/* Pricing Tiers */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {tiers.map((tier, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <NeonCard className={`p-8 h-full flex flex-col border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A]/80 ${tier.highlight ? 'ring-2 ring-blue-600 dark:ring-neon-primary' : ''}`}>
                                    {tier.comingSoon && (
                                        <div className="mb-4">
                                            <span className="text-xs font-semibold text-gray-500 dark:text-white/40 bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-full">
                                                Coming Soon
                                            </span>
                                        </div>
                                    )}
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                        {tier.name}
                                    </h2>
                                    <div className="mb-4">
                                        <span className="text-4xl font-bold text-gray-900 dark:text-white">{tier.price}</span>
                                        {tier.period && (
                                            <span className="text-gray-600 dark:text-white/60">/{tier.period}</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-white/60 mb-6">
                                        {tier.description}
                                    </p>
                                    <ul className="space-y-3 flex-1 mb-8">
                                        {tier.features.map((feat, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                                <span className="text-sm text-gray-700 dark:text-white/70">{feat}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <Link href={tier.comingSoon ? "/contact" : "/signup"} className="mt-auto">
                                        <NeonButton 
                                            variant={tier.highlight ? "primary" : "ghost"} 
                                            className="w-full py-3"
                                        >
                                            {tier.cta}
                                        </NeonButton>
                                    </Link>
                                </NeonCard>
                            </motion.div>
                        ))}
                    </div>

                    {/* Comparison Table */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <NeonCard className="p-8 border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A]/80 overflow-x-auto">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                                Feature Comparison
                            </h2>
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-white/10">
                                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Feature</th>
                                        <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">Free</th>
                                        <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">Pro</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {comparisonFeatures.map((item, index) => (
                                        <tr key={index} className="border-b border-gray-200 dark:border-white/5">
                                            <td className="py-3 px-4 text-gray-700 dark:text-white/70">{item.feature}</td>
                                            <td className="py-3 px-4 text-center">
                                                {item.free === true ? (
                                                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                                                ) : item.free === false ? (
                                                    <X className="w-5 h-5 text-gray-400 mx-auto" />
                                                ) : (
                                                    <span className="text-gray-700 dark:text-white/70">{item.free}</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {item.pro === true ? (
                                                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                                                ) : item.pro === false ? (
                                                    <X className="w-5 h-5 text-gray-400 mx-auto" />
                                                ) : (
                                                    <span className="text-gray-700 dark:text-white/70">{item.pro}</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </NeonCard>
                    </motion.div>

                    {/* Guarantee */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center"
                    >
                        <NeonCard className="p-8 border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A]/80">
                            <p className="text-lg text-gray-700 dark:text-white/80 italic">
                                "If you don't see value in your first 30 days, we'll refund 100% of your payment. No questions asked. We're that confident in what we've built."
                            </p>
                        </NeonCard>
                    </motion.div>

                    {/* FAQ */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                            Pricing FAQ
                        </h2>
                        <div className="space-y-4">
                            {faqs.map((faq, index) => (
                                <NeonCard key={index} className="p-6 border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A]/80">
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                        {faq.q}
                                    </h3>
                                    <p className="text-gray-700 dark:text-white/70">
                                        {faq.a}
                                    </p>
                                </NeonCard>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </AppLayout>
    )
}

