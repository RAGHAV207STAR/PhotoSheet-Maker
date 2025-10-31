
"use client";

import Image from 'next/image';
import { useDrag } from 'react-dnd';
import { type Photo, useEditor } from '@/context/editor-context';
import { cn } from '@/lib/utils';

interface DraggablePhotoProps {
  photo: Photo;
}

export default function DraggablePhoto({ photo }: DraggablePhotoProps) {
  const { borderWidth } = useEditor();
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'PHOTO',
    item: { id: photo.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={(node) => { if (node) drag(node); }}
      className={cn(
        "relative w-full h-full cursor-grab border-black",
        isDragging ? "opacity-50" : "opacity-100"
      )}
      style={{
        borderWidth: `${borderWidth}px`
      }}
    >
      <Image
        src={photo.imageSrc}
        alt={`Photo ${photo.id}`}
        fill
        className="object-cover pointer-events-none"
        priority // Eager load visible images
      />
    </div>
  );
}
