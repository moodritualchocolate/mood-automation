import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MOOD — ריטואל שוקולד פונקציונלי",
  description:
    "ENERGY, RELAX, SLEEP — שוקולד מריר 70% עם פורמולה מדויקת לכל רגע ביום.",
  openGraph: {
    title: "MOOD — בחרו את הרגע",
    description: "שלושה רגעים ביום. ריטואל אחד שמחכים לו.",
    type: "website",
    images: [{ url: "/mood-hero-three-moments.png", width: 1680, height: 945, alt: "MOOD Energy, Relax ו-Sleep" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MOOD — בחרו את הרגע",
    description: "שלושה רגעים ביום. ריטואל אחד שמחכים לו.",
    images: ["/mood-hero-three-moments.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="he" dir="rtl">
      <body style={{ margin: 0, overflow: "hidden" }}>{children}</body>
    </html>
  );
}
