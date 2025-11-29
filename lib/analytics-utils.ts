import { TrendPoint } from './api'

export const calculateCorrelation = (data: any[], keyX: string, keyY: string): number => {
    if (!data || data.length < 2) return 0

    const n = data.length
    let sumX = 0
    let sumY = 0
    let sumXY = 0
    let sumX2 = 0
    let sumY2 = 0

    for (let i = 0; i < n; i++) {
        const x = Number(data[i][keyX]) || 0
        const y = Number(data[i][keyY]) || 0
        sumX += x
        sumY += y
        sumXY += x * y
        sumX2 += x * x
        sumY2 += y * y
    }

    const numerator = n * sumXY - sumX * sumY
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

    if (denominator === 0) return 0
    return numerator / denominator
}

export const calculateHistogram = (data: any[], key: string, bins: number = 10) => {
    if (!data || data.length === 0) return []

    const values = data.map(d => Number(d[key]) || 0).filter(v => !isNaN(v))
    if (values.length === 0) return []

    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min
    const binSize = range / bins

    const histogram = Array(bins).fill(0).map((_, i) => ({
        binStart: min + i * binSize,
        binEnd: min + (i + 1) * binSize,
        count: 0,
        label: `${(min + i * binSize).toFixed(1)} - ${(min + (i + 1) * binSize).toFixed(1)}`
    }))

    values.forEach(v => {
        const binIndex = Math.min(Math.floor((v - min) / binSize), bins - 1)
        if (binIndex >= 0 && binIndex < bins) {
            histogram[binIndex].count++
        }
    })

    return histogram
}

export const filterDataByRange = (data: any[], range: string) => {
    if (!data) return []
    const now = new Date()
    const cutoff = new Date()

    switch (range) {
        case '1W':
            cutoff.setDate(now.getDate() - 7)
            break
        case '1M':
            cutoff.setMonth(now.getMonth() - 1)
            break
        case '3M':
            cutoff.setMonth(now.getMonth() - 3)
            break
        case '6M':
            cutoff.setMonth(now.getMonth() - 6)
            break
        case '1Y':
            cutoff.setFullYear(now.getFullYear() - 1)
            break
        case 'ALL':
            return data
        default:
            return data
    }

    return data.filter(d => new Date(d.date) >= cutoff)
}

export const fillMissingDates = (data: any[], range: string) => {
    if (!data || data.length === 0) return []
    
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const startDate = new Date(now)

    switch (range) {
        case '1W': startDate.setDate(now.getDate() - 7); break;
        case '1M': startDate.setMonth(now.getMonth() - 1); break;
        case '3M': startDate.setMonth(now.getMonth() - 3); break;
        case '6M': startDate.setMonth(now.getMonth() - 6); break;
        case '1Y': startDate.setFullYear(now.getFullYear() - 1); break;
        case 'ALL': 
            // For ALL, find the earliest date in the data and fill from there to today
            if (data.length === 0) return []
            const dates = data.map(d => new Date(d.date).getTime()).filter(t => !isNaN(t))
            if (dates.length === 0) return data
            const earliestDate = new Date(Math.min(...dates))
            earliestDate.setHours(0, 0, 0, 0)
            
            const dataMap = new Map()
            data.forEach(d => {
                const dDate = new Date(d.date).toISOString().split('T')[0]
                dataMap.set(dDate, d)
            })

            const filledData = []
            const current = new Date(earliestDate)
            
            // Iterate from earliest date to today
            while (current <= now) {
                const dateStr = current.toISOString().split('T')[0]
                if (dataMap.has(dateStr)) {
                    filledData.push(dataMap.get(dateStr))
                } else {
                    filledData.push({ date: dateStr })
                }
                current.setDate(current.getDate() + 1)
            }
            
            return filledData
        default: return data || [];
    }

    const dataMap = new Map()
    if (data) {
        data.forEach(d => {
            const dDate = new Date(d.date).toISOString().split('T')[0]
            dataMap.set(dDate, d)
        })
    }

    const filledData = []
    const current = new Date(startDate)
    
    // Iterate until today
    while (current <= now) {
        const dateStr = current.toISOString().split('T')[0]
        if (dataMap.has(dateStr)) {
            filledData.push(dataMap.get(dateStr))
        } else {
            filledData.push({ date: dateStr })
        }
        current.setDate(current.getDate() + 1)
    }
    
    return filledData
}

export const getMetricLabel = (key: string) => {
    const labels: Record<string, string> = {
        recovery: 'Recovery',
        strain: 'Strain',
        sleep: 'Sleep Hours',
        hrv: 'HRV',
        resting_hr: 'RHR',
        spo2: 'SpO2',
        respiratory_rate: 'Resp. Rate',
        skin_temp: 'Skin Temp',
        calories: 'Calories'
    }
    return labels[key] || key
}

export const getMetricUnit = (key: string) => {
    const units: Record<string, string> = {
        recovery: '%',
        strain: '',
        sleep: 'h',
        hrv: 'ms',
        resting_hr: 'bpm',
        spo2: '%',
        respiratory_rate: 'rpm',
        skin_temp: '°C',
        calories: 'kcal'
    }
    return units[key] || ''
}

export const getMetricColor = (key: string) => {
    const colors: Record<string, string> = {
        recovery: '#34d399', // emerald-400
        strain: '#3b82f6',   // blue-500
        sleep: '#818cf8',    // indigo-400
        hrv: '#fbbf24',      // amber-400
        resting_hr: '#f472b6', // pink-400
        spo2: '#ef4444',     // red-500
        respiratory_rate: '#14b8a6', // teal-500
        skin_temp: '#f97316', // orange-500
        calories: '#a855f7'  // purple-500
    }
    return colors[key] || '#9ca3af'
}
