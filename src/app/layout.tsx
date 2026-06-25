import { AppShell } from "@/components/app-shell";
import { Providers } from "@/components/providers";
import type { Metadata, Viewport } from "next";
import { Assistant, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Hebrew-first display + body. Assistant carries Hebrew + Latin at the
// same weight rhythm so we don't pair-mismatch in mixed-language strings
// like "₪450 לטיפול". Added the 300 and 800 weights for refined hierarchy.
const sans = Assistant({
  subsets: ["latin", "hebrew"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

// Mono for IDs, prices, tabular metadata · adds the "engineered" feel
// you see in Linear / Stripe / Vercel — numbers feel deliberate.
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MOOD · Procurement Hub",
  description:
    "מרכז השליטה ברכש של MOOD Ritual Chocolate — איתור, בדיקה, השוואה ובחירת ספקים.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MOOD",
  },
};

export const viewport: Viewport = {
  themeColor: "#7c482e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // dir/lang are set on <html> at runtime by the I18nProvider (Hebrew/RTL default).
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <body className={`${sans.variable} ${mono.variable} font-sans antialiased`}>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
