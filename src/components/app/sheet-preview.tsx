
"use client"

import { useEditor } from '@/context/editor-context';
import { Image as ImageIcon } from 'lucide-react';
import DraggablePhoto from './draggable-photo';
import DroppablePlaceholder from './droppable-placeholder';

export default function SheetPreview() {
  const { image, photos } = useEditor();

  return (
    <div className="printable-area-wrapper h-full">
      <div
        id="photosheet-container"
        className="printable-area w-full h-full relative bg-white"
      >
          {/* Render droppable placeholders */}
          {photos.map((photo) => (
            <DroppablePlaceholder key={photo.id} photo={photo} />
          ))}

          {/* Render draggable photos on top */}
          {image && photos.map((photo) => (
            <DraggablePhoto key={photo.id} photo={photo} imageSrc={image} />
          ))}

          {photos.length === 0 && !image && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-muted-foreground p-4 no-print">
              <ImageIcon className="h-12 w-12 mb-4" />
              <h3 className="text-lg font-semibold">A4 Preview</h3>
              <p className="text-sm max-w-xs mx-auto">Your photosheet will appear here once you select a number of copies.</p>
            </div>
          )}
      </div>
    </div>
  );
}
