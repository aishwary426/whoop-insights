'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'

interface ParticleBackgroundProps {
    particleCount?: number
    accentColor?: string
    variant?: 'magnetic' | 'swirl'
    isMobile?: boolean
}

export default function ParticleBackground({
    particleCount, // Allow override, but default will be dynamic
    accentColor,
    variant = 'magnetic',
    isMobile = false,
}: ParticleBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 })
    const scrollRef = useRef({ y: 0, targetY: 0 })
    const { theme } = useTheme()
    const effectiveAccentColor = accentColor || (theme === 'dark' ? '#00FF8F' : '#3B82F6')

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true }) // Optimize context
        if (!ctx) return

        let width = 0
        let height = 0
        let animationFrameId: number

        // Configuration - Performance Optimized
        // Reduce default particle count significantly for better performance
        const DEFAULT_COUNT = isMobile ? 60 : 200
        const PARTICLE_COUNT = particleCount || DEFAULT_COUNT
        
        const FOCAL_LENGTH = 800
        const DEPTH = 2000
        const BASE_SIZE = 2.0
        const MAGNETIC_RADIUS = variant === 'swirl' ? 400 : 1200
        const MAGNETIC_RADIUS_SQ = MAGNETIC_RADIUS * MAGNETIC_RADIUS
        const MAGNETIC_FORCE = 0.7 

        // Spatial Grid for optimized connections
        const GRID_SIZE = 150
        let grid: Map<string, Particle[]> = new Map()

        // Pre-calculate colors
        const isLightMode = theme === 'light' || theme === undefined
        const accentColors = isLightMode 
            ? ['#3B82F6', '#2563EB', '#1D4ED8', '#60A5FA']
            : [`hsl(160, 100%, 60%)`, `hsl(170, 100%, 60%)`, `hsl(150, 100%, 60%)`] // Simple static HSL for perf
            
        const baseColors = isLightMode
            ? ['#000000', '#0A0A0A', '#1A1A1A', '#2A2A2A', '#1F1F1F']
            : [`hsl(160, 20%, 80%)`, `hsl(170, 20%, 80%)`]

        class Particle {
            x: number
            y: number
            z: number
            baseX: number
            baseY: number
            baseZ: number
            size: number
            color: string

            // Magnetic Physics
            magX: number = 0
            magY: number = 0
            vx: number = 0
            vy: number = 0
            isAccent: boolean = false

            // Screen coordinates (cached for connections)
            screenX: number = 0
            screenY: number = 0
            scale: number = 0
            visible: boolean = false

            constructor() {
                // Random point in a sphere
                const theta = Math.random() * Math.PI * 2
                const phi = Math.acos((Math.random() * 2) - 1)
                const r = Math.cbrt(Math.random()) * 1000 

                this.baseX = r * Math.sin(phi) * Math.cos(theta)
                this.baseY = r * Math.sin(phi) * Math.sin(theta)
                this.baseZ = r * Math.cos(phi)

                this.x = this.baseX
                this.y = this.baseY
                this.z = this.baseZ

                this.size = Math.random() * BASE_SIZE + 0.5

                // Color palette
                if (Math.random() > 0.85) {
                    this.color = accentColors[Math.floor(Math.random() * accentColors.length)]
                    this.isAccent = true
                } else {
                    this.color = baseColors[Math.floor(Math.random() * baseColors.length)]
                }
            }

            update(cosY: number, sinY: number, cosX: number, sinX: number, scrollZ: number) {
                // 1. Apply Rotation
                let x1 = this.baseX * cosY - this.baseZ * sinY
                let z1 = this.baseZ * cosY + this.baseX * sinY

                let y1 = this.baseY * cosX - z1 * sinX
                let z2 = z1 * cosX + this.baseY * sinX

                // 2. Apply Scroll
                z2 -= scrollZ * 2 

                // Wrap around Z
                const zRange = DEPTH
                while (z2 < -FOCAL_LENGTH + 100) z2 += zRange
                while (z2 > zRange - FOCAL_LENGTH + 100) z2 -= zRange

                // 3. Magnetic Interaction
                const scale = FOCAL_LENGTH / (FOCAL_LENGTH + z2)
                const screenX = width / 2 + x1 * scale
                const screenY = height / 2 + y1 * scale

                // Optimization: Only calculate magnetic force if mouse is somewhat close or if there's residual velocity
                // But we need screen coordinates for drawing anyway
                
                // Cache screen coords for drawing and connections
                this.screenX = screenX
                this.screenY = screenY
                this.scale = scale
                this.visible = z2 > -FOCAL_LENGTH + 100 && scale > 0

                if (!this.visible) return

                const dx = mouseRef.current.targetX - screenX
                const dy = mouseRef.current.targetY - screenY
                
                // Quick bounding box check before square root
                if (Math.abs(dx) < MAGNETIC_RADIUS && Math.abs(dy) < MAGNETIC_RADIUS) {
                    const distSq = dx * dx + dy * dy
                    
                    if (distSq < MAGNETIC_RADIUS_SQ) {
                        const dist = Math.sqrt(distSq)
                        const force = (1 - dist / MAGNETIC_RADIUS) * MAGNETIC_FORCE
                        
                        let forceX = 0
                        let forceY = 0

                        if (variant === 'swirl') {
                            forceX = -dy * force * 2 + dx * force * 0.5
                            forceY = dx * force * 2 + dy * force * 0.5
                        } else {
                            forceX = dx * force
                            forceY = dy * force
                        }

                        this.vx += (forceX - this.magX) * 0.1
                        this.vy += (forceY - this.magY) * 0.1
                    }
                }

                this.vx *= 0.8 
                this.vy *= 0.8

                this.magX += this.vx
                this.magY += this.vy

                // Apply magnetic offset
                this.x = x1 + this.magX / scale
                this.y = y1 + this.magY / scale
                this.z = z2
                
                // Update screen coords with magnetic offset
                this.screenX = width / 2 + this.x * scale
                this.screenY = height / 2 + this.y * scale
            }

            draw(ctx: CanvasRenderingContext2D) {
                if (!this.visible) return

                // Depth of Field / Fog
                let alpha = Math.min(1, this.scale * this.scale * 0.8)
                if (this.z < -FOCAL_LENGTH + 200) alpha *= 0.1 

                if (alpha < 0.05) return // Aggressive culling

                const size = this.size * this.scale

                ctx.fillStyle = this.color
                ctx.globalAlpha = alpha

                ctx.beginPath()
                ctx.arc(this.screenX, this.screenY, size / 2, 0, Math.PI * 2)
                ctx.fill()
            }
        }

        let particles: Particle[] = []

        const init = () => {
            width = window.innerWidth
            height = window.innerHeight

            const dpr = isMobile ? 1 : (window.devicePixelRatio || 1)
            canvas.width = width * dpr
            canvas.height = height * dpr
            ctx.scale(dpr, dpr)
            canvas.style.width = `${width}px`
            canvas.style.height = `${height}px`

            mouseRef.current.targetX = width / 2
            mouseRef.current.targetY = height / 2

            particles = []
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                particles.push(new Particle())
            }
        }

        let currentRotX = 0
        let currentRotY = Math.PI * 0.1 
        let currentScroll = 0

        const animate = () => {
            if (!ctx) return
            ctx.clearRect(0, 0, width, height)

            // Smooth Interpolation
            const mouseRotY = (mouseRef.current.targetX / width - 0.5) * 0.2
            const targetRotX = (mouseRef.current.targetY / height - 0.5) * 0.2

            currentRotX += (targetRotX - currentRotX) * 0.05
            const baseRotY = Math.PI * 0.1 
            currentRotY += (baseRotY + mouseRotY - currentRotY) * 0.05
            currentScroll += (scrollRef.current.targetY - currentScroll) * 0.05

            const cosY = Math.cos(currentRotY)
            const sinY = Math.sin(currentRotY)
            const cosX = Math.cos(currentRotX)
            const sinX = Math.sin(currentRotX)

            const time = Date.now() * 0.00025 
            const autoRotY = currentRotY + time
            const finalCosY = Math.cos(autoRotY)
            const finalSinY = Math.sin(autoRotY)

            // Reset grid
            grid.clear()

            particles.forEach(p => {
                p.update(finalCosY, finalSinY, cosX, sinX, currentScroll)

                if (p.visible) {
                    // Add to grid for connections
                    const gridX = Math.floor(p.screenX / GRID_SIZE)
                    const gridY = Math.floor(p.screenY / GRID_SIZE)
                    const key = `${gridX},${gridY}`
                    
                    if (!grid.has(key)) grid.set(key, [])
                    grid.get(key)!.push(p)

                    // Draw
                    p.draw(ctx)
                }
            })

            // Draw connections using Spatial Grid
            ctx.lineWidth = 0.3
            const CONNECT_DISTANCE = 120 // Reduced
            const CONNECT_DISTANCE_SQ = CONNECT_DISTANCE * CONNECT_DISTANCE

            // Only connect a subset of particles to keep it fast
            // We iterate through grid cells that have particles
            
            // Limit total connections per frame to avoid spikes
            let connectionsDrawn = 0
            const MAX_CONNECTIONS = isMobile ? 50 : 150

            for (const [key, cellParticles] of Array.from(grid.entries())) {
                if (connectionsDrawn > MAX_CONNECTIONS) break

                const [gx, gy] = key.split(',').map(Number)

                // Check neighbor cells (including current)
                // We only need to check half of the neighbors to avoid duplicates if we were iterating all pairs,
                // but since we are iterating grid cells, it's safer to check neighbors.
                // To optimize, we can just check current cell + right + bottom + bottom-right + bottom-left
                const neighborKeys = [
                    `${gx},${gy}`,
                    `${gx + 1},${gy}`,
                    `${gx},${gy + 1}`,
                    `${gx + 1},${gy + 1}`,
                    `${gx - 1},${gy + 1}`
                ]

                for (const p1 of cellParticles) {
                    if (connectionsDrawn > MAX_CONNECTIONS) break
                    
                    // Only connect if it's an accent particle or random chance (optimization)
                    if (!p1.isAccent && Math.random() > 0.05) continue

                    for (const nKey of neighborKeys) {
                        const neighbors = grid.get(nKey)
                        if (!neighbors) continue

                        for (const p2 of neighbors) {
                            if (p1 === p2) continue

                            const dx = p1.screenX - p2.screenX
                            const dy = p1.screenY - p2.screenY
                            
                            // Fast check
                            if (Math.abs(dx) > CONNECT_DISTANCE || Math.abs(dy) > CONNECT_DISTANCE) continue

                            const distSq = dx * dx + dy * dy

                            if (distSq < CONNECT_DISTANCE_SQ) {
                                const alpha = (1 - distSq / CONNECT_DISTANCE_SQ) * 0.15
                                if (alpha > 0.02) {
                                    ctx.beginPath()
                                    ctx.strokeStyle = isLightMode ? `rgba(0,0,0,${alpha})` : `rgba(255,255,255,${alpha})`
                                    ctx.moveTo(p1.screenX, p1.screenY)
                                    ctx.lineTo(p2.screenX, p2.screenY)
                                    ctx.stroke()
                                    connectionsDrawn++
                                }
                            }
                        }
                    }
                }
            }

            ctx.globalAlpha = 1
            animationFrameId = requestAnimationFrame(animate)
        }

        let resizeTimeout: NodeJS.Timeout
        const handleResize = () => {
            clearTimeout(resizeTimeout)
            resizeTimeout = setTimeout(() => init(), 200) // Increased debounce
        }

        const handleMouseMove = (e: MouseEvent) => {
            // No heavy logic here, just update ref
            mouseRef.current.targetX = e.clientX
            mouseRef.current.targetY = e.clientY
        }

        let lastScrollY = 0
        const handleScroll = () => {
            const currentScrollY = window.scrollY
            if (Math.abs(currentScrollY - lastScrollY) > 5) { // Increased threshold
                lastScrollY = currentScrollY
                scrollRef.current.targetY = currentScrollY
            }
        }

        window.addEventListener('resize', handleResize, { passive: true })
        window.addEventListener('mousemove', handleMouseMove, { passive: true })
        window.addEventListener('scroll', handleScroll, { passive: true })

        init()
        animate()

        return () => {
            clearTimeout(resizeTimeout)
            window.removeEventListener('resize', handleResize)
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('scroll', handleScroll)
            cancelAnimationFrame(animationFrameId)
        }
    }, [particleCount, effectiveAccentColor, variant, theme, isMobile])

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
        />
    )
}
