import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from './components/auth/AuthProvider';

export const metadata: Metadata = {
  title: 'MOOD Creative OS',
  description: 'A creative operating system for chocolate brands. Compose, review, approve.',
};

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
      <body className="min-h-screen bg-[#050505] text-[#F7F5F2]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
