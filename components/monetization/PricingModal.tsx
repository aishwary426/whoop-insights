'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Sparkles, Zap, Shield, Activity } from 'lucide-react'
import NeonButton from '../ui/NeonButton'
import NeonCard from '../ui/NeonCard'

interface PricingModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function PricingModal({ isOpen, onClose }: PricingModalProps) {
    const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly')

    if (!isOpen) return null

    const features = [
        { name: 'Advanced Recovery Prediction', free: false, pro: true },
        { name: 'Habit Impact Analysis', free: false, pro: true },
        { name: 'Smart Notifications', free: false, pro: true },
        { name: 'Unlimited History', free: false, pro: true },
        { name: 'Basic Trends', free: true, pro: true },
        { name: 'Daily Journal', free: true, pro: true },
    ]

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="w-full max-w-4xl pointer-events-auto">
                            <NeonCard className="relative overflow-hidden bg-[#0A0A0A] border-gray-800">
                                {/* Close Button */}
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>

                                <div className="p-8 md:p-12">
                                    <div className="text-center mb-12">
                                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                                            Unlock Your Full Potential
                                        </h2>
                                        <p className="text-gray-400 max-w-xl mx-auto">
                                            Get AI-powered insights, predictive analytics, and personalized recommendations to optimize your performance.
                                        </p>

                                        {/* Billing Toggle */}
                                        <div className="flex items-center justify-center gap-4 mt-8">
                                            <span className={`text-sm ${billingInterval === 'monthly' ? 'text-white' : 'text-gray-500'}`}>Monthly</span>
                                            <button
                                                onClick={() => setBillingInterval(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
                                                className="relative w-14 h-8 rounded-full bg-gray-800 transition-colors"
                                            >
                                                <motion.div
                                                    animate={{ x: billingInterval === 'monthly' ? 2 : 26 }}
                                                    className="w-6 h-6 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50"
                                                />
                                            </button>
                                            <span className={`text-sm ${billingInterval === 'yearly' ? 'text-white' : 'text-gray-500'}`}>
                                                Yearly <span className="text-green-400 text-xs ml-1">(Save 20%)</span>
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-8">
                                        {/* Free Plan */}
                                        <div className="p-6 rounded-2xl border border-gray-800 bg-gray-900/50">
                                            <h3 className="text-xl font-bold text-white mb-2">Basic</h3>
                                            <div className="text-3xl font-bold text-white mb-6">$0<span className="text-sm text-gray-500 font-normal">/mo</span></div>
                                            <ul className="space-y-4 mb-8">
                                                {features.map((feature, i) => (
                                                    <li key={i} className="flex items-center gap-3">
                                                        {feature.free ? (
                                                            <Check className="w-5 h-5 text-gray-400" />
                                                        ) : (
                                                            <X className="w-5 h-5 text-gray-700" />
                                                        )}
                                                        <span className={feature.free ? 'text-gray-300' : 'text-gray-600'}>
                                                            {feature.name}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                            <button
                                                onClick={onClose}
                                                className="w-full py-3 rounded-xl border border-gray-700 text-white hover:bg-gray-800 transition-colors font-medium"
                                            >
                                                Continue Free
                                            </button>
                                        </div>

                                        {/* Pro Plan */}
                                        <div className="relative p-6 rounded-2xl border border-blue-500/30 bg-blue-500/5">
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-blue-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-500/20">
                                                Most Popular
                                            </div>
                                            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                                Pro <Sparkles className="w-4 h-4 text-blue-400" />
                                            </h3>
                                            <div className="text-3xl font-bold text-white mb-6">
                                                ${billingInterval === 'monthly' ? '9' : '7'}
                                                <span className="text-sm text-gray-500 font-normal">/mo</span>
                                            </div>
                                            <ul className="space-y-4 mb-8">
                                                {features.map((feature, i) => (
                                                    <li key={i} className="flex items-center gap-3">
                                                        <Check className="w-5 h-5 text-blue-400" />
                                                        <span className="text-white">
                                                            {feature.name}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                            <NeonButton
                                                variant="primary"
                                                className="w-full justify-center"
                                                onClick={() => {
                                                    // TODO: Integrate Lemon Squeezy / Stripe
                                                    console.log('Upgrade clicked')
                                                }}
                                            >
                                                Upgrade to Pro
                                            </NeonButton>
                                        </div>
                                    </div>
                                </div>
                            </NeonCard>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
