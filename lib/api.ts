import { getCurrentUser } from './supabase'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export interface DashboardSummary {
    recovery_score: number
    strain_score: number
    sleep_hours: number
    hrv: number
    recommendation: {
        intensity: string
        focus: string
        workout_type: string
        notes: string
        optimal_time: string
    }
    forecast: {
        tomorrow_recovery: number
        confidence_interval: [number, number]
    }
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

    const url = new URL(`${API_BASE_URL}${endpoint}`)
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

    uploadWhoopData: async (file: File) => {
        const user = await getCurrentUser()
        if (!user) {
            throw new Error('User not authenticated')
        }

        const formData = new FormData()
        formData.append('file', file)
        formData.append('user_id', user.id)

        const response = await fetch(`${API_BASE_URL}/whoop/upload`, {
            method: 'POST',
            body: formData,
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Upload failed: ${response.statusText} - ${errorText}`)
        }

        return response.json()
    }
}
