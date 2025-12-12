'use client'

import { motion, useMotionValue, useMotionTemplate } from 'framer-motion'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export default function CyberGrid() {
    const { theme } = useTheme()
    const [mounted, setMounted] = useState(false)

    // Mouse tracking for magnetic glow
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    useEffect(() => {
        setMounted(true)
        
        // Center the glow initially
        if (typeof window !== 'undefined') {
            mouseX.set(window.innerWidth / 2)
            mouseY.set(window.innerHeight / 2)
        }

        const handleMouseMove = ({ clientX, clientY }: MouseEvent) => {
            mouseX.set(clientX)
            mouseY.set(clientY)
        }

        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [mouseX, mouseY])

    // Determine grid color based on theme - matching website colors
    const isLight = mounted && (theme === 'light')
    
    // Base grid colors: subtle and low opacity
    const baseGridColor = isLight 
        ? 'rgba(0, 102, 255, 0.12)' // Blue for light mode
        : 'rgba(0, 255, 143, 0.1)' // Neon green for dark mode
    
    // Glow grid colors: brighter around cursor (reduced intensity)
    const glowGridColor = isLight 
        ? 'rgba(0, 102, 255, 0.25)' // Brighter blue for light mode
        : 'rgba(0, 255, 143, 0.22)' // Brighter neon green for dark mode

    // Dynamic mask for the magnetic glow effect (smaller radius)
    const maskImage = useMotionTemplate`radial-gradient(400px circle at ${mouseX}px ${mouseY}px, black 30%, transparent 70%)`

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Base Grid - subtle, always visible with vignette */}
            <motion.div
                className="absolute inset-0"
                style={{
                    backgroundSize: '80px 80px',
                    backgroundImage: `
                        linear-gradient(to right, ${baseGridColor} 1px, transparent 1px),
                        linear-gradient(to bottom, ${baseGridColor} 1px, transparent 1px)
                    `,
                    // Vignette effect - fade towards edges
                    maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 100%)',
                    WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 100%)',
                }}
                animate={{
                    backgroundPosition: ['0px 0px', '0px 80px']
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: 'linear'
                }}
            />

            {/* Magnetic Glow Layer - follows cursor */}
            <motion.div
                className="absolute inset-0"
                style={{
                    backgroundSize: '80px 80px',
                    backgroundImage: `
                        linear-gradient(to right, ${glowGridColor} 1px, transparent 1px),
                        linear-gradient(to bottom, ${glowGridColor} 1px, transparent 1px)
                    `,
                    maskImage,
                    WebkitMaskImage: maskImage,
                    // Subtle glow filter for magnetic effect
                    filter: isLight 
                        ? 'drop-shadow(0 0 1px rgba(0, 102, 255, 0.3))'
                        : 'drop-shadow(0 0 1px rgba(0, 255, 143, 0.25))'
                }}
                animate={{
                    backgroundPosition: ['0px 0px', '0px 80px']
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: 'linear'
                }}
            />
        </div>
    )
}
