
"use client";

import Link from 'next/link';
import { useUser } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { User, MoreVertical, History } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '../ui/button';
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from 'react';

function ClientHomepageHeader() {
  const { user, isUserLoading } = useUser();

  return (
    <>
      <div className="relative z-10 flex justify-between items-start p-4">
        {/* Sidebar Trigger for Desktop */}
        <div className="hidden md:block">
          <SidebarTrigger className="text-white hover:text-white hover:bg-white/20" />
        </div>

        {/* Profile Avatar for Desktop */}
        <div className="hidden md:flex items-center gap-2">
          {isUserLoading ? (
            <div className="h-10 w-10" />
          ) : (
            <Link href={user ? "/profile" : "/login"}>
              <div className="rounded-full p-0.5 bg-gradient-to-r from-primary via-accent to-blue-600 animate-gradient-shift bg-[length:200%_auto] transition-all hover:scale-110 cursor-pointer">
                <Avatar className="h-10 w-10 border-2 border-transparent">
                  {user ? <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} /> : null}
                  <AvatarFallback className="bg-background/80">
                    <User className="h-6 w-6 text-foreground" />
                  </AvatarFallback>
                </Avatar>
              </div>
            </Link>
          )}
        </div>
        
        {/* Mobile Header */}
        <div className="w-full flex justify-between items-center md:hidden">
            {/* Profile Avatar for Mobile */}
             {isUserLoading ? (
                <div className="h-10 w-10" />
            ) : (
                <Link href={user ? "/profile" : "/login"}>
                    <div className="rounded-full p-0.5 bg-gradient-to-r from-primary via-accent to-blue-600 animate-gradient-shift bg-[length:200%_auto] transition-all hover:scale-110 cursor-pointer">
                        <Avatar className="h-10 w-10 border-2 border-transparent">
                        {user ? <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} /> : null}
                        <AvatarFallback className="bg-background/80">
                            <User className="h-6 w-6 text-foreground" />
                        </AvatarFallback>
                        </Avatar>
                    </div>
                </Link>
            )}
            
            {/* Settings Dropdown for Mobile */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 text-white hover:bg-white/20 hover:text-white">
                    <MoreVertical className="h-6 w-6" />
                    <span className="sr-only">Open menu</span>
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                      <Link href="/history">
                      <History className="mr-2 h-4 w-4" />
                      <span>History</span>
                      </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>

      <div className="relative flex-grow flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.5)' }}>
          SiRa Editor
        </h1>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Badge variant="secondary" className="bg-white/30 backdrop-blur-sm text-white border-white/20">Passport Photos</Badge>
            <Badge variant="secondary" className="bg-white/30 backdrop-blur-sm text-white border-white/20">Photo Collage</Badge>
            <Badge variant="secondary" className="bg-white/30 backdrop-blur-sm text-white border-white/20">Photo Prints</Badge>
        </div>
      </div>
    </>
  );
}

export default function HomepageHeader() {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Render a static skeleton on the server
    return (
       <div className="relative z-10 flex justify-between items-start p-4">
        <div className="hidden md:block">
          <SidebarTrigger className="text-white hover:text-white hover:bg-white/20" />
        </div>
        <div className="flex-grow"></div>
      </div>
    );
  }
  
  return <ClientHomepageHeader />;
}
