
"use client";

import { useEditor } from '@/context/editor-context';
import { Image as ImageIcon } from 'lucide-react';
import { useMemo, useEffect, useCallback } from 'react';
import DraggablePhoto from './draggable-photo';
import DroppablePlaceholder from './droppable-placeholder';

export default function SheetPreview() {
  const { 
    images, 
    photos, 
    photoWidthCm, 
    photoHeightCm, 
    photoSpacing, 
    setPhotos, 
    copies 
  } = useEditor();

  const placeholders = useMemo(() => {
    const sheetWidthMm = 210;
    const sheetHeightMm = 297;
    const photoWidthMm = photoWidthCm * 10;
    const photoHeightMm = photoHeightCm * 10;
    const spacingMm = photoSpacing * 10;
    
    const newPlaceholders = [];
    if (photoWidthMm > 0 && photoHeightMm > 0) {
        const cols = Math.floor((sheetWidthMm + spacingMm) / (photoWidthMm + spacingMm));
        const rows = Math.floor((sheetHeightMm + spacingMm) / ((photoHeightMm + spacingMm)));
        
        if (cols > 0 && rows > 0) {
            const totalGridWidth = (cols * photoWidthMm) + ((cols - 1) * spacingMm);
            const totalGridHeight = (rows * photoHeightMm) + ((rows - 1) * spacingMm);
            
            let startX = (sheetWidthMm - totalGridWidth) / 2;
            let startY = spacingMm;

            if (sheetHeightMm - totalGridHeight < spacingMm) {
              startY = Math.max(2, (sheetHeightMm - totalGridHeight) / 2);
            }
            
            if (sheetWidthMm - totalGridWidth < spacingMm) {
               startX = Math.max(2, (sheetWidthMm - totalGridWidth) / 2);
            }

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const xPos = startX + c * (photoWidthMm + spacingMm);
                    const yPos = startY + r * (photoHeightMm + spacingMm);

                    if (xPos + photoWidthMm > sheetWidthMm + 1 || yPos + photoHeightMm > sheetHeightMm + 1) continue;

                    newPlaceholders.push({
                        id: r * cols + c,
                        x: (xPos / sheetWidthMm) * 100,
                        y: (yPos / sheetHeightMm) * 100,
                        width: (photoWidthMm / sheetWidthMm) * 100,
                        height: (photoHeightMm / sheetHeightMm) * 100,
                        imageSrc: '', // Start with no image
                    });
                }
            }
        }
    }
    return newPlaceholders;
  }, [photoWidthCm, photoHeightCm, photoSpacing]);

  const populatePhotos = useCallback(() => {
    const totalPhotosToPlace = copies * images.length;
    
    const newPhotos = placeholders.map((p, index) => {
      const imageIndex = index % images.length;
      return {
        ...p,
        imageSrc: (images.length > 0 && index < totalPhotosToPlace) ? images[imageIndex] : ''
      };
    });

    setPhotos(newPhotos.slice(0, placeholders.length));
  }, [placeholders, copies, images, setPhotos]); 
  
  useEffect(() => {
    populatePhotos();
  }, [populatePhotos]);


  return (
    <div className="printable-area-wrapper h-full">
      <div
        id="photosheet-container"
        className="printable-area w-full h-full relative bg-white"
      >
          {photos.map((photo) => (
            <DroppablePlaceholder key={photo.id} photo={photo}>
              {photo.imageSrc ? (
                <DraggablePhoto photo={photo} />
              ) : null}
            </DroppablePlaceholder>
          ))}

          {photos.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-muted-foreground p-4 no-print">
              <ImageIcon className="h-12 w-12 mb-4" />
              <h3 className="text-lg font-semibold">A4 Preview</h3>
              <p className="text-sm max-w-xs mx-auto">Your photosheet layout will appear here. Adjust settings to generate a layout.</p>
            </div>
          )}
      </div>
    </div>
  );
}
