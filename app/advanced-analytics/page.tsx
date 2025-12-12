"use client";

import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "../../components/layout/AppLayout";
import AnalyticsControls from "../../components/advanced-analytics/AnalyticsControls";
import AdvancedChart from "../../components/advanced-analytics/AdvancedChart";
import CorrelationScatterPlot from "../../components/advanced-analytics/CorrelationScatterPlot";
import DistributionHistogram from "../../components/advanced-analytics/DistributionHistogram";
import ComparativeStats from "../../components/advanced-analytics/ComparativeStats";
import HabitImpactVisualization from "../../components/advanced-analytics/HabitImpactVisualization";
import { api, type TrendsResponse } from "../../lib/api";
import { getCurrentUser } from "../../lib/auth";
import {
  useTrends,
  useJournalInsights,
  useDashboardSummary,
  usePersonalizationInsights,
} from "../../lib/hooks/useDashboardData"; // Added hooks
import { filterDataByRange, fillMissingDates } from "../../lib/analytics-utils";
import { motion } from "framer-motion";
import ScrollReveal from "../../components/ui/ScrollReveal";
import {
  formatShortDate,
  formatWeekday,
  formatDayWeekday,
  formatFullDate,
  getRelativeDateLabel,
} from "../../lib/formatters"; // Added formatters
import { Heart, Dumbbell, Zap, Moon, Thermometer, Flame } from "lucide-react"; // Added icons

// Imported Components from Dashboard
import StatsRow from "../../components/dashboard/StatsRow";
import RecoveryBaselinePanel from "../../components/dashboard/RecoveryBaselinePanel";
import DashboardSkeleton, {
  PersonalizationInsightsSkeleton,
} from "../../components/dashboard/DashboardSkeleton";
import TodayRecommendationCard from "../../components/dashboard/TodayRecommendationCard";
import ForecastCard from "../../components/dashboard/ForecastCard";
import NeonCard from "../../components/ui/NeonCard";

// Lazy load heavy components
const PerformanceSection = lazy(
  () => import("../../components/dashboard/PerformanceSection")
);
const MorningBriefing = lazy(
  () => import("../../components/dashboard/MorningBriefing")
);

const AVAILABLE_METRICS = [
  "recovery",
  "strain",
  "sleep",
  "hrv",
  "resting_hr",
  "spo2",
  "respiratory_rate",
  "skin_temp",
  "calories",
];

