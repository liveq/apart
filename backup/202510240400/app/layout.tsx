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
  metadataBase: new URL('https://apart.liveq.kr'),
  title: "도면 배치 - 평면도 그리기 & 가구 배치 플래너 | Floor Plan Layout Designer",
  description: "무료 온라인 도면 배치 도구. 아파트, 매장, 사무실, 카페 등 모든 공간의 평면도 작성과 가구 배치를 한 곳에서! 드래그 앤 드롭, 도면 그리기, 거리 측정, 상업용 활용 가능. Free floor plan layout designer for apartments, stores, offices with furniture placement and drawing tools.",
  keywords: [
    // 한국어 키워드 - 기본
    "도면 배치", "평면도 그리기", "가구 배치", "가구배치", "도면 작성", "레이아웃 설계",
    "평면도", "아파트 평면도", "도면 그리기", "인테리어 도면", "공간 설계",
    // 주거 공간
    "아파트 가구배치", "가구 배치 플래너", "아파트 인테리어", "방 배치", "집 꾸미기", "이사 준비",
    // 상업 공간
    "매장 레이아웃", "매장 배치", "상업 공간 설계", "매장 인테리어", "카페 인테리어", "쇼룸 디자인",
    "사무실 배치", "사무실 레이아웃", "오피스 공간", "상가 인테리어", "가게 설계",
    // 기능
    "거리 측정", "치수 측정", "인테리어 플래너", "인테리어 시뮬레이션", "가구 시뮬레이션",
    "무료 도면 작성", "온라인 평면도", "무료 가구배치", "온라인 가구배치", "웹 가구배치",
    "공간 계획", "레이아웃 디자인", "평면도 설계", "도면 플래너",
    // English keywords - Basic
    "floor plan layout", "floor plan designer", "furniture planner", "layout design", "blueprint planner",
    "furniture layout", "floor plan", "space planning", "interior design", "layout planner",
    // Residential
    "apartment layout", "room planner", "furniture arrangement", "home design", "apartment design",
    // Commercial
    "store layout", "retail design", "office layout", "cafe design", "commercial space",
    "shop design", "showroom layout", "office space planning", "retail floor plan",
    // Features
    "free furniture planner", "online furniture planner", "furniture layout tool",
    "drawing tool", "measurement tool", "floor plan design", "layout tool",
    "drag and drop planner", "online floor plan", "free layout designer",
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
    siteName: "도면 배치 - Floor Plan Layout",
    title: "도면 배치 - 평면도 그리기 & 가구 배치 플래너",
    description: "무료 온라인 도면 배치 도구. 아파트, 매장, 사무실, 카페 등 모든 공간의 평면도 작성과 가구 배치를 한 곳에서! 상업용 활용 가능.",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "도면 배치 플래너 로고",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "도면 배치 - 평면도 그리기 & 가구 배치 플래너",
    description: "무료 온라인 도면 배치 도구. 아파트, 매장, 사무실 등 모든 공간의 평면도 작성과 가구 배치. 상업용 활용 가능!",
    images: ["/icon-512.png"],
  },
  category: "productivity",
  applicationName: "도면 배치",
  appleWebApp: {
    capable: true,
    title: "도면 배치",
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
    "name": "도면 배치 - 평면도 그리기 & 가구 배치 플래너",
    "alternateName": ["Floor Plan Layout Designer", "Blueprint Planner", "아파트 가구배치 플래너"],
    "description": "무료 온라인 도면 배치 도구. 아파트, 매장, 사무실, 카페 등 모든 공간의 평면도 작성과 가구 배치를 한 곳에서! 드래그 앤 드롭, 도면 그리기, 거리 측정, 상업용 활용 가능.",
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
      "도면 작성 및 레이아웃 설계",
      "거리 측정 도구",
      "치수 자동 표시",
      "이미지 업로드 및 배율 설정",
      "가구 회전 및 리사이즈",
      "스마트 가이드 및 스냅",
      "아파트, 매장, 사무실 등 다양한 공간 지원",
      "상업용 활용 가능",
      "다크/라이트 모드",
      "이미지 저장 (JPEG)",
      "모바일 최적화",
      "무료 온라인 도구"
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
          position="top-center"
          containerStyle={{
            top: '90px',
          }}
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
