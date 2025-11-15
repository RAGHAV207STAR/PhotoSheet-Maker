
"use client";

import type { Dispatch, SetStateAction } from 'react';
import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';

export interface Photo {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  imageSrc: string; 
}

export interface ImageWithDimensions {
    src: string;
    width: number;
    height: number;
}

type Unit = 'cm' | 'in';
const CM_TO_IN = 0.393701;
const IN_TO_CM = 2.54;

// Type for the value that can be passed to our state setters
type NumberSetterValue = number | number[];

const handleNumberSetter = (value: NumberSetterValue): number => {
    return Array.isArray(value) ? value[0] : value;
};

interface EditorContextType {
  images: ImageWithDimensions[];
  setImages: Dispatch<SetStateAction<ImageWithDimensions[]>>;
  copies: number;
  setCopies: Dispatch<SetStateAction<number>>;
  
  // Standard photosheet
  photos: Photo[][]; // Array of sheets, each sheet is an array of photos
  setPhotos: Dispatch<SetStateAction<Photo[][]>>;
  currentSheet: number;
  setCurrentSheet: Dispatch<SetStateAction<number>>;
  swapPhoto: (sourceIndex: number, targetIndex: number) => void;
  
  // Common settings
  borderWidth: number;
  setBorderWidth: (value: NumberSetterValue) => void;
  photoSpacing: number;
  setPhotoSpacing: (value: NumberSetterValue) => void;
  photoWidthCm: number;
  photoHeightCm: number;
  setPhotoSize: (newSize: { width?: number; height?: number; }, fromUnit: Unit) => void;
  
  displayPhotoWidth: number;
  displayPhotoHeight: number;

  marginTopCm: number;
  setMarginTopCm: (value: NumberSetterValue) => void;
  marginBottomCm: number;
  setMarginBottomCm: (value: NumberSetterValue) => void;
  marginLeftCm: number;
  setMarginLeftCm: (value: NumberSetterValue) => void;
  marginRightCm: number;
  setMarginRightCm: (value: NumberSetterValue) => void;
  unit: Unit;
  setUnit: Dispatch<SetStateAction<Unit>>;
  
  // Actions
  resetEditor: () => void;
  resetLayout: () => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

const initialCopies = 1;
const initialBorderWidth = 2;
const initialPhotoSpacing = 0.3; // in cm
const initialPhotoWidthCm = 3.15;
const initialPhotoHeightCm = 4.15;
const initialMarginTopCm = 1;
const initialMarginBottomCm = 1;
const initialMarginLeftCm = 1;
const initialMarginRightCm = 1;
const initialUnit = 'cm';

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [images, setImages] = useState<ImageWithDimensions[]>([]);
  const [copies, setCopies] = useState<number>(initialCopies);
  
  // Standard photosheet state
  const [photos, setPhotos] = useState<Photo[][]>([]);
  const [currentSheet, setCurrentSheet] = useState<number>(0);
  
  // Common settings
  const [borderWidth, setBorderWidthState] = useState<number>(initialBorderWidth);
  const [photoSpacing, setPhotoSpacingState] = useState<number>(initialPhotoSpacing);
  const [photoWidthCm, setPhotoWidthCmState] = useState<number>(initialPhotoWidthCm);
  const [photoHeightCm, setPhotoHeightCmState] = useState<number>(initialPhotoHeightCm);
  const [marginTopCm, setMarginTopCmState] = useState<number>(initialMarginTopCm);
  const [marginBottomCm, setMarginBottomCmState] = useState<number>(initialMarginBottomCm);
  const [marginLeftCm, setMarginLeftCmState] = useState<number>(initialMarginLeftCm);
  const [marginRightCm, setMarginRightCmState] = useState<number>(initialMarginRightCm);
  const [unit, setUnit] = useState<Unit>(initialUnit);

  const setBorderWidth = (value: NumberSetterValue) => setBorderWidthState(handleNumberSetter(value));
  const setPhotoSpacing = (value: NumberSetterValue) => setPhotoSpacingState(handleNumberSetter(value));
  const setMarginTopCm = (value: NumberSetterValue) => setMarginTopCmState(handleNumberSetter(value));
  const setMarginBottomCm = (value: NumberSetterValue) => setMarginBottomCmState(handleNumberSetter(value));
  const setMarginLeftCm = (value: NumberSetterValue) => setMarginLeftCmState(handleNumberSetter(value));
  const setMarginRightCm = (value: NumberSetterValue) => setMarginRightCmState(handleNumberSetter(value));
  
  const setPhotoSize = (newSize: { width?: number; height?: number; }, fromUnit: Unit) => {
    if (newSize.width !== undefined && !isNaN(newSize.width)) {
      setPhotoWidthCmState(fromUnit === 'cm' ? newSize.width : newSize.width * IN_TO_CM);
    }
    if (newSize.height !== undefined && !isNaN(newSize.height)) {
      setPhotoHeightCmState(fromUnit === 'cm' ? newSize.height : newSize.height * IN_TO_CM);
    }
  };
  
  const displayPhotoWidth = useMemo(() => unit === 'cm' ? photoWidthCm : photoWidthCm * CM_TO_IN, [photoWidthCm, unit]);
  const displayPhotoHeight = useMemo(() => unit === 'cm' ? photoHeightCm : photoHeightCm * CM_TO_IN, [photoHeightCm, unit]);


