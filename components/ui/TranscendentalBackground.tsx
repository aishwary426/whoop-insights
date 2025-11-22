'use client'

import { useRef, useEffect } from 'react'
import { motion, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate } from 'framer-motion'
import ParticleBackground from './ParticleBackground'

// --- Layer 1: Neon Structure (The "Overview" Vibe) ---
function NeonStructure({ opacity, scale }: { opacity: any, scale: any }) {
    return (
        <motion.div style={{ opacity, scale }} className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-[40rem] h-[40rem] max-w-[90vw]">
                {/* Rotating Rings */}
                {[100, 75, 50].map((size, i) => (
                    <motion.div
                        key={i}
                        className="absolute inset-0 border border-green-600/30 dark:border-neon-primary/10 rounded-full will-change-transform"
                        style={{ inset: `${(100 - size) / 2}%` }}
                        animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
                        transition={{ duration: 60 + i * 10, ease: "linear", repeat: Infinity }}
                    />
                ))}
                {/* Glowing Core - Reduced blur for performance */}
                <div className="absolute inset-0 bg-green-500/20 dark:bg-neon-primary/5 blur-xl rounded-full" />
            </div>
        </motion.div>
    )
}

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
    const { scrollYProgress } = useScroll()
    // Smoother spring physics (lower stiffness, optimized damping) with reduced precision for better performance
    const smoothScroll = useSpring(scrollYProgress, { stiffness: 100, damping: 30, mass: 0.5, restDelta: 0.001 })

    // Opacity transitions for different layers
    // Extended ranges for smoother cross-fading
    const neonOpacity = useTransform(smoothScroll, [0, 0.25], [1, 0], { clamp: true })
    const neonScale = useTransform(smoothScroll, [0, 0.35], [1, 6], { clamp: true }) // Reduced max scale for better performance

    const particleOpacity = useTransform(smoothScroll, [0.1, 0.3, 0.8, 1], [0, 1, 1, 0], { clamp: true })
    const cosmicOpacity = useTransform(smoothScroll, [0.6, 0.8, 1], [0, 1, 1], { clamp: true })

    // Parallax movement for the background layers with clamped values
    const y1 = useTransform(smoothScroll, [0, 1], [0, 200], { clamp: true })
    const y2 = useTransform(smoothScroll, [0, 1], [0, 100], { clamp: true })
    const y3 = useTransform(smoothScroll, [0, 1], [0, 50], { clamp: true })

    return (
        <div className="fixed inset-0 z-0 overflow-hidden bg-gray-50 dark:bg-[#050505]">
            {/* Layer 1: Neon Structure (Top) */}
            <motion.div
                style={{ y: y1 }}
                className="absolute inset-0 will-change-transform"
                initial={false}
            >
                <NeonStructure opacity={neonOpacity} scale={neonScale} />
            </motion.div>

            {/* Layer 2: Particle Network (Middle) */}
            <motion.div
                style={{ y: y2, opacity: particleOpacity }}
                className="absolute inset-0 will-change-transform"
                initial={false}
            >
                <div className="absolute inset-0">
                    <ParticleBackground accentColor="#22d3ee" />
                </div>
            </motion.div>

            {/* Layer 3: Cosmic Void (Bottom) */}
            <motion.div
                style={{ y: y3, opacity: cosmicOpacity }}
                className="absolute inset-0 will-change-transform"
                initial={false}
            >
                <CosmicVoid opacity={cosmicOpacity} />
            </motion.div>

            {/* Global Vignette / Texture */}
            <div className="absolute inset-0 pointer-events-none bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-gray-200/20 via-transparent to-gray-200/40 dark:from-black/20 dark:via-transparent dark:to-black/40" />
        </div>
    )
}
