'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export default function CyberGrid() {
    const { scrollY } = useScroll()
    const { theme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Move the grid based on scroll
    const y = useTransform(scrollY, [0, 1000], [0, 200])

    // Determine grid color based on theme
    // Light mode: Blue grid
    // Dark mode: Neon Green grid
    const isLight = mounted && (theme === 'light')
    const gridColor = isLight ? 'rgba(0, 102, 255, 0.1)' : 'rgba(0, 255, 143, 0.1)'
    const horizonColor = isLight ? 'from-transparent via-blue-500/20 to-transparent' : 'from-transparent via-emerald-500/20 to-transparent'

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none perspective-[500px]">
            {/* Grid Container with Perspective */}
            <motion.div
                className="absolute inset-[-100%] w-[300%] h-[300%] origin-top"
                style={{
                    y,
                    rotateX: "60deg",
                    backgroundSize: "60px 60px",
                    backgroundImage: `
                        linear-gradient(to right, ${gridColor} 1px, transparent 1px),
                        linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)
                    `,
                    maskImage: "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)"
                }}
                animate={{
                    backgroundPosition: ["0px 0px", "0px 60px"]
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear"
                }}
            />

            {/* Glowing Horizon Line */}
            <div className={`absolute top-[30%] left-0 right-0 h-[1px] bg-gradient-to-r ${horizonColor} blur-sm`} />
        </div>
    )
}
