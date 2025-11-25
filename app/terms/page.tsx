'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, FileText, AlertTriangle, CheckCircle, User, CreditCard, Shield, X, Gavel, Scale } from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import NeonCard from '../../components/ui/NeonCard'

const sections = [
    {
        icon: CheckCircle,
        title: 'Agreement to Terms',
        content: 'These Terms of Service ("Terms") govern your access to and use of the Whoop Insights website and services (the "Service"). By accessing or using the Service, you agree to be bound by these Terms. If you do not agree, do not use the Service.',
        color: 'text-blue-600 dark:text-neon-primary'
    },
    {
        icon: FileText,
        title: 'Description of Service',
        content: 'Whoop Insights provides AI-powered analytics for WHOOP wearable device users. The Service analyzes data you export from your WHOOP device to provide personalized insights, predictions, and recommendations.',
        important: 'Important: Whoop Insights is an independent service and is not affiliated with, endorsed by, or connected to WHOOP Inc.',
        color: 'text-purple-400'
    },
    {
        icon: User,
        title: 'Eligibility',
        content: 'You must be at least 16 years old to use the Service. By using the Service, you represent that you meet this requirement and have the legal capacity to enter into these Terms.',
        color: 'text-green-500'
    },
    {
        icon: User,
        title: 'Account Registration',
        description: 'To use certain features, you must create an account. You agree to:',
        items: [
            'Provide accurate and complete information',
            'Maintain the security of your password',
            'Notify us immediately of any unauthorized access',
            'Accept responsibility for all activity under your account'
        ],
        color: 'text-yellow-400'
    },
    {
        icon: FileText,
        title: 'User Data and Content',
        description: 'You retain ownership of all data you upload to the Service ("User Data"). By uploading User Data, you grant us a limited license to process, analyze, and store it solely for the purpose of providing the Service to you.',
        note: 'You represent that you have the right to upload any data you provide and that doing so does not violate any third-party rights.',
        color: 'text-red-400'
    },
    {
        icon: X,
        title: 'Acceptable Use',
        description: 'You agree NOT to:',
        items: [
            'Use the Service for any unlawful purpose',
            'Upload data belonging to others without authorization',
            'Attempt to gain unauthorized access to any part of the Service',
            'Interfere with or disrupt the Service',
            'Reverse engineer, decompile, or disassemble the Service',
            'Use automated systems to access the Service without permission',
            'Resell or redistribute the Service without authorization'
        ],
        color: 'text-cyan-400'
    },
    {
        icon: CreditCard,
        title: 'Subscriptions and Payments',
        description: '',
        items: [
            'Free Tier: Available at no cost with limited features.',
            'Pro Tier: Paid subscription with additional features. Billed monthly or annually.',
            'Billing: Subscriptions automatically renew unless cancelled. You authorize us to charge your payment method on each renewal date.',
            'Cancellation: Cancel anytime from Account Settings. Access continues until the end of your billing period.',
            'Refunds: 30-day money-back guarantee for first-time subscribers. Contact contact@data-insights.cloud.'
        ],
        color: 'text-pink-400'
    },
    {
        icon: Shield,
        title: 'Intellectual Property',
        description: 'The Service, including its software, design, text, graphics, and other content (excluding User Data), is owned by Whoop Insights and protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works without our permission.',
        note: '"WHOOP" is a trademark of WHOOP Inc. and is used for identification purposes only. Whoop Insights is not affiliated with WHOOP Inc.',
        color: 'text-orange-400'
    },
    {
        icon: AlertTriangle,
        title: 'Disclaimer of Warranties',
        description: 'THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.',
        health: 'Health Disclaimer: The Service provides informational insights only. It is NOT medical advice. Predictions and recommendations are based on statistical models and may not be accurate for all individuals. Always consult a qualified healthcare provider before making health-related decisions.',
        color: 'text-red-500'
    },
    {
        icon: Shield,
        title: 'Limitation of Liability',
        description: 'TO THE MAXIMUM EXTENT PERMITTED BY LAW, WHOOP INSIGHTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR USE, ARISING FROM YOUR USE OF THE SERVICE.',
        note: 'OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.',
        color: 'text-indigo-400'
    },
    {
        icon: Shield,
        title: 'Indemnification',
        description: 'You agree to indemnify and hold harmless Whoop Insights and its officers, directors, employees, and agents from any claims, damages, losses, or expenses (including attorney\'s fees) arising from your use of the Service or violation of these Terms.',
        color: 'text-blue-500'
    },
    {
        icon: X,
        title: 'Termination',
        description: 'We may suspend or terminate your access to the Service at any time for any reason, including violation of these Terms. Upon termination, your right to use the Service ceases immediately. Provisions that by their nature should survive termination will survive.',
        color: 'text-gray-500'
    },
    {
        icon: Gavel,
        title: 'Dispute Resolution',
        items: [
            'Governing Law: These Terms are governed by the laws of [Your Jurisdiction], without regard to conflict of law principles.',
            'Arbitration: Any disputes shall be resolved through binding arbitration in accordance with [Arbitration Rules], except that either party may seek injunctive relief in court.',
            'Class Action Waiver: You agree to resolve disputes individually and waive any right to participate in class actions.'
        ],
        color: 'text-purple-500'
    },
    {
        icon: FileText,
        title: 'Modifications to Terms',
        description: 'We may modify these Terms at any time. We will notify you of material changes by posting the updated Terms and updating the "Last Updated" date. Continued use after changes constitutes acceptance.',
        color: 'text-green-400'
    },
    {
        icon: Scale,
        title: 'Severability',
        description: 'If any provision of these Terms is found unenforceable, the remaining provisions will continue in effect.',
        color: 'text-yellow-500'
    },
    {
        icon: FileText,
        title: 'Entire Agreement',
        description: 'These Terms, together with our Privacy Policy, constitute the entire agreement between you and Whoop Insights regarding the Service.',
        color: 'text-cyan-500'
    }
]

