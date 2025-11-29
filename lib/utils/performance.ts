/**
 * Performance utilities for smoother interactions
 */

/**
 * Throttle function calls using requestAnimationFrame
 */
export function rafThrottle<T extends (...args: any[]) => any>(fn: T): T {
  let rafId: number | null = null
  let lastArgs: Parameters<T>

  return ((...args: Parameters<T>) => {
    lastArgs = args
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        fn(...lastArgs)
        rafId = null
      })
    }
  }) as T
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T {
  let timeoutId: NodeJS.Timeout | null = null

  return ((...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delay)
  }) as T
}

/**
 * Use passive event listeners for better scroll performance
 */
export function addPassiveEventListener(
  element: HTMLElement | Window,
  event: string,
  handler: EventListener,
  options: AddEventListenerOptions = {}
) {
  const passiveOptions = { passive: true, ...options }
  element.addEventListener(event, handler, passiveOptions)
  return () => element.removeEventListener(event, handler, passiveOptions)
}

/**
 * Check if device supports hardware acceleration
 */
export function supportsHardwareAcceleration(): boolean {
  if (typeof window === 'undefined') return false
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
  return !!gl
}





