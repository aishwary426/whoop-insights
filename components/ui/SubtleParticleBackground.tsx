'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'

interface SubtleParticleBackgroundProps {
    particleCount?: number
    opacity?: number
    glowIntensity?: number
}

export default function SubtleParticleBackground({
    particleCount = 300,
    opacity = 0.12,
    glowIntensity = 0.2
}: SubtleParticleBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const { theme } = useTheme()

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let width = window.innerWidth
        let height = window.innerHeight
        let animationFrameId: number
        let lastTime = 0
        const targetFPS = 30 // Limit to 30 FPS for better performance
        const frameInterval = 1000 / targetFPS

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
            baseSize: number
        }

        const particles: Particle[] = []
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.2,
                vy: (Math.random() - 0.5) * 0.2,
                size: Math.random() * 1.5 + 0.5,
                baseSize: Math.random() * 1.5 + 0.5
            })
        }

        const animate = (currentTime: number) => {
            // Throttle to target FPS
            if (currentTime - lastTime < frameInterval) {
                animationFrameId = requestAnimationFrame(animate)
                return
            }
            lastTime = currentTime

            ctx.clearRect(0, 0, width, height)

            // Simplified rendering - no expensive shadow blur
            const isLightMode = theme === 'light' || theme === undefined
            const accentColor = isLightMode ? '#3B82F6' : '#00FF8F' // Blue in light, green in dark
            const baseColor = isLightMode ? '#000000' : '#FFFFFF' // Black in light, white in dark

            particles.forEach((p, index) => {
                // Update position with more motion
                p.vx += (Math.random() - 0.5) * 0.01 // Add slight random acceleration
                p.vy += (Math.random() - 0.5) * 0.01
                p.vx *= 0.98 // Slight damping
                p.vy *= 0.98
                
                p.x += p.vx
                p.y += p.vy

                // Wrap around edges
                if (p.x < 0) p.x = width
                if (p.x > width) p.x = 0
                if (p.y < 0) p.y = height
                if (p.y > height) p.y = 0

                // Alternate between accent and base colors
                const useAccent = index % 5 === 0 // 20% accent particles
                const color = useAccent ? accentColor : baseColor

                // Simple particle - no pulsing for better performance
                ctx.globalAlpha = opacity
                ctx.fillStyle = color
                ctx.beginPath()
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
                ctx.fill()

                // Simple glow - just a larger semi-transparent circle
                ctx.globalAlpha = opacity * glowIntensity
                ctx.beginPath()
                ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2)
                ctx.fill()
            })

            ctx.globalAlpha = 1
            animationFrameId = requestAnimationFrame(animate)
        }

        animationFrameId = requestAnimationFrame(animate)

        return () => {
            window.removeEventListener('resize', resize)
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId)
            }
        }
    }, [particleCount, opacity, glowIntensity, theme])

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 -z-0 pointer-events-none"
            style={{
                width: '100%',
                height: '100%',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0
            }}
        />
    )
}

