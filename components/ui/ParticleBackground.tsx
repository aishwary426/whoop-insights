'use client'

import { useEffect, useRef } from 'react'

interface ParticleBackgroundProps {
    particleCount?: number
    accentColor?: string
    variant?: 'magnetic' | 'swirl'
}

export default function ParticleBackground({
    accentColor = '#00FF8F',
    variant = 'magnetic',
}: ParticleBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 })
    const scrollRef = useRef({ y: 0, targetY: 0 })

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let width = 0
        let height = 0
        let animationFrameId: number

        // Configuration
        const PARTICLE_COUNT = 2000
        const FOCAL_LENGTH = 800
        const DEPTH = 2000
        const BASE_SIZE = 1.5
        const MAGNETIC_RADIUS = variant === 'swirl' ? 400 : 1200
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

            update(rotationX: number, rotationY: number, scrollZ: number) {
                // 1. Apply Rotation (Mouse Parallax)
                // Rotate around Y axis
                let x1 = this.baseX * Math.cos(rotationY) - this.baseZ * Math.sin(rotationY)
                let z1 = this.baseZ * Math.cos(rotationY) + this.baseX * Math.sin(rotationY)

                // Rotate around X axis
                let y1 = this.baseY * Math.cos(rotationX) - z1 * Math.sin(rotationX)
                let z2 = z1 * Math.cos(rotationX) + this.baseY * Math.sin(rotationX)

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
                const dist = Math.sqrt(dx * dx + dy * dy)

                let forceX = 0
                let forceY = 0

                if (dist < MAGNETIC_RADIUS) {
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

                ctx.fillStyle = overrideColor || this.color
                ctx.globalAlpha = alpha
                ctx.beginPath()
                ctx.arc(x2d, y2d, this.size * scale, 0, Math.PI * 2)
                ctx.fill()
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
        let currentRotX = 0
        let currentRotY = 0
        let currentScroll = 0

        const animate = () => {
            if (!ctx) return
            ctx.clearRect(0, 0, width, height)

            // Smooth Interpolation
            // Mouse -> Rotation
            const targetRotY = (mouseRef.current.targetX / width - 0.5) * 0.2
            const targetRotX = (mouseRef.current.targetY / height - 0.5) * 0.2

            currentRotX += (targetRotX - currentRotX) * 0.05
            currentRotY += (targetRotY - currentRotY) * 0.05

            // Scroll -> Z movement
            currentScroll += (scrollRef.current.targetY - currentScroll) * 0.05

            // Calculate dynamic color based on scroll
            // Scroll 0 -> Hue 160 (Green/Cyan)
            // Scroll 1000 -> Hue 260 (Purple)
            // Scroll 2000 -> Hue 320 (Pink)
            const scrollHueShift = (currentScroll * 0.1) % 360
            const baseHue = 160 + scrollHueShift

            // Auto-rotation (idle)
            const time = Date.now() * 0.0001
            const autoRotY = currentRotY + time

            particles.forEach(p => {
                p.update(currentRotX, autoRotY, currentScroll)

                // Dynamic color override
                // We use the particle's original random variation but shift the hue
                const pColor = p.isAccent
                    ? `hsl(${baseHue}, 100%, 60%)`
                    : `hsl(${baseHue}, 20%, 80%)`

                p.draw(ctx, pColor)
            })

            ctx.globalAlpha = 1
            animationFrameId = requestAnimationFrame(animate)
        }

        const handleResize = () => init()

        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current.targetX = e.clientX
            mouseRef.current.targetY = e.clientY
        }

        const handleScroll = () => {
            scrollRef.current.targetY = window.scrollY
        }

        window.addEventListener('resize', handleResize)
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('scroll', handleScroll)

        init()
        animate()

        return () => {
            window.removeEventListener('resize', handleResize)
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('scroll', handleScroll)
            cancelAnimationFrame(animationFrameId)
        }
    }, [accentColor])

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-0 pointer-events-none"
        />
    )
}
