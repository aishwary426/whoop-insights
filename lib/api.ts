import { getCurrentUser } from './supabase'

const resolveApiBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL
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

export interface TrendsResponse {
    recovery: TrendPoint[]
    strain: TrendPoint[]
    sleep: TrendPoint[]
    hrv: TrendPoint[]
}

async function fetchWithAuth(endpoint: string, params: Record<string, any> = {}) {
    const user = await getCurrentUser()
    if (!user) {
        throw new Error('User not authenticated')
    }

    const url = new URL(`${API_BASE_URL}${endpoint}`, typeof window !== 'undefined' ? window.location.origin : undefined)
    url.searchParams.append('user_id', user.id)

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value))
        }
    })

    const response = await fetch(url.toString(), {
        headers: {
            'Content-Type': 'application/json',
        },
    })

    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`)
    }

    return response.json()
}

export const api = {
    getDashboardSummary: async (): Promise<DashboardSummary> => {
        return fetchWithAuth('/dashboard/summary')
    },

    getTrends: async (startDate?: string, endDate?: string): Promise<TrendsResponse> => {
        return fetchWithAuth('/dashboard/trends', {
            start_date: startDate,
            end_date: endDate,
        })
    },

    getInsights: async (regenerate = false) => {
        return fetchWithAuth('/dashboard/insights', { regenerate })
    },

    getCalorieAnalysis: async (): Promise<CalorieAnalysis> => {
        return fetchWithAuth('/dashboard/calorie-analysis')
    },

    uploadWhoopData: async (file: File): Promise<UploadResponse> => {
        const user = await getCurrentUser()
        if (!user) {
            throw new Error('User not authenticated')
        }

        const isMobileDevice = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

        const formData = new FormData()
        formData.append('file', file)
        formData.append('user_id', user.id)
        formData.append('is_mobile', String(isMobileDevice))

        const response = await fetch(`${API_BASE_URL}/whoop/upload`, {
            method: 'POST',
            body: formData,
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Upload failed: ${response.statusText} - ${errorText}`)
        }

        return response.json()
    },

    streamUploadProgress: (
        uploadId: string,
        onMessage: (event: UploadProgressEvent) => void,
        onError?: () => void
    ) => {
        const source = new EventSource(`${API_BASE_URL}/whoop/upload/progress/${uploadId}`)

        source.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)
                onMessage(data)
            } catch (error) {
                console.error('Failed to parse progress event', error)
            }
        }

        source.onerror = () => {
            console.error('Progress stream encountered an error')
            onError?.()
        }

        return source
    }
}
