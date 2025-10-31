
import type {Metadata, Viewport} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import BottomNavbar from '@/components/app/bottom-navbar';
import Header from '@/components/app/header';
import { EditorProvider } from '@/context/editor-context';
import { FirebaseClientProvider } from '@/firebase';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/app/app-sidebar';
import GoogleAnalytics from '@/components/app/google-analytics';
import SessionValidator from '@/components/app/session-validator';

const APP_NAME = "Photosheet Maker";
const APP_URL = "https://photosheet-maker.vercel.app";
const APP_DEFAULT_TITLE = "Photosheet Maker | Create Passport Size Photos Online";
const APP_TITLE_TEMPLATE = "%s | Photosheet Maker";
const APP_DESCRIPTION = "Easily create, customize, and print professional passport-size photos, ID photos, and visa photos online. Our ID Photo Maker is fast, free, and ready in seconds.";
const OG_IMAGE_URL = `${APP_URL}/og-image.png`; // Assuming you'll create this image

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  keywords: [
    "Photo Sheet Maker",
    "Passport Size Photo Online",
    "ID Photo Maker",
    "Online Photo Editor",
    "passport photo",
    "visa photo",
    "id photo",
    "photo printing",
    "photo editor",
    "passport size photo maker",
    "create passport photo",
    "free passport photo tool"
  ],
  authors: [{ name: "Photosheet Maker Team", url: APP_URL }],
  creator: "Photosheet Maker Team",
  publisher: "Photosheet Maker Team",
  manifest: "/manifest.webmanifest",
  metadataBase: new URL(APP_URL),
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
        alt: "Photosheet Maker - Create Passport Photos Online",
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
    creator: "@YourTwitterHandle", // Replace with your actual Twitter handle
  },
  other: {
    "google-site-verification": "k4kWMniewMZF4Th5E85MuPIN-py8BXX_uWIuLPbu2Io",
  }
};

export const viewport: Viewport = {
  themeColor: '#ADD8E6',
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Photosheet Maker",
  "operatingSystem": "WEB",
  "applicationCategory": "MultimediaApplication",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "1250"
  },
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "description": "Create professional passport-size photos online instantly.",
  "url": "https://photosheet-maker.vercel.app"
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
    <html lang="en" className={`${inter.variable} light`} suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={`font-body antialiased`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <GoogleAnalytics />
      <FirebaseClientProvider>
          <EditorProvider>
            <SidebarProvider defaultOpen={false}>
                <SessionValidator />
                <div className="group/sidebar-wrapper flex min-h-screen">
                    <AppSidebar />
                    <SidebarInset>
                    <Header />
                    <main className="flex-grow flex flex-col">{children}</main>
                    </SidebarInset>
                </div>
                <Toaster />
                <BottomNavbar />
            </SidebarProvider>
          </EditorProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
