'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, BookOpen, Clock } from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import NeonCard from '../../components/ui/NeonCard'
import { api } from '../../lib/api'

interface BlogPost {
    id: number
    title: string
    category: string
    reading_time?: string
    preview: string
    content?: string
    image_url?: string
    slug: string
    published: number
    created_at: string
    updated_at: string
}

const categories = [
    'Recovery Science',
    'Training Insights',
    'Product Updates',
    'Case Studies',
    'Data Analysis'
]

export default function BlogPage() {
    const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
    const [loading, setLoading] = useState(true)
    const [email, setEmail] = useState('')
    const [subscribing, setSubscribing] = useState(false)
    const [subscribeMessage, setSubscribeMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    useEffect(() => {
        loadBlogPosts()
    }, [])

    const loadBlogPosts = async () => {
        try {
            setLoading(true)
            const response = await api.getBlogPosts(true) // Only published posts
            setBlogPosts(response.posts || [])
        } catch (error: any) {
            console.error('Error loading blog posts:', error)
            // Fallback to empty array on error
            setBlogPosts([])
        } finally {
            setLoading(false)
        }
    }

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!email.trim()) {
            setSubscribeMessage({ type: 'error', text: 'Please enter your email address' })
            return
        }

        setSubscribing(true)
        setSubscribeMessage(null)

        try {
            const response = await api.subscribeNewsletter(email.trim())
            setSubscribeMessage({ type: 'success', text: response.message || 'Successfully subscribed!' })
            setEmail('') // Clear email on success
        } catch (error: any) {
            setSubscribeMessage({ 
                type: 'error', 
                text: error.message || 'Failed to subscribe. Please try again later.' 
            })
        } finally {
            setSubscribing(false)
        }
    }
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
                            The Whoop Insights Blog
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-xl text-gray-600 dark:text-white/60 max-w-3xl mx-auto"
                        >
                            Data-driven training insights, product updates, and recovery science
                        </motion.p>
                    </div>

                    {/* Categories */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="flex flex-wrap gap-2 justify-center">
                            {categories.map((category, index) => (
                                <span
                                    key={index}
                                    className="px-4 py-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full text-sm text-gray-700 dark:text-white/70"
                                >
                                    {category}
                                </span>
                            ))}
                        </div>
                    </motion.div>

                    {/* Blog Posts */}
                    <div className="space-y-6">
                        {loading ? (
                            <div className="text-center py-12">
                                <p className="text-gray-600 dark:text-white/60">Loading blog posts...</p>
                            </div>
                        ) : blogPosts.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-600 dark:text-white/60">No blog posts available yet. Check back soon!</p>
                            </div>
                        ) : (
                            blogPosts.map((post, index) => (
                                <motion.div
                                    key={post.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <NeonCard className="p-8 border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A]/80 hover:border-blue-600 dark:hover:border-neon-primary transition-colors">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="text-xs font-semibold text-blue-600 dark:text-neon-primary bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">
                                                {post.category}
                                            </span>
                                            {post.reading_time && (
                                                <div className="flex items-center gap-1 text-gray-500 dark:text-white/40 text-sm">
                                                    <Clock className="w-4 h-4" />
                                                    <span>Reading time: {post.reading_time}</span>
                                                </div>
                                            )}
                                        </div>
                                    {post.image_url && (
                                        <img 
                                            src={post.image_url} 
                                            alt={post.title} 
                                            className="w-full h-64 object-cover rounded-lg mb-6"
                                        />
                                    )}
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                        {post.title}
                                    </h2>
                                    <p className="text-gray-700 dark:text-white/70 leading-relaxed mb-6">
                                        {post.preview}
                                    </p>
                                        <button className="text-blue-600 dark:text-neon-primary font-medium hover:underline flex items-center gap-2">
                                            Read More
                                            <BookOpen className="w-4 h-4" />
                                        </button>
                                    </NeonCard>
                                </motion.div>
                            ))
                        )}
                    </div>

                    {/* Newsletter Signup */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="pt-12"
                    >
                        <NeonCard className="p-8 md:p-12 border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A]/80 text-center">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                Get smarter about recovery
                            </h2>
                            <p className="text-gray-600 dark:text-white/60 mb-6">
                                Weekly insights on training, recovery, and getting more from your WHOOP data. No spam, unsubscribe anytime.
                            </p>
                            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={subscribing}
                                    className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-black/40 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-neon-primary disabled:opacity-50"
                                />
                                <button 
                                    type="submit"
                                    disabled={subscribing}
                                    className="px-6 py-3 bg-blue-600 dark:bg-neon-primary text-black dark:text-black rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-neon-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {subscribing ? 'Subscribing...' : 'Subscribe'}
                                </button>
                            </form>
                            {subscribeMessage && (
                                <div className={`mt-4 max-w-md mx-auto px-4 py-3 rounded-lg ${
                                    subscribeMessage.type === 'success' 
                                        ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' 
                                        : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                                }`}>
                                    {subscribeMessage.text}
                                </div>
                            )}
                        </NeonCard>
                    </motion.div>
                </div>
            </div>
        </AppLayout>
    )
}

