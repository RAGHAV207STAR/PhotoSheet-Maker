
"use client";

import { useState, useEffect } from 'react';
import { PlaceHolderImages, type ImagePlaceholder } from '@/lib/placeholder-images';
import HomepageHeader from '@/components/app/homepage-header';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';
import { useToast } from '@/hooks/use-toast';

const HomepageBodyContent = dynamic(() => import('@/components/app/homepage-body-content'), {
  ssr: false,
  loading: () => (
    <div className="w-full max-w-4xl space-y-8">
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-72 w-full" />
    </div>
  ),
});

// This is a Client Component to manage the state of the SmartPhotoPicker.
export default function Home() {
  const [heroImage, setHeroImage] = useState<ImagePlaceholder | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Select a random image only on the client-side to prevent hydration mismatch.
    if (!heroImage) {
      setHeroImage(PlaceHolderImages[Math.floor(Math.random() * PlaceHolderImages.length)]);
    }
  }, [heroImage]);

  const handleCollageClick = () => {
    toast({
        title: "Coming Soon!",
        description: "The photo collage feature is not available yet, but we're working on it.",
    });
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-purple-50 overflow-x-hidden">
        <header className="relative w-full text-white">
          <div className="relative h-64 md:h-80 w-full">
            {heroImage ? (
              <Image
                src={heroImage.imageUrl}
                alt={heroImage.description}
                fill
                priority
                className="object-cover"
                data-ai-hint={heroImage.imageHint}
              />
            ) : (
              <Skeleton className="w-full h-full" />
            )}
            <div className="absolute inset-0 bg-black/30 flex flex-col">
              <HomepageHeader />
            </div>
          </div>
        </header>

        <main className="flex-grow w-full px-4 py-8 flex flex-col items-center gap-8">
          <HomepageBodyContent onCollageClick={handleCollageClick} />
        </main>
      
      <footer className="py-6 px-4 text-center text-sm w-full">
        <p className="font-semibold text-blue-900/60">&copy; {new Date().getFullYear()} SiRa Editor. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
