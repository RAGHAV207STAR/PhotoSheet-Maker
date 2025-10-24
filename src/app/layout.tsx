
import type {Metadata, Viewport} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import BottomNavbar from '@/components/app/bottom-navbar';
import Header from '@/components/app/header';
import { EditorProvider } from '@/context/editor-context';
import { FirebaseClientProvider } from '@/firebase';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/app/app-sidebar';


const APP_NAME = "Photosheet Maker";
const APP_DEFAULT_TITLE = "Photosheet Maker - Create & Print Passport Photos";
const APP_TITLE_TEMPLATE = "%s - Photosheet Maker";
const APP_DESCRIPTION = "Easily create, customize, and print photosheets for passports, visas, and other ID documents. Upload your photo, choose the number of copies, and get a print-ready PDF in seconds.";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.webmanifest",
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
  },
  twitter: {
    card: "summary",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: '#ADD8E6',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png"></link>
      </head>
      <body className="font-body antialiased">
      <FirebaseClientProvider>
          <EditorProvider>
            <SidebarProvider defaultOpen={false}>
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
