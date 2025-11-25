'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Mail, MessageSquare, Lightbulb, Newspaper, Handshake, HelpCircle } from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import NeonCard from '../../components/ui/NeonCard'
import NeonButton from '../../components/ui/NeonButton'
import { useState } from 'react'

const contactOptions = [
    {
        icon: Mail,
        title: 'General Inquiries',
        email: 'contact@data-insights.cloud',
        description: 'For partnership opportunities, press inquiries, or general questions.',
        color: 'text-blue-600 dark:text-neon-primary'
    },
    {
        icon: HelpCircle,
        title: 'Support',
        email: 'contact@data-insights.cloud',
        description: 'Having trouble with the platform? Our support team typically responds within 24 hours (Pro users) or 48-72 hours (Free users).',
        color: 'text-green-500'
    },
    {
        icon: Lightbulb,
        title: 'Feature Requests',
        email: 'contact@data-insights.cloud',
        description: 'Have an idea for a new feature? We read every suggestion and prioritize based on user demand.',
        color: 'text-purple-400'
    },
    {
        icon: Newspaper,
        title: 'Press & Media',
        email: 'contact@data-insights.cloud',
        description: 'For interviews, press kits, or media inquiries.',
        color: 'text-yellow-400'
    }
]

const subjects = [
    'General',
    'Support',
    'Feedback',
    'Press',
    'Partnership',
    'Other'
]

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: 'General',
        message: ''
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // Handle form submission
        const mailtoLink = `mailto:contact@data-insights.cloud?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`)}`
        window.location.href = mailtoLink
    }

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
                            Get in touch
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-xl text-gray-600 dark:text-white/60 max-w-3xl mx-auto"
                        >
                            Questions, feedback, or just want to say hi? We'd love to hear from you.
                        </motion.p>
                    </div>

                    {/* Contact Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {contactOptions.map((option, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <NeonCard className="p-6 border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A]/80 h-full">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className={`w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center flex-shrink-0 ${option.color}`}>
                                            <option.icon className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                                {option.title}
                                            </h3>
                                            <a
                                                href={`mailto:${option.email}`}
                                                className="text-blue-600 dark:text-neon-primary hover:underline block mb-2"
                                            >
                                                {option.email}
                                            </a>
                                            <p className="text-sm text-gray-600 dark:text-white/60">
                                                {option.description}
                                            </p>
                                        </div>
                                    </div>
                                </NeonCard>
                            </motion.div>
                        ))}
                    </div>

                    {/* Contact Form */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <NeonCard className="p-8 md:p-12 border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A]/80">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                                Send us a message
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                                            Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-black/40 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-neon-primary"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                                            Email <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-black/40 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-neon-primary"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="subject" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                                        Subject <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="subject"
                                        required
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-black/40 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-neon-primary"
                                    >
                                        {subjects.map((subject) => (
                                            <option key={subject} value={subject}>
                                                {subject}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="message" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                                        Message <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        id="message"
                                        required
                                        rows={6}
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-black/40 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-neon-primary resize-none"
                                    />
                                </div>
                                <NeonButton type="submit" variant="primary" className="w-full md:w-auto px-8 py-3">
                                    Send Message
                                </NeonButton>
                            </form>
                        </NeonCard>
                    </motion.div>

                    {/* Response Times */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center"
                    >
                        <NeonCard className="p-6 border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A]/80">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Response Times</h3>
                            <div className="space-y-2 text-sm text-gray-700 dark:text-white/70">
                                <p>• Pro users: Within 24 hours</p>
                                <p>• Free users: Within 48-72 hours</p>
                                <p>• Press inquiries: Within 24 hours</p>
                            </div>
                        </NeonCard>
                    </motion.div>

                    {/* Social */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center space-y-4"
                    >
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Follow us</h3>
                        <div className="flex items-center justify-center gap-6">
                            <a
                                href="https://twitter.com/whoopinsights"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-600 dark:text-white/60 hover:text-blue-600 dark:hover:text-neon-primary transition-colors"
                            >
                                Twitter/X: @whoopinsights
                            </a>
                            <a
                                href="https://instagram.com/whoopinsights"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-600 dark:text-white/60 hover:text-blue-600 dark:hover:text-neon-primary transition-colors"
                            >
                                Instagram: @whoopinsights
                            </a>
                        </div>
                    </motion.div>
                </div>
            </div>
        </AppLayout>
    )
}

