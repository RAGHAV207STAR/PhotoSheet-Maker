
"use client";

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
  photos: Photo[][]; // Array of sheets, each sheet is an array of photos
  setPhotos: Dispatch<SetStateAction<Photo[][]>>;
  currentSheet: number;
  setCurrentSheet: Dispatch<SetStateAction<number>>;
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
  resetLayout: () => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

const initialCopies = 1;
const initialBorderWidth = 2;
const initialPhotoSpacing = 0.3;
const initialPhotoWidthCm = 3.15;
const initialPhotoHeightCm = 4.14;
const initialUnit = 'cm';

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [images, setImages] = useState<string[]>([]);
  const [copies, setCopies] = useState<number>(initialCopies);
  const [photos, setPhotos] = useState<Photo[][]>([]);
  const [currentSheet, setCurrentSheet] = useState<number>(0);
  const [borderWidth, setBorderWidth] = useState<number>(initialBorderWidth);
  const [photoSpacing, setPhotoSpacing] = useState<number>(initialPhotoSpacing);
  const [photoWidthCm, setPhotoWidthCm] = useState<number>(initialPhotoWidthCm);
  const [photoHeightCm, setPhotoHeightCm] = useState<number>(initialPhotoHeightCm);
  const [unit, setUnit] = useState<Unit>(initialUnit);

  const swapPhoto = useCallback((sourceId: number, targetId: number) => {
    setPhotos(currentSheets => {
      const newSheets = [...currentSheets];
      const currentSheetPhotos = newSheets[currentSheet];
      if (!currentSheetPhotos) return currentSheets;

      const sourceIndex = currentSheetPhotos.findIndex(p => p.id === sourceId);
      const targetIndex = currentSheetPhotos.findIndex(p => p.id === targetId);

      if (sourceIndex === -1 || targetIndex === -1) {
        return currentSheets;
      }
      
      const newSheetPhotos = [...currentSheetPhotos];
      // Swap the image sources
      const sourceImageSrc = newSheetPhotos[sourceIndex].imageSrc;
      newSheetPhotos[sourceIndex] = { ...newSheetPhotos[sourceIndex], imageSrc: newSheetPhotos[targetIndex].imageSrc };
      newSheetPhotos[targetIndex] = { ...newSheetPhotos[targetIndex], imageSrc: sourceImageSrc };
      
      newSheets[currentSheet] = newSheetPhotos;
      return newSheets;
    });
  }, [currentSheet]);
  
  const resetLayout = useCallback(() => {
    setPhotos([]);
    setCurrentSheet(0);
    setBorderWidth(initialBorderWidth);
    setPhotoSpacing(initialPhotoSpacing);
    setPhotoWidthCm(initialPhotoWidthCm);
    setPhotoHeightCm(initialPhotoHeightCm);
    setUnit(initialUnit);
  }, []);

  const resetEditor = useCallback(() => {
    setImages([]);
    setCopies(initialCopies);
    resetLayout();
  }, [resetLayout]);


  const value = {
    images,
    setImages,
    copies,
    setCopies,
    photos,
    setPhotos,
    currentSheet,
    setCurrentSheet,
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
    resetLayout,
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
