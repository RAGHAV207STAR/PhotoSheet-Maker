
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { User, Download } from 'lucide-react';
import { usePWAInstall } from '@/hooks/use-pwa-install';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarTrigger } from '@/components/ui/sidebar';

const copyOptions = [1, 2, 4, 6, 8, 10, 12, 20, 30];

export default function Home() {
  const [selectedCopies, setSelectedCopies] = useState<number | null>(null);
  const router = useRouter();
  const [heroImage, setHeroImage] = useState(PlaceHolderImages[0]);
  const { canInstall, install } = usePWAInstall();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    // Select a random image on the client to avoid hydration mismatch
    const randomImage = PlaceHolderImages[Math.floor(Math.random() * PlaceHolderImages.length)];
    setHeroImage(randomImage);
  }, []);

  const handleInstallClick = () => {
    if (canInstall) {
      install();
    } else {
      toast({
        title: "Installation Not Available",
        description: "Your browser does not support PWA installation, or it's not ready. Please try again later.",
      });
    }
  }

  useEffect(() => {
    if (selectedCopies !== null) {
      router.push(`/editor?copies=${selectedCopies}`);
    }
  }, [selectedCopies, router]);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-cyan-100 to-blue-200">
       <header
          className="relative w-full text-white"
        >
          <div className="relative h-64 md:h-80 w-full">
            <Image 
              src={heroImage.imageUrl}
              alt={heroImage.description}
              layout="fill"
              objectFit="cover"
              className="z-0"
              data-ai-hint={heroImage.imageHint}
              key={heroImage.id} // Add key to force re-render on image change
            />
            <div className="absolute inset-0 bg-black/30 flex flex-col">
                <div className="relative z-10 flex justify-between items-start p-4">
                    <div className="hidden md:block">
                        <SidebarTrigger className="text-white hover:text-white hover:bg-white/20" />
                    </div>
                    <div className="flex items-center gap-4">
                        {isUserLoading ? (
                            <div className="h-10 w-10" /> 
                        ) : (
                            <Link href={user ? "/profile" : "/login"}>
                                <div className="rounded-full p-0.5 bg-white/30 transition-all hover:scale-110 cursor-pointer">
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
                    <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.2)'}}>Photosheet Maker</h1>
                    <p className="text-lg md:text-xl text-white mt-4 px-4 py-1 bg-white/20 backdrop-blur-sm rounded-full">Create Printable Photo Sheets Instantly!</p>
                </div>
            </div>
          </div>
      </header>

      {canInstall && (
        <div className="py-4 flex justify-center">
            <Button onClick={handleInstallClick} size="lg" className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg transform transition-all hover:scale-105">
                <Download className="mr-2 h-4 w-4"/>
                Install App
            </Button>
        </div>
      )}

      <main className="flex-grow w-full px-4 py-8 flex flex-col items-center">
        <div className="w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden">
          <Card className="w-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 animate-gradient-shift bg-[length:200%_auto] border-0 rounded-xl p-0 relative">
             <div className="bg-white/80 backdrop-blur-md rounded-xl p-6">
                <CardHeader className="text-center p-0 pb-6">
                  <CardTitle className="text-2xl font-bold tracking-tight text-slate-800">Select Copies</CardTitle>
                  <CardDescription className="text-slate-600">How many photos do you need on the sheet?</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 w-full">
                    {copyOptions.map((num) => (
                      <Button
                        key={num}
                        variant={selectedCopies === num ? 'default' : 'outline'}
                        className={cn(
                          "py-6 text-lg font-semibold rounded-lg transition-all transform hover:scale-105",
                          selectedCopies === num 
                            ? "bg-slate-900 text-white hover:bg-slate-800" 
                            : "bg-white/50 text-slate-800 border-slate-200 hover:bg-white"
                        )}
                        onClick={() => setSelectedCopies(num)}
                      >
                        {num}
                      </Button>
                    ))}
                  </div>
                </CardContent>
             </div>
          </Card>
        </div>
      </main>

      <footer className="py-6 text-center text-sm w-full">
        <p className="font-semibold text-blue-900/60">&copy; {new Date().getFullYear()} Photosheet Maker. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
