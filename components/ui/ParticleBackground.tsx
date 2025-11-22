'use client'

import { useEffect, useRef } from 'react'

interface ParticleBackgroundProps {
    particleCount?: number
    accentColor?: string
    variant?: 'magnetic' | 'swirl'
}

import { useTheme } from 'next-themes'

export default function ParticleBackground({
    particleCount = 1200,
    accentColor = '#00FF8F',
    variant = 'magnetic',
}: ParticleBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 })
    const scrollRef = useRef({ y: 0, targetY: 0 })
    const { theme } = useTheme()

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let width = 0
        let height = 0
        let animationFrameId: number

        // Configuration
        const PARTICLE_COUNT = particleCount
        const FOCAL_LENGTH = 800
        const DEPTH = 2000
        const BASE_SIZE = 1.5
        const MAGNETIC_RADIUS = variant === 'swirl' ? 400 : 1200
        const MAGNETIC_RADIUS_SQ = MAGNETIC_RADIUS * MAGNETIC_RADIUS
        const MAGNETIC_FORCE = 0.5

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

            constructor() {
                // Random point in a sphere
                const theta = Math.random() * Math.PI * 2
                const phi = Math.acos((Math.random() * 2) - 1)
                const r = Math.cbrt(Math.random()) * 1000 // Cube root for uniform distribution

                this.baseX = r * Math.sin(phi) * Math.cos(theta)
                this.baseY = r * Math.sin(phi) * Math.sin(theta)
                this.baseZ = r * Math.cos(phi)

                this.x = this.baseX
                this.y = this.baseY
                this.z = this.baseZ

                this.size = Math.random() * BASE_SIZE + 0.5

                // Color palette: White/Grey with subtle accent
                if (Math.random() > 0.9) {
                    this.color = accentColor
                    this.isAccent = true
                } else {
                    const v = Math.floor(Math.random() * 100 + 155)
                    this.color = `rgb(${v}, ${v}, ${v})`
                }
            }

            update(cosY: number, sinY: number, cosX: number, sinX: number, scrollZ: number) {
                // 1. Apply Rotation (Pre-calculated matrices)
                // Rotate around Y axis
                let x1 = this.baseX * cosY - this.baseZ * sinY
                let z1 = this.baseZ * cosY + this.baseX * sinY

                // Rotate around X axis
                let y1 = this.baseY * cosX - z1 * sinX
                let z2 = z1 * cosX + this.baseY * sinX

                // 2. Apply Scroll (Fly through)
                // Move particles towards camera based on scroll
                z2 -= scrollZ * 2 // Speed factor

                // Wrap around Z
                const zRange = DEPTH
                while (z2 < -FOCAL_LENGTH + 100) z2 += zRange
                while (z2 > zRange - FOCAL_LENGTH + 100) z2 -= zRange

                // 3. Magnetic Interaction (Screen Space)
                // Project current position to screen space to check distance
                const scale = FOCAL_LENGTH / (FOCAL_LENGTH + z2)
                const screenX = width / 2 + x1 * scale
                const screenY = height / 2 + y1 * scale

                const dx = mouseRef.current.targetX - screenX
                const dy = mouseRef.current.targetY - screenY
                const distSq = dx * dx + dy * dy

                let forceX = 0
                let forceY = 0

                if (distSq < MAGNETIC_RADIUS_SQ) {
                    const dist = Math.sqrt(distSq)
                    const force = (1 - dist / MAGNETIC_RADIUS) * MAGNETIC_FORCE

                    if (variant === 'swirl') {
                        // Orbital force (perpendicular to direction)
                        forceX = -dy * force * 2
                        forceY = dx * force * 2
                        // Slight attraction to keep them in orbit
                        forceX += dx * force * 0.5
                        forceY += dy * force * 0.5
                    } else {
                        // Magnetic attraction
                        forceX = dx * force
                        forceY = dy * force
                    }
                }

                // Spring physics for magnetic offset
                this.vx += (forceX - this.magX) * 0.1
                this.vy += (forceY - this.magY) * 0.1

                this.vx *= 0.8 // Damping
                this.vy *= 0.8

                this.magX += this.vx
                this.magY += this.vy

                // Apply magnetic offset to world coordinates (scaled inversely to depth to feel consistent)
                // We apply it to x1, y1 so it affects the 3D position
                this.x = x1 + this.magX / scale
                this.y = y1 + this.magY / scale
                this.z = z2
            }

            draw(ctx: CanvasRenderingContext2D, overrideColor?: string) {
                if (!ctx) return

                // Perspective Projection
                const scale = FOCAL_LENGTH / (FOCAL_LENGTH + this.z)

                // Depth of Field / Fog
                // Fade out as they get further or too close
                let alpha = Math.min(1, scale * scale * 0.8)
                if (this.z < -FOCAL_LENGTH + 200) alpha *= 0.1 // Fade out if hitting camera

                if (alpha < 0.01) return

                const x2d = width / 2 + this.x * scale
                const y2d = height / 2 + this.y * scale
                const size = this.size * scale

                ctx.fillStyle = overrideColor || this.color
                ctx.globalAlpha = alpha

                // Optimization: Use fillRect instead of arc for tiny particles
                // It's significantly faster to rasterize
                ctx.fillRect(x2d - size / 2, y2d - size / 2, size, size)
            }
        }

        let particles: Particle[] = []

        const init = () => {
            width = window.innerWidth
            height = window.innerHeight

            // Handle Pixel Ratio for crisp rendering
            const dpr = window.devicePixelRatio || 1
            canvas.width = width * dpr
            canvas.height = height * dpr
            ctx.scale(dpr, dpr)
            canvas.style.width = `${width}px`
            canvas.style.height = `${height}px`

            // Center magnetic point initially
            mouseRef.current.targetX = width / 2
            mouseRef.current.targetY = height / 2

            particles = []
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                particles.push(new Particle())
            }
        }

        // Smooth damping for mouse and scroll
        // Start with rotation already active for immediate movement
        let currentRotX = 0
        let currentRotY = Math.PI * 0.1 // Start with initial rotation for immediate movement
        let currentScroll = 0

        const animate = () => {
            if (!ctx) return
            ctx.clearRect(0, 0, width, height)

            // Smooth Interpolation
            // Mouse -> Rotation (additive on top of continuous rotation)
            const mouseRotY = (mouseRef.current.targetX / width - 0.5) * 0.2
            const targetRotX = (mouseRef.current.targetY / height - 0.5) * 0.2

            currentRotX += (targetRotX - currentRotX) * 0.05
            // Add mouse interaction to base rotation, allowing smooth interpolation
            const baseRotY = Math.PI * 0.1 // Base rotation offset
            currentRotY += (baseRotY + mouseRotY - currentRotY) * 0.05

            // Scroll -> Z movement
            currentScroll += (scrollRef.current.targetY - currentScroll) * 0.05

            // Pre-calculate rotation matrices once per frame
            const cosY = Math.cos(currentRotY)
            const sinY = Math.sin(currentRotY)
            const cosX = Math.cos(currentRotX)
            const sinX = Math.sin(currentRotX)

            // Calculate dynamic color based on scroll
            // Scroll 0 -> Hue 160 (Green/Cyan)
            // Scroll 1000 -> Hue 260 (Purple)
            // Scroll 2000 -> Hue 320 (Pink)
            const scrollHueShift = (currentScroll * 0.1) % 360
            const baseHue = 160 + scrollHueShift

            // Auto-rotation (idle) - enhanced speed for visible rotation from start
            const time = Date.now() * 0.00015 // Slightly faster rotation
            const autoRotY = currentRotY + time

            // Pre-calc auto rotation if needed, but here we mix mouse and auto
            // Let's just add time to the Y rotation for the matrix
            const finalCosY = Math.cos(autoRotY)
            const finalSinY = Math.sin(autoRotY)

            const isLightMode = theme === 'light' || theme === undefined

            particles.forEach(p => {
                // Pass pre-calculated values
                p.update(finalCosY, finalSinY, cosX, sinX, currentScroll)

                // Dynamic color override
                // We use the particle's original random variation but shift the hue
                let pColor;
                if (p.isAccent) {
                    pColor = `hsl(${baseHue}, 100%, 60%)`
                } else {
                    // Darker particles in light mode (lightness 30%), lighter in dark mode (lightness 80%)
                    const lightness = isLightMode ? '30%' : '80%'
                    pColor = `hsl(${baseHue}, 20%, ${lightness})`
                }

                p.draw(ctx, pColor)
            })

            ctx.globalAlpha = 1
            animationFrameId = requestAnimationFrame(animate)
        }

        // Throttle functions to reduce update frequency
        let resizeTimeout: NodeJS.Timeout
        let scrollTimeout: NodeJS.Timeout

        const handleResize = () => {
            clearTimeout(resizeTimeout)
            resizeTimeout = setTimeout(() => init(), 150)
        }

        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current.targetX = e.clientX
            mouseRef.current.targetY = e.clientY
        }

        let lastScrollY = 0
        const handleScroll = () => {
            const currentScrollY = window.scrollY
            // Only update if scroll change is significant (reduces unnecessary updates)
            if (Math.abs(currentScrollY - lastScrollY) > 2) {
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
            clearTimeout(scrollTimeout)
            window.removeEventListener('resize', handleResize)
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('scroll', handleScroll)
            cancelAnimationFrame(animationFrameId)
        }
    }, [particleCount, accentColor, variant, theme])

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
        />
    )
}
