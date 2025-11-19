'use client'

import { useEffect, useRef } from 'react'

interface ParticleBackgroundProps {
    particleCount?: number
    baseSpeed?: number
    accentColor?: string
}

export default function ParticleBackground({
    particleCount = 100,
    baseSpeed = 0.2,
    accentColor = '#00FF8F',
}: ParticleBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let animationFrameId: number
        let particles: Particle[] = []
        let width = 0
        let height = 0

        // Mouse state
        let mouseX = 0
        let mouseY = 0
        let targetMouseX = 0
        let targetMouseY = 0

        class Particle {
            x: number
            y: number
            z: number
            baseX: number
            baseY: number
            size: number
            color: string
            speed: number
            angle: number
            radius: number

            constructor() {
                this.x = Math.random() * width
                this.y = Math.random() * height
                this.z = Math.random() * 2 // Depth factor
                this.baseX = this.x
                this.baseY = this.y
                this.size = Math.random() * 1.5 + 0.5

                // 15% chance of being neon, otherwise white/grey
                const isNeon = Math.random() < 0.15
                this.color = isNeon ? accentColor : `rgba(255, 255, 255, ${Math.random() * 0.3 + 0.1})`

                this.speed = baseSpeed * (Math.random() * 0.5 + 0.5)
                this.angle = Math.random() * Math.PI * 2
                this.radius = Math.random() * 100 + 50 // Orbit radius for some movement
            }

            update() {
                // Gentle drift
                this.angle += this.speed * 0.01

                // Mouse parallax
                const dx = (mouseX - width / 2) * 0.05 * this.z
                const dy = (mouseY - height / 2) * 0.05 * this.z

                this.x = this.baseX + Math.cos(this.angle) * 20 + dx
                this.y = this.baseY + Math.sin(this.angle) * 20 + dy

                // Wrap around screen
                if (this.x < -50) this.baseX += width + 100
                if (this.x > width + 50) this.baseX -= width + 100
                if (this.y < -50) this.baseY += height + 100
                if (this.y > height + 50) this.baseY -= height + 100
            }

            draw() {
                if (!ctx) return
                ctx.beginPath()
                ctx.arc(this.x, this.y, this.size * (this.z * 0.5 + 0.5), 0, Math.PI * 2)
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
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle())
            }
        }

        const animate = () => {
            if (!ctx) return
            ctx.clearRect(0, 0, width, height)

            // Smooth mouse interpolation
            mouseX += (targetMouseX - mouseX) * 0.1
            mouseY += (targetMouseY - mouseY) * 0.1

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
            targetMouseX = e.clientX
            targetMouseY = e.clientY
        }

        window.addEventListener('resize', handleResize)
        window.addEventListener('mousemove', handleMouseMove)

        init()
        animate()

        return () => {
            window.removeEventListener('resize', handleResize)
            window.removeEventListener('mousemove', handleMouseMove)
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
