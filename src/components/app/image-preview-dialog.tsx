
"use client";

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Sheet, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImagePreviewDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  imageUrl: string;
  onViewSheet: () => void;
  title?: string;
}

export function ImagePreviewDialog({ isOpen, onOpenChange, imageUrl, onViewSheet, title = "Image Preview" }: ImagePreviewDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-3xl p-0 gap-0"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="relative aspect-[4/3] w-full bg-slate-900/10 flex items-center justify-center overflow-hidden rounded-md">
            {imageUrl ? (
              <Image src={imageUrl} alt={title} fill className="object-contain" />
            ) : (
                <div className="text-muted-foreground">No image</div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 p-4">
                <DialogHeader>
                    <DialogTitle className="text-white text-lg font-bold" style={{textShadow: '1px 1px 3px rgba(0,0,0,0.5)'}}>{title}</DialogTitle>
                </DialogHeader>
            </div>
            <DialogFooter className="absolute bottom-0 left-0 right-0 p-4 bg-transparent flex-row sm:justify-end gap-2">
                <Button variant="secondary" onClick={() => onOpenChange(false)}>
                    <X className="mr-2 h-4 w-4" />
                    Close
                </Button>
                <Button onClick={onViewSheet}>
                    <Sheet className="mr-2 h-4 w-4" />
                    View Sheet
                </Button>
            </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}


    
