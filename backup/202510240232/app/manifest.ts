import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '도면 배치 - 평면도 그리기 & 가구 배치 플래너',
    short_name: '도면 배치',
    description: '무료 온라인 도면 배치 도구. 아파트, 매장, 사무실, 카페 등 모든 공간의 평면도 작성과 가구 배치를 한 곳에서! 드래그 앤 드롭, 도면 그리기, 거리 측정, 상업용 활용 가능.',
    start_url: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#ffffff',
    theme_color: '#3b82f6',
    categories: ['productivity', 'design', 'utilities'],
    lang: 'ko',
    dir: 'ltr',
    scope: '/',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
    screenshots: [
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        label: '도면 배치 플래너',
      },
    ],
  };
}
