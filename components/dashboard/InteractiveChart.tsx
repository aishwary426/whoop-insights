'use client'

import { useState, memo, useMemo } from 'react'
import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import NeonCard from '../ui/NeonCard'
import { useTheme } from 'next-themes'

interface InteractiveChartProps {
  title: string
  subtitle?: string
  data: { date: string; value: number }[]
  color: string
  unit?: string
  height?: number | string
  className?: string
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

  const chartData = useMemo(() => 
    data.map((item, idx) => ({
      ...item,
      index: idx,
    })),
    [data]
  )

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white/90 dark:bg-black/90 border border-neon-primary/30 rounded-lg p-3 shadow-lg dark:shadow-neon-card backdrop-blur-xl">
          <p className="text-xs text-gray-600 dark:text-white/60 mb-1">{data.date}</p>
          <p className="text-lg font-semibold" style={{ color }}>
            {typeof data.value === 'number' ? +data.value.toFixed(2) : data.value}{unit}
          </p>
        </div>
      )
    }
    return null
  }

  const tickColor = theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'
  const dotFill = theme === 'dark' ? '#0A0A0A' : '#ffffff'

  return (
    <NeonCard className={`p-6 border-gray-200 dark:border-white/10 flex flex-col ${className || ''}`}>
      <div className="mb-4 shrink-0">
        <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-white/50">{title}</p>
        {subtitle && <p className="text-sm text-gray-600 dark:text-white/60 mt-1">{subtitle}</p>}
      </div>
      <div className="relative flex-1 min-h-[160px]" style={{ height: typeof height === 'number' ? `${height}px` : height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
            onMouseMove={(e: any) => {
              if (e && e.activeTooltipIndex !== undefined) {
                setHoveredIndex(e.activeTooltipIndex)
              }
            }}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <defs>
              <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: tickColor, fontSize: 11 }}
              interval={0}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: tickColor, fontSize: 11 }}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2.5}
              fill={`url(#gradient-${color.replace('#', '')})`}
              dot={(props: any) => {
                const { cx, cy, payload } = props
                const isHovered = hoveredIndex === payload.index
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 6 : 4}
                    fill={dotFill}
                    stroke={color}
                    strokeWidth={isHovered ? 3 : 2}
                    className="transition-all duration-200"
                    style={{ filter: isHovered ? `drop-shadow(0 0 8px ${color})` : 'none' }}
                  />
                )
              }}
              activeDot={{ r: 6, fill: dotFill, stroke: color, strokeWidth: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </NeonCard>
  )
}

export default memo(InteractiveChart)

