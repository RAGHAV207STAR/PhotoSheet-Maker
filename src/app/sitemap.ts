
import { MetadataRoute } from 'next'
 
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://siraeditor.vercel.app";

  return [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    },
    {
      url: `${baseUrl}/editor`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/history`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
        url: `${baseUrl}/profile`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.5,
    },
    {
        url: `${baseUrl}/login`,
        lastModified: new Date(),
        changeFrequency: 'yearly',
        priority: 0.5,
    },
  ]
}
