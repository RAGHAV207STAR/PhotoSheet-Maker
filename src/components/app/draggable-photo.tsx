
"use client";

import { useDrag } from 'react-dnd';
import Image from 'next/image';
import type { Photo } from '@/context/editor-context';
import { useEditor } from '@/context/editor-context';

interface DraggablePhotoProps {
  photo: Photo;
  imageSrc: string;
}

export default function DraggablePhoto({ photo, imageSrc }: DraggablePhotoProps) {
  const { borderWidth } = useEditor();
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'photo',
    item: { id: photo.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const opacity = isDragging ? 0.4 : 1;

  // Find the initial placeholder for this photo to render it at the correct position
  const initialPhoto = useEditor().photos.find(p => p.id === photo.id);

  if (!initialPhoto) return null;


  return (
    <div
      ref={drag}
      className="absolute photo-item overflow-hidden cursor-move"
      style={{
        left: `${photo.x}%`,
        top: `${photo.y}%`,
        width: `${photo.width}%`,
        height: `${photo.height}%`,
        boxSizing: 'border-box',
        border: `${borderWidth}px solid black`,
        opacity,
        // Ensure draggable photos appear above placeholders
        zIndex: isDragging ? 100 : 10,
      }}
    >
      <Image
        src={imageSrc}
        alt={`Photo ${photo.id + 1}`}
        layout="fill"
        objectFit="cover"
        className="bg-center"
        draggable="false"
      />
    </div>
  );
}
