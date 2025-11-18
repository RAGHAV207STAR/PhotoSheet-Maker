
"use client";

import { Toaster } from "@/components/ui/toaster"
import BottomNavbar from '@/components/app/bottom-navbar';
import Header from '@/components/app/header';
import { EditorProvider } from '@/context/editor-context';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/app/app-sidebar';
import GoogleAnalytics from '@/components/app/google-analytics';
import { LanguageProvider } from '@/context/language-context';
import SessionValidator from "./session-validator";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GoogleAnalytics />
      <EditorProvider>
        <LanguageProvider>
          <SidebarProvider defaultOpen={false}>
              <SessionValidator />
              <div className="group/sidebar-wrapper flex min-h-screen">
                  <AppSidebar />
                  <SidebarInset>
                    <div className="flex flex-col flex-1 min-h-screen">
                        <Header />
                        <main className="flex-grow flex flex-col">{children}</main>
                    </div>
                  </SidebarInset>
              </div>
              <Toaster />
              <BottomNavbar />
          </SidebarProvider>
        </LanguageProvider>
      </EditorProvider>
    </>
  );
}
