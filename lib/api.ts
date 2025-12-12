import { getCurrentUser } from './auth'

const resolveApiBaseUrl = () => {
    // If API URL is explicitly set, use it
    if (process.env.NEXT_PUBLIC_API_URL) {
        const url = process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')
        // If the URL ends with /api, append /v1
        if (url.endsWith('/api')) {
            return `${url}/v1`
        }
        return url
    }

    if (typeof window !== 'undefined') {
        // Use same-origin relative path to avoid mixed-content issues in production
        return '/api/v1'
    }

    // SSR / fallback (dev)
    return 'http://localhost:8000/api/v1'
}

const API_BASE_URL = resolveApiBaseUrl()

export interface UploadProgressEvent {
    upload_id: string
    progress: number
    message: string
    status: string
    stage?: string
    version?: number
    timestamp?: string
}

export interface UploadResponse {
    upload_id: string
    status: string
    message: string
}

export interface TodayMetrics {
    date: string
    recovery_score: number | null
    strain_score: number | null
    sleep_hours: number | null
    hrv: number | null
    resting_hr: number | null
    workouts_count: number
    rem_sleep_min?: number | null
    deep_sleep_min?: number | null
    light_sleep_min?: number | null
    awake_time_min?: number | null
    sleep_efficiency?: number | null
    sleep_performance_percentage?: number | null
    respiratory_rate?: number | null
    spo2_percentage?: number | null
    skin_temp_celsius?: number | null
    avg_heart_rate?: number | null
    max_heart_rate?: number | null
    calories?: number | null
}

export interface TodayRecommendation {
    intensity_level: string
    focus: string
    workout_type: string
    notes: string
    optimal_time: string
    calories?: number
}

export interface TomorrowPrediction {
    recovery_forecast: number | null
    confidence: number
}

export interface HealthScores {
    consistency: number
    burnout_risk: number
    sleep_health: number
    injury_risk: number
}

export interface WorkoutEfficiency {
    sport_type: string
    avg_cal_per_min: number
    avg_hr: number
    sample_size: number
}

export interface CalorieAnalysis {
    winner: WorkoutEfficiency | null
    explanation: string
    comparison: WorkoutEfficiency[]
}

export interface DashboardSummary {
    today: TodayMetrics
    recommendation: TodayRecommendation
    tomorrow: TomorrowPrediction
    scores: HealthScores
    risk_flags: string[]
}

export interface TrendPoint {
    date: string
    value: number
}

export interface TrendsSeries {
    recovery: TrendPoint[]
    strain: TrendPoint[]
    sleep: TrendPoint[]
    hrv: TrendPoint[]
    calories: TrendPoint[]
    spo2: TrendPoint[]
    skin_temp: TrendPoint[]
    resting_hr: TrendPoint[]
    respiratory_rate: TrendPoint[]
}

export interface TrendsResponse {
    user_id: string
    series: TrendsSeries
    is_whoop_api_limited?: boolean  // True if data is limited to 25 records due to WHOOP API
}

export interface InsightItem {
    insight_type: string
    title: string
    description: string
    confidence: number
    period_start?: string
    period_end?: string
    data?: Record<string, any>
}

export interface CalorieGPSWorkout {
    type: string
    name: string
    emoji: string
    color: string
    efficiency: number
    time: number
    optimal: boolean
    improvement: number
}

export interface CalorieGPSModelMetrics {
    mae?: number
    r2?: number
    sample_size?: number
    feature_importance?: Record<string, number>
    model_type?: string
}

export interface CalorieGPSResponse {
    recommendations: CalorieGPSWorkout[]
    is_personalized: boolean
    model_confidence?: number
    model_metrics?: CalorieGPSModelMetrics
}

export interface BlogPost {
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

export interface BlogPostList {
    posts: BlogPost[]
}

export interface NewsletterSubscribe {
    email: string
}

export interface NewsletterResponse {
    success: boolean
    message: string
}

async function fetchWithAuth(endpoint: string, params: Record<string, any> = {}, timeoutMs = 30000, overrideUserId?: string) {
    console.log(`fetchWithAuth: calling ${endpoint}`)
    const user = await getCurrentUser()
    if (!user) {
        console.error('fetchWithAuth: User not authenticated')
        throw new Error('User not authenticated')
    }
    console.log(`fetchWithAuth: got user ${user.id}`)

    const url = new URL(`${API_BASE_URL}${endpoint}`, typeof window !== 'undefined' ? window.location.origin : undefined)
    // Use overrideUserId if provided (for admin viewing), otherwise use current user's ID
    url.searchParams.append('user_id', overrideUserId || user.id)

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value))
        }
    })

    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
        const response = await fetch(url.toString(), {
            headers: {
                'Content-Type': 'application/json',
            },
            signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
            const errorText = await response.text().catch(() => '')
            throw new Error(`API Error (${response.status}): ${errorText || response.statusText}`)
        }

        return response.json()
    } catch (error: any) {
        clearTimeout(timeoutId)
        if (error.name === 'AbortError') {
            throw new Error(`Request timeout after ${timeoutMs / 1000} seconds`)
        }
        throw error
    }
}

