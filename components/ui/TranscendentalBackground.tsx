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
                        className="absolute inset-0 border border-neon-primary/10 rounded-full"
                        style={{ inset: `${(100 - size) / 2}%` }}
                        animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
                        transition={{ duration: 60 + i * 10, ease: "linear", repeat: Infinity }}
                    />
                ))}
                {/* Glowing Core */}
                <div className="absolute inset-0 bg-neon-primary/5 blur-3xl rounded-full" />
            </div>
        </motion.div>
    )
}

// --- Layer 3: Cosmic Void (The "Deep Data" Vibe) ---
function CosmicVoid({ opacity }: { opacity: any }) {
    return (
        <motion.div style={{ opacity }} className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/10 to-black/80" />
            {/* Floating Orbs */}
            {[...Array(5)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute rounded-full bg-purple-500/10 blur-2xl"
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
    const smoothScroll = useSpring(scrollYProgress, { stiffness: 120, damping: 25, restDelta: 0.0001 })

    // Opacity transitions for different layers
    // 0.0 -> 0.2: Neon Structure scales up and explodes
    // 0.1 -> 0.8: Particle Network fades in (disintegration effect) and flows
    // 0.7 -> 1.0: Cosmic Void deepens

    const neonOpacity = useTransform(smoothScroll, [0, 0.15], [1, 0])
    const neonScale = useTransform(smoothScroll, [0, 0.3], [1, 15]) // Explosive growth

    const particleOpacity = useTransform(smoothScroll, [0.05, 0.2, 0.8, 1], [0, 1, 1, 0])
    const cosmicOpacity = useTransform(smoothScroll, [0.6, 0.8, 1], [0, 1, 1])

    // Parallax movement for the background layers
    const y1 = useTransform(smoothScroll, [0, 1], [0, 200])
    const y2 = useTransform(smoothScroll, [0, 1], [0, 100])
    const y3 = useTransform(smoothScroll, [0, 1], [0, 50])

    return (
        <div className="fixed inset-0 z-0 overflow-hidden bg-[#050505]">
            {/* Layer 1: Neon Structure (Top) */}
            <motion.div style={{ y: y1 }} className="absolute inset-0">
                <NeonStructure opacity={neonOpacity} scale={neonScale} />
            </motion.div>

            {/* Layer 2: Particle Network (Middle) */}
            <motion.div style={{ y: y2, opacity: particleOpacity }} className="absolute inset-0">
                <div className="absolute inset-0">
                    <ParticleBackground particleCount={1000} accentColor="#22d3ee" />
                </div>
            </motion.div>

            {/* Layer 3: Cosmic Void (Bottom) */}
            <motion.div style={{ y: y3, opacity: cosmicOpacity }} className="absolute inset-0">
                <CosmicVoid opacity={cosmicOpacity} />
            </motion.div>

            {/* Global Vignette / Texture */}
            <div className="absolute inset-0 pointer-events-none bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/20 via-transparent to-black/40" />
        </div>
    )
}
