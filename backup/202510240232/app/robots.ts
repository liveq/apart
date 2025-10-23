import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://apart.liveq.kr';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/backup/', '/test-rotation/'],
      },
      {
        userAgent: 'GPTBot', // ChatGPT
        allow: '/',
      },
      {
        userAgent: 'ChatGPT-User', // ChatGPT web browsing
        allow: '/',
      },
      {
        userAgent: 'Google-Extended', // Google AI/Bard
        allow: '/',
      },
      {
        userAgent: 'anthropic-ai', // Claude
        allow: '/',
      },
      {
        userAgent: 'Claude-Web', // Claude web browsing
        allow: '/',
      },
      {
        userAgent: 'PerplexityBot', // Perplexity AI
        allow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
