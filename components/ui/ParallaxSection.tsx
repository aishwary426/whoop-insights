'use client'

import { useRef } from 'react'
import ScrollReveal from './ScrollReveal'

interface ParallaxSectionProps {
    children: React.ReactNode
    className?: string
    stickyContent?: React.ReactNode
    stickyPosition?: 'left' | 'right' | 'top'
    id?: string
}

export default function ParallaxSection({
    children,
    className = "",
    stickyContent,
    stickyPosition = 'top',
    id
}: ParallaxSectionProps) {
    const ref = useRef<HTMLDivElement>(null)

    return (
        <section id={id} ref={ref} className={`relative min-h-[60vh] md:min-h-[80vh] flex flex-col justify-center py-8 md:py-16 lg:py-24 ${className}`}>
            <div className="container mx-auto px-4 md:px-6 lg:px-8">
                {stickyContent ? (
                    <div className={`flex flex-col ${stickyPosition === 'left' || stickyPosition === 'right' ? 'lg:flex-row' : ''} gap-4 md:gap-8 lg:gap-12 items-start`}>
                        {/* Sticky Side - Now just Static Side */}
                        <div className={`
              ${stickyPosition === 'top' ? 'w-full mb-4 md:mb-8' : ''}
              ${stickyPosition === 'left' ? 'lg:w-1/3 lg:order-1 lg:sticky lg:top-24 lg:self-start' : ''}
              ${stickyPosition === 'right' ? 'lg:w-1/3 lg:order-2 lg:sticky lg:top-24 lg:self-start' : ''}
            `}>
                            <ScrollReveal>
                                {stickyContent}
                            </ScrollReveal>
                        </div>

                        {/* Scrollable Content Side */}
                        <div
                            className={`
                w-full
                ${stickyPosition === 'left' ? 'lg:w-2/3 lg:order-2' : ''}
                ${stickyPosition === 'right' ? 'lg:w-2/3 lg:order-1' : ''}
              `}
                        >
                            <ScrollReveal delay={0.2}>
                                {children}
                            </ScrollReveal>
                        </div>
                    </div>
                ) : (
                    <ScrollReveal>
                        {children}
                    </ScrollReveal>
                )}
            </div>
        </section>
    )
}
