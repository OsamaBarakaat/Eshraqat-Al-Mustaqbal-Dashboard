import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "إشراقة المستقبل للعقارات | لوحة التحكم الإدارية",
  description: "لوحة التحكم الإدارية لشركة إشراقة المستقبل للعقارات - نحو غدٍ مشرق",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/Logo/Eshraqat-Al-Mustakbal-Logo.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="font-cairo bg-warm-white text-primary-text antialiased selection:bg-brand-gold selection:text-brand-charcoal min-h-screen">
        {children}
      </body>
    </html>
  );
}
