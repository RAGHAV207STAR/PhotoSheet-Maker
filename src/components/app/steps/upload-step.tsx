
"use client";

import { ChangeEvent, useRef, useState, DragEvent } from 'react';
import Image from 'next/image';
import { useEditor } from '@/context/editor-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Image as ImageIcon, ArrowRight, RefreshCw, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadStepProps {
  onContinue: () => void;
}

export default function UploadStep({ onContinue }: UploadStepProps) {
  const { images, setImages } = useEditor();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files: FileList) => {
    if (files.length === 0) return;

    const validFiles: File[] = [];
    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        validFiles.push(file);
      } else {
        toast({
          title: "Invalid File Skipped",
          description: `"${file.name}" is not a valid image file.`,
          variant: "destructive",
        });
      }
    }

    if (validFiles.length > 0) {
      const newImages: string[] = [];
      let filesRead = 0;
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
          newImages.push(loadEvent.target?.result as string);
          filesRead++;
          if (filesRead === validFiles.length) {
            setImages(prev => [...prev, ...newImages]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
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

  const handleReset = () => {
    setImages([]);
    if (inputRef.current) {
        inputRef.current.value = '';
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col flex-grow pb-32 md:pb-20">
      <main className="w-full max-w-2xl mx-auto flex flex-col items-center p-4 sm:p-6 lg:p-8 gap-8">
        <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Upload Your Photo(s)</h1>
            <p className="text-muted-foreground mt-1">{images.length > 0 ? 'Review your photos and continue.' : 'Select one or more images from your device.'}</p>
        </div>
        
        <div className="w-full">
          <Card 
            className={cn(
              "w-full h-full transition-all duration-300 shadow-lg",
              isDragging && "border-primary ring-2 ring-primary"
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <CardContent 
              onClick={images.length === 0 ? triggerUpload : undefined} 
              className={cn(
                "relative w-full max-w-2xl mx-auto flex items-center justify-center overflow-hidden p-0",
                images.length === 0 && "cursor-pointer group aspect-video"
              )}
            >
              <AnimatePresence mode="wait">
                {images.length > 0 ? (
                    <motion.div
                        key="image-gallery"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full h-full grid grid-cols-3 sm:grid-cols-4 gap-2 p-4"
                    >
                        {images.map((img, index) => (
                           <div key={index} className="relative aspect-square group">
                                <Image src={img} alt={`Uploaded photo ${index + 1}`} fill className="object-cover rounded-md" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                                    <Button size="icon" variant="destructive" onClick={() => removeImage(index)}>
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                </div>
                           </div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        key="upload-prompt"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="text-center text-muted-foreground p-4 flex flex-col items-center gap-4"
                    >
                        <div className='border-2 border-dashed border-gray-300 rounded-full p-4 sm:p-6 group-hover:border-primary group-hover:text-primary transition-colors'>
                            <ImageIcon className="h-10 w-10 sm:h-12 sm:w-12" />
                        </div>
                        <div className='flex flex-col gap-2 items-center'>
                            <span className="font-semibold text-base sm:text-lg">Click or Drag to Upload</span>
                            <p className='text-xs sm:text-sm'>or</p>
                            <Button onClick={(e) => { e.stopPropagation(); triggerUpload(); }} variant="ghost" size="sm">
                                <Upload className="mr-2 h-4 w-4" /> Select from Device
                            </Button>
                        </div>
                        <p className="text-xs mt-2">Supports JPG, PNG, WEBP (multiple files allowed)</p>
                    </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
          <Input ref={inputRef} id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} multiple />
        </div>

      </main>
      <footer className="bg-background/80 backdrop-blur-sm border-t p-4 fixed bottom-16 md:bottom-0 left-0 right-0 z-10 no-print">
        <div className="w-full max-w-lg mx-auto">
            {images.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" onClick={handleReset} size="lg">
                        <RefreshCw className="mr-2"/> Clear All
                    </Button>
                    <Button onClick={onContinue} className="w-full flex" size="lg">
                        Generate Sheet
                        <ArrowRight className="ml-2" />
                    </Button>
                </div>
            ) : (
                <Button onClick={triggerUpload} className="w-full flex" size="lg">
                    <Upload className="mr-2"/>
                    Upload Photo(s)
                </Button>
            )}
        </div>
      </footer>
    </div>
  );
}