export const api = {
    getDashboardSummary: async (overrideUserId?: string): Promise<DashboardSummary> => {
        return fetchWithAuth('/dashboard/summary', {}, 30000, overrideUserId)
    },

    getTrends: async (startDate?: string, endDate?: string, overrideUserId?: string): Promise<TrendsResponse> => {
        return fetchWithAuth('/dashboard/trends', {
            start_date: startDate,
            end_date: endDate,
        }, 30000, overrideUserId)
    },

    getInsights: async (regenerate = false) => {
        return fetchWithAuth('/dashboard/insights', { regenerate })
    },

    getCalorieAnalysis: () => fetchWithAuth('/dashboard/calorie-analysis'),
    getJournalInsights: () => fetchWithAuth('/dashboard/journal-insights'),

    getRecoveryTrajectory: async (factorKey: string, currentDate?: string) => {
        const params: Record<string, any> = { factor_key: factorKey }
        if (currentDate) params.current_date = currentDate
        return fetchWithAuth('/dashboard/recovery-trajectory', params)
    },

    getXAIExplanations: async (factorKey: string, explanationType: 'shap' | 'lime' | 'interactions' = 'shap', instanceIdx?: number) => {
        const params: Record<string, any> = {
            factor_key: factorKey,
            explanation_type: explanationType
        }
        if (instanceIdx !== undefined) params.instance_idx = instanceIdx
        return fetchWithAuth('/dashboard/xai-explanations', params)
    },
    getPersonalizationInsights: (overrideUserId?: string) => fetchWithAuth('/dashboard/personalization-insights', {}, 30000, overrideUserId),

    getCalorieBurnAnalyticsRecommendations: async (
        recoveryScore: number,
        targetCalories: number,
        strainScore?: number,
        sleepHours?: number,
        hrv?: number,
        restingHr?: number,
        acuteChronicRatio?: number,
        sleepDebt?: number,
        consistencyScore?: number
    ) => {
        const params: Record<string, any> = {
            recovery_score: recoveryScore,
            target_calories: targetCalories,
        }

        if (strainScore !== undefined) params.strain_score = strainScore
        if (sleepHours !== undefined) params.sleep_hours = sleepHours
        if (hrv !== undefined) params.hrv = hrv
        if (restingHr !== undefined) params.resting_hr = restingHr
        if (acuteChronicRatio !== undefined) params.acute_chronic_ratio = acuteChronicRatio
        if (sleepDebt !== undefined) params.sleep_debt = sleepDebt
        if (consistencyScore !== undefined) params.consistency_score = consistencyScore

        // Use the same backend endpoint (we'll update backend to support both)
        return fetchWithAuth('/calorie-gps/recommendations', params) as Promise<CalorieGPSResponse>
    },

    // Legacy function name for backward compatibility
    getCalorieGPSRecommendations: async (
        recoveryScore: number,
        targetCalories: number,
        strainScore?: number,
        sleepHours?: number,
        hrv?: number,
        restingHr?: number,
        acuteChronicRatio?: number,
        sleepDebt?: number,
        consistencyScore?: number
    ) => {
        // Use the same implementation
        const params: Record<string, any> = {
            recovery_score: recoveryScore,
            target_calories: targetCalories,
        }

        if (strainScore !== undefined) params.strain_score = strainScore
        if (sleepHours !== undefined) params.sleep_hours = sleepHours
        if (hrv !== undefined) params.hrv = hrv
        if (restingHr !== undefined) params.resting_hr = restingHr
        if (acuteChronicRatio !== undefined) params.acute_chronic_ratio = acuteChronicRatio
        if (sleepDebt !== undefined) params.sleep_debt = sleepDebt
        if (consistencyScore !== undefined) params.consistency_score = consistencyScore

        return fetchWithAuth('/calorie-gps/recommendations', params)
    },

    getModelMetrics: async (): Promise<any> => {
        return fetchWithAuth('/model-metrics')
    },



    // Blog API
    getBlogPosts: async (publishedOnly: boolean = true) => {
        const url = new URL(`${API_BASE_URL}/blog`, typeof window !== 'undefined' ? window.location.origin : undefined)
        url.searchParams.append('published_only', String(publishedOnly))

        const response = await fetch(url.toString(), {
            headers: {
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            throw new Error(`Failed to fetch blog posts: ${response.statusText}`)
        }

        return response.json() as Promise<BlogPostList>
    },

    getBlogPost: async (postId: number) => {
        const url = new URL(`${API_BASE_URL}/blog/${postId}`, typeof window !== 'undefined' ? window.location.origin : undefined)

        const response = await fetch(url.toString(), {
            headers: {
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            throw new Error(`Failed to fetch blog post: ${response.statusText}`)
        }

        return response.json() as Promise<BlogPost>
    },

    // Newsletter API (no auth required)
    subscribeNewsletter: async (email: string) => {
        const url = new URL(`${API_BASE_URL}/newsletter/subscribe`, typeof window !== 'undefined' ? window.location.origin : undefined)

        const response = await fetch(url.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: response.statusText }))
            throw new Error(errorData.detail || `Failed to subscribe: ${response.statusText}`)
        }

        return response.json() as Promise<NewsletterResponse>
    },

    // Admin Blog API (requires admin authentication)
    async fetchWithAdminAuth(endpoint: string, options: RequestInit = {}) {
        const user = await getCurrentUser()
        if (!user || !user.email) {
            throw new Error('User not authenticated or email not available')
        }

        const url = new URL(`${API_BASE_URL}${endpoint}`, typeof window !== 'undefined' ? window.location.origin : undefined)

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer email:${user.email}`,
            ...(options.headers || {}),
        }

        const response = await fetch(url.toString(), {
            ...options,
            headers,
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: response.statusText }))
            throw new Error(errorData.detail || `Request failed: ${response.statusText}`)
        }

        return response.json()
    },

    createBlogPost: async (post: any) => {
        const user = await getCurrentUser()
        if (!user || !user.email) {
            throw new Error('User not authenticated')
        }

        const url = new URL(`${API_BASE_URL}/blog`, typeof window !== 'undefined' ? window.location.origin : undefined)

        const response = await fetch(url.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer email:${user.email}`,
            },
            body: JSON.stringify(post),
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: response.statusText }))
            throw new Error(errorData.detail || `Failed to create blog post: ${response.statusText}`)
        }

        return response.json()
    },

    updateBlogPost: async (postId: number, post: any) => {
        const user = await getCurrentUser()
        if (!user || !user.email) {
            throw new Error('User not authenticated')
        }

        const url = new URL(`${API_BASE_URL}/blog/${postId}`, typeof window !== 'undefined' ? window.location.origin : undefined)

        const response = await fetch(url.toString(), {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer email:${user.email}`,
            },
            body: JSON.stringify(post),
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: response.statusText }))
            throw new Error(errorData.detail || `Failed to update blog post: ${response.statusText}`)
        }

        return response.json()
    },

    deleteBlogPost: async (postId: number) => {
        const user = await getCurrentUser()
        if (!user || !user.email) {
            throw new Error('User not authenticated')
        }

        const url = new URL(`${API_BASE_URL}/blog/${postId}`, typeof window !== 'undefined' ? window.location.origin : undefined)

        const response = await fetch(url.toString(), {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer email:${user.email}`,
            },
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: response.statusText }))
            throw new Error(errorData.detail || `Failed to delete blog post: ${response.statusText}`)
        }

        return true
    },

    uploadBlogImage: async (file: File) => {
        const user = await getCurrentUser()
        if (!user || !user.email) {
            throw new Error('User not authenticated')
        }

        const formData = new FormData()
        formData.append('file', file)

        const url = new URL(`${API_BASE_URL}/blog/upload-image`, typeof window !== 'undefined' ? window.location.origin : undefined)

        const response = await fetch(url.toString(), {
            method: 'POST',
            headers: {
                'Authorization': `Bearer email:${user.email}`,
            },
            body: formData,
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: response.statusText }))
            throw new Error(errorData.detail || `Failed to upload image: ${response.statusText}`)
        }

        return response.json()
    },

    uploadWhoopData: async (file: File, isMobile: boolean = false) => {
        const user = await getCurrentUser()
        if (!user) {
            throw new Error('User not authenticated')
        }

        const formData = new FormData()
        formData.append('file', file)
        formData.append('user_id', user.id)
        formData.append('is_mobile', String(isMobile))

        // Extract name and email from user metadata to sync with backend
        const name = user.user_metadata?.name || user.user_metadata?.full_name || user.user_metadata?.display_name
        if (name) {
            formData.append('name', name)
        }
        if (user.email) {
            formData.append('email', user.email)
        }

        // Sync other profile fields if available in metadata
        const age = user.user_metadata?.age
        if (age) {
            formData.append('age', String(age))
        }

        const nationality = user.user_metadata?.nationality
        if (nationality) {
            formData.append('nationality', nationality)
        }

        const goal = user.user_metadata?.goal
        if (goal) {
            formData.append('goal', goal)
        }

        const response = await fetch(`${API_BASE_URL}/whoop/ingest`, {
            method: 'POST',
            body: formData,
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: response.statusText }))
            throw new Error(errorData.detail || `Failed to upload data: ${response.statusText}`)
        }

        return response.json()
    },

    // Admin API
    getAdminEmails: async () => {
        const user = await getCurrentUser()
        if (!user || !user.email) {
            throw new Error('User not authenticated')
        }

        const url = new URL(`${API_BASE_URL}/admin/admins`, typeof window !== 'undefined' ? window.location.origin : undefined)

        const response = await fetch(url.toString(), {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer email:${user.email}`,
            },
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: response.statusText }))
            throw new Error(errorData.detail || `Failed to get admin emails: ${response.statusText}`)
        }

        return response.json()
    },

    addAdminEmail: async (email: string) => {
        const user = await getCurrentUser()
        if (!user || !user.email) {
            throw new Error('User not authenticated')
        }

        const url = new URL(`${API_BASE_URL}/admin/admins`, typeof window !== 'undefined' ? window.location.origin : undefined)
        url.searchParams.append('email', email)

        const response = await fetch(url.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer email:${user.email}`,
            },
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: response.statusText }))
            throw new Error(errorData.detail || `Failed to add admin email: ${response.statusText}`)
        }

        return response.json()
    },

    removeAdminEmail: async (email: string) => {
        const user = await getCurrentUser()
        if (!user || !user.email) {
            throw new Error('User not authenticated')
        }

        const url = new URL(`${API_BASE_URL}/admin/admins/${encodeURIComponent(email)}`, typeof window !== 'undefined' ? window.location.origin : undefined)

        const response = await fetch(url.toString(), {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer email:${user.email}`,
            },
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: response.statusText }))
            throw new Error(errorData.detail || `Failed to remove admin email: ${response.statusText}`)
        }

        return response.json()
    },

    // Zenith AI Coach API
    zenithChat: async (question: string, summary?: DashboardSummary | null, trends?: TrendsResponse | null) => {
        const user = await getCurrentUser()
        if (!user) {
            throw new Error('User not authenticated')
        }

        if (!user.id) {
            throw new Error('User ID not found. Please log out and log back in.')
        }

        const url = new URL(`${API_BASE_URL}/zenith/chat`, typeof window !== 'undefined' ? window.location.origin : undefined)
        url.searchParams.append('user_id', user.id)

        const response = await fetch(url.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                question,
                user_data: {
                    summary,
                    trends,
                },
            }),
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: response.statusText }))
            throw new Error(errorData.detail || `Failed to get response: ${response.statusText}`)
        }

        return response.json()
    },

    updateUserProfile: async (data: { name?: string; email?: string; age?: number; nationality?: string; goal?: string }) => {
        const user = await getCurrentUser()
        if (!user) throw new Error('Not authenticated')

        const url = new URL(`${API_BASE_URL}/users/me`)
        url.searchParams.append('user_id', user.id)

        const response = await fetch(url.toString(), {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: response.statusText }))
            throw new Error(errorData.detail || `Failed to update profile: ${response.statusText}`)
        }

        return response.json()
    },

    getWhoopAuthUrl: async () => {
        return fetchWithAuth('/whoop/authorize')
    },

    syncWhoopData: async (code: string, state: string) => {
        return fetchWithAuth('/whoop/callback', { code, state })
    },

    syncWhoopDataNow: async () => {
        const user = await getCurrentUser()
        if (!user) {
            throw new Error('User not authenticated')
        }
        const url = new URL(`${API_BASE_URL}/whoop/sync`, typeof window !== 'undefined' ? window.location.origin : undefined)
        url.searchParams.append('user_id', user.id)

        const response = await fetch(url.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: response.statusText }))
            throw new Error(errorData.detail || `Failed to sync data: ${response.statusText}`)
        }

        return response.json()
    },
}
