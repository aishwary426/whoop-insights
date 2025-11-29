export const formatShortDate = (date: Date | string): string => {
    const d = new Date(date)
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })
}

export const formatWeekday = (date: Date | string): string => {
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { weekday: 'short' })
}

export const formatDayWeekday = (date: Date | string, isMobile: boolean = false): string => {
    const d = new Date(date)
    const day = d.getDate()
    const weekday = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
    return isMobile ? `${day}` : `${day}/ ${weekday}`
}

export const formatFullDate = (date: Date | string): string => {
    const d = new Date(date)
    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    })
}

export const getRelativeDateLabel = (dateStr: string): string => {
    if (!dateStr) return 'Today'
    
    // Parse YYYY-MM-DD manually to ensure we work with local date components
    // and avoid timezone shifts that happen with new Date(string)
    const parts = dateStr.split('-')
    if (parts.length !== 3) return 'Today'
    
    const year = parseInt(parts[0])
    const month = parseInt(parts[1]) - 1 // Months are 0-indexed
    const day = parseInt(parts[2])
    
    const dateObj = new Date(year, month, day)
    const today = new Date()
    
    // Reset times to compare dates only
    dateObj.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)
    
    if (dateObj.getTime() === today.getTime()) {
        return 'Today'
    }
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (dateObj.getTime() === yesterday.getTime()) {
        return 'Yesterday'
    }
    
    return formatShortDate(dateStr)
}
