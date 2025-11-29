'use client'

import { useState, memo, useMemo, useCallback } from 'react'
import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import NeonCard from '../ui/NeonCard'
import { useTheme } from 'next-themes'
import { useIsMobile } from '../../lib/hooks/useIsMobile'
import { usePerformanceMode } from '../../lib/hooks/usePerformanceMode'

interface InteractiveChartProps {
  title: string
  subtitle?: string
  data: { date: string; value: number }[]
  color: string
  unit?: string
  height?: number | string
  className?: string
}

// Reduce data points for mobile/low-end devices
function reduceDataPoints(data: { date: string; value: number }[], maxPoints: number) {
  if (data.length <= maxPoints) return data
  
  const step = Math.ceil(data.length / maxPoints)
  const reduced: { date: string; value: number }[] = []
  
  for (let i = 0; i < data.length; i += step) {
    reduced.push(data[i])
  }
  
  // Always include the last point
  if (reduced[reduced.length - 1] !== data[data.length - 1]) {
    reduced.push(data[data.length - 1])
  }
  
  return reduced
}

function InteractiveChart({
  title,
  subtitle,
  data,
  color,
  unit = '',
  height = 200,
  className,
}: InteractiveChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const { theme } = useTheme()
  const isMobile = useIsMobile()
  const { reduceDataPoints: shouldReduce } = usePerformanceMode()

  // Reduce data points on mobile/low-end devices for better performance
  const optimizedData = useMemo(() => {
    if (shouldReduce && data.length > 30) {
      return reduceDataPoints(data, isMobile ? 20 : 30)
    }
    return data
  }, [data, shouldReduce, isMobile])

  const chartData = useMemo(() =>
    optimizedData.map((item, idx) => ({
      ...item,
      index: idx,
    })),
    [optimizedData]
  )

  const hasData = useMemo(() => {
    return optimizedData.length > 0 && optimizedData.some(item => item.value !== null && item.value !== undefined)
  }, [optimizedData])

  const CustomTooltip = useCallback(({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white/90 dark:bg-black/90 border border-blue-600/30 dark:border-neon-primary/30 rounded-lg p-3 shadow-lg dark:shadow-neon-card backdrop-blur-xl">
          <p className="text-xs text-gray-600 dark:text-white/60 mb-1">{data.date}</p>
          <p className="text-lg font-semibold" style={{ color }}>
            {typeof data.value === 'number' ? +data.value.toFixed(2) : data.value}{unit}
          </p>
        </div>
      )
    }
    return null
  }, [color, unit])

  const tickColor = theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'
  const dotFill = theme === 'dark' ? '#0A0A0A' : '#ffffff'

  // Debounce hover updates to prevent jitter
  const handleMouseMove = useCallback((e: any) => {
    if (e && e.activeTooltipIndex !== undefined) {
      // Use requestAnimationFrame for smoother updates
      requestAnimationFrame(() => {
        setHoveredIndex(e.activeTooltipIndex)
      })
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    setHoveredIndex(null)
  }, [])

  return (
    <NeonCard className={`p-4 md:p-6 border-gray-200 dark:border-white/10 flex flex-col ${className || ''}`}>
      <div className="mb-3 md:mb-4 shrink-0">
        <p className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-white/50">{title}</p>
        {subtitle && <p className="text-xs md:text-sm text-gray-600 dark:text-white/60 mt-1">{subtitle}</p>}
      </div>
      <div className="relative flex-1 min-h-[140px] md:min-h-[160px] chart-container" style={{ height: typeof height === 'number' ? `${height}px` : height }}>
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%" key={`chart-${title}-${optimizedData.length}`}>
            <AreaChart
              data={chartData}
              margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
              onMouseMove={isMobile ? undefined : handleMouseMove}
              onMouseLeave={isMobile ? undefined : handleMouseLeave}
            >
              <defs>
                <linearGradient id={`gradient-${title.toLowerCase().replace(/\s+/g, '-')}-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: tickColor, fontSize: isMobile ? 9 : 11 }}
                interval={isMobile ? Math.ceil(data.length / 4) : 0}
                angle={isMobile ? -45 : 0}
                textAnchor={isMobile ? 'end' : 'middle'}
                height={isMobile ? 60 : 30}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: tickColor, fontSize: 11 }}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} isAnimationActive={false} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2.5}
                fill={`url(#gradient-${title.toLowerCase().replace(/\s+/g, '-')}-${color.replace('#', '')})`}
                isAnimationActive={false} // Disable animation for better performance
                dot={(props: any) => {
                  const { cx, cy, payload } = props
                  const isHovered = hoveredIndex === payload.index
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 6 : 4}
                      fill={isMobile ? 'transparent' : dotFill}
                      stroke={color}
                      strokeWidth={isHovered ? 3 : 2}
                      className="transition-all duration-200"
                      style={{ filter: isHovered ? `drop-shadow(0 0 8px ${color})` : 'none' }}
                    />
                  )
                }}
                activeDot={{ r: 6, fill: isMobile ? 'transparent' : dotFill, stroke: color, strokeWidth: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-sm text-gray-400 dark:text-white/40 mb-1">No data available</p>
              <p className="text-xs text-gray-500 dark:text-white/30">Data will appear as it's collected</p>
            </div>
          </div>
        )}
      </div>
    </NeonCard>
  )
}

export default memo(InteractiveChart)


