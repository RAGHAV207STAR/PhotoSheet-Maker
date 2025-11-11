
"use client";

import { ChangeEvent, useRef, useState, DragEvent } from 'react';
import Image from 'next/image';
import { useEditor, ImageWithDimensions } from '@/context/editor-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Image as ImageIcon, ArrowRight, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadStepProps {
  onContinue: () => void;
}

const MAX_IMAGES = 100;

export default function UploadStep({ onContinue }: UploadStepProps) {
  const { images, setImages } = useEditor();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files: FileList) => {
    if (files.length === 0) return;

    const totalAfterAdd = images.length + files.length;
    if (totalAfterAdd > MAX_IMAGES) {
        toast({
            title: "Maximum Images Reached",
            description: `You can select a maximum of ${MAX_IMAGES} photos. You tried to add ${files.length} but only ${MAX_IMAGES - images.length} spots are left.`,
            variant: "destructive",
        });
    }

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
      const filesToProcess = validFiles.slice(0, MAX_IMAGES - images.length);
      
      const newImages: ImageWithDimensions[] = [];
      let filesRead = 0;
      
      filesToProcess.forEach(file => {
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
          if (loadEvent.target?.result) {
            const src = loadEvent.target.result as string;
            const img = document.createElement('img');
            img.onload = () => {
              newImages.push({ src, width: img.width, height: img.height });
              filesRead++;
              if (filesRead === filesToProcess.length) {
                 setImages(prev => [...prev, ...newImages]);
              }
            };
            img.src = src;
          } else {
             filesRead++;
             if (filesRead === filesToProcess.length) {
                 setImages(prev => [...prev, ...newImages]);
              }
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
       // Reset the input value to allow selecting the same file again
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

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  }

  const title = 'Upload Your Photo(s)';
  const description = `You can upload multiple photos to appear on the sheet.`;


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
            <div 
                onClick={images.length === 0 ? triggerUpload : undefined} 
                className={cn(
                    "relative w-full h-full mx-auto flex items-center justify-center p-0",
                    images.length === 0 && "cursor-pointer group"
                )}
            >
                <AnimatePresence mode="wait">
                    {(images.length > 0) ? (
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
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                            <AnimatePresence>
                                {images.map((img, index) => (
                                <motion.div 
                                    key={img.src.slice(0, 50) + index} // Use a portion of the data URL as key
                                    layout
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    className="relative aspect-square group shadow-md rounded-lg overflow-hidden"
                                >
                                    <Image src={img.src} alt={`Uploaded photo ${index + 1}`} fill className="object-cover" sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                                        <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => removeImage(index)}>
                                            <Trash2 className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                </motion.div>
                                ))}
                            </AnimatePresence>
                            {images.length < MAX_IMAGES && (
                                <motion.div
                                    layout
                                    onClick={triggerUpload}
                                    className="relative aspect-square group shadow-md rounded-lg overflow-hidden border-2 border-dashed border-slate-300 bg-slate-100 hover:border-primary hover:bg-slate-200/60 transition-all flex items-center justify-center cursor-pointer"
                                >
                                    <div className="text-center text-slate-600 p-2">
                                        <motion.div
                                            whileHover={{ scale: 1.1, y: -2 }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                                        >
                                            <Upload className="h-8 w-8 mx-auto" />
                                        </motion.div>
                                        <p className="text-sm font-semibold mt-1">Add More</p>
                                    </div>
                                </motion.div>
                            )}
                            </div>
                        </motion.div>
                    ) : (
                        <Card className="w-full bg-white/60 backdrop-blur-lg border-2 border-dashed border-gray-300 hover:border-primary transition-colors duration-300">
                            <CardContent className="p-0">
                                <motion.div
                                    key="upload-prompt"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="text-center text-muted-foreground p-4 flex flex-col items-center gap-4 aspect-video sm:aspect-[2/1] lg:aspect-[3/1] justify-center"
                                >
                                     <div className="text-center mb-4">
                                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-800">{title}</h1>
                                        <p className="text-muted-foreground mt-1 text-sm sm:text-base">{description}</p>
                                    </div>
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
                                </motion.div>
                            </CardContent>
                        </Card>
                    )}
                </AnimatePresence>
            </div>
            <Input ref={inputRef} id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} multiple />
        </div>
      </main>
      <footer className="bg-background/80 backdrop-blur-sm border-t p-4 fixed bottom-0 left-0 right-0 z-10 no-print">
        <div className="w-full max-w-lg mx-auto">
            {images.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                    <Button onClick={onContinue} className="w-full flex bg-slate-900 text-white hover:bg-slate-800" size="lg" disabled={images.length === 0}>
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
