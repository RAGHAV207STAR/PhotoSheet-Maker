
"use client";

import { useState, useEffect, useRef } from 'react';
import { PlaceHolderImages, type ImagePlaceholder } from '@/lib/placeholder-images';
import HomepageHeader from '@/components/app/homepage-header';
import Image from 'next/image';
import HomepageBodyContent from '@/components/app/homepage-body-content';
import { useEditor, ImageWithDimensions } from '@/context/editor-context';
import SmartPhotoPicker from '@/components/app/smart-photo-picker';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import UploadStep from '@/components/app/steps/upload-step';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const MIN_IMAGES = 2;
const MAX_IMAGES = 100;

type ViewState = 'home' | 'collage_picker' | 'collage_manager';

// This is a Client Component to manage the state of the SmartPhotoPicker.
export default function Home() {
  const [heroImage, setHeroImage] = useState<ImagePlaceholder | null>(null);
  const { images, setImages, resetEditor } = useEditor();
  const [viewState, setViewState] = useState<ViewState>('home');
  const router = useRouter();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const desktopFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Select a random image only on the client-side to prevent hydration mismatch.
    if (!heroImage) {
      setHeroImage(PlaceHolderImages[Math.floor(Math.random() * PlaceHolderImages.length)]);
    }

    // Determine the initial view state based on existing images in context
    if (images.length > 0 && viewState === 'home') {
        if (!isMobile) {
            setViewState('collage_manager');
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.length, isMobile]);

  const handleAddImages = (newImages: ImageWithDimensions[]) => {
    setImages(prev => {
      const combined = [...prev, ...newImages];
      // Remove duplicates based on src
      const uniqueImages = Array.from(new Map(combined.map(item => [item.src, item])).values());
      if (uniqueImages.length > MAX_IMAGES) {
          toast({
              title: "Maximum Images Reached",
              description: `You can only select up to ${MAX_IMAGES} photos.`,
              variant: "destructive",
          });
          return uniqueImages.slice(0, MAX_IMAGES);
      }
      return uniqueImages;
    });
  };
  
  const handleDesktopFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const currentImageCount = images.length;
    const totalAfterAdd = currentImageCount + files.length;
    
    if (totalAfterAdd > MAX_IMAGES) {
        toast({
            title: "Maximum Images Reached",
            description: `You can only add ${MAX_IMAGES - currentImageCount} more photos.`,
            variant: "destructive",
        });
    }

    const imageFiles = Array.from(files)
      .filter(file => file.type.startsWith('image/'))
      .slice(0, MAX_IMAGES - currentImageCount);

    if(imageFiles.length === 0) {
        if(files.length > 0) {
            toast({ title: "No valid images selected", description: "Please select valid image files.", variant: "destructive" });
        }
        return;
    }

    const newImageObjects: ImageWithDimensions[] = [];
    let filesRead = 0;

    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        if (typeof src === 'string') {
          const img = document.createElement('img');
          img.onload = () => {
            newImageObjects.push({ src, width: img.width, height: img.height });
            filesRead++;
            if (filesRead === imageFiles.length) {
              setImages(prev => [...prev, ...newImageObjects].slice(0, MAX_IMAGES));
              if(viewState === 'home') {
                 setViewState('collage_manager');
              }
            }
          };
          img.src = src;
        } else {
            filesRead++;
            if (filesRead === imageFiles.length) {
              setImages(prev => [...prev, ...newImageObjects].slice(0, MAX_IMAGES));
              if(viewState === 'home') {
                 setViewState('collage_manager');
              }
            }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleContinueToEditor = () => {
    if (images.length < MIN_IMAGES) {
        toast({
            title: `Select at least ${MIN_IMAGES} photos`,
            description: `You need a minimum of ${MIN_IMAGES} photos to create a collage.`,
            variant: "destructive",
        });
        return;
    }
    router.push('/editor?flow=collage');
  };
  
  const handleCollageClick = () => {
    resetEditor();
    if(isMobile) {
      setViewState('collage_picker');
    } else {
      desktopFileInputRef.current?.click();
    }
  }

  const handleBackToHome = () => {
      resetEditor();
      setViewState('home');
  }
  
  const renderHomeView = () => (
      <>
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
      </>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-purple-50 overflow-x-hidden">
      
      <AnimatePresence mode="wait">
        {viewState === 'home' && (
            <motion.div 
                key="home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
            >
                {renderHomeView()}
            </motion.div>
        )}
        {viewState === 'collage_manager' && !isMobile && (
             <motion.div 
                key="collage-manager"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full flex-grow flex flex-col"
            >
                <header className="p-4 flex items-center justify-start border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
                    <Button variant="ghost" onClick={handleBackToHome}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Home
                    </Button>
                </header>
                <UploadStep onContinue={handleContinueToEditor} isCollageFlow={true} />
            </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewState === 'collage_picker' && isMobile && (
          <SmartPhotoPicker
            selected={images.map(img => img.src)}
            setImagesWithDimensions={setImages}
            onToggleSelect={(url) => {
              setImages(prev => {
                 if (prev.some(p => p.src === url)) {
                     return prev.filter(p => p.src !== url);
                 }
                 if (prev.length >= MAX_IMAGES) {
                     toast({ title: "Maximum reached", description: `You can only select up to ${MAX_IMAGES} photos.`});
                     return prev;
                 }
                 // This part needs dimensions, which we don't have here.
                 // The adding of new images should happen inside the picker.
                 return prev;
              });
            }}
            onAddImages={handleAddImages}
            onClose={handleBackToHome}
            onDone={handleContinueToEditor}
          />
        )}
      </AnimatePresence>
      
      <input
        type="file"
        ref={desktopFileInputRef}
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => handleDesktopFiles(e.target.files)}
      />
      
      {viewState === 'home' && (
          <footer className="py-6 px-4 text-center text-sm w-full">
            <p className="font-semibold text-blue-900/60">&copy; {new Date().getFullYear()} Photosheet Maker. All Rights Reserved.</p>
          </footer>
      )}
    </div>
  );
}
