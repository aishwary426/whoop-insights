'use client'

import { useEffect, useRef } from 'react'

interface ParticleBackgroundProps {
    particleCount?: number
    baseSpeed?: number
    accentColor?: string
}

/**
 * Renders a field of “planets” that orbit subtly and are magnetically attracted
 * toward the cursor, easing back to their original orbit when the cursor leaves.
 */
export default function ParticleBackground({
    particleCount = 70,
    baseSpeed = 0.15,
    accentColor = '#00FF8F',
}: ParticleBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let animationFrameId: number
        let particles: Planet[] = []
        let width = 0
        let height = 0

        // Magnetic cursor state (smoothed for gentle pull)
        let pointerActive = false
        let pointerX = 0
        let pointerY = 0
        let targetPointerX = 0
        let targetPointerY = 0

        const accentPalette = [accentColor, '#00D8FF']

        class Planet {
            centerX: number
            centerY: number
            orbitRadiusX: number
            orbitRadiusY: number
            angle: number
            orbitSpeed: number
            size: number
            color: string
            magnetism: number
            x: number
            y: number

            constructor() {
                this.centerX = Math.random() * width
                this.centerY = Math.random() * height

                // Slightly elliptical orbits
                const baseOrbit = Math.random() * 120 + 60
                this.orbitRadiusX = baseOrbit * (Math.random() * 0.6 + 0.7)
                this.orbitRadiusY = baseOrbit * (Math.random() * 0.6 + 0.7)

                this.angle = Math.random() * Math.PI * 2
                this.orbitSpeed = baseSpeed * (Math.random() * 0.8 + 0.4)

                this.size = Math.random() * 1.8 + 0.8
                const isAccent = Math.random() < 0.18
                const chosenAccent = accentPalette[Math.floor(Math.random() * accentPalette.length)]
                this.color = isAccent ? chosenAccent : `rgba(255, 255, 255, ${Math.random() * 0.35 + 0.1})`

                this.magnetism = Math.random() * 0.8 + 0.6 // how strongly it reacts to the cursor
                this.x = this.centerX
                this.y = this.centerY
            }

            update() {
                this.angle += this.orbitSpeed * 0.01

                // Home orbit position
                const orbitX = this.centerX + Math.cos(this.angle) * this.orbitRadiusX
                const orbitY = this.centerY + Math.sin(this.angle) * this.orbitRadiusY

                let targetX = orbitX
                let targetY = orbitY

                if (pointerActive) {
                    const dx = pointerX - orbitX
                    const dy = pointerY - orbitY
                    const distSq = dx * dx + dy * dy
                    const dist = Math.sqrt(distSq) || 1

                    // Magnetic pull scales down with distance; capped to keep motion smooth
                    const pull = Math.min(1, (180 * this.magnetism) / (dist + 40))
                    targetX = orbitX + dx * pull
                    targetY = orbitY + dy * pull
                }

                // Ease toward target (orbit or magnetic target)
                this.x += (targetX - this.x) * 0.08
                this.y += (targetY - this.y) * 0.08
            }

            draw() {
                if (!ctx) return
                ctx.beginPath()
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
                ctx.fillStyle = this.color
                ctx.fill()
            }
        }

        const init = () => {
            width = window.innerWidth
            height = window.innerHeight
            canvas.width = width
            canvas.height = height

            particles = []
            const clampedCount = Math.max(40, Math.min(80, Math.floor(particleCount)))
            for (let i = 0; i < clampedCount; i++) {
                particles.push(new Planet())
            }
        }

        const animate = () => {
            if (!ctx) return
            ctx.clearRect(0, 0, width, height)

            // Smooth cursor easing
            pointerX += (targetPointerX - pointerX) * 0.12
            pointerY += (targetPointerY - pointerY) * 0.12

            particles.forEach(p => {
                p.update()
                p.draw()
            })

            animationFrameId = requestAnimationFrame(animate)
        }

        const handleResize = () => {
            init()
        }

        const handleMouseMove = (e: MouseEvent) => {
            pointerActive = true
            targetPointerX = e.clientX
            targetPointerY = e.clientY
        }

        const handleMouseLeave = () => {
            pointerActive = false
        }

        window.addEventListener('resize', handleResize)
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseleave', handleMouseLeave)

        init()
        animate()

        return () => {
            window.removeEventListener('resize', handleResize)
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseleave', handleMouseLeave)
            cancelAnimationFrame(animationFrameId)
        }
    }, [particleCount, baseSpeed, accentColor])

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-0 pointer-events-none"
            style={{ background: 'radial-gradient(circle at 50% 50%, #0A0A0A 0%, #000000 100%)' }}
        />
    )
}
