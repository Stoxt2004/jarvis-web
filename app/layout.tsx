// src/app/layout.tsx
import './globals.css'
import type { Metadata } from 'next'
import { Inter, Roboto_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import { Providers } from './providers'

// Fonts
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter', 
})

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-roboto-mono',
})

export const metadata: Metadata = {
  title: 'Jarvis Web OS',
  description: 'Un Web Operating System futuristico in stile Jarvis',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it" className="dark">
      <body className={`${inter.variable} ${robotoMono.variable} font-sans bg-background text-white antialiased`}>
        <Providers>
          <Toaster position="top-center" />
          {children}
        </Providers>
      </body>
    </html>
  )
}