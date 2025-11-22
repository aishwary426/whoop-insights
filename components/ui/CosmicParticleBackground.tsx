'use client'

import { useEffect, useRef } from 'react'

interface CosmicParticleBackgroundProps {
    particleCount?: number
}

export default function CosmicParticleBackground({
    particleCount = 200
}: CosmicParticleBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let width = window.innerWidth
        let height = window.innerHeight
        let animationFrameId: number
        let time = 0

        const resize = () => {
            width = window.innerWidth
            height = window.innerHeight
            canvas.width = width
            canvas.height = height
        }
        resize()
        window.addEventListener('resize', resize)

        interface Particle {
            x: number
            y: number
            vx: number
            vy: number
            size: number
            opacity: number
            angle: number
            speed: number
            life: number // 0 to 1, decreases as particle falls
        }

        const neonGreen = { r: 0, g: 255, b: 143 }
        const circleX = width / 2
        const circleY = height * 0.2 // Top area
        const circleRadius = 80

        const particles: Particle[] = []

        // Function to create new particles from the circle
        const createParticle = () => {
            const angle = Math.random() * Math.PI * 2
            const speed = 0.5 + Math.random() * 1.5
            const distance = circleRadius + Math.random() * 20
            
            particles.push({
                x: circleX + Math.cos(angle) * distance,
                y: circleY + Math.sin(angle) * distance,
                vx: Math.cos(angle) * speed * 0.3, // Horizontal spread
                vy: 0.5 + Math.random() * 1.5, // Downward velocity
                size: 2 + Math.random() * 3,
                opacity: 0.8 + Math.random() * 0.2,
                angle: angle,
                speed: speed,
                life: 1.0
            })
        }

        const animate = () => {
            time += 0.016

            // Clear canvas with fade trail
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
            ctx.fillRect(0, 0, width, height)

            // Create new particles periodically
            if (particles.length < particleCount && Math.random() < 0.3) {
                createParticle()
            }

            // Draw the neon green circle
            const circleGlow = ctx.createRadialGradient(
                circleX, circleY, 0,
                circleX, circleY, circleRadius * 2
            )
            circleGlow.addColorStop(0, 'rgba(0, 255, 143, 0.6)')
            circleGlow.addColorStop(0.5, 'rgba(0, 255, 143, 0.3)')
            circleGlow.addColorStop(1, 'rgba(0, 255, 143, 0)')
            
            ctx.fillStyle = circleGlow
            ctx.beginPath()
            ctx.arc(circleX, circleY, circleRadius * 2, 0, Math.PI * 2)
            ctx.fill()

            // Main circle
            ctx.fillStyle = 'rgba(0, 255, 143, 0.8)'
            ctx.beginPath()
            ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2)
            ctx.fill()

            // Inner glow
            ctx.fillStyle = 'rgba(0, 255, 143, 1)'
            ctx.beginPath()
            ctx.arc(circleX, circleY, circleRadius * 0.6, 0, Math.PI * 2)
            ctx.fill()

            // Update and draw particles
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i]

                // Update position
                p.x += p.vx
                p.y += p.vy

                // Increase downward velocity (gravity effect)
                p.vy += 0.05

                // Decrease life as particle falls
                p.life -= 0.008

                // Decrease size as it disintegrates
                p.size *= 0.998

                // Decrease opacity as it disintegrates
                p.opacity = p.life * 0.8

                // Remove dead particles
                if (p.life <= 0 || p.y > height + 50 || p.size < 0.1) {
                    particles.splice(i, 1)
                    continue
                }

                // Draw particle with glow
                const glowRadius = p.size * 2
                const glowGradient = ctx.createRadialGradient(
                    p.x, p.y, 0,
                    p.x, p.y, glowRadius
                )
                glowGradient.addColorStop(0, `rgba(${neonGreen.r}, ${neonGreen.g}, ${neonGreen.b}, ${p.opacity * 0.6})`)
                glowGradient.addColorStop(0.5, `rgba(${neonGreen.r}, ${neonGreen.g}, ${neonGreen.b}, ${p.opacity * 0.2})`)
                glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

                ctx.fillStyle = glowGradient
                ctx.beginPath()
                ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2)
                ctx.fill()

                // Main particle
                ctx.globalAlpha = p.opacity
                ctx.fillStyle = `rgb(${neonGreen.r}, ${neonGreen.g}, ${neonGreen.b})`
                ctx.beginPath()
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
                ctx.fill()
            }

            ctx.globalAlpha = 1

            animationFrameId = requestAnimationFrame(animate)
        }

        animate()

        return () => {
            window.removeEventListener('resize', resize)
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId)
            }
        }
    }, [particleCount])

    return (
        <div className="fixed inset-0 -z-0 pointer-events-none" style={{
            background: 'rgba(0, 0, 0, 1)'
        }}>
            <canvas
                ref={canvasRef}
                className="absolute inset-0"
                style={{
                    width: '100%',
                    height: '100%'
                }}
            />
        </div>
    )
}
