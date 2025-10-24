
"use client";

import { useDrop } from 'react-dnd';
import { useEditor, type Photo } from '@/context/editor-context';
import { cn } from '@/lib/utils';
import { Image as ImageIcon } from 'lucide-react';

interface DroppablePlaceholderProps {
  photo: Photo;
}

export default function DroppablePlaceholder({ photo }: DroppablePlaceholderProps) {
  const { movePhoto, borderWidth, image } = useEditor();

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'photo',
    drop: (item: { id: number }) => {
      if (item.id !== photo.id) {
        movePhoto(item.id, photo.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [photo.id, movePhoto]);

  return (
    <div
      ref={drop}
      className={cn(
        "absolute flex items-center justify-center bg-gray-100/50 transition-colors",
        isOver && canDrop && "bg-primary/20"
      )}
      style={{
        left: `${photo.x}%`,
        top: `${photo.y}%`,
        width: `${photo.width}%`,
        height: `${photo.height}%`,
        boxSizing: 'border-box',
        border: `${borderWidth}px dashed #9ca3af`,
        zIndex: 1,
      }}
    >
      {!image && <ImageIcon className="h-6 w-6 text-gray-400" />}
    </div>
  );
}
