import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ThemeProvider from '@/components/ThemeProvider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://automationforge.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'AutomationForge — Home Automation Code Generator',
    template: '%s | AutomationForge',
  },
  description:
    'Generate and fix working automation code for Shelly, Home Assistant, Node-RED, and ESPHome. Free build sheets with full parts lists and one-click Amazon purchasing.',
  keywords: [
    'home automation', 'Shelly script', 'Home Assistant automation',
    'Node-RED flow', 'ESPHome config', 'smart home DIY',
    'motion sensor automation', 'smart light schedule',
    'home automation code generator', 'Shelly Gen2',
  ],
  authors: [{ name: 'AutomationForge' }],
  creator: 'AutomationForge',
  openGraph: {
    type: 'website',
    siteName: 'AutomationForge',
    title: 'AutomationForge — Home Automation Code Generator',
    description: 'Generate working Shelly, Home Assistant, Node-RED, and ESPHome code for your smart home. 30+ free build sheets with parts lists.',
    url: SITE_URL,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AutomationForge — Home Automation Code Generator',
    description: 'Generate working automation code for Shelly, HA, Node-RED, and ESPHome. Free build sheets with parts lists.',
  },
  robots: { index: true, follow: true },
  alternates: { canonical: SITE_URL },
};

// Organization JSON-LD for Google Knowledge Panel
const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'AutomationForge',
  url: SITE_URL,
  description: 'Open-source home automation code generator for Shelly, Home Assistant, Node-RED, and ESPHome.',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/build-sheets?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        <ThemeProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}

