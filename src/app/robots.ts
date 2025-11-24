
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const sitemapUrl = "https://siraeditor.vercel.app/sitemap.xml";

  return {
    rules: [
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/profile', '/login'],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/api/', '/profile', '/login'],
      },
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/profile', '/login'],
        crawlDelay: 10,
      },
    ],
    sitemap: sitemapUrl,
    host: "https://siraeditor.vercel.app",
  };
}
