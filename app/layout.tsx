import './globals.css'
import { Montserrat } from 'next/font/google'
import React, { Suspense, lazy } from 'react'
import ThemeProvider from '../components/providers/ThemeProvider'
import { SubscriptionProvider } from '../lib/hooks/useSubscription'
import { UserProvider } from '../lib/contexts/UserContext'
import CyberGrid from '../components/ui/CyberGrid'



const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-montserrat',
})

const montserratBold = Montserrat({
  subsets: ['latin'],
  weight: '700',
  variable: '--font-montserrat-bold',
})

export const metadata = {
  title: 'Whoop Insights | AI-Powered Recovery Predictions for Athletes',
  description: 'Upload your WHOOP data and get personalized recovery forecasts, optimal sleep windows, and strain thresholds. AI trained on YOUR physiology, not averages.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/logo.svg', type: 'image/svg+xml', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'apple-touch-icon-precomposed',
        url: '/apple-touch-icon.png',
      },
    ],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Whoop Insights',
  },
}

export const viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${montserrat.className} ${montserrat.variable} ${montserratBold.variable}`}>
        <ThemeProvider>
          <UserProvider>
            <SubscriptionProvider>
              <div className="fixed inset-0 z-[-1]">
                <div className="w-full h-full bg-white dark:bg-black" />
                <CyberGrid />
              </div>
              <div className="relative z-10">
                {children}
              </div>
            </SubscriptionProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
