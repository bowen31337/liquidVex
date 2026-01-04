import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { MarketDataProvider } from '@/components/MarketDataProvider';
import { ClientProviders } from '@/components/ClientProviders';
import { PerformanceMonitor } from '@/components/PerformanceMonitor/PerformanceMonitor';
import { AccessibilityProvider } from '@/contexts/AccessibilityContext';
import KeyboardShortcuts from '@/components/KeyboardShortcuts/KeyboardShortcuts';
import ScreenReaderAnnouncements from '@/components/ScreenReaderAnnouncements/ScreenReaderAnnouncements';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'liquidVex - Hyperliquid DEX Trading Interface',
  description:
    'Professional trading interface for Hyperliquid L1 DEX with real-time order book, charts, and position management.',
  keywords: ['trading', 'DEX', 'Hyperliquid', 'cryptocurrency', 'perpetuals', 'derivatives'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-background text-text-primary antialiased">
        <AccessibilityProvider>
          <ClientProviders>
            <MarketDataProvider>
              {children}
              <KeyboardShortcuts />
              <ScreenReaderAnnouncements />
              {/* PerformanceMonitor disabled for tests - can be re-enabled manually if needed */}
            </MarketDataProvider>
          </ClientProviders>
        </AccessibilityProvider>
      </body>
    </html>
  );
}
