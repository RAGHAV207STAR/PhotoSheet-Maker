
"use client";

import { ChangeEvent, useRef, useState, DragEvent } from 'react';
import Image from 'next/image';
import { useEditor } from '@/context/editor-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Image as ImageIcon, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface UploadStepProps {
  onContinue: () => void;
}

export default function UploadStep({ onContinue }: UploadStepProps) {
  const { image, setImage } = useEditor();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setImage(loadEvent.target?.result as string);
        toast({
          title: "Image Uploaded",
          description: "Your photo is ready for the next step.",
        });
      };
      reader.readAsDataURL(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please upload a valid image file (JPG, PNG, WEBP).",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };
  
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
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

  return (
    <div className="flex flex-col flex-grow pb-32 md:pb-20">
      <main className="w-full max-w-lg mx-auto flex flex-col items-center p-4 sm:p-6 lg:p-8 gap-8">
        <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Upload Your Photo</h1>
            <p className="text-muted-foreground mt-1">Select an image from your device to get started</p>
        </div>
        
        <div className="w-full">
          <Card 
            className={cn(
              "w-full h-full transition-colors duration-300",
              isDragging && "border-primary ring-2 ring-primary"
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <CardContent 
              onClick={!image ? triggerUpload : undefined} 
              className={cn(
                "relative w-full aspect-[3/4] max-w-sm mx-auto flex items-center justify-center overflow-hidden p-0",
                !image && "cursor-pointer group"
              )}
            >
              {image ? (
                <Image src={image} alt="Uploaded photo" layout="fill" objectFit="contain" />
              ) : (
                <div className="text-center text-muted-foreground p-4 flex flex-col items-center gap-4">
                  <div className='border-2 border-dashed border-gray-300 rounded-full p-6 group-hover:border-primary group-hover:text-primary transition-colors'>
                    <ImageIcon className="h-16 w-16" />
                  </div>
                  <div className='flex flex-col gap-2 items-center'>
                    <span className="font-semibold text-lg">Click or Drag to Upload</span>
                    <p className='text-sm'>or</p>
                    <Button onClick={(e) => { e.stopPropagation(); triggerUpload(); }} size="sm">
                      <Upload className="mr-2 h-4 w-4" /> Select from Device
                    </Button>
                  </div>
                  <p className="text-xs mt-2">Supports JPG, PNG, WEBP</p>
                </div>
              )}
            </CardContent>
          </Card>
          <Input ref={inputRef} id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </div>

      </main>
      <footer className="bg-background border-t p-4 fixed bottom-16 md:bottom-0 left-0 right-0 z-10 no-print">
        <div className="w-full max-w-lg mx-auto">
            <Button onClick={onContinue} disabled={!image} className="w-full flex" size="lg">
              Generate PhotoSheet
              <ArrowRight className="ml-2" />
            </Button>
        </div>
      </footer>
    </div>
  );
}
