
"use client"

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, History, User, Image as ImageIcon } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { useEditor } from '@/context/editor-context';
import { useState, useEffect } from 'react';

export default function AppSidebar() {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Return a static sidebar skeleton on the server to avoid hook errors.
    return (
      <Sidebar collapsible="offcanvas">
        <SidebarHeader>
          <Link href="/" className="font-headline text-3xl">
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600 whitespace-nowrap">Photosheet Maker</span>
          </Link>
        </SidebarHeader>
      </Sidebar>
    );
  }

  return <ClientAppSidebar />;
}

function ClientAppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { setImages } = useEditor();

  const handlePassportClick = (e: React.MouseEvent) => {
      e.preventDefault();
      setImages([]); // Clear any existing images from other flows
      router.push('/editor');
  }

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/editor', label: 'Passport', icon: ImageIcon, onClick: handlePassportClick },
    { href: '/history', label: 'History', icon: History },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <Link href="/" className="font-headline text-3xl">
          <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600 whitespace-nowrap">Photosheet Maker</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={isActive} tooltip={{children: item.label}}>
                  <Link href={item.href} onClick={item.onClick}>
                    <item.icon />
                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
