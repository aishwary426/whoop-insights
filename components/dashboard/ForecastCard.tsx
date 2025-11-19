'use client'

import NeonCard from '../ui/NeonCard'

interface ForecastCardProps {
    forecast: number
}

export default function ForecastCard({ forecast }: ForecastCardProps) {
    const roundedForecast = Math.round(forecast)
    const isHighRecovery = roundedForecast > 66

    return (
        <NeonCard className="p-6 border-white/10 bg-[#0A0A0A] h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/50">Tomorrow</p>
                    <p className="text-3xl font-semibold text-neon-primary mt-1">
                        {roundedForecast}%
                    </p>
                </div>
                <div className="text-[10px] uppercase tracking-wider text-white/60 bg-white/5 px-2 py-1 rounded border border-white/5">
                    AI Forecast
                </div>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">
                {isHighRecovery
                    ? "Expect high recovery tomorrow. Good day to push."
                    : "Recovery might be lower tomorrow. Prioritize sleep."}
            </p>
        </NeonCard>
    )
}
