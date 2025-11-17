
"use client";

import React, { type RefObject } from 'react';
import { cn } from '@/lib/utils';
import { ImageIcon } from 'lucide-react';
import type { Photo } from '@/context/editor-context';

interface PhotoItemProps {
  photo: Photo;
  index: number;
  borderWidth: number;
  isDragging: boolean;
  isDropTarget: boolean;
  handleDragStart: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  handleDragEnd: () => void;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragEnter: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  handleTouchStart: (e: React.TouchEvent<HTMLDivElement>, index: number) => void;
  handleTouchMove: (e: React.TouchEvent<HTMLDivElement>) => void;
  handleTouchEnd: () => void;
}

const PhotoItem = ({ 
  photo, 
  index, 
  borderWidth,
  isDragging,
  isDropTarget,
  handleDragStart,
  handleDragEnd,
  handleDragOver,
  handleDragEnter,
  handleDragLeave,
  handleDrop,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
}: PhotoItemProps) => {

  return (
    <div
      data-photo-index={index}
      style={{
        position: 'absolute',
        left: `${photo.x}%`,
        top: `${photo.y}%`,
        width: `${photo.width}%`,
        height: `${photo.height}%`,
        opacity: isDragging ? 0.5 : 1,
      }}
      className={cn(
          'photo-item', 
          isDropTarget && 'drag-over-glow',
          !photo.imageSrc && 'placeholder-wrapper'
      )}
      draggable={!!photo.imageSrc}
      onDragStart={(e) => handleDragStart(e, index)}
      onDragOver={handleDragOver}
      onDragEnter={(e) => handleDragEnter(e, index)}
      onDragLeave={handleDragLeave}
      onDrop={(e) => handleDrop(e, index)}
      onDragEnd={handleDragEnd}
      onTouchStart={(e) => handleTouchStart(e, index)}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {photo.imageSrc ? (
         <div
          style={{
            borderWidth: `${borderWidth}px`,
          }}
          className='w-full h-full border-black'
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.imageSrc} alt={`Photo ${photo.id}`} className="photo-preview pointer-events-none" />
        </div>
      ) : (
        <div className="w-full h-full border-dashed border-slate-300" style={{borderWidth: '2px'}}>
          <div className="placeholder-icon flex items-center justify-center h-full w-full no-print">
            <ImageIcon className="h-6 w-6 text-gray-400" />
          </div>
        </div>
      )}
    </div>
  );
};


const SheetPreview = React.forwardRef<HTMLDivElement, {
  photos: Photo[][];
  currentSheet: number;
  borderWidth: number;
  dropTargetIndex: number | null;
  dragIndex: RefObject<number | null>;
  touchTargetIndex: RefObject<number | null>;
  setDropTargetIndex: (index: number | null) => void;
  swapPhotos: (dropIndex: number) => void;
}>((props, ref) => {
  const { 
    photos, 
    currentSheet, 
    borderWidth,
    dropTargetIndex,
    dragIndex,
    touchTargetIndex,
    setDropTargetIndex,
    swapPhotos
  } = props;

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    const target = e.target as HTMLDivElement;
    if (target.querySelector('img')?.src) {
        dragIndex.current = index;
        e.dataTransfer.effectAllowed = "move";
    } else {
        e.preventDefault();
    }
  };
  
  const handleDragEnd = () => {
    dragIndex.current = null;
    setDropTargetIndex(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); 
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (dragIndex.current !== null && dragIndex.current !== index) {
        setDropTargetIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDropTargetIndex(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (dragIndex.current !== null) {
      swapPhotos(index);
    }
    handleDragEnd();
  };
  
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>, index: number) => {
    const target = e.currentTarget as HTMLDivElement;
    if (target.querySelector('img')?.src) {
        dragIndex.current = index;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
      const touch = e.touches[0];
      if (!touch || dragIndex.current === null) return;
      
      const dropTargetElement = document.elementFromPoint(touch.clientX, touch.clientY);
      const dropTargetIndexAttr = dropTargetElement?.closest('.photo-item')?.getAttribute('data-photo-index');
      
      if (dropTargetIndexAttr) {
          const dropIndex = parseInt(dropTargetIndexAttr, 10);
          if (!isNaN(dropIndex) && dropIndex !== dragIndex.current) {
            setDropTargetIndex(dropIndex);
            touchTargetIndex.current = dropIndex;
          } else {
             // If hovering over the same element, clear the target
            if (dropIndex === dragIndex.current) {
               setDropTargetIndex(null);
               touchTargetIndex.current = null;
            }
          }
      } else {
        touchTargetIndex.current = null;
        setDropTargetIndex(null);
      }
  };

  const handleTouchEnd = () => {
    if (dragIndex.current !== null && touchTargetIndex.current !== null) {
      swapPhotos(touchTargetIndex.current);
    }
    dragIndex.current = null;
    touchTargetIndex.current = null;
    setDropTargetIndex(null);
  };


  const sheetToRender = (photos && photos[currentSheet]) ? photos[currentSheet] : [];

  return (
    <div ref={ref} id="sheet-container" className="w-full h-full bg-white">
      <div
        id={`sheet-${currentSheet}`}
        className="printable-area w-full h-full relative bg-white"
        key={`${currentSheet}-${photos.length}-${borderWidth}-${JSON.stringify(sheetToRender[0])}`}
      >
        {sheetToRender.map((photo, index) => {
           const isDragging = dragIndex.current === index;
           const isDropTarget = dropTargetIndex === index;
           return (
             <PhotoItem 
                key={photo.id} 
                index={index} 
                photo={photo}
                borderWidth={borderWidth}
                isDragging={isDragging}
                isDropTarget={isDropTarget}
                handleDragStart={handleDragStart}
                handleDragEnd={handleDragEnd}
                handleDragOver={handleDragOver}
                handleDragEnter={handleDragEnter}
                handleDragLeave={handleDragLeave}
                handleDrop={handleDrop}
                handleTouchStart={handleTouchStart}
                handleTouchMove={handleTouchMove}
                handleTouchEnd={handleTouchEnd}
              />
           )
        })}
        
        {sheetToRender.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-muted-foreground p-4 no-print">
              <ImageIcon className="h-12 w-12 mb-4" />
              <h3 className="text-lg font-semibold">A4 Preview</h3>
              <p className="text-sm max-w-xs mx-auto">Your photosheet layout will appear here. Adjust settings to generate a layout.</p>
            </div>
        )}
      </div>
    </div>
  );
});

SheetPreview.displayName = "SheetPreview";
export default SheetPreview;
