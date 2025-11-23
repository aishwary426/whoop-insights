import './globals.css'
import { Inter } from 'next/font/google'
import React from 'react'
import ThemeProvider from '../components/providers/ThemeProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Whoop Insights | AI-Powered Recovery Predictions for Athletes',
  description: 'Upload your WHOOP data and get personalized recovery forecasts, optimal sleep windows, and strain thresholds. AI trained on YOUR physiology, not averages.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
