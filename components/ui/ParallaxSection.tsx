'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform, useSpring, MotionValue } from 'framer-motion'

interface ParallaxSectionProps {
    children: React.ReactNode
    className?: string
    stickyContent?: React.ReactNode
    stickyPosition?: 'left' | 'right' | 'top'
}

export default function ParallaxSection({
    children,
    className = "",
    stickyContent,
    stickyPosition = 'top'
}: ParallaxSectionProps) {
    const ref = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    })

    // Smooth out the scroll progress
    const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 })

    // Parallax effects
    const y = useTransform(smoothProgress, [0, 1], [100, -100])
    const opacity = useTransform(smoothProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0])
    const scale = useTransform(smoothProgress, [0, 0.2, 0.8, 1], [0.9, 1, 1, 0.9])

    // Background parallax (slower)
    const bgY = useTransform(smoothProgress, [0, 1], [50, -50])

    return (
        <section ref={ref} className={`relative min-h-[80vh] flex flex-col justify-center py-24 ${className}`}>
            {/* Background Elements - Removed to allow global TranscendentalBackground to show */}

            <div className="container mx-auto px-6 md:px-8">
                {stickyContent ? (
                    <div className={`flex flex-col ${stickyPosition === 'left' || stickyPosition === 'right' ? 'lg:flex-row' : ''} gap-12 items-start`}>
                        {/* Sticky Side */}
                        <div className={`
              ${stickyPosition === 'top' ? 'w-full mb-8 sticky top-24 z-10' : ''}
              ${stickyPosition === 'left' ? 'lg:w-1/3 lg:sticky lg:top-32 lg:order-1' : ''}
              ${stickyPosition === 'right' ? 'lg:w-1/3 lg:sticky lg:top-32 lg:order-2' : ''}
            `}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            >
                                {stickyContent}
                            </motion.div>
                        </div>

                        {/* Scrollable Content Side */}
                        <motion.div
                            style={{ y, opacity, scale }}
                            className={`
                w-full
                ${stickyPosition === 'left' ? 'lg:w-2/3 lg:order-2' : ''}
                ${stickyPosition === 'right' ? 'lg:w-2/3 lg:order-1' : ''}
              `}
                        >
                            {children}
                        </motion.div>
                    </div>
                ) : (
                    <motion.div style={{ y, opacity, scale }}>
                        {children}
                    </motion.div>
                )}
            </div>
        </section>
    )
}
