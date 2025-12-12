'use client'

import NeonCard from '../ui/NeonCard'
import ParallaxSection from '../ui/ParallaxSection'

// Skeleton animation utility
const SkeletonPulse = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-white/10 rounded ${className}`} />
)

// Stats Row Skeleton
export function StatsRowSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
      {[1, 2, 3, 4].map((i) => (
        <NeonCard key={i} className="p-3 md:p-6 border-gray-200 dark:border-white/10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 md:gap-3 flex-1 min-w-0">
              <SkeletonPulse className="w-7 h-7 md:w-10 md:h-10 rounded-lg flex-shrink-0" />
              <SkeletonPulse className="h-3 md:h-4 flex-1" />
            </div>
            <div className="flex flex-col items-end flex-shrink-0 gap-2">
              <SkeletonPulse className="h-6 md:h-8 w-16 md:w-20" />
              <SkeletonPulse className="h-2 w-12" />
            </div>
          </div>
        </NeonCard>
      ))}
    </div>
  )
}

// Today Recommendation Card Skeleton
export function TodayRecommendationCardSkeleton() {
  return (
    <NeonCard className="p-8 border-gray-200 dark:border-white/10 bg-gradient-to-br from-blue-600/10 dark:from-green-500/10 to-blue-500/5 dark:to-emerald-500/5 h-full">
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <SkeletonPulse className="h-3 w-40 mb-4" />
          <SkeletonPulse className="h-16 w-24 mb-2" />
        </div>
        <SkeletonPulse className="w-14 h-14 rounded-2xl" />
      </div>
      <div className="space-y-3 mb-8">
        <SkeletonPulse className="h-4 w-full" />
        <SkeletonPulse className="h-4 w-5/6" />
        <SkeletonPulse className="h-4 w-4/6" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-xl bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/5">
            <SkeletonPulse className="w-4 h-4 mb-2" />
            <SkeletonPulse className="h-2 w-12 mb-2" />
            <SkeletonPulse className="h-4 w-16" />
          </div>
        ))}
      </div>
    </NeonCard>
  )
}

// Forecast Card Skeleton
export function ForecastCardSkeleton() {
  return (
    <NeonCard className="p-6 border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0A0A0A] h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <SkeletonPulse className="h-3 w-20 mb-2" />
          <SkeletonPulse className="h-10 w-24" />
        </div>
        <SkeletonPulse className="h-5 w-20 rounded" />
      </div>
      <div className="space-y-2">
        <SkeletonPulse className="h-3 w-full" />
        <SkeletonPulse className="h-3 w-4/5" />
      </div>
    </NeonCard>
  )
}

// Recovery Baseline Panel Skeleton
export function RecoveryBaselinePanelSkeleton() {
  return (
    <NeonCard className="p-6 border-gray-200 dark:border-white/10 bg-white/80 dark:bg-[#0A0A0A]">
      <div className="mb-6">
        <SkeletonPulse className="h-6 w-48 mb-2" />
        <SkeletonPulse className="h-4 w-64" />
      </div>
      <div className="h-64 md:h-80">
        <SkeletonPulse className="h-full w-full rounded-lg" />
      </div>
    </NeonCard>
  )
}

// Performance Section Skeleton
export function PerformanceSectionSkeleton() {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <SkeletonPulse className="h-8 w-64 mx-auto mb-2" />
        <SkeletonPulse className="h-4 w-96 mx-auto" />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <NeonCard key={i} className="p-6 border-gray-200 dark:border-white/10 bg-white/80 dark:bg-[#0A0A0A]">
            <SkeletonPulse className="h-6 w-40 mb-4" />
            <div className="h-64">
              <SkeletonPulse className="h-full w-full rounded-lg" />
            </div>
          </NeonCard>
        ))}
      </div>
    </div>
  )
}

// Personalization Insights Skeleton
export function PersonalizationInsightsSkeleton() {
  return (
    <div className="grid gap-6">
      {[1, 2].map((i) => (
        <NeonCard key={i} className="p-6 border-gray-200 dark:border-white/10 bg-white/80 dark:bg-[#0A0A0A]">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <SkeletonPulse className="h-6 w-48 mb-3" />
              <div className="space-y-2">
                <SkeletonPulse className="h-4 w-full" />
                <SkeletonPulse className="h-4 w-5/6" />
              </div>
            </div>
            <SkeletonPulse className="h-6 w-24 rounded" />
          </div>
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-blue-600/10 dark:from-amber-500/10 to-blue-500/5 dark:to-orange-500/5 border border-blue-600/20 dark:border-amber-500/20">
            <SkeletonPulse className="h-3 w-32 mb-3" />
            <SkeletonPulse className="h-8 w-20 mb-2" />
            <SkeletonPulse className="h-3 w-48" />
          </div>
        </NeonCard>
      ))}
    </div>
  )
}

// Main Dashboard Skeleton
export default function DashboardSkeleton() {
  return (
    <div className="relative z-10 w-full px-4 md:px-6 lg:px-8 pt-16 md:pt-20 lg:pt-24">
      {/* Section 1: Hero / Overview */}
      <ParallaxSection
        stickyPosition="top"
        stickyContent={
          <div className="w-full pb-4 md:pb-8">
            <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-4 md:space-y-6">
              <SkeletonPulse className="h-4 w-32" />
              <SkeletonPulse className="h-12 md:h-16 lg:h-20 w-64 md:w-96" />
            </div>
          </div>
        }
      >
        <div className="space-y-4 md:space-y-6">
          <SkeletonPulse className="h-10 md:h-14 lg:h-16 w-64 md:w-80" />
          <StatsRowSkeleton />
        </div>
      </ParallaxSection>

      {/* Section 2: AI Coaching */}
      <ParallaxSection
        stickyPosition="left"
        stickyContent={
          <div className="space-y-3 md:space-y-4 w-full">
            <NeonCard className="p-6 border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0A0A0A] h-full flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <SkeletonPulse className="h-3 w-20 mb-2" />
                  <SkeletonPulse className="h-8 w-32" />
                </div>
                <SkeletonPulse className="h-5 w-16 rounded" />
              </div>
              <div className="space-y-2">
                <SkeletonPulse className="h-3 w-full" />
                <SkeletonPulse className="h-3 w-5/6" />
              </div>
            </NeonCard>
          </div>
        }
      >
        <div className="flex flex-col gap-4 md:gap-6">
          <TodayRecommendationCardSkeleton />
          <ForecastCardSkeleton />
        </div>
      </ParallaxSection>

      {/* Section 3: Recovery Trends */}
      <ParallaxSection
        stickyPosition="right"
        stickyContent={
          <div className="space-y-2 md:space-y-4 text-left md:text-right">
            <SkeletonPulse className="h-8 w-48 ml-auto" />
            <SkeletonPulse className="h-4 w-64 ml-auto hidden md:block" />
          </div>
        }
      >
        <RecoveryBaselinePanelSkeleton />
      </ParallaxSection>

      {/* Section 4: Performance Metrics */}
      <div className="relative z-20">
        <PerformanceSectionSkeleton />
      </div>

      {/* Section 5: Personalization Insights */}
      <ParallaxSection
        stickyPosition="left"
        stickyContent={
          <div className="space-y-2 md:space-y-4">
            <SkeletonPulse className="h-8 w-48" />
            <SkeletonPulse className="h-4 w-64 hidden md:block" />
          </div>
        }
      >
        <PersonalizationInsightsSkeleton />
      </ParallaxSection>
    </div>
  )
}






