export default function AdvancedAnalyticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  // SWR Hooks
  const { trends, isLoading: trendsLoading } = useTrends(
    undefined,
    undefined,
    user?.id
  );
  const { insights: journalInsights, isLoading: insightsLoading } =
    useJournalInsights(user?.id);
  const { summary, isLoading: summaryLoading } = useDashboardSummary(user?.id); // Fetch summary
  const {
    insights: personalizationInsights,
    isLoading: personalizationLoading,
  } = usePersonalizationInsights(user?.id); // Fetch insights

  const loading = trendsLoading || insightsLoading || summaryLoading;

  // Filter State - Default to 'ALL' to show all historical data
  const [dateRange, setDateRange] = useState("ALL");
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    "recovery",
    "strain",
  ]);
  const [comparisonPeriod, setComparisonPeriod] = useState<
    "week" | "month" | "year"
  >("week");

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      router.push("/login");
    } else {
      setUser(currentUser);
    }
  };

  const toggleMetric = (metric: string) => {
    setSelectedMetrics((prev) => {
      if (prev.includes(metric)) {
        // Don't allow deselecting the last metric
        if (prev.length === 1) return prev;
        return prev.filter((m) => m !== metric);
      } else {
        // Allow selecting any number of metrics
        return [...prev, metric];
      }
    });
  };

  // --- Data Transformations for Migrated Components ---

  const recoveryData = useMemo(() => {
    if (!trends?.series?.recovery) return [];
    return trends.series.recovery.map((item: any) => ({
      date: formatShortDate(item.date),
      recovery: item.value,
    }));
  }, [trends?.series?.recovery]);

  const last30Strain = useMemo(
    () =>
      trends?.series?.strain?.map((item: any) => ({
        date: formatDayWeekday(item.date, false),
        value: item.value,
      })) || [],
    [trends?.series?.strain]
  );

  const last30Sleep = useMemo(
    () =>
      trends?.series?.sleep?.map((d: any) => ({
        date: formatDayWeekday(d.date, false),
        value: d.value || 0,
      })) || [],
    [trends?.series?.sleep]
  );

  // Get yesterday's strain from trends data (second to last item)
  const yesterdayStrain = useMemo(
    () =>
      trends?.series?.strain && trends.series.strain.length >= 2
        ? trends.series.strain[trends.series.strain.length - 2]?.value
        : null,
    [trends?.series?.strain]
  );

  const statsData = useMemo(() => {
    const todayLabel = summary?.today?.date
      ? getRelativeDateLabel(summary.today.date)
      : "Today";

    return [
      {
        icon: Heart,
        label: "Recovery",
        value: summary?.today?.recovery_score
          ? `${Math.round(summary.today.recovery_score)}%`
          : "--",
        subtitle: todayLabel,
        color:
          "from-blue-600/20 dark:from-green-500/20 to-blue-500/20 dark:to-emerald-500/20",
      },
      {
        icon: Dumbbell,
        label: "Strain",
        value:
          yesterdayStrain !== null && yesterdayStrain !== undefined
            ? yesterdayStrain.toFixed(1)
            : "--",
        subtitle: "YESTERDAY",
        color: "from-purple-500/20 to-pink-500/20",
      },
      {
        icon: Zap,
        label: "HRV",
        value: summary?.today?.hrv
          ? `${Math.round(summary.today.hrv)} ms`
          : "--",
        subtitle: todayLabel,
        color: "from-amber-500/20 to-orange-500/20",
      },
      {
        icon: Moon,
        label: "Sleep",
        value: summary?.today?.sleep_hours
          ? `${summary.today.sleep_hours.toFixed(1)}h`
          : "--",
        subtitle: "Last night",
        color: "from-blue-500/20 to-cyan-500/20",
      },
      {
        icon: Zap,
        label: "Respiratory Rate",
        value: summary?.today?.respiratory_rate
          ? `${summary.today.respiratory_rate.toFixed(1)} rpm`
          : "--",
        subtitle: "Last night",
        color: "from-green-500/20 to-emerald-500/20",
      },
      {
        icon: Heart,
        label: "SpO2",
        value:
          summary?.today?.spo2_percentage != null
            ? `${summary.today.spo2_percentage.toFixed(1)}%`
            : "--",
        subtitle: "Last night",
        color: "from-red-500/20 to-pink-500/20",
      },
      {
        icon: Thermometer,
        label: "Skin Temp",
        value: summary?.today?.skin_temp_celsius
          ? `${summary.today.skin_temp_celsius.toFixed(1)}°C`
          : "--",
        subtitle: "Last night",
        color: "from-orange-500/20 to-yellow-500/20",
      },
      {
        icon: Flame,
        label: "Calories",
        value: summary?.today?.calories
          ? `${Math.round(summary.today.calories)}`
          : "--",
        subtitle: todayLabel === "Today" ? "Today" : todayLabel,
        color: "from-purple-500/20 to-indigo-500/20",
      },
    ];
  }, [summary, yesterdayStrain]);

  // Transform and Filter Data for Advanced Charts
  const filteredData = useMemo(() => {
    if (!trends || !trends.series) return [];

    // Merge all series into a single array of objects by date
    const dateMap: Record<string, any> = {};

    // Helper to merge series
    const mergeSeries = (key: string, data: any[]) => {
      if (!data) return;
      data.forEach((point) => {
        if (!dateMap[point.date]) {
          dateMap[point.date] = { date: point.date };
        }
        dateMap[point.date][key] = point.value;
      });
    };

    AVAILABLE_METRICS.forEach((metric) => {
      // @ts-ignore - dynamic access to series
      mergeSeries(metric, trends.series[metric]);
    });

    const mergedData = Object.values(dateMap).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    // First filter by date range, then fill missing dates
    const filtered = filterDataByRange(mergedData, dateRange);
    return fillMissingDates(filtered, dateRange);
  }, [trends, dateRange]);

  if (loading) {
    return (
      <AppLayout>
        <DashboardSkeleton />
      </AppLayout>
    );
  }

  return (
    <AppLayout user={user}>
      <div className="relative z-10 container mx-auto px-4 py-8 pt-24 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-3">
              Advanced Analytics
            </h1>
            <p className="text-base text-gray-700 dark:text-white/80 leading-relaxed">
              Deep dive into your biometric trends and correlations.
            </p>
          </div>
        </div>

        {/* --- MIGRATED DASHBOARD COMPONENTS START --- */}

        {/* Stats Row */}
        <ScrollReveal>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Daily Overview
          </h2>
          <StatsRow stats={statsData} />
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Morning Briefing */}
          <div className="lg:col-span-2">
            {summary && (
              <Suspense
                fallback={
                  <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
                }
              >
                <MorningBriefing summary={summary} />
              </Suspense>
            )}
          </div>
          {/* Recommendation & Forecast */}
          <div className="space-y-6">
            <TodayRecommendationCard
              recovery={summary?.today?.recovery_score || 0}
              recommendation={
                summary?.recommendation?.notes || "No recommendation available."
              }
              workoutType={summary?.recommendation?.workout_type || "Rest"}
              optimalTime={summary?.recommendation?.optimal_time || "Anytime"}
              tomorrowForecast={Math.round(
                summary?.tomorrow?.recovery_forecast || 50
              )}
              calories={summary?.recommendation?.calories}
              title={
                summary?.today?.date
                  ? `${getRelativeDateLabel(
                      summary.today.date
                    )}'s Recommendation`
                  : "Today's AI Recommendation"
              }
            />
            <ForecastCard
              forecast={summary?.tomorrow?.recovery_forecast || 0}
              strain={summary?.today?.strain_score || 0}
              sleep={summary?.today?.sleep_hours || 0}
            />
          </div>
        </div>

        {/* Recovery Baseline */}
        <ScrollReveal>
          <div className="space-y-2 mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Recovery Trends
            </h2>
            <p className="text-sm text-gray-600 dark:text-white/60">
              Visualizing your recovery baseline over time.
            </p>
          </div>
          <RecoveryBaselinePanel data={recoveryData} />
        </ScrollReveal>

        {/* Performance Section */}
        <ScrollReveal>
          <Suspense
            fallback={
              <div className="h-[400px] md:h-[500px] bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
            }
          >
            <PerformanceSection
              strainData={last30Strain}
              sleepData={last30Sleep}
            />
          </Suspense>
        </ScrollReveal>

        {/* Personalization Insights */}
        <ScrollReveal>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            AI Personalization
          </h2>
          {loading ? (
            <PersonalizationInsightsSkeleton />
          ) : personalizationInsights.length > 0 ? (
            <div className="grid gap-6">
              {personalizationInsights.map((insight, idx) => (
                <NeonCard
                  key={idx}
                  className="p-6 border-gray-200 dark:border-white/10 bg-white/80 dark:bg-[#0A0A0A]"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                        {insight.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-white/70">
                        {insight.description}
                      </p>
                    </div>
                    {insight.confidence && (
                      <span className="text-xs font-bold px-3 py-1.5 rounded-md uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0 ml-4">
                        {Math.round(insight.confidence * 100)}% CONFIDENCE
                      </span>
                    )}
                  </div>
                  {/* Simplified View for Advanced Page */}
                  {insight.data?.safe_threshold && (
                    <div className="text-sm text-blue-600 dark:text-amber-400">
                      Safe Strain Threshold:{" "}
                      <strong>{insight.data.safe_threshold.toFixed(1)}</strong>
                    </div>
                  )}
                </NeonCard>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 opacity-60">
              No insights available yet.
            </div>
          )}
        </ScrollReveal>

        {/* --- MIGRATED DASHBOARD COMPONENTS END --- */}

        <div className="border-t border-gray-200 dark:border-white/10 my-12" />

        <AnalyticsControls
          dateRange={dateRange}
          setDateRange={setDateRange}
          selectedMetrics={selectedMetrics}
          toggleMetric={toggleMetric}
          availableMetrics={AVAILABLE_METRICS}
          setMetrics={setSelectedMetrics}
        />

        {filteredData.length > 0 ? (
          <div className="space-y-8">
            {/* Comparative Stats */}
            <ScrollReveal>
              <ComparativeStats
                data={filteredData}
                metrics={selectedMetrics}
                period={comparisonPeriod}
              />
            </ScrollReveal>

            {/* Main Chart */}
            <ScrollReveal>
              <AdvancedChart
                data={filteredData}
                selectedMetrics={selectedMetrics}
              />
            </ScrollReveal>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Correlation */}
              <ScrollReveal delay={0.1}>
                <CorrelationScatterPlot
                  data={filteredData}
                  metrics={selectedMetrics}
                  availableMetrics={AVAILABLE_METRICS}
                />
              </ScrollReveal>

              {/* Distribution */}
              <ScrollReveal delay={0.2}>
                <DistributionHistogram
                  data={filteredData}
                  metrics={selectedMetrics}
                  availableMetrics={AVAILABLE_METRICS}
                />
              </ScrollReveal>
            </div>

            {/* Habit Impact Analysis */}
            {journalInsights.length > 0 && (
              <ScrollReveal delay={0.3} className="mt-12">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Habit Impact Analysis
                  </h2>
                  <p className="text-base text-gray-700 dark:text-white/80">
                    Quantify how journal entries (alcohol, stress, travel)
                    affect your recovery with statistical significance.
                  </p>
                </div>
                <HabitImpactVisualization
                  insights={
                    journalInsights.filter(
                      (i) => i.data && typeof i.data.impact_percent === "number"
                    ) as any
                  }
                />
              </ScrollReveal>
            )}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-500 dark:text-white/50">
              No data available for the selected range.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
