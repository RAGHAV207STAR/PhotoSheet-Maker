
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, User, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BottomNavbar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/editor', label: 'Passport', icon: ImageIcon },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  // Hide navbar on login and editor pages
  const hiddenPaths = ['/login', '/editor'];
  if (hiddenPaths.some(path => pathname.startsWith(path))) {
    return null;
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t shadow-t-lg z-50 no-print">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              href={item.href}
              key={item.href}
              className={cn(
                'flex flex-col items-center justify-center text-sm w-full h-full transition-all duration-300 rounded-lg',
                isActive 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:text-primary hover:bg-muted/50'
              )}
            >
              <Icon className="h-6 w-6 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
