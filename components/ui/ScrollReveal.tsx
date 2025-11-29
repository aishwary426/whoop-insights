'use client'

import { motion } from 'framer-motion'
import React from 'react'
import { usePerformanceMode } from '../../lib/hooks/usePerformanceMode'

interface ScrollRevealProps {
    children: React.ReactNode
    delay?: number
    className?: string
}

export default function ScrollReveal({ children, delay = 0, className = '' }: ScrollRevealProps) {
    const { reduceAnimations } = usePerformanceMode()
    
    // On mobile/low-end devices, use simpler CSS animations or no animation
    if (reduceAnimations) {
        return (
            <div className={`opacity-0 animate-fade-in ${className}`} style={{ animationDelay: `${delay}s` }}>
                {children}
            </div>
        )
    }
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay, ease: "easeOut" }}
            className={className}
        >
            {children}
        </motion.div>
    )
}
