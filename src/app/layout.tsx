import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: 'AutomationForge — Home Automation Code Generator',
    template: '%s | AutomationForge',
  },
  description:
    'Generate and fix working automation code for Shelly, Home Assistant, Node-RED, and ESPHome. Free build sheets with full parts lists.',
  keywords: ['home automation', 'Shelly', 'Home Assistant', 'Node-RED', 'ESPHome', 'smart home'],
  openGraph: {
    type: 'website',
    siteName: 'AutomationForge',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-[#0a0a0f] text-gray-100 min-h-screen flex flex-col antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
