import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MOOD CREATIVE OS — ENERGY',
  description: 'An autonomous creative operating system. V1: ENERGY static banner engine.',
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
