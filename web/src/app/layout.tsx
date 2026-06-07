import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { AuthProvider } from "@/features/auth/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zephyr — Kentsel Saha Yönetim Sistemi",
  description:
    "Yapay zekâ destekli kentsel saha analizi: çöp/kirlilik ve altyapı tespiti, ekip yönlendirme ve temizlik öncelik panosu.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full max-w-full flex-col overflow-x-clip font-sans">
        <AuthProvider>
          <MotionProvider>{children}</MotionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