export default function TermsPage() {
    return (
        <AppLayout>
            <div className="relative z-10 min-h-screen py-24 px-6 md:px-12">
                <div className="max-w-5xl mx-auto space-y-12">
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
                            Terms of Service
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-xl text-gray-600 dark:text-white/60 max-w-3xl mx-auto"
                        >
                            Last Updated: November 2025
                        </motion.p>
                    </div>

                    {/* Sections */}
                    <div className="space-y-8">
                        {sections.map((section, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <NeonCard className="p-8 border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A]/80">
                                    <div className="flex items-start gap-6">
                                        <div className={`w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center flex-shrink-0 ${section.color}`}>
                                            <section.icon className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                                {section.title}
                                            </h2>
                                            {section.content && (
                                                <p className="text-gray-700 dark:text-white/80 leading-relaxed mb-4">
                                                    {section.content}
                                                </p>
                                            )}
                                            {section.description && (
                                                <p className="text-gray-700 dark:text-white/80 leading-relaxed mb-4">
                                                    {section.description}
                                                </p>
                                            )}
                                            {section.items && (
                                                <ul className="space-y-2 list-disc list-inside text-gray-700 dark:text-white/70">
                                                    {section.items.map((item, i) => (
                                                        <li key={i}>{item}</li>
                                                    ))}
                                                </ul>
                                            )}
                                            {section.important && (
                                                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                                    <p className="text-sm text-yellow-800 dark:text-yellow-300 font-semibold">
                                                        {section.important}
                                                    </p>
                                                </div>
                                            )}
                                            {section.health && (
                                                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                                    <p className="text-sm text-red-800 dark:text-red-300">
                                                        {section.health}
                                                    </p>
                                                </div>
                                            )}
                                            {section.note && (
                                                <p className="mt-4 text-sm text-gray-600 dark:text-white/60 italic">
                                                    {section.note}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </NeonCard>
                            </motion.div>
                        ))}
                    </div>

                    {/* Contact */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center"
                    >
                        <NeonCard className="p-8 border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A]/80">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                Contact
                            </h2>
                            <p className="text-gray-700 dark:text-white/80 mb-4">
                                Questions about these Terms? Contact us at:
                            </p>
                            <a
                                href="mailto:contact@data-insights.cloud"
                                className="text-blue-600 dark:text-neon-primary hover:underline font-medium"
                            >
                                contact@data-insights.cloud
                            </a>
                        </NeonCard>
                    </motion.div>
                </div>
            </div>
        </AppLayout>
    )
}
