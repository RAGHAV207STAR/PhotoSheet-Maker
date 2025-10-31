
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { useUser } from "@/firebase";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function Header() {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // The header is hidden on small screens and visible on md screens and up.
  // The login page and home page have their own headers, so this one is hidden there.
  if (pathname === "/login" || pathname === '/' || !isClient) {
    return null;
  }

  return (
    <header className="sticky top-0 left-0 right-0 p-2 border-b items-center justify-between bg-gradient-to-r from-cyan-50 via-blue-100 to-purple-200 z-40 no-print animate-gradient-shift bg-[length:200%_auto] flex">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="hidden md:flex" />
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600 whitespace-nowrap">Photosheet Maker</span>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {isUserLoading ? (
            <div className="h-10 w-10" />
        ) : (
            <Link href={user ? "/profile" : "/login"}>
                <div className="rounded-full p-0.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 animate-gradient-shift bg-[length:200%_auto] transition-all hover:scale-110 cursor-pointer">
                    <Avatar className="h-8 w-8 border-2 border-transparent">
                        {user ? <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} /> : null}
                        <AvatarFallback className="bg-background/80">
                            <User className="h-4 w-4 text-foreground" />
                        </AvatarFallback>
                    </Avatar>
                </div>
            </Link>
        )}
      </div>
    </header>
  );
}