  const placeholders = useMemo(() => {
    const sheetWidthMm = 210;
    const sheetHeightMm = 297;
    const photoWidthMm = photoWidthCm * 10;
    const photoHeightMm = photoHeightCm * 10;
    const spacingMm = photoSpacing * 10;

    const marginTopMm = photoSpacing * 10;
    const marginBottomMm = photoSpacing * 10;
    const marginLeftMm = photoSpacing * 10;
    const marginRightMm = photoSpacing * 10;

    const printableWidth = sheetWidthMm - marginLeftMm - marginRightMm;
    const printableHeight = sheetHeightMm - marginTopMm - marginBottomMm;
    
    const newPlaceholders = [];
    if (photoWidthMm > 0 && photoHeightMm > 0 && printableWidth > 0 && printableHeight > 0) {
        const cols = Math.floor((printableWidth + spacingMm) / (photoWidthMm + spacingMm));
        const rows = Math.floor((printableHeight + spacingMm) / (photoHeightMm + spacingMm));
        
        if (cols > 0 && rows > 0) {
            const totalGridWidth = (cols * photoWidthMm) + ((cols - 1) * spacingMm);
            const startX = marginLeftMm + (printableWidth - totalGridWidth) / 2;
            const startY = marginTopMm;

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const xPos = startX + c * (photoWidthMm + spacingMm);
                    const yPos = startY + r * (photoHeightMm + spacingMm);

                    if (xPos + photoWidthMm <= sheetWidthMm - marginRightMm + 1 && yPos + photoHeightMm <= sheetHeightMm - marginBottomMm + 1) {
                        newPlaceholders.push({
                            id: r * cols + c,
                            x: (xPos / sheetWidthMm) * 100,
                            y: (yPos / sheetHeightMm) * 100,
                            width: (photoWidthMm / sheetWidthMm) * 100,
                            height: (photoHeightMm / sheetHeightMm) * 100,
                            imageSrc: '',
                        });
                    }
                }
            }
        }
    }
    return newPlaceholders;
  }, [photoWidthCm, photoHeightCm, photoSpacing]);

  useEffect(() => {
    if (images.length === 0 || placeholders.length === 0) {
      if (photos.length > 0) {
        setPhotos([]);
      }
      return;
    }
  
    const allImageSources: string[] = [];
    images.forEach(image => {
      // Use the original image source for every copy.
      const originalSrc = image.src;
      for (let i = 0; i < copies; i++) {
        allImageSources.push(originalSrc);
      }
    });
  
    const photosBySheet: any[][] = [];
    for (let i = 0; i < allImageSources.length; i += placeholders.length) {
      const sheetSources = allImageSources.slice(i, i + placeholders.length);
      photosBySheet.push(sheetSources);
    }
  
    const finalSheets = photosBySheet.map(sheetSources => {
      return placeholders.map((placeholder, index) => {
        return {
          ...placeholder,
          imageSrc: sheetSources[index] || '',
        };
      });
    });

    // Only update state if the generated sheets are different from the current ones.
    if (JSON.stringify(finalSheets) !== JSON.stringify(photos)) {
        setPhotos(finalSheets);
    }
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images, copies, placeholders]);


  const swapPhoto = useCallback((sourceIndex: number, targetIndex: number) => {
    setPhotos(currentSheets => {
        const newSheets = [...currentSheets];
        const currentSheetPhotos = newSheets[currentSheet];
        if (!currentSheetPhotos) return currentSheets;

        // Create a mutable copy of the current sheet's photos
        const updatedPhotos = [...currentSheetPhotos];

        // Swap the image sources
        const sourceImageSrc = updatedPhotos[sourceIndex].imageSrc;
        updatedPhotos[sourceIndex] = { ...updatedPhotos[sourceIndex], imageSrc: updatedPhotos[targetIndex].imageSrc };
        updatedPhotos[targetIndex] = { ...updatedPhotos[targetIndex], imageSrc: sourceImageSrc };
        
        newSheets[currentSheet] = updatedPhotos;
        return newSheets;
    });
  }, [currentSheet]);
  
  const resetLayout = useCallback(() => {
    setPhotos([]);
    setCurrentSheet(0);
    setBorderWidthState(initialBorderWidth);
    setPhotoSpacingState(initialPhotoSpacing);
    setPhotoWidthCmState(initialPhotoWidthCm);
    setPhotoHeightCmState(initialPhotoHeightCm);
    setMarginTopCmState(initialMarginTopCm);
    setMarginBottomCmState(initialMarginBottomCm);
    setMarginLeftCmState(initialMarginLeftCm);
    setMarginRightCmState(initialMarginRightCm);
    setUnit(initialUnit);
  }, []);

  const resetEditor = useCallback(() => {
    setImages([]);
    setCopies(initialCopies);
    resetLayout();
  }, [resetLayout]);


  const value: EditorContextType = {
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
    photoHeightCm,
    setPhotoSize,
    displayPhotoWidth,
    displayPhotoHeight,
    marginTopCm,
    setMarginTopCm,
    marginBottomCm,
    setMarginBottomCm,
    marginLeftCm,
    setMarginLeftCm,
    marginRightCm,
    setMarginRightCm,
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
