import { useState, useEffect, useMemo } from 'react'

interface PerformanceMode {
  isLowEnd: boolean
  isMobile: boolean
  reduceAnimations: boolean
  reduceCharts: boolean
  reduceDataPoints: boolean
}

const MOBILE_BREAKPOINT = 768
const LOW_END_THRESHOLD = {
  // Hardware concurrency (CPU cores)
  cores: 4,
  // Device memory (GB) - if available
  memory: 4,
  // Connection speed estimate
  connection: '4g',
}

export function usePerformanceMode(): PerformanceMode {
  const [isMobile, setIsMobile] = useState(false)
  const [isLowEnd, setIsLowEnd] = useState(false)
  const [hardwareInfo, setHardwareInfo] = useState({
    cores: 4,
    memory: 4,
    connection: '4g',
  })

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return
    }

    // Check mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    checkMobile()

    // Check hardware
    const checkHardware = () => {
      const cores = navigator.hardwareConcurrency || 4
      const memory = (navigator as any).deviceMemory || 4
      const connection = (navigator as any).connection?.effectiveType || '4g'
      
      setHardwareInfo({ cores, memory, connection })
      
      // Determine if low-end device
      const lowEnd = 
        cores <= LOW_END_THRESHOLD.cores ||
        memory <= LOW_END_THRESHOLD.memory ||
        connection === 'slow-2g' ||
        connection === '2g' ||
        connection === '3g' ||
        // Check for mobile user agent
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      
      setIsLowEnd(lowEnd)
    }
    
    checkHardware()

    // Listen for connection changes
    const connection = (navigator as any).connection
    if (connection) {
      connection.addEventListener('change', checkHardware)
    }

    // Listen for resize
    let resizeTimeout: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(checkMobile, 100)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (connection) {
        connection.removeEventListener('change', checkHardware)
      }
      clearTimeout(resizeTimeout)
    }
  }, [])

  // More aggressive performance mode - reduce animations by default for better performance
  return useMemo(() => ({
    isLowEnd,
    isMobile,
    reduceAnimations: true, // Disable heavy animations by default for better performance
    reduceCharts: isLowEnd,
    reduceDataPoints: isLowEnd || isMobile,
  }), [isLowEnd, isMobile])
}

