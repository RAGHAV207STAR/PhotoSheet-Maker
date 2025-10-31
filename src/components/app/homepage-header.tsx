
"use client";

import Link from 'next/link';
import { useUser } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { User } from 'lucide-react';

export default function HomepageHeader() {
  const { user, isUserLoading } = useUser();

  return (
    <>
      <div className="relative z-10 flex justify-between items-start p-4">
        <div className="hidden md:block">
          <SidebarTrigger className="text-white hover:text-white hover:bg-white/20 hidden md:flex" />
        </div>
        <div className="flex items-center gap-4">
          {isUserLoading ? (
            <div className="h-10 w-10" />
          ) : (
            <Link href={user ? "/profile" : "/login"}>
              <div className="rounded-full p-0.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 animate-gradient-shift bg-[length:200%_auto] transition-all hover:scale-110 cursor-pointer">
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
      </div>

      <div className="relative flex-grow flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-500 animate-gradient-shift bg-[length:200%_auto]" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.1)' }}>
          Photosheet Maker
        </h1>
        <p className="text-base md:text-xl text-white mt-4 px-3 py-1.5 bg-white/25 backdrop-blur-sm rounded-full">
          Create Printable Photo Sheets Instantly!
        </p>
      </div>
    </>
  );
}
