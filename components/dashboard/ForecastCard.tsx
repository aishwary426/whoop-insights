'use client'

import { memo } from 'react'
import NeonCard from '../ui/NeonCard'

interface ForecastCardProps {
    forecast: number | null | undefined
    strain?: number
    sleep?: number
}

function ForecastCard({ forecast, strain = 0, sleep = 0 }: ForecastCardProps) {
    // Handle null/undefined forecast - show 0% as placeholder but indicate it's being calculated
    const forecastValue = forecast ?? 0
    const roundedForecast = Math.round(forecastValue)
    const hasForecast = forecast !== null && forecast !== undefined
    const isHighRecovery = roundedForecast > 66

    let explanation = ""
    if (!hasForecast) {
        explanation = "Forecast will be available after you have more data."
    } else if (isHighRecovery) {
        explanation = "Your metrics indicate you're primed for performance tomorrow."
    } else {
        if (strain > 15) {
            explanation = "High strain today is likely dampening your projected recovery."
        } else if (sleep > 0 && sleep < 6) {
            explanation = "Recent sleep duration may be limiting your recovery potential."
        } else {
            explanation = "Recovery might be lower tomorrow based on your recent trends. Prioritize sleep."
        }
    }

    return (
        <NeonCard className="p-6 border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0A0A0A] h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-white/50">Tomorrow</p>
                    <p className="text-3xl font-semibold text-blue-600 dark:text-neon-primary mt-1">
                        {hasForecast ? `${roundedForecast}%` : '—'}
                    </p>
                </div>
                <div className="text-[10px] uppercase tracking-wider text-gray-600 dark:text-white/60 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded border border-gray-200 dark:border-white/5">
                    AI Forecast
                </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-white/60 leading-relaxed">
                {explanation}
            </p>
        </NeonCard>
    )
}

export default memo(ForecastCard)
