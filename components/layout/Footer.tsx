'use client'

import { Target } from 'lucide-react'
import Link from 'next/link'


export default function Footer() {
    return (
        <footer className="relative z-10 border-t border-blue-600/20 dark:border-neon-primary/20 bg-white/80 dark:bg-black/80 backdrop-blur-xl mt-20">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-600/50 dark:via-neon-primary/50 to-transparent" />

            <div className="container mx-auto px-6 py-12">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">

                    {/* Left Side: Branding */}
                    <div className="flex flex-col items-center md:items-start gap-2">
                        <div className="flex items-center gap-3 group">
                            <div className="w-10 h-10 rounded-full bg-blue-600/10 dark:bg-neon-primary/10 flex items-center justify-center border border-blue-600/20 dark:border-neon-primary/20 group-hover:bg-blue-600/20 dark:group-hover:bg-neon-primary/20 transition-all duration-300 shadow-[0_0_15px_rgba(0,102,255,0.2)] dark:shadow-[0_0_15px_rgba(0,255,143,0.2)]">
                                <Target className="w-5 h-5 text-blue-600 dark:text-neon-primary" />
                            </div>
                            <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-neon-primary transition-colors duration-300">
                                Whoop Insights Pro
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-white/40 max-w-xs text-center md:text-left">
                            Unlock hidden patterns in your physiological data with advanced AI analytics.
                        </p>
                    </div>

                    {/* Right Side: Credits */}
                    <div className="flex flex-col items-center md:items-end gap-1">
                        <p className="text-lg text-gray-800 dark:text-white/80 font-light">
                            Designed by <span className="font-bold text-blue-600 dark:text-neon-primary drop-shadow-[0_0_8px_rgba(0,102,255,0.5)] dark:drop-shadow-[0_0_8px_rgba(0,255,143,0.5)]">Aishwary</span>
                        </p>
                        <p className="text-sm text-gray-600 dark:text-white/40 uppercase tracking-widest">
                            For Whoop Athletes
                        </p>
                    </div>

                </div>

                {/* Bottom Bar */}
                <div className="mt-12 pt-8 border-t border-gray-200 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-600 dark:text-white/20">
                    <p>© {new Date().getFullYear()} Whoop Insights Pro. Not affiliated with WHOOP Inc.</p>
                    <div className="flex gap-6">
                        <Link href="/privacy" className="hover:text-blue-600 dark:hover:text-neon-primary cursor-pointer transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-blue-600 dark:hover:text-neon-primary cursor-pointer transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
