
"use client";

import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Trash2, Plus } from 'lucide-react';
import type { ImagePlaceholder } from '@/lib/placeholder-images';
import { Button } from '../ui/button';
import { useRef, useState } from 'react';
import { ImagePreviewDialog } from './image-preview-dialog';

interface PhotoGridProps {
  images: (ImagePlaceholder | { id: string; imageUrl: string; description: string; imageHint: string })[];
  selected: string[];
  onToggleSelect: (imageUrl: string) => void;
  onAddClick?: () => void;
  isSelectionPreview?: boolean;
}

const PhotoGridItem = ({ item, isSelected, selectionIndex, onToggleSelect, isSelectionPreview }: {
    item: (ImagePlaceholder | { id: string; imageUrl: string; description: string; imageHint: string });
    isSelected: boolean;
    selectionIndex: number;
    onToggleSelect: (imageUrl:string) => void;
    isSelectionPreview?: boolean;
}) => {
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const didLongPress = useRef(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handlePointerDown = () => {
      didLongPress.current = false;
      pressTimer.current = setTimeout(() => {
          didLongPress.current = true;
          setIsPreviewOpen(true);
      }, 500); // 500ms for a long press
  };

  const handlePointerUp = () => {
      if (pressTimer.current) {
          clearTimeout(pressTimer.current);
      }
  };

  const handleClick = (e: React.MouseEvent) => {
      if (didLongPress.current) {
          e.preventDefault();
          return;
      }
      e.stopPropagation();
      onToggleSelect(item.imageUrl);
  }

  const closePreview = () => {
    setIsPreviewOpen(false);
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="relative aspect-square cursor-pointer group"
        onClick={isSelectionPreview ? undefined : handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <Image
          src={item.imageUrl}
          alt={item.description}
          fill
          sizes="(max-width: 768px) 33vw, (max-width: 1200px) 25vw, 20vw"
          className={cn(
            "object-cover rounded-lg transition-all duration-300",
            isSelected && !isSelectionPreview && "scale-90"
          )}
          data-ai-hint={item.imageHint}
        />
        <div
          className={cn(
            "absolute inset-0 rounded-lg transition-all duration-300 pointer-events-none",
            isSelected && !isSelectionPreview
              ? 'bg-purple-500/30 ring-4 ring-purple-500 ring-offset-2 ring-offset-background' 
              : 'bg-black/40 opacity-0 group-hover:opacity-100'
          )}
           style={{
                borderColor: isSelected ? '#A855F7' : 'transparent',
            }}
        />
        <AnimatePresence>
          {isSelected && !isSelectionPreview && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="absolute top-1 right-1 bg-purple-600 rounded-full text-white h-5 w-5 flex items-center justify-center text-xs font-bold shadow-lg pointer-events-none"
            >
              {selectionIndex + 1}
            </motion.div>
          )}
        </AnimatePresence>
        
        {isSelectionPreview && (
              <div className="absolute top-1 right-1">
                  <Button size="icon" variant="destructive" className="h-6 w-6 opacity-80 hover:opacity-100 rounded-full" onClick={handleClick}>
                      <Trash2 className="h-3 w-3"/>
                      <span className="sr-only">Remove image</span>
                  </Button>
              </div>
        )}
      </motion.div>
      <ImagePreviewDialog
          isOpen={isPreviewOpen}
          onOpenChange={setIsPreviewOpen}
          imageUrl={item.imageUrl}
          onViewSheet={closePreview}
          title="Image Preview"
      />
    </>
  );
};


export default function PhotoGrid({ images, selected, onToggleSelect, onAddClick, isSelectionPreview = false }: PhotoGridProps) {
  const gridClasses = isSelectionPreview
    ? "grid grid-flow-col auto-cols-max gap-2 p-2"
    : "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 p-2";
  
  const itemClasses = isSelectionPreview ? "h-20 w-20" : "";

  return (
    <div className={gridClasses}>
      <AnimatePresence>
        {images.map(item => {
          const isSelected = selected.includes(item.imageUrl);
          const selectionIndex = isSelected ? selected.indexOf(item.imageUrl) : -1;
          return (
            <div key={item.imageUrl} className={itemClasses}>
              <PhotoGridItem 
                  item={item}
                  isSelected={isSelected}
                  selectionIndex={selectionIndex}
                  onToggleSelect={onToggleSelect}
                  isSelectionPreview={isSelectionPreview}
              />
            </div>
          )
        })}
      </AnimatePresence>
      {!isSelectionPreview && onAddClick && (
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={onAddClick}
            className="relative aspect-square cursor-pointer group flex items-center justify-center bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg hover:bg-slate-200 hover:border-purple-500 transition-colors"
        >
            <div className="text-center text-slate-500 group-hover:text-purple-600 transition-colors">
                <Plus className="h-8 w-8 mx-auto" />
                <p className="text-sm font-semibold mt-1">Add More</p>
            </div>
        </motion.div>
      )}
    </div>
  );
}
