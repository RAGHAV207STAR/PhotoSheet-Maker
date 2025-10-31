
"use client";

import { useDrop } from 'react-dnd';
import { useEditor, type Photo } from '@/context/editor-context';
import { cn } from '@/lib/utils';
import { ImageIcon } from 'lucide-react';

interface DroppablePlaceholderProps {
  photo: Photo;
  children: React.ReactNode;
}

interface DragItem {
  id: number;
}

export default function DroppablePlaceholder({ photo, children }: DroppablePlaceholderProps) {
  const { swapPhoto } = useEditor();

  const [{ isOver, canDrop }, drop] = useDrop<DragItem, void, { isOver: boolean; canDrop: boolean; }>(() => ({
    accept: 'PHOTO',
    drop: (item) => {
        if (item.id !== photo.id) {
            swapPhoto(item.id, photo.id);
        }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }));

  return (
    <div
      ref={(node) => { if (node) drop(node); }}
      className="absolute photo-item"
      style={{
        left: `${photo.x}%`,
        top: `${photo.y}%`,
        width: `${photo.width}%`,
        height: `${photo.height}%`,
      }}
    >
      <div
        className={cn(
          "relative w-full h-full border border-dashed border-gray-300 transition-all",
          isOver && canDrop && "bg-primary/20 border-primary ring-2 ring-primary",
          !photo.imageSrc && "bg-gray-100/50"
        )}
      >
        {children}
        {!photo.imageSrc && (
             <div className="flex items-center justify-center h-full w-full">
                <ImageIcon className="h-6 w-6 text-gray-400" />
            </div>
        )}
      </div>
    </div>
  );
}
