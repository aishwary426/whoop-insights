'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import ParallaxSection from '../ui/ParallaxSection'
import NeonCard from '../ui/NeonCard'

const faqs = [
    {
        question: 'How is this different from WHOOP\'s built-in insights?',
        answer: 'WHOOP tells you what happened. We predict what\'s coming. WHOOP uses population-based thresholds; we calculate YOUR personal thresholds based on YOUR data. WHOOP reacts to burnout; we warn you 2-3 days before it happens.'
    },
    {
        question: 'Do I need to share my WHOOP login credentials?',
        answer: 'No. You simply export your data CSV from the WHOOP app and upload it to our platform. We never access your WHOOP account directly.'
    },
    {
        question: 'How much data do I need for accurate predictions?',
        answer: 'Minimum: 14 days for basic insights. Recommended: 30+ days for reliable predictions. Optimal: 60+ days for full feature accuracy including circadian rhythm detection and long-term trend analysis.'
    },
    {
        question: 'Is my data secure?',
        answer: 'Your privacy is our priority. We use bank-level encryption (AES-256) for data in transit and at rest. We never sell your data. You can delete all your data at any time with one click.'
    },
    {
        question: 'How accurate are the recovery predictions?',
        answer: 'Our models achieve 85%+ accuracy on next-day recovery predictions after 30 days of training data. Accuracy improves over time as the model learns your patterns.'
    },
    {
        question: 'Does this work with WHOOP 4.0?',
        answer: 'Yes. Our platform works with data exports from any WHOOP version (3.0, 4.0, and future versions) as long as you can export the standard CSV format.'
    },
    {
        question: 'Can I use this if I travel frequently or have irregular schedules?',
        answer: 'Absolutely. Our models are designed to handle variability. In fact, users with irregular schedules often benefit MOST from personalized insights because generic advice fails them.'
    },
    {
        question: 'What happens if I miss uploading data for a few days?',
        answer: 'No problem. When you upload new data, our models automatically update. Predictions remain valid based on your historical patterns, and accuracy returns to full once you resume regular uploads.'
    },
    {
        question: 'Is there a mobile app?',
        answer: 'Currently, Whoop Insights is a web-based platform optimized for mobile browsers. A native app is on our roadmap for 2025.'
    },
    {
        question: 'Can I get a refund if it doesn\'t work for me?',
        answer: 'Yes. We offer a 30-day money-back guarantee. If you\'re not seeing value, email us and we\'ll refund your payment — no questions asked.'
    }
]

function FAQItem({ faq, index }: { faq: typeof faqs[0], index: number }) {
    const [isOpen, setIsOpen] = useState(index === 0)

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: index * 0.05 }}
        >
            <NeonCard className="border-gray-200 dark:border-white/10 bg-white/50 dark:bg-[#0A0A0A]/40 dark:hover:bg-[#0A0A0A]/50 transition-colors">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full p-6 text-left flex items-start justify-between gap-4 group"
                >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90 group-hover:text-blue-600 dark:group-hover:text-neon-primary transition-colors pr-4">
                        {faq.question}
                    </h3>
                    <ChevronDown
                        className={`w-5 h-5 text-gray-500 dark:text-white/40 flex-shrink-0 transition-transform duration-300 ${
                            isOpen ? 'rotate-180' : ''
                        }`}
                    />
                </button>
                {isOpen && (
                    <div className="px-6 pb-6">
                        <p className="text-gray-600 dark:text-white/60 leading-relaxed">
                            {faq.answer}
                        </p>
                    </div>
                )}
            </NeonCard>
        </motion.div>
    )
}

export default function FAQSection() {
    return (
        <ParallaxSection id="faq" className="bg-transparent">
            <div className="max-w-4xl mx-auto">
                {/* Section Header */}
                <div className="text-center mb-12 md:mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight"
                    >
                        Questions? We've got answers.
                    </motion.h2>
                </div>

                {/* FAQ Items */}
                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <FAQItem key={index} faq={faq} index={index} />
                    ))}
                </div>
            </div>
        </ParallaxSection>
    )
}
