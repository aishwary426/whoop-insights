'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Save, Trash2, Plus, Upload, X, CheckCircle, XCircle } from 'lucide-react'
import AppLayout from '../../../components/layout/AppLayout'
import NeonCard from '../../../components/ui/NeonCard'
import { api } from '../../../lib/api'
import { getCurrentUser } from '../../../lib/auth'

interface BlogPost {
    id?: number
    title: string
    category: string
    reading_time?: string
    preview: string
    content?: string
    image_url?: string
    slug: string
    published: number
}

const categories = [
    'Recovery Science',
    'Training Insights',
    'Product Updates',
    'Case Studies',
    'Data Analysis'
]

export default function AdminBlogPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [posts, setPosts] = useState<BlogPost[]>([])
    const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
    const [showForm, setShowForm] = useState(false)
    const [uploadingImage, setUploadingImage] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Auto-dismiss message after 5 seconds
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                setMessage(null)
            }, 5000)
            return () => clearTimeout(timer)
        }
    }, [message])

    useEffect(() => {
        checkAdminAccess()
        loadPosts()
    }, [])

    const checkAdminAccess = async () => {
        try {
            const currentUser = await getCurrentUser()
            if (!currentUser || !currentUser.email) {
                router.push('/login')
                return
            }

            // Check if user is admin (email: ctaishwary@gmail.com)
            if (currentUser.email.toLowerCase() !== 'ctaishwary@gmail.com') {
                router.push('/')
                return
            }

            setUser(currentUser)
        } catch (error) {
            console.error('Error checking admin access:', error)
            router.push('/login')
        } finally {
            setLoading(false)
        }
    }

    const loadPosts = async () => {
        try {
            const response = await api.getBlogPosts(false) // Get all posts including drafts
            setPosts(response.posts || [])
        } catch (error: any) {
            console.error('Error loading posts:', error)
            setMessage({ type: 'error', text: 'Failed to load blog posts' })
        }
    }

    const generateSlug = (title: string) => {
        return title.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
    }

    const handleImageUpload = async (file: File) => {
        try {
            setUploadingImage(true)
            const response = await api.uploadBlogImage(file)
            return response.image_url
        } catch (error: any) {
            throw new Error(error.message || 'Failed to upload image')
        } finally {
            setUploadingImage(false)
        }
    }

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            const imageUrl = await handleImageUpload(file)
            if (editingPost) {
                setEditingPost({ ...editingPost, image_url: imageUrl })
            }
            setMessage({ type: 'success', text: 'Image uploaded successfully' })
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to upload image' })
        }
    }

    const handleSave = async () => {
        if (!editingPost) return

        try {
            setMessage(null)

            // Generate slug if not provided
            if (!editingPost.slug && editingPost.title) {
                editingPost.slug = generateSlug(editingPost.title)
            }

            if (editingPost.id) {
                // Update existing post
                await api.updateBlogPost(editingPost.id, editingPost)
                setMessage({ type: 'success', text: `✅ Blog post "${editingPost.title}" updated successfully!` })
            } else {
                // Create new post
                await api.createBlogPost(editingPost)
                setMessage({ type: 'success', text: `🎉 Blog post "${editingPost.title}" created and published successfully!` })
            }

            setShowForm(false)
            setEditingPost(null)
            await loadPosts()
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to save blog post' })
        }
    }

    const handleDelete = async (postId: number) => {
        if (!confirm('Are you sure you want to delete this blog post?')) return

        try {
            await api.deleteBlogPost(postId)
            setMessage({ type: 'success', text: 'Blog post deleted successfully' })
            await loadPosts()
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to delete blog post' })
        }
    }

    const handleNewPost = () => {
        setEditingPost({
            title: '',
            category: categories[0],
            preview: '',
            slug: '',
            published: 1
        })
        setShowForm(true)
    }

    const handleEdit = (post: BlogPost) => {
        setEditingPost({ ...post })
        setShowForm(true)
    }

    if (loading) {
        return (
            <AppLayout>
                <div className="min-h-screen flex items-center justify-center">
                    <p className="text-gray-600 dark:text-white/60">Loading...</p>
                </div>
            </AppLayout>
        )
    }

    return (
        <AppLayout>
            <div className="relative z-10 min-h-screen py-24 px-6 md:px-12">
                <div className="max-w-6xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <Link href="/" className="inline-flex items-center gap-2 text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white transition-colors mb-4">
                                <ArrowLeft className="w-4 h-4" />
                                Back to Home
                            </Link>
                            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                                Blog Admin
                            </h1>
                            <p className="text-gray-600 dark:text-white/60 mt-2">
                                Manage blog posts and images
                            </p>
                        </div>
                        <button
                            onClick={handleNewPost}
                            className="px-6 py-3 bg-blue-600 dark:bg-neon-primary text-black dark:text-black rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-neon-primary/90 transition-colors flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            New Post
                        </button>
                    </div>

                    {/* Toast Notification */}
                    {message && (
                        <motion.div
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            className={`fixed top-24 right-6 z-50 max-w-md ${message.type === 'success'
                                    ? 'bg-green-500 dark:bg-green-600 text-white shadow-lg shadow-green-500/50'
                                    : 'bg-red-500 dark:bg-red-600 text-white shadow-lg shadow-red-500/50'
                                } rounded-lg p-4 flex items-start gap-3 animate-pulse`}
                            style={{ animation: 'none' }}
                        >
                            {message.type === 'success' ? (
                                <CheckCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                            ) : (
                                <XCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                                <p className="font-semibold text-sm">{message.text}</p>
                            </div>
                            <button
                                onClick={() => setMessage(null)}
                                className="flex-shrink-0 hover:bg-white/20 rounded p-1 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    )}

                    {/* Form */}
                    {showForm && editingPost && (
                        <NeonCard className="p-8 border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A]/80">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {editingPost.id ? 'Edit Post' : 'New Post'}
                                </h2>
                                <button
                                    onClick={() => {
                                        setShowForm(false)
                                        setEditingPost(null)
                                    }}
                                    className="text-gray-500 hover:text-gray-700 dark:text-white/60 dark:hover:text-white"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-2">
                                        Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={editingPost.title}
                                        onChange={(e) => {
                                            setEditingPost({ ...editingPost, title: e.target.value, slug: generateSlug(e.target.value) })
                                        }}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-black/40 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                                        placeholder="Blog post title"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-2">
                                            Category *
                                        </label>
                                        <select
                                            value={editingPost.category}
                                            onChange={(e) => setEditingPost({ ...editingPost, category: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-black/40 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                                        >
                                            {categories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-2">
                                            Reading Time
                                        </label>
                                        <input
                                            type="text"
                                            value={editingPost.reading_time || ''}
                                            onChange={(e) => setEditingPost({ ...editingPost, reading_time: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-black/40 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                                            placeholder="e.g., 5 min"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-2">
                                        Preview *
                                    </label>
                                    <textarea
                                        value={editingPost.preview}
                                        onChange={(e) => setEditingPost({ ...editingPost, preview: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-black/40 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                                        rows={4}
                                        placeholder="Preview text shown on blog list..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-2">
                                        Content
                                    </label>
                                    <textarea
                                        value={editingPost.content || ''}
                                        onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-black/40 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                                        rows={8}
                                        placeholder="Full blog post content (optional)..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-2">
                                        Image
                                    </label>
                                    <div className="space-y-2">
                                        {editingPost.image_url && (
                                            <div className="relative">
                                                <img
                                                    src={editingPost.image_url}
                                                    alt="Blog post"
                                                    className="w-full h-48 object-cover rounded-lg"
                                                />
                                                <button
                                                    onClick={() => setEditingPost({ ...editingPost, image_url: undefined })}
                                                    className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            disabled={uploadingImage}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-black/40 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
                                        />
                                        {uploadingImage && (
                                            <p className="text-sm text-gray-600 dark:text-white/60">Uploading image...</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={editingPost.published === 1}
                                            onChange={(e) => setEditingPost({ ...editingPost, published: e.target.checked ? 1 : 0 })}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-white/70">Published</span>
                                    </label>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={handleSave}
                                        disabled={!editingPost.title || !editingPost.preview || !editingPost.category}
                                        className="px-6 py-3 bg-blue-600 dark:bg-neon-primary text-black dark:text-black rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-neon-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Save className="w-5 h-5" />
                                        {editingPost.id ? 'Update' : 'Create'} Post
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowForm(false)
                                            setEditingPost(null)
                                        }}
                                        className="px-6 py-3 bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-white/70 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-white/20 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </NeonCard>
                    )}

                    {/* Posts List */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">All Posts</h2>
                        {posts.length === 0 ? (
                            <p className="text-gray-600 dark:text-white/60">No blog posts yet. Create your first post!</p>
                        ) : (
                            posts.map(post => (
                                <NeonCard key={post.id} className="p-6 border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A]/80">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                                    {post.title}
                                                </h3>
                                                <span className={`px-2 py-1 text-xs rounded-full ${post.published === 1
                                                        ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
                                                    }`}>
                                                    {post.published === 1 ? 'Published' : 'Draft'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-white/60 mb-2">
                                                {post.category} {post.reading_time && `• ${post.reading_time}`}
                                            </p>
                                            <p className="text-gray-700 dark:text-white/70 line-clamp-2">
                                                {post.preview}
                                            </p>
                                            {post.image_url && (
                                                <img
                                                    src={post.image_url}
                                                    alt={post.title}
                                                    className="mt-4 w-full h-32 object-cover rounded-lg"
                                                />
                                            )}
                                        </div>
                                        <div className="flex gap-2 ml-4">
                                            <button
                                                onClick={() => handleEdit(post)}
                                                className="p-2 text-blue-600 dark:text-neon-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                                            >
                                                <Save className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => post.id && handleDelete(post.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </NeonCard>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}

