import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { AuthProvider } from '@/components/providers/AuthProvider'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import CookieNotice from '@/components/shared/CookieNotice'
import { Analytics } from '@vercel/analytics/react'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'letsfindsanity - Support for Builders',
    template: '%s | letsfindsanity',
  },
  description: 'a space for builders to journal, support and ask for advice anonymously ! Connect with fellow builders, share your journey, and find mental wellness support in a safe, anonymous community.',
  keywords: [
    'anonymous support',
    'builder community',
    'mental health',
    'journaling',
    'startup advice',
    'founder support',
    'anonymous posting',
    'builder wellness',
    'tech community',
  ],
  authors: [{ name: 'letsfindsanity' }],
  creator: 'letsfindsanity',
  publisher: 'letsfindsanity',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/letsfindsanity.ico',
    shortcut: '/letsfindsanity.ico',
    apple: '/letsfindsanity.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    siteName: 'letsfindsanity',
    title: 'letsfindsanity - Support for Builders',
    description: 'a space for builders to journal, support and ask for advice anonymously ! Connect with fellow builders, share your journey, and find mental wellness support.',
    images: [
      {
        url: '/letsfindsanity.png',
        width: 1200,
        height: 630,
        alt: 'letsfindsanity - Support for Builders',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'letsfindsanity - Support for Builders',
    description: 'a space for builders to journal, support and ask for advice anonymously ! Connect with fellow builders and find support.',
    images: ['/letsfindsanity.png'],
    creator: '@letsfindsanity',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification codes here when you get them
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'letsfindsanity',
    description: 'a space for builders to journal, support and ask for advice anonymously !',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: 'letsfindsanity',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/letsfindsanity.png`,
      },
    },
  }

  return (
    <html lang="en" data-theme="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <Header />
            <main>{children}</main>
            <Footer />
            <CookieNotice />
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
