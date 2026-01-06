import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono, Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { QueryProvider } from "@/components/providers/query-provider"
import { Header } from "@/components/layout/header"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })
const _inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: {
    default: "Mat We - 주짓수 커뮤니티 플랫폼",
    template: "%s | Mat We",
  },
  description: "주짓수 강사와 수강생을 연결하는 플랫폼. 강의 영상을 통해 학습하고, 1:1 PT로 실력을 향상시키세요.",
  keywords: ["주짓수", "브라질리언 주짓수", "BJJ", "격투기", "무술", "PT", "개인 트레이닝", "강의", "온라인 강의"],
  authors: [{ name: "Mat We" }],
  creator: "Mat We",
  publisher: "Mat We",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://mat-we.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "/",
    siteName: "Mat We",
    title: "Mat We - 주짓수 커뮤니티 플랫폼",
    description: "주짓수 강사와 수강생을 연결하는 플랫폼. 강의 영상을 통해 학습하고, 1:1 PT로 실력을 향상시키세요.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Mat We - 주짓수 커뮤니티 플랫폼",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mat We - 주짓수 커뮤니티 플랫폼",
    description: "주짓수 강사와 수강생을 연결하는 플랫폼. 강의 영상을 통해 학습하고, 1:1 PT로 실력을 향상시키세요.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${_inter.variable} font-sans antialiased`}>
        <QueryProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
            >
              본문으로 건너뛰기
            </a>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main id="main-content" className="flex-1" role="main">
                {children}
              </main>
            </div>
          </ThemeProvider>
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  )
}
