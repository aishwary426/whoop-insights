'use client'

import AppLayout from '../../components/layout/AppLayout'
import TranscendentalBackground from '../../components/ui/TranscendentalBackground'
import { Shield, Lock, Server, Cpu } from 'lucide-react'

export default function PrivacyPage() {
    return (
        <AppLayout>
            <TranscendentalBackground />
            <div className="relative z-10 min-h-screen py-24 px-6 md:px-12">
                <div className="max-w-4xl mx-auto space-y-12">

                    {/* Header */}
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl md:text-6xl font-bold text-white">Privacy Policy</h1>
                        <p className="text-xl text-white/60">Your data stays where it belongs: on your device.</p>
                    </div>

                    {/* Core Principle: Local Processing */}
                    <div className="bg-black/40 backdrop-blur-xl border border-neon-primary/20 rounded-2xl p-8 md:p-12 space-y-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-full bg-neon-primary/10 flex items-center justify-center border border-neon-primary/20">
                                <Cpu className="w-6 h-6 text-neon-primary" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Local-First Intelligence</h2>
                        </div>
                        <p className="text-lg text-white/80 leading-relaxed">
                            Whoop Insights Pro is built on a <strong>local-first architecture</strong>. When you upload your WHOOP export, the data is processed, analyzed, and stored entirely within your own local environment (your browser and your local machine running the backend).
                        </p>
                        <p className="text-lg text-white/80 leading-relaxed">
                            We do <strong>not</strong> upload your physiological data to any external cloud servers for storage or training. The machine learning models run locally on your hardware.
                        </p>
                    </div>

                    {/* Detailed Sections */}
                    <div className="space-y-6">

                        {/* Data Collection */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-8 space-y-4">
                            <Shield className="w-8 h-8 text-blue-400" />
                            <h3 className="text-xl font-bold text-white">Data Collection</h3>
                            <p className="text-white/60">
                                We only access the data you explicitly provide via the WHOOP export file. This includes your sleep, strain, recovery, and physiological metrics. This data is used solely to generate the insights displayed on your dashboard.
                            </p>
                        </div>

                        {/* Model Training */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-8 space-y-4">
                            <Server className="w-8 h-8 text-purple-400" />
                            <h3 className="text-xl font-bold text-white">Model Training</h3>
                            <p className="text-white/60">
                                Any personalization or machine learning training happens on your device. Your unique physiological patterns are learned locally, ensuring your biometric signature never leaves your control.
                            </p>
                        </div>

                        {/* Security */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-8 space-y-4">
                            <Lock className="w-8 h-8 text-green-400" />
                            <h3 className="text-xl font-bold text-white">Security</h3>
                            <p className="text-white/60">
                                Since your data resides on your local machine, it is as secure as your own device. We recommend keeping your local environment updated and secure.
                            </p>
                        </div>

                    </div>

                    {/* Footer Note */}
                    <div className="text-center pt-12 border-t border-white/10">
                        <p className="text-white/40 text-sm">
                            Last Updated: November 2025
                        </p>
                    </div>

                </div>
            </div>
        </AppLayout>
    )
}
