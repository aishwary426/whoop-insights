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
}

async function fetchWithAuth(endpoint: string, params: Record<string, any> = {}, timeoutMs = 30000, overrideUserId?: string) {
    const user = await getCurrentUser()
    if (!user) {
        throw new Error('User not authenticated')
    }

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
            throw new Error(`Request timeout after ${timeoutMs/1000} seconds`)
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
        return fetchWithAuth('/calorie-gps/recommendations', params)
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

    uploadWhoopData: async (file: File): Promise<UploadResponse> => {
        const user = await getCurrentUser()
        if (!user) {
            throw new Error('User not authenticated. Please log in and try again.')
        }

        // Validate file before attempting upload
        if (!file) {
            throw new Error('No file selected. Please select a ZIP file to upload.')
        }

        if (!file.name.toLowerCase().endsWith('.zip')) {
            throw new Error('Invalid file type. Please upload a ZIP file exported from WHOOP.')
        }

        const fileSizeMB = file.size / 1024 / 1024
        if (fileSizeMB > 4.5) {
            throw new Error(`File too large (${fileSizeMB.toFixed(2)} MB). Maximum size is 4.5MB. Please try a smaller export or contact support.`)
        }

        const isMobileDevice = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

        const formData = new FormData()
        formData.append('file', file)
        formData.append('user_id', user.id)
        formData.append('is_mobile', String(isMobileDevice))

        const uploadUrl = `${API_BASE_URL}/whoop/ingest`
        console.log('=== Upload Request ===')
        console.log('URL:', uploadUrl)
        console.log('File:', file.name)
        console.log('Size:', file.size, 'bytes (' + fileSizeMB.toFixed(2) + ' MB)')
        console.log('User ID:', user.id)
        console.log('Is Mobile:', isMobileDevice)

        let response: Response
        try {
            response = await fetch(uploadUrl, {
                method: 'POST',
                body: formData,
                // Don't set Content-Type header - let browser set it with boundary for multipart/form-data
            })
        } catch (fetchError: any) {
            // Network error - fetch itself failed
            console.error('Fetch error (network/CORS):', fetchError)
            const networkErrorMsg = fetchError?.message?.includes('CORS')
                ? 'CORS error: The server may not be configured correctly. Please check your deployment.'
                : fetchError?.message?.includes('Failed to fetch')
                    ? 'Network error: Unable to reach the server. Please check your internet connection and try again.'
                    : `Network error: ${fetchError?.message || 'Failed to connect to server'}. Please try again.`
            throw new Error(networkErrorMsg)
        }

        if (!response.ok) {
            let errorDetail = ''
            let errorText = ''

            try {
                // Clone response to read it without consuming the stream
                const responseClone = response.clone()
                const text = await responseClone.text()

                console.error('Upload error response:', {
                    status: response.status,
                    statusText: response.statusText,
                    text: text,
                    textLength: text.length,
                    headers: Object.fromEntries(response.headers.entries())
                })

                if (text && text.trim()) {
                    try {
                        // Try to parse as JSON for structured error
                        const jsonError = JSON.parse(text)
                        errorDetail = jsonError.detail || jsonError.message || jsonError.error || JSON.stringify(jsonError)
                    } catch {
                        // Not JSON, use as-is
                        errorDetail = text.trim()
                    }
                }
            } catch (readError) {
                console.error('Error reading response text:', readError)
                // Continue with status-based messages
            }

            // Provide more helpful error messages based on status code
            if (response.status === 413) {
                errorText = errorDetail || 'File too large. Vercel limits uploads to 4.5MB. Please try a smaller export or contact support.'
            } else if (response.status === 400) {
                errorText = errorDetail || 'Invalid file format. Please upload a WHOOP export ZIP file.'
            } else if (response.status === 401 || response.status === 403) {
                errorText = errorDetail || 'Authentication error. Please log in again.'
            } else if (response.status === 404) {
                errorText = errorDetail || 'Upload endpoint not found. The API route may not be deployed correctly. Please check your Vercel deployment.'
            } else if (response.status === 405) {
                errorText = errorDetail || 'Method not allowed. The endpoint exists but doesn\'t accept POST requests. This may be a Vercel routing configuration issue. Please check that the Python serverless function is properly configured.'
            } else if (response.status === 405) {
                errorText = errorDetail || 'Method not allowed. The server may not be configured correctly for POST requests. Please check your Vercel function configuration.'
            } else if (response.status === 413) {
                errorText = errorDetail || 'File too large. Maximum file size is 4.5MB.'
            } else if (response.status === 422) {
                errorText = errorDetail || 'Invalid request format. Please ensure you\'re uploading a valid ZIP file.'
            } else if (response.status === 502 || response.status === 503) {
                errorText = errorDetail || 'Service temporarily unavailable. The server may be starting up. Please try again in a moment.'
            } else if (response.status >= 500) {
                errorText = errorDetail || `Server error (${response.status}). Please try again later. If the problem persists, contact support.`
            } else if (response.status === 0) {
                errorText = errorDetail || 'Network error: Request was cancelled or blocked. Please check your connection and try again.'
            } else {
                // For any other status code, use detail if available, otherwise provide context
                errorText = errorDetail || `Upload failed with status ${response.status}: ${response.statusText || 'Unknown error'}`
            }

            // Final fallback - ensure we never have an empty error
            if (!errorText || errorText.trim() === '' || errorText === 'Unknown error') {
                errorText = `Upload failed: HTTP ${response.status} ${response.statusText || 'Unknown status'}`
            }

            throw new Error(errorText)
        }

        return response.json()
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
        
        return response.json()
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
        
        return response.json()
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
        
        return response.json()
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

        const url = new URL(`${API_BASE_URL}/images/upload`, typeof window !== 'undefined' ? window.location.origin : undefined)
        
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

    // Admin API
    getAllUsers: async () => {
        const user = await getCurrentUser()
        if (!user || !user.email) {
            throw new Error('User not authenticated')
        }

        const url = new URL(`${API_BASE_URL}/admin/users`, typeof window !== 'undefined' ? window.location.origin : undefined)
        
        const response = await fetch(url.toString(), {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer email:${user.email}`,
            },
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: response.statusText }))
            throw new Error(errorData.detail || `Failed to get users: ${response.statusText}`)
        }

        return response.json()
    },

    deleteUser: async (userId: string) => {
        const user = await getCurrentUser()
        if (!user || !user.email) {
            throw new Error('User not authenticated')
        }

        const url = new URL(`${API_BASE_URL}/admin/users/${userId}`, typeof window !== 'undefined' ? window.location.origin : undefined)
        
        const response = await fetch(url.toString(), {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer email:${user.email}`,
            },
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: response.statusText }))
            throw new Error(errorData.detail || `Failed to delete user: ${response.statusText}`)
        }

        return response.json()
    },
}
