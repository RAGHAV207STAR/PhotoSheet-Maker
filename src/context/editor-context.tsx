
"use client"

import type { Dispatch, SetStateAction } from 'react';
import { createContext, useContext, useState, useCallback } from 'react';

export interface Photo {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  imageSrc: string; 
}

type Unit = 'cm' | 'in';

interface EditorContextType {
  images: string[];
  setImages: Dispatch<SetStateAction<string[]>>;
  copies: number;
  setCopies: Dispatch<SetStateAction<number>>;
  photos: Photo[];
  setPhotos: Dispatch<SetStateAction<Photo[]>>;
  swapPhoto: (sourceId: number, targetId: number) => void;
  borderWidth: number;
  setBorderWidth: Dispatch<SetStateAction<number>>;
  photoSpacing: number;
  setPhotoSpacing: Dispatch<SetStateAction<number>>;
  photoWidthCm: number;
  setPhotoWidthCm: Dispatch<SetStateAction<number>>;
  photoHeightCm: number;
  setPhotoHeightCm: Dispatch<SetStateAction<number>>;
  unit: Unit;
  setUnit: Dispatch<SetStateAction<Unit>>;
  resetEditor: () => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [images, setImages] = useState<string[]>([]);
  const [copies, setCopies] = useState<number>(1);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [borderWidth, setBorderWidth] = useState<number>(1);
  const [photoSpacing, setPhotoSpacing] = useState<number>(0.3);
  const [photoWidthCm, setPhotoWidthCm] = useState<number>(3.5);
  const [photoHeightCm, setPhotoHeightCm] = useState<number>(4.5);
  const [unit, setUnit] = useState<Unit>('cm');

  const swapPhoto = useCallback((sourceId: number, targetId: number) => {
    setPhotos(currentPhotos => {
      const sourceIndex = currentPhotos.findIndex(p => p.id === sourceId);
      const targetIndex = currentPhotos.findIndex(p => p.id === targetId);

      if (sourceIndex === -1 || targetIndex === -1) {
        return currentPhotos;
      }
      
      const newPhotos = [...currentPhotos];
      // Swap the image sources
      const sourceImageSrc = newPhotos[sourceIndex].imageSrc;
      newPhotos[sourceIndex] = { ...newPhotos[sourceIndex], imageSrc: newPhotos[targetIndex].imageSrc };
      newPhotos[targetIndex] = { ...newPhotos[targetIndex], imageSrc: sourceImageSrc };

      return newPhotos;
    });
  }, []);

  const resetEditor = useCallback(() => {
    setBorderWidth(1);
    setPhotoSpacing(0.3);
    setPhotoWidthCm(3.5);
    setPhotoHeightCm(4.5);
    setUnit('cm');
    // We don't reset images or copies here, only layout adjustments
  }, []);


  const value = {
    images,
    setImages,
    copies,
    setCopies,
    photos,
    setPhotos,
    swapPhoto,
    borderWidth,
    setBorderWidth,
    photoSpacing,
    setPhotoSpacing,
    photoWidthCm,
    setPhotoWidthCm,
    photoHeightCm,
    setPhotoHeightCm,
    unit,
    setUnit,
    resetEditor,
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
