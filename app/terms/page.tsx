'use client'

import AppLayout from '../../components/layout/AppLayout'
import TranscendentalBackground from '../../components/ui/TranscendentalBackground'
import { FileText, AlertTriangle, CheckCircle } from 'lucide-react'

export default function TermsPage() {
    return (
        <AppLayout>
            <TranscendentalBackground />
            <div className="relative z-10 min-h-screen py-24 px-6 md:px-12">
                <div className="max-w-4xl mx-auto space-y-12">

                    {/* Header */}
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white">Terms & Conditions</h1>
                        <p className="text-xl text-gray-600 dark:text-white/60">Please read these terms carefully before using Data insights.</p>
                    </div>

                    {/* Content Container */}
                    <div className="space-y-8">

                        {/* Section 1: Acceptance */}
                        <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-8">
                            <div className="flex items-center gap-3 mb-4">
                                <CheckCircle className="w-6 h-6 text-blue-600 dark:text-neon-primary" />
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">1. Acceptance of Terms</h2>
                            </div>
                            <p className="text-gray-700 dark:text-white/70 leading-relaxed">
                                By accessing and using Data insights, you accept and agree to be bound by the terms and provision of this agreement. In addition, when using this service, you shall be subject to any posted guidelines or rules applicable to such services.
                            </p>
                        </div>

                        {/* Section 2: Disclaimer */}
                        <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-8">
                            <div className="flex items-center gap-3 mb-4">
                                <AlertTriangle className="w-6 h-6 text-amber-500" />
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">2. Disclaimer</h2>
                            </div>
                            <div className="space-y-4 text-gray-700 dark:text-white/70 leading-relaxed">
                                <p>
                                    <strong>Not Affiliated with WHOOP:</strong> Data insights is an independent project developed by Aishwary and is not affiliated, associated, authorized, endorsed by, or in any way officially connected with WHOOP Inc., or any of its subsidiaries or its affiliates.
                                </p>
                                <p>
                                    <strong>Not Medical Advice:</strong> The insights and recommendations provided by this application are for informational purposes only and do not constitute medical advice. Always consult with a qualified healthcare professional before making any changes to your health or fitness regimen.
                                </p>
                            </div>
                        </div>

                        {/* Section 3: Usage */}
                        <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-8">
                            <div className="flex items-center gap-3 mb-4">
                                <FileText className="w-6 h-6 text-blue-400" />
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">3. Use of Service</h2>
                            </div>
                            <p className="text-gray-700 dark:text-white/70 leading-relaxed">
                                You agree to use this application only for lawful purposes. You are responsible for ensuring that your use of the software complies with all applicable laws and regulations. As this is a local-first application, you are responsible for the security and privacy of the data stored on your own device.
                            </p>
                        </div>

                        {/* Section 4: Warranties */}
                        <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">4. No Warranties</h2>
                            <p className="text-gray-700 dark:text-white/70 leading-relaxed">
                                This website is provided "as is" without any representations or warranties, express or implied. Data insights makes no representations or warranties in relation to this website or the information and materials provided on this website.
                            </p>
                        </div>

                    </div>

                    {/* Footer Note */}
                    <div className="text-center pt-12 border-t border-gray-200 dark:border-white/10">
                        <p className="text-gray-400 dark:text-white/40 text-sm">
                            Last Updated: November 2025
                        </p>
                    </div>

                </div>
            </div>
        </AppLayout>
    )
}
