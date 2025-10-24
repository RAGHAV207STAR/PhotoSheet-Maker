
"use client"

import type { Dispatch, SetStateAction } from 'react';
import { createContext, useContext, useState, useCallback } from 'react';

export interface Photo {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface EditorContextType {
  image: string | null;
  setImage: Dispatch<SetStateAction<string | null>>;
  copies: number;
  setCopies: Dispatch<SetStateAction<number>>;
  photos: Photo[];
  setPhotos: Dispatch<SetStateAction<Photo[]>>;
  movePhoto: (draggedId: number, targetId: number) => void;
  borderWidth: number;
  setBorderWidth: Dispatch<SetStateAction<number>>;
  photoSpacing: number;
  setPhotoSpacing: Dispatch<SetStateAction<number>>;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [image, setImage] = useState<string | null>(null);
  const [copies, setCopies] = useState<number>(1);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [borderWidth, setBorderWidth] = useState<number>(1);
  const [photoSpacing, setPhotoSpacing] = useState<number>(0.3);
  
  const movePhoto = useCallback((draggedId: number, targetId: number) => {
    setPhotos((prevPhotos) => {
      const newPhotos = [...prevPhotos];
      const draggedPhoto = newPhotos.find(p => p.id === draggedId);
      const targetPhoto = newPhotos.find(p => p.id === targetId);

      if (!draggedPhoto || !targetPhoto) return newPhotos;

      // Swap positions
      const tempX = draggedPhoto.x;
      const tempY = draggedPhoto.y;
      draggedPhoto.x = targetPhoto.x;
      draggedPhoto.y = targetPhoto.y;
      targetPhoto.x = tempX;
      targetPhoto.y = tempY;

      return newPhotos;
    });
  }, []);


  const value = {
    image,
    setImage,
    copies,
    setCopies,
    photos,
    setPhotos,
    movePhoto,
    borderWidth,
    setBorderWidth,
    photoSpacing,
    setPhotoSpacing,
  };

  return (
    <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
}
