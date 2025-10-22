import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '아파트 가구배치 & 평면도 그리기 플래너',
    short_name: '가구배치 플래너',
    description: '무료 온라인 아파트 가구 배치 및 평면도 그리기 도구. 드래그 앤 드롭으로 가구 배치, 도면 그리기, 거리 측정, 이미지 저장까지!',
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
        label: '아파트 가구배치 플래너',
      },
    ],
  };
}
