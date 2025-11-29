import useSWR from 'swr'
import { api, DashboardSummary, TrendsResponse, InsightItem } from '../api'

// SWR fetcher wrapper
const fetcher = (url: string) => {
    // We need to handle the API calls mapping based on URL key
    // This is a simplified fetcher that assumes the key is the endpoint path
    // But since our api.ts has specific methods, we might want to wrap them.
    // Alternatively, we can use the api methods directly in the SWR key if we define a fetcher that accepts a function.
    // But standard SWR usage is key + fetcher.
    return fetch(url).then(res => res.json())
}

// Custom hook for Dashboard Summary
export function useDashboardSummary(userId?: string, refreshKey?: string | number) {
    const { data, error, isLoading, mutate } = useSWR<DashboardSummary>(
        userId ? [`/dashboard/summary?user_id=${userId}`, refreshKey] : null,
        () => api.getDashboardSummary(userId),
        {
            refreshInterval: 60000, // Refresh every 60 seconds for live updates
            revalidateOnFocus: true, // Revalidate when window regains focus
            keepPreviousData: true,
            dedupingInterval: 30000, // Dedupe requests within 30 seconds
        }
    )

    return {
        summary: data,
        isLoading,
        isError: error,
        mutate,
    }
}

// Custom hook for Trends
export function useTrends(startDate?: string, endDate?: string, userId?: string, refreshKey?: string | number) {
    // Create a stable key that changes when params change
    const key = userId ? ['/dashboard/trends', userId, startDate, endDate, refreshKey] : null

    const { data, error, isLoading, mutate } = useSWR<TrendsResponse>(
        key,
        () => api.getTrends(startDate, endDate, userId),
        {
            refreshInterval: 120000, // Refresh every 2 minutes (trends change less frequently)
            revalidateOnFocus: true,
            keepPreviousData: true,
        }
    )

    return {
        trends: data,
        isLoading,
        isError: error,
        mutate,
    }
}

// Custom hook for Journal Insights
export function useJournalInsights(userId?: string) {
    const { data, error, isLoading } = useSWR<InsightItem[]>(
        userId ? `/dashboard/journal-insights?user_id=${userId}` : null,
        () => api.getJournalInsights(),
        {
            refreshInterval: 0,
            revalidateOnFocus: false,
            keepPreviousData: true,
        }
    )

    return {
        insights: data || [],
        isLoading,
        isError: error,
    }
}

// Custom hook for Personalization Insights
export function usePersonalizationInsights(userId?: string) {
    const { data, error, isLoading } = useSWR<InsightItem[]>(
        userId ? `/dashboard/personalization-insights?user_id=${userId}` : null,
        () => api.getPersonalizationInsights(userId),
        {
            refreshInterval: 0, // Expensive call, don't auto-refresh
            revalidateOnFocus: false,
            keepPreviousData: true,
        }
    )

    return {
        insights: data || [],
        isLoading,
        isError: error,
    }
}
