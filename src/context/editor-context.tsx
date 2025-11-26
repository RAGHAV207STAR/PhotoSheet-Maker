
"use client";

import type { Dispatch, SetStateAction } from 'react';
import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { useUser, useFirestore, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp, doc } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';

export interface Photo {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  imageSrc: string; 
  text: string;
  textColor: string;
  fontSize: number; // percentage of photo height
  textAlign: 'left' | 'center' | 'right';
  textVerticalAlign: 'top' | 'middle' | 'bottom';
  rotation: 0 | 90 | 180 | 270;
  fit: 'cover' | 'contain';
}

export interface ImageWithDimensions {
    src: string;
    width: number;
    height: number;
}

export type PageSize = 'A4' | 'Letter' | 'Legal' | 'Tabloid' | 'A3' | 'A5' | '4x6in' | '5x7in' | 'Custom';

type Unit = 'cm' | 'in';
const CM_TO_IN = 0.393701;
const IN_TO_CM = 2.54;

const PAGE_DIMENSIONS_CM: Record<Exclude<PageSize, 'Custom'>, { width: number; height: number; }> = {
    'A4': { width: 21.0, height: 29.7 },
    'Letter': { width: 21.59, height: 27.94 },
    'Legal': { width: 21.59, height: 35.56 },
    'Tabloid': { width: 27.94, height: 43.18 },
    'A3': { width: 29.7, height: 42.0 },
    'A5': { width: 14.8, height: 21.0 },
    '4x6in': { width: 10.16, height: 15.24 },
    '5x7in': { width: 12.7, height: 17.78 },
};

