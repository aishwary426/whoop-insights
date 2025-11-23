'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Eye, Download, FileArchive, User as UserIcon, Mail, Calendar, BarChart3, Trash2 } from 'lucide-react'
import AppLayout from '../../../components/layout/AppLayout'
import TranscendentalBackground from '../../../components/ui/TranscendentalBackground'
import NeonCard from '../../../components/ui/NeonCard'
import { api } from '../../../lib/api'
import { getCurrentUser } from '../../../lib/auth'

interface ZipFile {
    upload_id: string
    filename: string
    size_bytes: number
    size_mb: number
    created_at: number
}

interface UserData {
    id: string
    email: string
    name: string | null
    age: number | null
    nationality: string | null
    goal: string | null
    created_at: string | null
    uploads_count: number
    zip_files: ZipFile[]
    zip_files_count: number
    metrics_count: number
    latest_metric_date: string | null
}

export default function AdminUsersPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [users, setUsers] = useState<UserData[]>([])
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    useEffect(() => {
        checkAdminAccess()
        loadUsers()
    }, [])

    const checkAdminAccess = async () => {
        try {
            const currentUser = await getCurrentUser()
            if (!currentUser || !currentUser.email) {
                router.push('/login')
                return
            }

            // Check if user is admin
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

    const loadUsers = async () => {
        try {
            setError(null)
            const response = await api.getAllUsers()
            setUsers(response.users || [])
        } catch (error: any) {
            console.error('Error loading users:', error)
            setError(error.message || 'Failed to load users')
        }
    }

    const handleViewCharts = (userId: string) => {
        // Navigate to dashboard with user_id parameter
        router.push(`/dashboard?admin_view=true&view_user_id=${userId}`)
    }

    const handleDownloadZip = (userId: string, uploadId: string) => {
        // Open download link in new tab
        const apiBaseUrl = typeof window !== 'undefined' ? window.location.origin : ''
        const downloadUrl = `${apiBaseUrl}/api/v1/whoop/files/${userId}/${uploadId}`
        window.open(downloadUrl, '_blank')
    }

    const handleDeleteUser = async (userId: string, userEmail: string) => {
        // Double confirmation for safety
        const confirmMessage = `Are you sure you want to delete user "${userEmail}"?\n\nThis will permanently delete:\n- All user data and metrics\n- All uploaded ZIP files\n- All model files\n- All related records\n\nThis action cannot be undone!`
        
        if (!confirm(confirmMessage)) {
            return
        }

        // Second confirmation
        if (!confirm('This is your final warning. Are you absolutely sure?')) {
            return
        }

        try {
            setDeletingUserId(userId)
            setError(null)
            setMessage(null)
            
            await api.deleteUser(userId)
            
            setMessage({ type: 'success', text: `User "${userEmail}" deleted successfully` })
            
            // Reload users list
            await loadUsers()
        } catch (error: any) {
            console.error('Error deleting user:', error)
            setError(error.message || 'Failed to delete user')
            setMessage({ type: 'error', text: error.message || 'Failed to delete user' })
        } finally {
            setDeletingUserId(null)
        }
    }

    // Auto-dismiss message after 5 seconds
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                setMessage(null)
            }, 5000)
            return () => clearTimeout(timer)
        }
    }, [message])

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A'
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            })
        } catch {
            return dateString
        }
    }

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    }

    const getUserDisplayName = (userData: UserData) => {
        // If name exists and is not empty, use it
        if (userData.name && userData.name.trim() !== '') {
            return userData.name
        }
        
        // Try to extract name from email (before @)
        if (userData.email && userData.email.includes('@')) {
            const emailPrefix = userData.email.split('@')[0]
            // If email prefix is not just a UUID, use it
            if (!emailPrefix.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
                // Capitalize first letter
                return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1)
            }
        }
        
        // Fallback: show shortened user ID
        const shortId = userData.id.substring(0, 8) + '...'
        return `User ${shortId}`
    }

    if (loading) {
        return (
            <AppLayout user={user}>
                <div className="min-h-screen flex items-center justify-center">
                    <p className="text-gray-600 dark:text-white/60">Loading...</p>
                </div>
            </AppLayout>
        )
    }

    return (
        <AppLayout user={user}>
            <TranscendentalBackground />
            <div className="relative z-10 min-h-screen py-24 px-6 md:px-12">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <Link href="/" className="inline-flex items-center gap-2 text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white transition-colors mb-4">
                                <ArrowLeft className="w-4 h-4" />
                                Back to Home
                            </Link>
                            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                                User Management
                            </h1>
                            <p className="text-gray-600 dark:text-white/60 mt-2">
                                View and manage all users, their data, and uploaded files
                            </p>
                        </div>
                        <button
                            onClick={loadUsers}
                            className="px-6 py-3 bg-blue-600 dark:bg-neon-primary text-black dark:text-black rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-neon-primary/90 transition-colors"
                        >
                            Refresh
                        </button>
                    </div>

                    {/* Messages */}
                    {message && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-4 rounded-lg ${
                                message.type === 'success'
                                    ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                                    : 'bg-red-500/10 border border-red-500/30 text-red-400'
                            }`}
                        >
                            <p>{message.text}</p>
                        </motion.div>
                    )}
                    {error && !message && (
                        <NeonCard className="p-4 border-red-500/30 bg-red-500/10">
                            <p className="text-red-400">{error}</p>
                        </NeonCard>
                    )}

                    {/* Users Table */}
                    <NeonCard className="p-6 border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A]/80 overflow-x-auto">
                        {users.length === 0 ? (
                            <p className="text-gray-600 dark:text-white/60 text-center py-8">No users found</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b-2 border-gray-300 dark:border-white/20 bg-gray-50 dark:bg-white/5">
                                            <th className="text-left py-4 px-4 text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">User</th>
                                            <th className="text-left py-4 px-4 text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Email</th>
                                            <th className="text-left py-4 px-4 text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Age</th>
                                            <th className="text-left py-4 px-4 text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Nationality</th>
                                            <th className="text-left py-4 px-4 text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Goal</th>
                                            <th className="text-left py-4 px-4 text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">ZIP Files</th>
                                            <th className="text-left py-4 px-4 text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Metrics</th>
                                            <th className="text-left py-4 px-4 text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Created</th>
                                            <th className="text-left py-4 px-4 text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((userData, index) => (
                                            <motion.tr
                                                key={userData.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                            >
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <UserIcon className="w-4 h-4 text-gray-500 dark:text-white/40" />
                                                        <div>
                                                            <span className="font-medium text-gray-900 dark:text-white block">
                                                                {getUserDisplayName(userData)}
                                                            </span>
                                                            {!userData.name && (
                                                                <span className="text-xs text-gray-500 dark:text-white/40">
                                                                    ID: {userData.id.substring(0, 12)}...
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="w-4 h-4 text-gray-500 dark:text-white/40" />
                                                        <span className="text-gray-700 dark:text-white/70 text-sm">
                                                            {userData.email}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className="text-gray-700 dark:text-white/70 text-sm">
                                                        {userData.age || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className="text-gray-700 dark:text-white/70 text-sm">
                                                        {userData.nationality || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className="text-gray-700 dark:text-white/70 text-sm">
                                                        {userData.goal || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <FileArchive className="w-4 h-4 text-gray-500 dark:text-white/40" />
                                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {userData.zip_files_count} file{userData.zip_files_count !== 1 ? 's' : ''}
                                                            </span>
                                                        </div>
                                                        {userData.zip_files.length > 0 && (
                                                            <div className="ml-6 space-y-1">
                                                                {userData.zip_files.slice(0, 2).map((zip) => (
                                                                    <div key={zip.upload_id} className="flex items-center gap-2 text-xs text-gray-600 dark:text-white/50">
                                                                        <span className="truncate max-w-[200px]">{zip.filename}</span>
                                                                        <span className="text-gray-500 dark:text-white/40">({formatFileSize(zip.size_bytes)})</span>
                                                                        <button
                                                                            onClick={() => handleDownloadZip(userData.id, zip.upload_id)}
                                                                            className="text-blue-600 dark:text-neon-primary hover:underline"
                                                                            title="Download ZIP"
                                                                        >
                                                                            <Download className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                                {userData.zip_files.length > 2 && (
                                                                    <span className="text-xs text-gray-500 dark:text-white/40">
                                                                        +{userData.zip_files.length - 2} more
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <BarChart3 className="w-4 h-4 text-gray-500 dark:text-white/40" />
                                                        <div>
                                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {userData.metrics_count}
                                                            </span>
                                                            {userData.latest_metric_date && (
                                                                <div className="text-xs text-gray-500 dark:text-white/40">
                                                                    Latest: {formatDate(userData.latest_metric_date)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-gray-500 dark:text-white/40" />
                                                        <span className="text-sm text-gray-700 dark:text-white/70">
                                                            {formatDate(userData.created_at)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleViewCharts(userData.id)}
                                                            className="px-3 py-1.5 bg-blue-600 dark:bg-neon-primary text-black dark:text-black rounded-lg text-sm font-medium hover:bg-blue-700 dark:hover:bg-neon-primary/90 transition-colors flex items-center gap-2"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            View Charts
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteUser(userData.id, userData.email)}
                                                            disabled={deletingUserId === userData.id}
                                                            className="px-3 py-1.5 bg-red-600 dark:bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 dark:hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            title="Delete user"
                                                        >
                                                            {deletingUserId === userData.id ? (
                                                                <>
                                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                                    Deleting...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Trash2 className="w-4 h-4" />
                                                                    Delete
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </NeonCard>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <NeonCard className="p-4 border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A]/80">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</div>
                            <div className="text-sm text-gray-600 dark:text-white/60">Total Users</div>
                        </NeonCard>
                        <NeonCard className="p-4 border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A]/80">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {users.reduce((sum, u) => sum + u.zip_files_count, 0)}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-white/60">Total ZIP Files</div>
                        </NeonCard>
                        <NeonCard className="p-4 border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A]/80">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {users.reduce((sum, u) => sum + u.metrics_count, 0)}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-white/60">Total Metrics</div>
                        </NeonCard>
                        <NeonCard className="p-4 border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A]/80">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {users.filter(u => u.metrics_count > 0).length}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-white/60">Active Users</div>
                        </NeonCard>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}

