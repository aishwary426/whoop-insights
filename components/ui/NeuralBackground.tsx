'use client'

import { useEffect, useRef } from 'react'

interface NeuralBackgroundProps {
    particleCount?: number
    connectionDistance?: number
    baseColor?: string
    accentColor?: string
}

export default function NeuralBackground({
    particleCount = 80,
    connectionDistance = 150,
    baseColor = 'rgba(255, 255, 255, 0.3)',
    accentColor = 'rgba(67, 97, 238, 0.6)' // Blue
}: NeuralBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let width = window.innerWidth
        let height = window.innerHeight
        let particles: Particle[] = []

        class Particle {
            x: number
            y: number
            vx: number
            vy: number
            size: number
            color: string

            constructor() {
                this.x = Math.random() * width
                this.y = Math.random() * height
                this.vx = (Math.random() - 0.5) * 0.5
                this.vy = (Math.random() - 0.5) * 0.5
                this.size = Math.random() * 2 + 1
                this.color = Math.random() > 0.8 ? accentColor : baseColor
            }

            update() {
                this.x += this.vx
                this.y += this.vy

                // Bounce off edges
                if (this.x < 0 || this.x > width) this.vx *= -1
                if (this.y < 0 || this.y > height) this.vy *= -1
            }

            draw() {
                if (!ctx) return
                ctx.beginPath()
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
                ctx.fillStyle = this.color
                ctx.fill()
            }
        }

        // Handle resize
        const handleResize = () => {
            width = window.innerWidth
            height = window.innerHeight
            canvas.width = width
            canvas.height = height
            initParticles()
        }

        window.addEventListener('resize', handleResize)
        handleResize()

        function initParticles() {
            particles = []
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle())
            }
        }

        function animate() {
            if (!ctx) return
            ctx.clearRect(0, 0, width, height)

            // Update and draw particles
            particles.forEach(p => {
                p.update()
                p.draw()
            })

            // Draw connections
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x
                    const dy = particles[i].y - particles[j].y
                    const dist = Math.sqrt(dx * dx + dy * dy)

                    if (dist < connectionDistance) {
                        ctx.beginPath()
                        ctx.strokeStyle = `rgba(100, 200, 255, ${1 - dist / connectionDistance})`
                        ctx.lineWidth = 0.5
                        ctx.moveTo(particles[i].x, particles[i].y)
                        ctx.lineTo(particles[j].x, particles[j].y)
                        ctx.stroke()
                    }
                }
            }

            requestAnimationFrame(animate)
        }

        initParticles()
        animate()

        return () => {
            window.removeEventListener('resize', handleResize)
        }
    }, [particleCount, connectionDistance, baseColor, accentColor])

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 -z-10 pointer-events-none"
        />
    )
}
