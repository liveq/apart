import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { GoogleAnalytics } from "@/lib/analytics/google-analytics";
import { Toaster } from "react-hot-toast";
import ToastDismissListener from "@/components/ToastDismissListener";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "아파트 가구배치 & 평면도 그리기 플래너 | Apartment Furniture Planner",
  description: "무료 온라인 아파트 가구 배치 및 평면도 그리기 도구. 드래그 앤 드롭으로 가구 배치, 도면 그리기, 거리 측정, 이미지 저장까지! Free furniture layout planner with drawing tools, measurement, and floor plan design.",
  keywords: [
    // 한국어 키워드
    "가구 배치", "가구배치", "아파트 가구배치", "가구 배치 플래너", "가구배치 프로그램",
    "평면도", "평면도 그리기", "아파트 평면도", "도면 그리기", "인테리어 도면",
    "거리 측정", "치수 측정", "아파트 인테리어", "인테리어 플래너", "인테리어 시뮬레이션",
    "방 배치", "집 꾸미기", "이사 준비", "가구 시뮬레이션", "아파트 설계",
    "무료 가구배치", "온라인 가구배치", "웹 가구배치",
    // English keywords
    "furniture planner", "apartment layout", "furniture layout", "floor plan", "interior design",
    "room planner", "furniture arrangement", "space planning", "home design", "apartment design",
    "free furniture planner", "online furniture planner", "furniture layout tool",
    "drawing tool", "measurement tool", "floor plan design",
  ],
  authors: [{ name: "Apartment Planner" }],
  creator: "Apartment Planner",
  publisher: "Apartment Planner",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    alternateLocale: ["en_US"],
    url: "https://apart.liveq.kr",
    siteName: "아파트 가구배치 플래너",
    title: "아파트 가구배치 & 평면도 그리기 플래너",
    description: "무료 온라인 아파트 가구 배치 및 평면도 그리기 도구. 드래그 앤 드롭으로 가구 배치, 도면 그리기, 거리 측정, 이미지 저장까지!",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "아파트 가구배치 플래너 로고",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "아파트 가구배치 & 평면도 그리기 플래너",
    description: "무료 온라인 아파트 가구 배치 및 평면도 그리기 도구. 드래그 앤 드롭으로 가구 배치, 도면 그리기, 거리 측정!",
    images: ["/icon-512.png"],
  },
  category: "productivity",
  applicationName: "아파트 가구배치 플래너",
  appleWebApp: {
    capable: true,
    title: "가구배치 플래너",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "아파트 가구배치 & 평면도 그리기 플래너",
    "alternateName": "Apartment Furniture Planner",
    "description": "무료 온라인 아파트 가구 배치 및 평면도 그리기 도구. 드래그 앤 드롭으로 가구 배치, 도면 그리기, 거리 측정, 이미지 저장까지!",
    "url": "https://apart.liveq.kr",
    "applicationCategory": "DesignApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "KRW"
    },
    "featureList": [
      "가구 배치 (드래그 앤 드롭)",
      "평면도 그리기 (선, 사각형, 원, 펜 도구)",
      "거리 측정 도구",
      "치수 자동 표시",
      "이미지 업로드 및 배율 설정",
      "가구 회전 및 리사이즈",
      "스마트 가이드 및 스냅",
      "다크/라이트 모드",
      "이미지 저장 (JPEG)",
      "모바일 최적화"
    ],
    "inLanguage": ["ko", "en"],
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "screenshot": "/icon-512.png",
    "image": "/icon-512.png",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5",
      "ratingCount": "1"
    }
  };

  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GoogleAnalytics />
        <ToastDismissListener />
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 5000,
            style: {
              background: '#333',
              color: '#fff',
              fontSize: '14px',
              padding: '12px 24px',
              minWidth: '320px',
              maxWidth: '500px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
