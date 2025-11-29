'use client'

import { useRef, memo } from 'react'
import ScrollReveal from './ScrollReveal'
import { usePerformanceMode } from '../../lib/hooks/usePerformanceMode'

interface ParallaxSectionProps {
    children: React.ReactNode
    className?: string
    stickyContent?: React.ReactNode
    stickyPosition?: 'left' | 'right' | 'top'
    id?: string
}

function ParallaxSection({
    children,
    className = "",
    stickyContent,
    stickyPosition = 'top',
    id
}: ParallaxSectionProps) {
    const ref = useRef<HTMLDivElement>(null)
    const { isMobile } = usePerformanceMode()

    // Disable sticky positioning on mobile for better performance
    const shouldUseSticky = !isMobile && (stickyPosition === 'left' || stickyPosition === 'right')

    return (
        <section id={id} ref={ref} className={`relative min-h-[60vh] md:min-h-[80vh] flex flex-col justify-center py-8 md:py-16 lg:py-24 ${className}`}>
            <div className="container mx-auto px-4 md:px-6 lg:px-8">
                {stickyContent ? (
                    <div className={`flex flex-col ${shouldUseSticky ? 'lg:flex-row' : ''} gap-4 md:gap-8 lg:gap-12 items-start`}>
                        {/* Sticky Side - Disabled on mobile */}
                        <div className={`
              ${stickyPosition === 'top' ? 'w-full mb-4 md:mb-8' : ''}
              ${shouldUseSticky && stickyPosition === 'left' ? 'lg:w-1/3 lg:order-1 lg:sticky lg:top-24 lg:self-start' : ''}
              ${shouldUseSticky && stickyPosition === 'right' ? 'lg:w-1/3 lg:order-2 lg:sticky lg:top-24 lg:self-start' : ''}
              ${!shouldUseSticky && stickyPosition !== 'top' ? 'w-full mb-4 md:mb-8' : ''}
            `}>
                            <ScrollReveal>
                                {stickyContent}
                            </ScrollReveal>
                        </div>

                        {/* Scrollable Content Side */}
                        <div
                            className={`
                w-full
                ${shouldUseSticky && stickyPosition === 'left' ? 'lg:w-2/3 lg:order-2' : ''}
                ${shouldUseSticky && stickyPosition === 'right' ? 'lg:w-2/3 lg:order-1' : ''}
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

export default memo(ParallaxSection)
