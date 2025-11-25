
import type {Metadata, Viewport} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase';
import AppLayout from '@/components/app/app-layout';

const APP_NAME = "SiRa Editor";
const APP_URL = "https://siraeditor.vercel.app";
const APP_DESCRIPTION = "SiRa Editor is a fast and professional online photo sheet maker, collage creator, and image editor. Create HD photo sheets, passport photos, layouts, and collages instantly.";
const OG_IMAGE_URL = `${APP_URL}/og-image.png`;

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: "SiRa Editor – Photo Sheet Maker & Online Collage Creator",
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: ["Photo Editor", "SiRa Editor", "Photo Sheet Maker", "Collage Maker", "Passport Photo", "Online Editor", "HD Photo Maker", "Layout Creator"],
  
  metadataBase: new URL(APP_URL),
  alternates: {
    canonical: "/",
  },
  
  manifest: "/manifest.json",
  
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: "SiRa Editor – Online Photo Editor",
      template: `%s | ${APP_NAME}`,
    },
    description: APP_DESCRIPTION,
    url: APP_URL,
    images: [
      {
        url: OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: "SiRa Editor - Photo Sheet & Collage Maker",
      },
    ],
    locale: "en_US",
  },
  
  twitter: {
    card: "summary_large_image",
    title: {
      default: "SiRa Editor – Photo Sheet Maker",
      template: `%s | ${APP_NAME}`,
    },
    description: APP_DESCRIPTION,
    creator: "@siraeditor",
    images: [OG_IMAGE_URL],
  },
  
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  
  other: {
    "google-site-verification": "-30ujEIjJeOl-kZGiqqXrZWLlCrcZ3d6dI1SLSKmd7o",
  }
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
  colorScheme: 'light dark',
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": APP_NAME,
  "url": APP_URL,
  "logo": `${APP_URL}/icon-512.png`,
  "description": APP_DESCRIPTION,
  "applicationCategory": "MultimediaApplication",
  "operatingSystem": "All",
  "browserRequirements": "Requires HTML5 support, JavaScript enabled.",
  "releaseNotes": "https://siraeditor.vercel.app/",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "creator": {
    "@type": "Organization",
    "name": "SiRa Editor",
    "logo": {
      "@type": "ImageObject",
      "url": `${APP_URL}/icon-512.png`
    }
  }
};

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <head>
        <meta name="google-site-verification" content="-30ujEIjJeOl-kZGiqqXrZWLlCrcZ3d6dI1SLSKmd7o" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <meta name="msapplication-TileColor" content="#000000" />
      </head>
      <body className={`font-body antialiased`}>
        <FirebaseClientProvider>
          <AppLayout>{children}</AppLayout>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
