
import type {Metadata, Viewport} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase';
import AppLayout from '@/components/app/app-layout';

const APP_NAME = "SiRa Editor";
const APP_URL = "https://siraeditor.vercel.app";
const APP_DEFAULT_TITLE = "SiRa Editor | Create Passport Size Photos Online";
const APP_TITLE_TEMPLATE = "%s | SiRa Editor";
const APP_DESCRIPTION = "Easily create, customize, and print professional passport-size photos, ID photos, and visa photos online. Our ID Photo Maker is fast, free, and ready in seconds.";
const OG_IMAGE_URL = `${APP_URL}/og-image.png`; // You should create this image in your public folder

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.webmanifest",
  metadataBase: new URL(APP_URL),
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
    url: APP_URL,
    images: [
      {
        url: OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: "SiRa Editor - Create Passport Photos Online",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
    images: [OG_IMAGE_URL],
  },
  verification: {
    google: '-30ujEIjJeOl-kZGiqqXrZWLlCrcZ3d6dI1SLSKmd7o',
  },
};

export const viewport: Viewport = {
  themeColor: '#ADD8E6',
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "SiRa Editor",
  "url": "https://siraeditor.vercel.app",
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
      </head>
      <body className={`font-body antialiased`}>
        <FirebaseClientProvider>
          <AppLayout>{children}</AppLayout>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
