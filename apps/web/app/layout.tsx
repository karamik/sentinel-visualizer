import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SubscriptionProvider } from '@/contexts/SubscriptionContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sentinel Visualizer',
  description: 'See the Unseen in ZK Circuits',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SubscriptionProvider>
          {children}
        </SubscriptionProvider>
      </body>
    </html>
  )
}
