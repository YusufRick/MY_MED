import type { Metadata } from 'next'
import { DM_Sans, Playfair_Display, DM_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'MedConnect MY',
  description: 'Healthcare dispensary system for Malaysia',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${playfair.variable} ${dmMono.variable}`}>
      <body className="font-sans bg-white text-pine-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
