
"use client";

import { ChangeEvent, useRef, useState, DragEvent } from 'react';
import Image from 'next/image';
import { useEditor, ImageWithDimensions } from '@/context/editor-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Image as ImageIcon, ArrowRight, Trash2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { useDraggable } from '@dnd-kit/core';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface UploadStepProps {
  onContinue: () => void;
  onBack: () => void;
}

const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];

const DraggableUploadedImage = ({ img, onRemove }: { img: ImageWithDimensions; onRemove: () => void }) => {
    const { attributes, listeners, setNodeRef } = useDraggable({
        id: img.src,
        data: {
            isFromUploadedList: true,
        }
    });

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-24 h-24 aspect-square group shadow-md rounded-lg overflow-hidden bg-slate-200 flex-shrink-0"
        >
            <div ref={setNodeRef} {...listeners} {...attributes} className="w-full h-full cursor-grab touch-none">
                <Image src={img.src} alt={`Uploaded photo`} fill className="object-cover" sizes="100px" />
            </div>
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                <Button size="icon" variant="destructive" className="h-8 w-8" onClick={onRemove}>
                    <Trash2 className="h-4 w-4"/>
                </Button>
            </div>
        </motion.div>
    );
};


export default function UploadStep({ onContinue, onBack }: UploadStepProps) {
  const { images, setImages } = useEditor();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = (file: File): Promise<ImageWithDimensions | null> => {
    return new Promise((resolve) => {
        if (!SUPPORTED_FORMATS.includes(file.type)) {
            toast({
                title: "Unsupported File Type",
                description: `"${file.name}" is not a supported image format. Please use JPG, PNG, or WEBP.`,
                variant: "destructive",
            });
            resolve(null);
            return;
        }

        const reader = new FileReader();
        reader.onload = (loadEvent) => {
            if (loadEvent.target?.result) {
                const src = loadEvent.target.result as string;
                const img = document.createElement('img');
                img.onload = () => {
                    resolve({ src, width: img.width, height: img.height });
                };
                img.onerror = () => {
                    toast({
                        title: "Image Load Error",
                        description: `Could not load "${file.name}". The file may be corrupt or not a valid image.`,
                        variant: "destructive",
                    });
                    resolve(null);
                };
                img.src = src;
            } else {
                 toast({
                    title: "File Read Error",
                    description: `An empty file was read for: ${file.name}`,
                    variant: "destructive",
                });
                resolve(null);
            }
        };
        reader.onerror = () => {
            toast({
                title: "File Read Error",
                description: `Could not read file: ${file.name}`,
                variant: "destructive",
            });
            resolve(null);
        };
        reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (files: FileList) => {
    if (files.length === 0) return;
    
    const newImagesPromises = Array.from(files).map(processFile);
    const newImages = (await Promise.all(newImagesPromises)).filter((img): img is ImageWithDimensions => img !== null);

    if (newImages.length > 0) {
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
       e.target.value = '';
    }
  };
  
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const triggerUpload = () => {
    inputRef.current?.click();
  };

  const removeImage = (srcToRemove: string) => {
    setImages(prev => prev.filter(img => img.src !== srcToRemove));
  }

  const title = 'Upload Your Photos';
  const description = `Select one or more clear, well-lit photos for your sheet.`;

  const hasImages = images.length > 0;

  return (
    <div className="flex flex-col flex-1 bg-background">
      <main 
          className="w-full max-w-7xl mx-auto flex-grow flex flex-col p-2 sm:p-4 md:p-6 lg:p-8 gap-6 md:gap-8 pb-32 md:pb-28"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
      >
        <div 
            className={cn(
                "relative w-full h-full transition-all duration-300 rounded-xl",
                isDragging && "ring-4 ring-primary ring-offset-4 ring-offset-background"
            )}
        >
            <AnimatePresence mode="wait">
                {hasImages ? (
                    <motion.div
                        key="image-gallery"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full h-full"
                    >
                        <Card className="w-full bg-transparent border-0 shadow-none mb-6">
                            <CardHeader className="text-center">
                            <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-800">{title}</CardTitle>
                            <CardDescription className="text-base">{description}</CardDescription>
                            </CardHeader>
                        </Card>
                        <div className="flex flex-col items-center gap-4">
                           <ScrollArea className="w-full">
                               <div className="flex items-center gap-4 p-4 justify-center">
                                    <AnimatePresence>
                                        {images.map((img) => (
                                            <DraggableUploadedImage key={img.src} img={img} onRemove={() => removeImage(img.src)} />
                                        ))}
                                    </AnimatePresence>
                               </div>
                               <ScrollBar orientation="horizontal" />
                           </ScrollArea>
                            <Button onClick={triggerUpload} variant="outline">
                                <Upload className="mr-2 h-4 w-4" />
                                Add More Photos
                            </Button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="upload-prompt"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                    >
                         <Card className="w-full bg-white/60 backdrop-blur-lg border-0 shadow-lg">
                            <CardHeader className="text-center">
                                <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-800">{title}</CardTitle>
                                <CardDescription className="text-base">{description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div 
                                    onClick={triggerUpload}
                                    className="cursor-pointer group mt-4 border-2 border-dashed border-gray-300 group-hover:border-primary transition-colors duration-300 rounded-lg"
                                >
                                    <div className="text-center text-muted-foreground p-4 flex flex-col items-center gap-4 aspect-video sm:aspect-[2/1] lg:aspect-[3/1] justify-center">
                                        <motion.div
                                            whileHover={{ scale: 1.1 }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                                            className='border-2 border-dashed border-gray-300 rounded-full p-4 sm:p-6 group-hover:border-primary group-hover:text-primary transition-colors'
                                        >
                                            <ImageIcon className="h-10 w-10 sm:h-12 sm:w-12" />
                                        </motion.div>
                                        <div className='flex flex-col gap-2 items-center'>
                                            <span className="font-semibold text-base sm:text-lg text-slate-700">Click or Drag & Drop to Upload</span>
                                            <p className='text-xs sm:text-sm'>or</p>
                                            <Button onClick={(e) => { e.stopPropagation(); triggerUpload(); }} variant="ghost" size="sm">
                                                <Upload className="mr-2 h-4 w-4" /> Select from Device
                                            </Button>
                                        </div>
                                        <p className="text-xs mt-2">Supports JPG, PNG, WEBP.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
            <Input ref={inputRef} id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} multiple />
        </div>
      </main>
      <footer className="bg-background/80 backdrop-blur-sm border-t p-4 fixed bottom-0 left-0 right-0 z-10 no-print">
        <div className="w-full max-w-lg mx-auto flex flex-col sm:flex-row gap-2">
            <Button onClick={onBack} variant="outline" className="w-full" size="lg">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
            </Button>
            <Button onClick={onContinue} className="w-full bg-slate-900 text-white hover:bg-slate-800" size="lg" disabled={!hasImages}>
                Page Setup
                <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        </div>
      </footer>
    </div>
  );
}
