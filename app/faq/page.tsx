'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, HelpCircle } from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import NeonCard from '../../components/ui/NeonCard'
import NeonButton from '../../components/ui/NeonButton'

const faqSections = [
    {
        title: 'General',
        questions: [
            {
                q: 'What is Whoop Insights?',
                a: 'Whoop Insights is an AI-powered analytics platform that transforms your WHOOP data into personalized predictions and recommendations. While WHOOP tells you what happened yesterday, we predict what\'s coming tomorrow — using machine learning trained on YOUR unique physiology.'
            },
            {
                q: 'How is this different from the WHOOP app?',
                a: 'WHOOP is excellent at tracking and displaying your data. We take that data and build predictive models personalized to YOU. Key differences: (1) We predict tomorrow\'s recovery, WHOOP only shows today. (2) We calculate YOUR personal strain threshold, WHOOP uses population averages. (3) We detect burnout 2-3 days early, WHOOP tells you after. (4) We quantify exactly how YOUR habits affect YOUR recovery.'
            },
            {
                q: 'Is this affiliated with WHOOP Inc?',
                a: 'No. Whoop Insights is an independent analytics platform. We are not affiliated with, endorsed by, or connected to WHOOP Inc. We simply analyze the data you export from your WHOOP device.'
            }
        ]
    },
    {
        title: 'Data & Privacy',
        questions: [
            {
                q: 'Do I need to share my WHOOP login?',
                a: 'No. You export your data as a CSV file from the WHOOP app and upload it directly to our platform. We never access your WHOOP account.'
            },
            {
                q: 'Is my data secure?',
                a: 'Yes. We use bank-level encryption (AES-256) for all data in transit and at rest. Your raw data is processed and immediately discarded — we only store aggregated model outputs. You can delete all your data at any time with one click.'
            },
            {
                q: 'Do you sell my data?',
                a: 'Never. Your data is yours. We don\'t sell, share, or monetize your personal information in any way. See our Privacy Policy for complete details.'
            },
            {
                q: 'Can I delete my data?',
                a: 'Yes. Go to Account Settings → Data Management → Delete All Data. This permanently removes all stored information within 24 hours.'
            }
        ]
    },
    {
        title: 'Accuracy & Requirements',
        questions: [
            {
                q: 'How accurate are the predictions?',
                a: 'Our recovery predictions achieve 85%+ accuracy after 30 days of training data. Accuracy improves over time as the model learns more of your patterns. Users with 60+ days of data typically see 90%+ accuracy.'
            },
            {
                q: 'How much data do I need?',
                a: 'Minimum: 14 days for basic predictions. Recommended: 30+ days for reliable insights. Optimal: 60+ days for all features including circadian rhythm detection.'
            },
            {
                q: 'Does this work with WHOOP 4.0?',
                a: 'Yes. Our platform works with data exports from any WHOOP version (3.0, 4.0, and future versions) that supports CSV export.'
            },
            {
                q: 'What if I have irregular schedules or travel frequently?',
                a: 'Our models are designed to handle variability. Users with irregular schedules often benefit MOST from personalized insights because generic advice fails them. The algorithm learns YOUR patterns, whatever they may be.'
            }
        ]
    },
    {
        title: 'Using the Platform',
        questions: [
            {
                q: 'How do I export my WHOOP data?',
                a: 'Open the WHOOP app → Profile → Settings → Data Export → Request Export. You\'ll receive a CSV file via email within a few minutes.'
            },
            {
                q: 'How often should I upload new data?',
                a: 'For best results: Casual users should upload monthly, serious athletes weekly, and those in competition prep every 3-4 days. Your predictions improve with fresher data.'
            },
            {
                q: 'Is there a mobile app?',
                a: 'Currently, Whoop Insights is a web-based platform optimized for mobile browsers. A native iOS and Android app is on our roadmap for 2025.'
            },
            {
                q: 'What happens if I miss uploading data?',
                a: 'Your predictions remain valid based on historical patterns. When you upload new data, models automatically update. You won\'t lose any functionality — just upload when you can.'
            }
        ]
    },
    {
        title: 'Billing & Support',
        questions: [
            {
                q: 'Can I try Pro before paying?',
                a: 'Yes. Every Pro subscription includes a 14-day free trial. No credit card required to start.'
            },
            {
                q: 'How do I cancel?',
                a: 'Go to Account Settings → Subscription → Cancel. One click, no questions, no phone calls required. You\'ll retain access until the end of your billing period.'
            },
            {
                q: 'What\'s your refund policy?',
                a: '30-day money-back guarantee. If you\'re not satisfied, email contact@data-insights.cloud within 30 days of payment and we\'ll refund 100% — no questions asked.'
            },
            {
                q: 'How do I contact support?',
                a: 'Email contact@data-insights.cloud. Pro users receive priority response within 24 hours. Free users typically receive responses within 48-72 hours.'
            }
        ]
    }
]

export default function FAQPage() {
    return (
        <AppLayout>
            <div className="relative z-10 min-h-screen py-24 px-6 md:px-12">
                <div className="max-w-4xl mx-auto space-y-12">
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
                            Frequently Asked Questions
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-xl text-gray-600 dark:text-white/60 max-w-3xl mx-auto"
                        >
                            Everything you need to know about Whoop Insights
                        </motion.p>
                    </div>

                    {/* FAQ Sections */}
                    <div className="space-y-12">
                        {faqSections.map((section, sectionIndex) => (
                            <motion.div
                                key={sectionIndex}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: sectionIndex * 0.1 }}
                            >
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                    <HelpCircle className="w-6 h-6 text-blue-600 dark:text-neon-primary" />
                                    {section.title}
                                </h2>
                                <div className="space-y-4">
                                    {section.questions.map((faq, index) => (
                                        <NeonCard key={index} className="p-6 border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A]/80">
                                            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-lg">
                                                {faq.q}
                                            </h3>
                                            <p className="text-gray-700 dark:text-white/70 leading-relaxed">
                                                {faq.a}
                                            </p>
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
                            Still have questions?
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-white/60 max-w-2xl mx-auto">
                            Email us at contact@data-insights.cloud — we're happy to help.
                        </p>
                        <div className="pt-2">
                            <Link href="/contact">
                                <NeonButton variant="primary" className="px-8 py-4 text-lg">
                                    Contact Support
                                </NeonButton>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        </AppLayout>
    )
}

