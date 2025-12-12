'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Shield, Lock, Server, Database, Eye, Cookie, Users, Globe } from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import NeonCard from '../../components/ui/NeonCard'

const sections = [
    {
        icon: Database,
        title: 'Information We Collect',
        subsections: [
            {
                subtitle: 'Information You Provide:',
                items: [
                    'Account Information: Email address, name, and password when you create an account.',
                    'WHOOP Data: When you upload your WHOOP data export, we receive physiological metrics including recovery scores, strain scores, sleep data, heart rate variability (HRV), resting heart rate, and journal entries.',
                    'Payment Information: If you subscribe to a paid plan, payment is processed by Stripe. We do not store your full credit card number.',
                    'Communications: When you contact us, we collect the information you provide in your message.'
                ]
            },
            {
                subtitle: 'Information Collected Automatically:',
                items: [
                    'Usage Data: Pages visited, features used, time spent on the Service.',
                    'Device Information: Browser type, operating system, device identifiers.',
                    'Log Data: IP address, access times, referring URLs.'
                ]
            }
        ],
        color: 'text-blue-600 dark:text-neon-primary'
    },
    {
        icon: Server,
        title: 'How We Use Your Information',
        items: [
            'Provide, maintain, and improve the Service',
            'Train machine learning models on YOUR data to generate personalized insights (models are trained per-user and are not shared)',
            'Process transactions and send related information',
            'Send administrative messages, updates, and security alerts',
            'Respond to your comments, questions, and support requests',
            'Monitor and analyze usage trends to improve user experience',
            'Detect, prevent, and address technical issues and fraud'
        ],
        color: 'text-purple-400'
    },
    {
        icon: Lock,
        title: 'How We Protect Your Data',
        items: [
            'Encryption: All data is encrypted in transit (TLS 1.3) and at rest (AES-256).',
            'Data Minimization: Raw WHOOP data is processed and immediately discarded. We only store aggregated model outputs.',
            'Access Controls: Strict access controls limit who can access user data.',
            'Regular Audits: We conduct regular security assessments.'
        ],
        color: 'text-green-500'
    },
    {
        icon: Database,
        title: 'Data Retention',
        items: [
            'Account Data: Retained while your account is active and for 30 days after deletion.',
            'Model Outputs: Retained while your account is active. Deleted within 30 days of account deletion.',
            'Raw WHOOP Data: Processed and immediately discarded. Not retained.',
            'Payment Records: Retained as required by law (typically 7 years for tax purposes).'
        ],
        color: 'text-yellow-400'
    },
    {
        icon: Users,
        title: 'Sharing Your Information',
        description: 'We do NOT sell your personal information. We may share information with:',
        items: [
            'Service Providers: Third parties who perform services on our behalf (hosting, payment processing, analytics). These providers are contractually obligated to protect your data.',
            'Legal Requirements: When required by law, subpoena, or government request.',
            'Business Transfers: In connection with a merger, acquisition, or sale of assets (you will be notified).',
            'With Your Consent: When you explicitly authorize sharing.'
        ],
        color: 'text-red-400'
    },
    {
        icon: Eye,
        title: 'Your Rights',
        description: 'Depending on your location, you may have the right to:',
        items: [
            'Access: Request a copy of your personal data.',
            'Correction: Request correction of inaccurate data.',
            'Deletion: Request deletion of your data (Account Settings → Delete All Data).',
            'Portability: Request your data in a portable format.',
            'Opt-Out: Opt out of marketing communications.'
        ],
        note: 'To exercise these rights, contact us at contact@data-insights.cloud.',
        color: 'text-cyan-400'
    },
    {
        icon: Cookie,
        title: 'Cookies and Tracking',
        description: 'We use cookies and similar technologies for:',
        items: [
            'Essential Cookies: Required for the Service to function (authentication, security).',
            'Analytics Cookies: Help us understand how users interact with the Service.'
        ],
        note: 'You can control cookies through your browser settings. Disabling essential cookies may affect functionality.',
        color: 'text-pink-400'
    },
    {
        icon: Users,
        title: 'Children\'s Privacy',
        description: 'The Service is not intended for users under 16 years of age. We do not knowingly collect information from children under 16. If we learn we have collected such information, we will delete it promptly.',
        color: 'text-orange-400'
    },
    {
        icon: Globe,
        title: 'International Transfers',
        description: 'Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers.',
        color: 'text-indigo-400'
    }
]

export default function PrivacyPage() {
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
                            Privacy Policy
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

                    {/* Introduction */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <NeonCard className="p-8 border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A]/80">
                            <p className="text-gray-700 dark:text-white/80 leading-relaxed">
                                Whoop Insights ("we," "our," or "us") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services (collectively, the "Service").
                            </p>
                            <p className="text-gray-700 dark:text-white/80 leading-relaxed mt-4">
                                Please read this Privacy Policy carefully. By using the Service, you agree to the collection and use of information in accordance with this policy.
                            </p>
                        </NeonCard>
                    </motion.div>

                    {/* Sections */}
                    <div className="space-y-8">
                        {sections.map((section, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <NeonCard className="p-8 border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A]/80">
                                    <div className="flex items-start gap-6 mb-6">
                                        <div className={`w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center flex-shrink-0 ${section.color}`}>
                                            <section.icon className="w-8 h-8" />
                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                                {section.title}
                                            </h2>
                                            {section.description && (
                                                <p className="text-gray-700 dark:text-white/80 mb-4">
                                                    {section.description}
                                                </p>
                                            )}
                                            {section.subsections ? (
                                                <div className="space-y-4">
                                                    {section.subsections.map((sub, i) => (
                                                        <div key={i}>
                                                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                                                {sub.subtitle}
                                                            </h3>
                                                            <ul className="space-y-2 list-disc list-inside text-gray-700 dark:text-white/70">
                                                                {sub.items.map((item, j) => (
                                                                    <li key={j}>{item}</li>
                                                                ))}
                                                            </ul>
                        </div>
                                                    ))}
                    </div>
                                            ) : section.items && (
                                                <ul className="space-y-2 list-disc list-inside text-gray-700 dark:text-white/70">
                                                    {section.items.map((item, i) => (
                                                        <li key={i}>{item}</li>
                                                    ))}
                                                </ul>
                                            )}
                                            {section.note && (
                                                <p className="mt-4 text-sm text-blue-600 dark:text-blue-400 italic">
                                                    {section.note}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </NeonCard>
                            </motion.div>
                        ))}
                    </div>

                    {/* Changes to Policy */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <NeonCard className="p-8 border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A]/80">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                Changes to This Policy
                            </h2>
                            <p className="text-gray-700 dark:text-white/80 leading-relaxed">
                                We may update this Privacy Policy from time to time. We will notify you of material changes by posting the new policy on this page and updating the "Last Updated" date. Your continued use of the Service after changes constitutes acceptance.
                            </p>
                        </NeonCard>
                    </motion.div>

                    {/* Contact */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center"
                    >
                        <NeonCard className="p-8 border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A]/80">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                Contact Us
                            </h2>
                            <p className="text-gray-700 dark:text-white/80 mb-4">
                                For privacy-related questions, contact us at:
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
