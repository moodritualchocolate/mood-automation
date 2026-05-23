import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MOOD CREATIVE OS — ENERGY',
  description: 'An autonomous creative operating system. V1: ENERGY static banner engine.',
};

// Mobile coherence: device-width viewport so the runtime renders at
// real scale on phones. Without this, mobile browsers render at 980px
// then shrink — atmospheric breathing still happens but at thumbnail
// scale, useless. Theme colour matches the page background so the iOS
// status bar and Android system UI participate in the atmosphere
// instead of cutting a hard edge across it.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#050505',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen scanline">
        {children}
      </body>
    </html>
  );
}
