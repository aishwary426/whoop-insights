'use client'

import { useEffect } from 'react'
import AppLayout from '../components/layout/AppLayout'
import TranscendentalBackground from '../components/ui/TranscendentalBackground'
import HeroSection from '../components/landing/HeroSection'
import ProblemSection from '../components/landing/ProblemSection'
import FeaturesSection from '../components/landing/FeaturesSection'
import HowItWorksSection from '../components/landing/HowItWorksSection'
import DifferentiatorsSection from '../components/landing/DifferentiatorsSection'
import TestimonialsSection from '../components/landing/TestimonialsSection'
import PricingSection from '../components/landing/PricingSection'
import FAQSection from '../components/landing/FAQSection'
import FinalCTASection from '../components/landing/FinalCTASection'

export default function LandingPage() {
  useEffect(() => {
    // Make AppLayout background transparent for landing page so particles are visible
    const timer = setTimeout(() => {
      const appLayoutDiv = document.querySelector('.min-h-screen.bg-white, .min-h-screen.dark\\:bg-bgDark')
      if (appLayoutDiv) {
        ;(appLayoutDiv as HTMLElement).classList.remove('bg-white', 'dark:bg-bgDark')
        ;(appLayoutDiv as HTMLElement).style.backgroundColor = 'transparent'
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      {/* Global Particle Background for entire landing page - fixed behind everything */}
      <TranscendentalBackground />
      
      {/* Landing Page Sections */}
      <div className="landing-page-wrapper relative z-[1]">
        <AppLayout>
          <HeroSection />
          <ProblemSection />
          <FeaturesSection />
          <HowItWorksSection />
          <DifferentiatorsSection />
          <TestimonialsSection />
          <PricingSection />
          <FAQSection />
          <FinalCTASection />
        </AppLayout>
      </div>
    </>
  )
}


