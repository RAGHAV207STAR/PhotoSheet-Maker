
"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { ImageIcon, RotateCw, Shrink, Expand } from 'lucide-react';
import type { Photo } from '@/context/editor-context';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEditor } from '@/context/editor-context';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PhotoItemProps {
  photo: Photo;
  borderWidth: number;
  borderColor: string;
  isDragging?: boolean;
}

export function PhotoItem({ 
  photo, 
  borderWidth,
  borderColor,
  isDragging,
}: PhotoItemProps) {

  const { rotatePhoto, togglePhotoFit, selectedPhotoId, setSelectedPhotoId } = useEditor();
  const isSelected = selectedPhotoId === photo.id;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isOver,
  } = useSortable({
      id: photo.id,
      data: {
          type: 'photo',
          photo,
      }
  });

  const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
      position: 'absolute',
      left: `${photo.x}%`,
      top: `${photo.y}%`,
      width: `${photo.width}%`,
      height: `${photo.height}%`,
      opacity: isDragging ? 0.5 : 1,
  };

  const textVerticalAlignClass = {
    'top': 'justify-start',
    'middle': 'justify-center',
    'bottom': 'justify-end'
  }[photo.textVerticalAlign];

  const textAlignClass = {
    'left': 'text-left',
    'center': 'text-center',
    'right': 'text-right'
  }[photo.textAlign];

  const handleRotate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    rotatePhoto(photo.id);
  }

  const handleToggleFit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    togglePhotoFit(photo.id);
  }

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPhotoId(photo.id);
  };


  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      data-photo-id={photo.id}
      className={cn(
          'photo-item group', 
          isOver && !isDragging && 'drag-over',
          !photo.imageSrc && 'z-0',
          isSelected && !isDragging && 'ring-2 ring-primary ring-offset-2 z-10'
      )}
      onClick={handleSelect}
    >
      {photo.imageSrc ? (
         <div
          style={{
            borderWidth: `${borderWidth}px`,
            borderColor: borderColor,
          }}
          className='w-full h-full border-black relative overflow-hidden'
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={photo.imageSrc} 
            alt={`Photo ${photo.id}`} 
            className={cn(
              "photo-preview pointer-events-none w-full h-full",
              photo.fit === 'cover' ? 'object-cover' : 'object-contain'
            )}
            style={{ transform: `rotate(${photo.rotation}deg)` }}
          />
          {photo.text && (
            <div 
              className={cn(
                "absolute inset-0 p-1 flex flex-col pointer-events-none",
                textVerticalAlignClass
              )}
            >
              <div
                className={cn("w-full", textAlignClass)}
                style={{
                  color: photo.textColor,
                  fontSize: `${photo.fontSize}%`,
                  lineHeight: '1.2',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
                }}
              >
                {photo.text}
              </div>
            </div>
          )}

           <div className="absolute top-1 right-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity no-print flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                      variant="secondary"
                      size="icon"
                      className="h-6 w-6 rounded-full shadow-md"
                      onClick={handleToggleFit}
                      onPointerDown={(e) => e.stopPropagation()}
                  >
                      {photo.fit === 'cover' ? <Shrink className="h-3 w-3" /> : <Expand className="h-3 w-3" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle Fit ({photo.fit === 'cover' ? 'Contain' : 'Cover'})</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                      variant="secondary"
                      size="icon"
                      className="h-6 w-6 rounded-full shadow-md"
                      onClick={handleRotate}
                      onPointerDown={(e) => e.stopPropagation()}
                  >
                      <RotateCw className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Rotate Photo</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
           </div>
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
  borderColor: string;
}>((props, ref) => {
  const { 
    photos, 
    currentSheet, 
    borderWidth,
    borderColor
  } = props;

  const { setSelectedPhotoId } = useEditor();

  const handleBackgroundClick = () => {
    setSelectedPhotoId(null);
  }

  return (
    <div ref={ref} id="sheet-container" className="w-full h-full bg-white" onClick={handleBackgroundClick}>
      {photos.map((sheetData, sheetIndex) => (
        <div
          id={`sheet-${sheetIndex}`}
          className={cn("printable-area w-full h-full relative bg-white", sheetIndex !== currentSheet && "hidden")}
          key={`${sheetIndex}-${photos.length}-${borderWidth}-${borderColor}-${JSON.stringify(sheetData[0])}`}
        >
          {sheetData.map((photo) => {
            return (
              <PhotoItem 
                key={photo.id} 
                photo={photo}
                borderWidth={borderWidth}
                borderColor={borderColor}
              />
            )
          })}
          
          {sheetData.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-muted-foreground p-4 no-print">
                <ImageIcon className="h-12 w-12 mb-4" />
                <h3 className="text-lg font-semibold">A4 Preview</h3>
                <p className="text-sm max-w-xs mx-auto">Your photosheet layout will appear here. Adjust settings to generate a layout.</p>
              </div>
          )}
        </div>
      ))}
    </div>
  );
});

SheetPreview.displayName = "SheetPreview";
export default SheetPreview;
