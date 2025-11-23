'use client'

import { Target } from 'lucide-react'
import Link from 'next/link'


export default function Footer() {
    return (
        <footer className="relative z-10 border-t border-blue-600/20 dark:border-neon-primary/20 bg-white/80 dark:bg-black/80 backdrop-blur-xl mt-20">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-600/50 dark:via-neon-primary/50 to-transparent" />

            <div className="container mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                    {/* Column 1: Product */}
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Product</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/features" className="text-gray-600 dark:text-white/60 hover:text-blue-600 dark:hover:text-neon-primary transition-colors">
                                    Features
                                </Link>
                            </li>
                            <li>
                                <Link href="/how-it-works" className="text-gray-600 dark:text-white/60 hover:text-blue-600 dark:hover:text-neon-primary transition-colors">
                                    How It Works
                                </Link>
                            </li>
                            <li>
                                <Link href="/pricing" className="text-gray-600 dark:text-white/60 hover:text-blue-600 dark:hover:text-neon-primary transition-colors">
                                    Pricing
                                </Link>
                            </li>
                            <li>
                                <Link href="/faq" className="text-gray-600 dark:text-white/60 hover:text-blue-600 dark:hover:text-neon-primary transition-colors">
                                    FAQ
                                </Link>
                            </li>
                            <li>
                                <Link href="/roadmap" className="text-gray-600 dark:text-white/60 hover:text-blue-600 dark:hover:text-neon-primary transition-colors">
                                    Roadmap
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 2: Company */}
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Company</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/about" className="text-gray-600 dark:text-white/60 hover:text-blue-600 dark:hover:text-neon-primary transition-colors">
                                    About
                                </Link>
                            </li>
                            <li>
                                <Link href="/blog" className="text-gray-600 dark:text-white/60 hover:text-blue-600 dark:hover:text-neon-primary transition-colors">
                                    Blog
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="text-gray-600 dark:text-white/60 hover:text-blue-600 dark:hover:text-neon-primary transition-colors">
                                    Contact
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 3: Legal */}
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Legal</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/privacy" className="text-gray-600 dark:text-white/60 hover:text-blue-600 dark:hover:text-neon-primary transition-colors">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="text-gray-600 dark:text-white/60 hover:text-blue-600 dark:hover:text-neon-primary transition-colors">
                                    Terms of Service
                                </Link>
                            </li>
                            <li>
                                <Link href="/security" className="text-gray-600 dark:text-white/60 hover:text-blue-600 dark:hover:text-neon-primary transition-colors">
                                    Data Security
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 4: Connect */}
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Connect</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <a href="mailto:contact@data-insights.cloud" className="text-gray-600 dark:text-white/60 hover:text-blue-600 dark:hover:text-neon-primary transition-colors">
                                    Email: contact@data-insights.cloud
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-gray-200 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-600 dark:text-white/20">
                    <p>© {new Date().getFullYear()} Whoop Insights. Not affiliated with WHOOP Inc.</p>
                    <p className="text-center md:text-right max-w-2xl">
                        Disclaimer: This product uses data exported from WHOOP. WHOOP is a registered trademark of WHOOP Inc. We are an independent analytics platform and are not endorsed by or affiliated with WHOOP Inc.
                    </p>
                </div>
            </div>
        </footer>
    )
}
