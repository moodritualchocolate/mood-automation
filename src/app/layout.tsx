import { AppShell } from "@/components/app-shell";
import { Providers } from "@/components/providers";
import type { Metadata, Viewport } from "next";
import { Assistant } from "next/font/google";
import "./globals.css";

const assistant = Assistant({
  subsets: ["latin", "hebrew"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MOOD Procurement Hub",
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
      <body className={`${assistant.variable} font-sans`}>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
