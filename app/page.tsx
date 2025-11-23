'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()

  useEffect(() => {
    // Check if there's an auth token in the hash fragment (email confirmation callback)
    // If so, redirect to the auth callback handler
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const type = hashParams.get('type')
      
      // If we have an access token or type parameter, this is likely an auth callback
      if (accessToken || type) {
        // Redirect to the proper callback handler
        router.replace(`/auth/callback${window.location.hash}`)
        return
      }
    }

    // Make AppLayout background transparent for landing page so particles are visible
    const timer = setTimeout(() => {
      const appLayoutDiv = document.querySelector('.min-h-screen.bg-white, .min-h-screen.dark\\:bg-bgDark')
      if (appLayoutDiv) {
        ;(appLayoutDiv as HTMLElement).classList.remove('bg-white', 'dark:bg-bgDark')
        ;(appLayoutDiv as HTMLElement).style.backgroundColor = 'transparent'
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [router])

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