type PageMargins = {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

// Type for the value that can be passed to our state setters
type NumberSetterValue = number | number[];

const handleNumberSetter = (value: NumberSetterValue): number => {
    return Array.isArray(value) ? value[0] : value;
};

// This type definition now correctly omits all functions from EditorContextType
export type EditorState = Omit<EditorContextType, 
  'setImages' | 'setCopies' | 'setPhotos' | 'setCurrentSheet' | 
  'setSelectedPhotoId' | 'swapPhotoItems' | 'placeImageInSlot' | 
  'updatePhotoText' | 'updatePhotoStyle' | 'rotatePhoto' | 'togglePhotoFit' |
  'setBorderWidth' | 'setBorderColor' | 'setPhotoSpacing' | 'setPhotoSize' |
  'setUnit' | 'setPageSize' | 'setPageDimensions' | 'setOrientation' | 
  'setPageMargins' | 'setEditorState' | 'resetEditor' | 'resetLayout' | 'saveToHistory'
>;

interface EditorContextType {
  images: ImageWithDimensions[];
  setImages: Dispatch<SetStateAction<ImageWithDimensions[]>>;
  copies: number;
  setCopies: Dispatch<SetStateAction<number>>;
  
  photos: Photo[][]; 
  setPhotos: Dispatch<SetStateAction<Photo[][]>>;
  currentSheet: number;
  setCurrentSheet: Dispatch<SetStateAction<number>>;
  selectedPhotoId: number | null;
  setSelectedPhotoId: Dispatch<SetStateAction<number | null>>;
  swapPhotoItems: (activeId: number, overId: number) => void;
  placeImageInSlot: (imageSrc: string, slotId: number) => void;
  updatePhotoText: (photoId: number, text: string) => void;
  updatePhotoStyle: (photoId: number, styles: Partial<Pick<Photo, 'textColor' | 'fontSize' | 'textAlign' | 'textVerticalAlign'>>) => void;
  rotatePhoto: (photoId: number) => void;
  togglePhotoFit: (photoId: number) => void;

  borderWidth: number;
  setBorderWidth: (value: NumberSetterValue) => void;
  borderColor: string;
  setBorderColor: Dispatch<SetStateAction<string>>;
  photoSpacing: number;
  setPhotoSpacing: (value: NumberSetterValue) => void;
  photoWidthCm: number;
  photoHeightCm: number;
  setPhotoSize: (newSize: { width?: number; height?: number; }, fromUnit: Unit) => void;
  
  displayPhotoWidth: number;
  displayPhotoHeight: number;
  
  unit: Unit;
  setUnit: Dispatch<SetStateAction<Unit>>;

  pageSize: PageSize;
  setPageSize: Dispatch<SetStateAction<PageSize>>;
  pageWidthCm: number;
  pageHeightCm: number;
  setPageDimensions: (newSize: { width?: number; height?: number; }, fromUnit: Unit) => void;
  displayPageWidth: number;
  displayPageHeight: number;

  orientation: 'portrait' | 'landscape';
  setOrientation: Dispatch<SetStateAction<'portrait' | 'landscape'>>;

  pageMarginsCm: PageMargins;
  setPageMargins: (newMargins: Partial<PageMargins>, fromUnit: Unit) => void;
  displayPageMargins: PageMargins;
  
  setEditorState: (state: EditorState) => void;
  resetEditor: () => void;
  resetLayout: () => void;
  saveToHistory: () => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

const initialCopies = 1;
const initialBorderWidth = 2;
const initialBorderColor = '#000000';
const initialPhotoSpacing = 0.3; // in cm
const initialPhotoWidthCm = 3.15;
const initialPhotoHeightCm = 4.15;
const initialUnit: Unit = 'cm';
const initialPageSize: PageSize = 'A4';
const initialOrientation = 'portrait';
const initialPageMarginsCm: PageMargins = { top: 0, right: 0.3, bottom: 1, left: 0.3 };
const initialTextColor = '#FFFFFF';
const initialFontSize = 8; // 8% of photo height
const initialTextAlign = 'center';
const initialTextVerticalAlign = 'bottom';
const initialRotation = 0;
const initialFit = 'cover';

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [images, setImages] = useState<ImageWithDimensions[]>([]);
  const [copies, setCopies] = useState<number>(initialCopies);
  
  const [photos, setPhotos] = useState<Photo[][]>([]);
  const [currentSheet, setCurrentSheet] = useState<number>(0);
  const [selectedPhotoId, setSelectedPhotoId] = useState<number | null>(null);

  const [borderWidth, setBorderWidthState] = useState<number>(initialBorderWidth);
  const [borderColor, setBorderColor] = useState<string>(initialBorderColor);
  const [photoSpacing, setPhotoSpacingState] = useState<number>(initialPhotoSpacing);
  const [photoWidthCm, setPhotoWidthCmState] = useState<number>(initialPhotoWidthCm);
  const [photoHeightCm, setPhotoHeightCmState] = useState<number>(initialPhotoHeightCm);
  const [unit, setUnit] = useState<Unit>(initialUnit);

  const [pageSize, setPageSize] = useState<PageSize>(initialPageSize);
  const [customPageWidthCm, setCustomPageWidthCm] = useState(PAGE_DIMENSIONS_CM.A4.width);
  const [customPageHeightCm, setCustomPageHeightCm] = useState(PAGE_DIMENSIONS_CM.A4.height);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(initialOrientation);
  const [pageMarginsCm, setPageMarginsCmState] = useState<PageMargins>(initialPageMarginsCm);

  const { user } = useUser(true);
  const firestore = useFirestore(true);
  const searchParams = useSearchParams();
  const historyId = searchParams.get('historyId');


  const setBorderWidth = (value: NumberSetterValue) => setBorderWidthState(handleNumberSetter(value));
  const setPhotoSpacing = (value: NumberSetterValue) => setPhotoSpacingState(handleNumberSetter(value));
  
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

  const { pageWidthCm, pageHeightCm } = useMemo(() => {
    let rawWidth, rawHeight;
    if (pageSize === 'Custom') {
        rawWidth = customPageWidthCm;
        rawHeight = customPageHeightCm;
    } else {
        rawWidth = PAGE_DIMENSIONS_CM[pageSize].width;
        rawHeight = PAGE_DIMENSIONS_CM[pageSize].height;
    }

    return orientation === 'portrait' 
        ? { pageWidthCm: rawWidth, pageHeightCm: rawHeight }
        : { pageWidthCm: rawHeight, pageHeightCm: rawWidth };

  }, [pageSize, customPageWidthCm, customPageHeightCm, orientation]);

  const setPageDimensions = (newSize: { width?: number; height?: number; }, fromUnit: Unit) => {
    if (pageSize === 'Custom') {
        if (newSize.width !== undefined && !isNaN(newSize.width)) {
            setCustomPageWidthCm(fromUnit === 'cm' ? newSize.width : newSize.width * IN_TO_CM);
        }
        if (newSize.height !== undefined && !isNaN(newSize.height)) {
            setCustomPageHeightCm(fromUnit === 'cm' ? newSize.height : newSize.height * IN_TO_CM);
        }
    }
  };

  const displayPageWidth = useMemo(() => unit === 'cm' ? pageWidthCm : pageWidthCm * CM_TO_IN, [pageWidthCm, unit]);
  const displayPageHeight = useMemo(() => unit === 'cm' ? pageHeightCm : pageHeightCm * CM_TO_IN, [pageHeightCm, unit]);

  const setPageMargins = (newMargins: Partial<PageMargins>, fromUnit: Unit) => {
      setPageMarginsCmState(prev => {
          const convertedMargins: Partial<PageMargins> = {};
          (Object.keys(newMargins) as Array<keyof PageMargins>).forEach(key => {
              const value = newMargins[key];
              if(value !== undefined && !isNaN(value)) {
                  convertedMargins[key] = fromUnit === 'cm' ? value : value * IN_TO_CM;
              }
          });
          return { ...prev, ...convertedMargins };
      });
  };

  const displayPageMargins = useMemo(() => {
    if (unit === 'in') {
      return {
        top: pageMarginsCm.top * CM_TO_IN,
        right: pageMarginsCm.right * CM_TO_IN,
        bottom: pageMarginsCm.bottom * CM_TO_IN,
        left: pageMarginsCm.left * CM_TO_IN,
      };
    }
    return pageMarginsCm;
  }, [pageMarginsCm, unit]);
  
  useEffect(() => {
    const spacingMm = photoSpacing * 10;
    const photoW = photoWidthCm * 10;
    const photoH = photoHeightCm * 10;
    const pageW = pageWidthCm * 10;
    const pageH = pageHeightCm * 10;

    const marginTop = pageMarginsCm.top * 10;
    const marginRight = pageMarginsCm.right * 10;
    const marginBottom = pageMarginsCm.bottom * 10;
    const marginLeft = pageMarginsCm.left * 10;
    
    const printableWidth = pageW - marginLeft - marginRight;
    const printableHeight = pageH - marginTop - marginBottom;

    if (photoW <= 0 || photoH <= 0 || printableWidth <= 0 || printableHeight <= 0) {
      setPhotos([]);
      return;
    }

    const cols = Math.floor((printableWidth + spacingMm) / (photoW + spacingMm));
    const rows = Math.floor((printableHeight + spacingMm) / (photoH + spacingMm));
    
    if (cols <= 0 || rows <= 0) {
      setPhotos([]);
      return;
    }
    
    const totalPlaceholders = cols * rows;
    const newSheets: Photo[][] = [];

    const existingPhotosById = new Map<number, Photo>();
    photos.flat().forEach(p => existingPhotosById.set(p.id, p));

    const autoPopulateImageSrc = images.length > 0 ? images[0].src : '';

    const sheetPhotos: Photo[] = [];
    for (let i = 0; i < totalPlaceholders; i++) {
        const r = Math.floor(i / cols);
        const c = i % cols;
        
        const xPos = marginLeft + c * (photoW + spacingMm);
        const yPos = marginTop + r * (photoH + spacingMm);
        
        const existingPhoto = existingPhotosById.get(i);
        
        const imageSrc = existingPhoto?.imageSrc || (i < copies ? autoPopulateImageSrc : '');

        sheetPhotos.push({
            id: i,
            x: (xPos / pageW) * 100,
            y: (yPos / pageH) * 100,
            width: (photoW / pageW) * 100,
            height: (photoH / pageH) * 100,
            imageSrc: imageSrc,
            text: existingPhoto?.text || '',
            textColor: existingPhoto?.textColor || initialTextColor,
            fontSize: existingPhoto?.fontSize || initialFontSize,
            textAlign: existingPhoto?.textAlign || initialTextAlign,
            textVerticalAlign: existingPhoto?.textVerticalAlign || initialTextVerticalAlign,
            rotation: existingPhoto?.rotation || initialRotation,
            fit: existingPhoto?.fit || initialFit,
        });
    }
    newSheets.push(sheetPhotos);
    
    setPhotos(newSheets);
    if(currentSheet !== 0) {
        setCurrentSheet(0);
    }
    setSelectedPhotoId(null);

  }, [copies, photoWidthCm, photoHeightCm, photoSpacing, pageWidthCm, pageHeightCm, pageMarginsCm, orientation, images]);

 const swapPhotoItems = useCallback((activeId: number, overId: number) => {
    setPhotos(prevSheets => {
        const newSheets = [...prevSheets];
        const currentSheetPhotos = newSheets[currentSheet];
        if (!currentSheetPhotos) return prevSheets;

        const activeIndex = currentSheetPhotos.findIndex(p => p.id === activeId);
        const overIndex = currentSheetPhotos.findIndex(p => p.id === overId);

        if (activeIndex === -1 || overIndex === -1) return prevSheets;
        
        const activePhotoProps = {
            imageSrc: currentSheetPhotos[activeIndex].imageSrc,
            text: currentSheetPhotos[activeIndex].text,
            textColor: currentSheetPhotos[activeIndex].textColor,
            fontSize: currentSheetPhotos[activeIndex].fontSize,
            textAlign: currentSheetPhotos[activeIndex].textAlign,
            textVerticalAlign: currentSheetPhotos[activeIndex].textVerticalAlign,
            rotation: currentSheetPhotos[activeIndex].rotation,
            fit: currentSheetPhotos[activeIndex].fit,
        };
        const overPhotoProps = {
            imageSrc: currentSheetPhotos[overIndex].imageSrc,
            text: currentSheetPhotos[overIndex].text,
            textColor: currentSheetPhotos[overIndex].textColor,
            fontSize: currentSheetPhotos[overIndex].fontSize,
            textAlign: currentSheetPhotos[overIndex].textAlign,
            textVerticalAlign: currentSheetPhotos[overIndex].textVerticalAlign,
            rotation: currentSheetPhotos[overIndex].rotation,
            fit: currentSheetPhotos[overIndex].fit,
        };

        const updatedSheet = currentSheetPhotos.map(p => {
          if (p.id === activeId) return { ...p, ...overPhotoProps };
          if (p.id === overId) return { ...p, ...activePhotoProps };
          return p;
        });

        newSheets[currentSheet] = updatedSheet;
        return newSheets;
    });
}, [currentSheet]);

  const placeImageInSlot = useCallback((imageSrc: string, slotId: number) => {
    setPhotos(prevSheets => {
      const newSheets = [...prevSheets];
      const currentSheetPhotos = newSheets[currentSheet];
      if (!currentSheetPhotos) return prevSheets;

      const slotIndex = currentSheetPhotos.findIndex(p => p.id === slotId);
      if (slotIndex !== -1) {
        const updatedSheet = [...currentSheetPhotos];
        updatedSheet[slotIndex] = { 
            ...updatedSheet[slotIndex], 
            imageSrc,
            text: '', // Reset text when new image is placed
            textColor: initialTextColor,
            fontSize: initialFontSize,
            textAlign: initialTextAlign,
            textVerticalAlign: initialTextVerticalAlign,
            rotation: initialRotation,
            fit: initialFit,
        };
        newSheets[currentSheet] = updatedSheet;
        return newSheets;
      }
      return prevSheets;
    });
  }, [currentSheet]);

  const updatePhotoText = useCallback((photoId: number, text: string) => {
    setPhotos(prevSheets => {
        return prevSheets.map(sheet => 
            sheet.map(photo => 
                photo.id === photoId ? { ...photo, text } : photo
            )
        );
    });
  }, []);
  
  const updatePhotoStyle = useCallback((photoId: number, styles: Partial<Pick<Photo, 'textColor' | 'fontSize' | 'textAlign' | 'textVerticalAlign'>>) => {
    setPhotos(prevSheets => {
        return prevSheets.map(sheet => 
            sheet.map(photo =>
                photo.id === photoId ? { ...photo, ...styles } : photo
            )
        );
    });
  }, []);

  const rotatePhoto = useCallback((photoId: number) => {
    setPhotos(prevSheets => {
      return prevSheets.map(sheet =>
        sheet.map(photo => {
          if (photo.id === photoId) {
            const newRotation = ((photo.rotation + 90) % 360) as Photo['rotation'];
            return { ...photo, rotation: newRotation };
          }
          return photo;
        })
      );
    });
  }, []);

  const togglePhotoFit = useCallback((photoId: number) => {
    setPhotos(prevSheets => {
      return prevSheets.map(sheet =>
        sheet.map(photo => {
          if (photo.id === photoId) {
            return { ...photo, fit: photo.fit === 'cover' ? 'contain' : 'cover' };
          }
          return photo;
        })
      );
    });
  }, []);

  const setEditorState = useCallback((state: EditorState) => {
    setImages(state.images || []);
    setCopies(state.copies);
    setPhotos(state.photos || []);
    setCurrentSheet(state.currentSheet);
    setSelectedPhotoId(state.selectedPhotoId || null);
    setBorderWidthState(state.borderWidth);
    setBorderColor(state.borderColor);
    setPhotoSpacingState(state.photoSpacing);
    setPhotoWidthCmState(state.photoWidthCm);
    setPhotoHeightCmState(state.photoHeightCm);
    setUnit(state.unit);
    setPageSize(state.pageSize);
    setOrientation(state.orientation);
    setPageMarginsCmState(state.pageMarginsCm);
    if (state.pageSize === 'Custom') {
      setCustomPageWidthCm(state.pageWidthCm);
      setCustomPageHeightCm(state.pageHeightCm);
    }
  }, []);
  
  const resetLayout = useCallback(() => {
    setCurrentSheet(0);
    setSelectedPhotoId(null);
    setBorderWidthState(initialBorderWidth);
    setBorderColor(initialBorderColor);
    setPhotoSpacingState(initialPhotoSpacing);
    setPhotoWidthCmState(initialPhotoWidthCm);
    setPhotoHeightCmState(initialPhotoHeightCm);
    setUnit(initialUnit);
    setPageSize(initialPageSize);
    setOrientation(initialOrientation);
    setCustomPageWidthCm(PAGE_DIMENSIONS_CM.A4.width);
    setCustomPageHeightCm(PAGE_DIMENSIONS_CM.A4.height);
    setPageMarginsCmState(initialPageMarginsCm);
  }, []);

  const resetEditor = useCallback(() => {
    setImages([]);
    setCopies(initialCopies);
    setPhotos([]);
    resetLayout();
  }, [resetLayout]);

  const saveToHistory = () => {
    if (!user || !firestore || images.length === 0) return;
    const firstImageSrc = images[0]?.src;
    if (!firstImageSrc) return;

    // Destructure all functions from the current state to get a plain state object
    const editorStateToSave: EditorState = {
        images, copies, photos, currentSheet, selectedPhotoId,
        borderWidth, borderColor, photoSpacing, photoWidthCm, photoHeightCm,
        unit, pageSize, pageWidthCm, pageHeightCm, orientation, pageMarginsCm,
        displayPhotoWidth, displayPhotoHeight, displayPageWidth, displayPageHeight, displayPageMargins
    };

    const photosheetData = {
      userId: user.uid,
      thumbnailUrl: firstImageSrc,
      copies: copies,
      createdAt: serverTimestamp(),
      editorState: editorStateToSave,
    };
    
    if (historyId) {
        const docRef = doc(firestore, 'users', user.uid, 'photosheets', historyId);
        setDocumentNonBlocking(docRef, photosheetData, { merge: true });
    } else {
        addDocumentNonBlocking(collection(firestore, 'users', user.uid, 'photosheets'), photosheetData);
    }
  }


  const value: EditorContextType = {
    images,
    setImages,
    copies,
    setCopies,
    photos,
    setPhotos,
    currentSheet,
    setCurrentSheet,
    selectedPhotoId,
    setSelectedPhotoId,
    swapPhotoItems,
    placeImageInSlot,
    updatePhotoText,
    updatePhotoStyle,
    rotatePhoto,
    togglePhotoFit,
    borderWidth,
    setBorderWidth,
    borderColor,
    setBorderColor,
    photoSpacing,
    setPhotoSpacing,
    photoWidthCm,
    photoHeightCm,
    setPhotoSize,
    displayPhotoWidth,
    displayPhotoHeight,
    unit,
    setUnit,
    pageSize,
    setPageSize,
    pageWidthCm,
    pageHeightCm,
    setPageDimensions,
    displayPageWidth,
    displayPageHeight,
    orientation,
    setOrientation,
    pageMarginsCm,
    setPageMargins,
    displayPageMargins,
    setEditorState,
    resetEditor,
    resetLayout,
    saveToHistory,
  };

  return (
    <EditorContext.Provider value={value}>
        {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
}
