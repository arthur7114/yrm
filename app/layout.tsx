import type { Metadata } from 'next'
import { IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'

const plexSans = IBM_Plex_Sans({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const plexMono = IBM_Plex_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  title: 'YRM',
  description: 'Central executiva de performance e operação de leads.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${plexSans.variable} ${plexMono.variable} min-h-screen antialiased`}>
        <Navbar />
        {children}
      </body>
    </html>
  )
}
