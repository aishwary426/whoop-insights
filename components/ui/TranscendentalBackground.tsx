'use client'

import { motion, useScroll, useTransform, useSpring, useVelocity } from 'framer-motion'
import ParticleBackground from './ParticleBackground'
import CyberGrid from './CyberGrid'
import { useIsMobile } from '../../lib/hooks/useIsMobile'

// --- Layer 3: Cosmic Void (The "Deep Data" Vibe) ---
function CosmicVoid({ opacity }: { opacity: any }) {
    return (
        <motion.div style={{ opacity }} className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-200/10 to-gray-200/80 dark:via-purple-900/10 dark:to-black/80" />
            {/* Floating Orbs */}
            {[...Array(5)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute rounded-full bg-purple-300/10 dark:bg-purple-500/10 blur-xl"
                    style={{
                        width: Math.random() * 300 + 100,
                        height: Math.random() * 300 + 100,
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                        y: [0, -50, 0],
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                        duration: 10 + Math.random() * 10,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            ))}
        </motion.div>
    )
}

export default function TranscendentalBackground() {
    const { scrollYProgress, scrollY } = useScroll()
    const scrollVelocity = useVelocity(scrollY)
    const isMobile = useIsMobile()

    // Smoother spring physics (lower stiffness, optimized damping) with reduced precision for better performance
    const smoothScroll = useSpring(scrollYProgress, { stiffness: 100, damping: 30, mass: 0.5, restDelta: 0.001 })
    const smoothVelocity = useSpring(scrollVelocity, { stiffness: 50, damping: 20 })

    // Opacity transitions for different layers
    // Particles visible from the start with rotating effect
    const particleOpacity = useTransform(smoothScroll, [0, 0.8, 1], [1, 1, 0], { clamp: true })
    const cosmicOpacity = useTransform(smoothScroll, [0.6, 0.8, 1], [0, 1, 1], { clamp: true })

    // Warp effect based on velocity
    // When scrolling fast, scale up slightly and blur
    // Disable on mobile for performance
    const warpScale = useTransform(smoothVelocity, [-1000, 0, 1000], isMobile ? [1, 1, 1] : [1.05, 1, 1.05], { clamp: true })
    const warpBlur = useTransform(smoothVelocity, [-2000, 0, 2000], isMobile ? ["blur(0px)", "blur(0px)", "blur(0px)"] : ["blur(2px)", "blur(0px)", "blur(2px)"])

    // Parallax movement for the background layers with clamped values
    const y2 = useTransform(smoothScroll, [0, 1], [0, 100], { clamp: true })
    const y3 = useTransform(smoothScroll, [0, 1], [0, 50], { clamp: true })

    return (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" style={{ backgroundColor: 'transparent' }}>
            {/* Layer -1: Base Background */}
            <div className="absolute inset-0 bg-gray-50 dark:bg-[#02030A]" />

            {/* Layer 0: Cyber Grid (Bottom-most) */}
            <div className="absolute inset-0 opacity-40 dark:opacity-60">
                <CyberGrid />
            </div>

            {/* Layer 1: Particle Network (Middle) */}
            <motion.div
                style={{ y: y2, opacity: particleOpacity, scale: warpScale, filter: warpBlur }}
                className="absolute inset-0 will-change-transform"
                initial={false}
            >
                <div className="absolute inset-0">
                    <ParticleBackground particleCount={isMobile ? 300 : 1000} accentColor="#3B82F6" isMobile={isMobile} />
                </div>
            </motion.div>

            {/* Layer 2: Cosmic Void (Bottom) */}
            {!isMobile && (
                <motion.div
                    style={{ y: y3, opacity: cosmicOpacity, scale: warpScale }}
                    className="absolute inset-0 will-change-transform"
                    initial={false}
                >
                    <CosmicVoid opacity={cosmicOpacity} />
                </motion.div>
            )}

            {/* Global Vignette / Texture */}
            <div className="absolute inset-0 pointer-events-none bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-gray-200/20 via-transparent to-gray-200/40 dark:from-black/20 dark:via-transparent dark:to-black/40" />
        </div>
    )
}
