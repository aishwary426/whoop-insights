'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Shield, Lock, Server, Eye, Key, AlertTriangle } from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import NeonCard from '../../components/ui/NeonCard'

const securityPrinciples = [
    {
        icon: Lock,
        title: 'Encryption Everywhere',
        description: 'All data is encrypted both in transit and at rest:',
        details: [
            'In Transit: TLS 1.3 encryption for all connections',
            'At Rest: AES-256 encryption for all stored data',
            'Database: Encrypted at the storage layer'
        ],
        color: 'text-blue-600 dark:text-neon-primary'
    },
    {
        icon: Server,
        title: 'Minimal Data Retention',
        description: 'We follow the principle of data minimization:',
        details: [
            'Raw WHOOP Data: Processed and immediately discarded. Never stored.',
            'Model Outputs: Only aggregated insights are retained.',
            'No Third-Party Sharing: Your data is never sold or shared for advertising.'
        ],
        color: 'text-green-500'
    },
    {
        icon: Key,
        title: 'Access Controls',
        description: 'Strict controls limit who can access your data:',
        details: [
            'Role-based access control (RBAC)',
            'Multi-factor authentication for all internal systems',
            'Regular access reviews and audits',
            'Principle of least privilege'
        ],
        color: 'text-purple-400'
    },
    {
        icon: Shield,
        title: 'Infrastructure Security',
        description: 'Our infrastructure is built on industry-leading security:',
        details: [
            'Hosted on SOC 2 Type II compliant infrastructure',
            'Regular security patches and updates',
            'DDoS protection',
            'Web Application Firewall (WAF)',
            'Intrusion detection and prevention'
        ],
        color: 'text-yellow-400'
    },
    {
        icon: Eye,
        title: 'Secure Development Practices',
        description: 'Security is built into our development process:',
        details: [
            'Secure coding guidelines',
            'Code reviews with security focus',
            'Dependency vulnerability scanning',
            'Regular penetration testing'
        ],
        color: 'text-cyan-400'
    }
]

const dataFlowSteps = [
    { step: 1, description: 'You export data from WHOOP app (CSV file on your device)' },
    { step: 2, description: 'You upload CSV to our platform (encrypted in transit)' },
    { step: 3, description: 'Our servers process the data and train your personal model' },
    { step: 4, description: 'Raw data is immediately discarded after processing' },
    { step: 5, description: 'Only model outputs (predictions, thresholds) are stored (encrypted)' },
    { step: 6, description: 'You access insights via encrypted connection' }
]

export default function SecurityPage() {
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
                            Your data security is our priority
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-xl text-gray-600 dark:text-white/60 max-w-3xl mx-auto"
                        >
                            Bank-level encryption, minimal data retention, and full transparency about how we protect your information.
                        </motion.p>
                    </div>

                    {/* Security Principles */}
                    <div className="space-y-6">
                        {securityPrinciples.map((principle, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <NeonCard className="p-8 border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A]/80">
                                    <div className="flex items-start gap-6 mb-6">
                                        <div className={`w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center flex-shrink-0 ${principle.color}`}>
                                            <principle.icon className="w-8 h-8" />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                                {principle.title}
                                            </h2>
                                            <p className="text-gray-700 dark:text-white/80 mb-4">
                                                {principle.description}
                                            </p>
                                            <ul className="space-y-2 list-disc list-inside text-gray-700 dark:text-white/70">
                                                {principle.details.map((detail, i) => (
                                                    <li key={i}>{detail}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </NeonCard>
                            </motion.div>
                        ))}
                    </div>

                    {/* Data Flow Overview */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <NeonCard className="p-8 md:p-12 border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A]/80">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                                Data Flow Overview
                            </h2>
                            <div className="space-y-4">
                                {dataFlowSteps.map((item, index) => (
                                    <div key={index} className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-blue-600 dark:bg-neon-primary text-white flex items-center justify-center flex-shrink-0 font-semibold text-sm">
                                            {item.step}
                                        </div>
                                        <p className="text-gray-700 dark:text-white/70 pt-1">
                                            {item.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </NeonCard>
                    </motion.div>

                    {/* Your Controls */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <NeonCard className="p-8 md:p-12 border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A]/80">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                                Your Controls
                            </h2>
                            <p className="text-gray-700 dark:text-white/80 mb-4">
                                You have full control over your data:
                            </p>
                            <ul className="space-y-3 list-disc list-inside text-gray-700 dark:text-white/70">
                                <li><strong>View:</strong> See all stored data in Account Settings</li>
                                <li><strong>Export:</strong> Download your data at any time</li>
                                <li><strong>Delete:</strong> Permanently delete all data with one click</li>
                            </ul>
                        </NeonCard>
                    </motion.div>

                    {/* Reporting Security Issues */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <NeonCard className="p-8 border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A]/80">
                            <div className="flex items-start gap-4">
                                <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                                        Reporting Security Issues
                                    </h2>
                                    <p className="text-gray-700 dark:text-white/80 mb-4">
                                        If you discover a security vulnerability, please report it responsibly:
                                    </p>
                                    <a
                                        href="mailto:contact@data-insights.cloud"
                                        className="text-blue-600 dark:text-neon-primary hover:underline font-medium"
                                    >
                                        Email: contact@data-insights.cloud
                                    </a>
                                    <p className="text-sm text-gray-600 dark:text-white/60 mt-2">
                                        We appreciate responsible disclosure and will acknowledge your report within 48 hours.
                                    </p>
                                </div>
                            </div>
                        </NeonCard>
                    </motion.div>

                    {/* Questions */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center"
                    >
                        <p className="text-gray-700 dark:text-white/80 mb-4">
                            Questions?
                        </p>
                        <a
                            href="mailto:contact@data-insights.cloud"
                            className="text-blue-600 dark:text-neon-primary hover:underline font-medium"
                        >
                            Contact our security team at contact@data-insights.cloud
                        </a>
                    </motion.div>
                </div>
            </div>
        </AppLayout>
    )
}

