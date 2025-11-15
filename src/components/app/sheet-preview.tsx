
"use client";

import { useEditor } from '@/context/editor-context';
import { Image as ImageIcon } from 'lucide-react';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const SheetPreview = forwardRef<HTMLDivElement>((props, ref) => {
  const { 
    photos, 
    currentSheet,
    swapPhoto,
    borderWidth,
  } = useEditor();

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.setData("dragIndex", index.toString());
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault();
    const sourceIndexStr = e.dataTransfer.getData("dragIndex");
    if (sourceIndexStr === null) return;
  
    const sourceIndex = parseInt(sourceIndexStr, 10);
    if (sourceIndex !== targetIndex) {
        swapPhoto(sourceIndex, targetIndex);
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const sheetToRender = photos[currentSheet] || [];

  return (
    <div ref={ref} id="sheet-container" className="w-full h-full bg-white">
      <div
        id={`sheet-${currentSheet}`}
        className="printable-area w-full h-full relative bg-white"
      >
        {sheetToRender.map((photo, index) => (
          <div
            key={photo.id}
            className="photo-item"
            style={{
              position: 'absolute',
              left: `${photo.x}%`,
              top: `${photo.y}%`,
              width: `${photo.width}%`,
              height: `${photo.height}%`,
              borderWidth: `${borderWidth}px`,
              borderStyle: photo.imageSrc ? 'solid' : 'dashed',
              borderColor: photo.imageSrc ? 'black' : '#cbd5e1'
            }}
            draggable={!!photo.imageSrc}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
          >
            {photo.imageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo.imageSrc} alt={`Photo ${photo.id}`} className="photo-preview pointer-events-none" />
            ) : (
              <div className="placeholder-icon flex items-center justify-center h-full w-full">
                <ImageIcon className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>
        ))}

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
