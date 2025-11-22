import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Whoop Insights Pro - AI-Powered Fitness Analysis',
  description: 'Unlock hidden patterns in your Whoop data with personalized AI insights',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
