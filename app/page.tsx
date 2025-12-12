'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '../components/layout/AppLayout'
import ScrollReveal from '../components/ui/ScrollReveal'
import HeroSection from '../components/landing/HeroSection'
import dynamic from 'next/dynamic'


const ProblemSection = dynamic(() => import('../components/landing/ProblemSection'))
const FeaturesSection = dynamic(() => import('../components/landing/FeaturesSection'))
const HowItWorksSection = dynamic(() => import('../components/landing/HowItWorksSection'))
const DifferentiatorsSection = dynamic(() => import('../components/landing/DifferentiatorsSection'))
const TestimonialsSection = dynamic(() => import('../components/landing/TestimonialsSection'))
const PricingSection = dynamic(() => import('../components/landing/PricingSection'))
const FAQSection = dynamic(() => import('../components/landing/FAQSection'))
const FinalCTASection = dynamic(() => import('../components/landing/FinalCTASection'))

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
  }, [router])

  return (
    <>
      {/* Landing Page Sections */}
      <div className="landing-page-wrapper relative z-[1]">
        <AppLayout>
          <ScrollReveal>
            <HeroSection />
          </ScrollReveal>
          <ScrollReveal>
            <ProblemSection />
          </ScrollReveal>
          <ScrollReveal>
            <FeaturesSection />
          </ScrollReveal>
          <ScrollReveal>
            <HowItWorksSection />
          </ScrollReveal>
          <ScrollReveal>
            <DifferentiatorsSection />
          </ScrollReveal>
          <ScrollReveal>
            <TestimonialsSection />
          </ScrollReveal>
          <ScrollReveal>
            <PricingSection />
          </ScrollReveal>
          <ScrollReveal>
            <FAQSection />
          </ScrollReveal>
          <ScrollReveal>
            <FinalCTASection />
          </ScrollReveal>
        </AppLayout>
      </div>
    </>
  )
}


