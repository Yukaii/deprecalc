import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Suspense } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { LoadingPage } from "@/components/loading"

export const metadata: Metadata = {
  title: "DeprecCalc - 手機折舊成本計算器",
  description:
    "精確計算 iPhone 與 Android 手機持有成本的專業工具。支援新機與二手機購買，階段式折舊模型，幫助您做出明智的購機決策。",
  keywords: "iPhone, Android, Samsung, Pixel, 折舊, 成本計算, 二手機, 持有成本, 折舊率",
  generator: "v0.app",
  openGraph: {
    title: "DeprecCalc - 手機折舊成本計算器",
    description: "精確計算 iPhone 與 Android 手機持有成本的專業工具",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-TW">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Suspense fallback={<LoadingPage />}>{children}</Suspense>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
