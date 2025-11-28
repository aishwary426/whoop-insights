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
