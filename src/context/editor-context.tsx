

"use client";

import type { Dispatch, SetStateAction } from 'react';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface Photo {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  imageSrc: string; 
}

export interface CollagePhoto {
  id: string;
  src: string;
  x: number; // percentage
  y: number; // percentage
  width: number; // percentage
  height: number; // percentage
  rotation: number;
  scale: number;
  scaleX?: number;
  scaleY?: number;
  position: { x: number; y: number };
  zIndex: number;
  clipPath?: { id: string; path: string };
  isOverlay?: boolean;
}

export interface ImageWithDimensions {
    src: string;
    width: number;
    height: number;
}


export type CollageLayoutType = 
  | 'grid' | 'mosaic' | 'freeform'
  | 'two-v-split' | 'two-h-split' | 'two-torn'
  | 'two-circles' | 'two-diagonal'
  | 'two-love-text' | 'two-text-see' | 'two-text-heart'
  | 'two-hearts-4' | 'two-film' | 'two-hearts-2' | 'two-hearts-3'
  | 'two-diagonal-curve' | 'two-hearts-nested';
  
export type EditorTab = 'layout' | 'ratio' | 'border';

type Unit = 'cm' | 'in';

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
  swapPhoto: (sourceId: number, targetId: number) => void;
  
  // Collage
  collagePhotos: CollagePhoto[];
  setCollagePhotos: Dispatch<SetStateAction<CollagePhoto[]>>;
  collageLayout: CollageLayoutType;
  setCollageLayout: Dispatch<SetStateAction<CollageLayoutType>>;
  collagePageSize: 'A4' | 'A3' | '4x6' | '5x7';
  setCollagePageSize: Dispatch<SetStateAction<'A4' | 'A3' | '4x6' | '5x7'>>;
  activeEditorTab: EditorTab;
  setActiveEditorTab: Dispatch<SetStateAction<EditorTab>>;
  selectedPhotoId: string | null;
  setSelectedPhotoId: Dispatch<SetStateAction<string | null>>;
  activeCropPhotoId: string | null;
  setActiveCropPhotoId: Dispatch<SetStateAction<string | null>>;
  
  // Common settings
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
  
  // Actions
  resetEditor: () => void;
  resetLayout: () => void;
  updatePhotoDetails: (id: string, updates: Partial<CollagePhoto>) => void;
  swapCollagePhoto: (sourceId: string, targetId: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

const initialCopies = 1;
const initialBorderWidth = 2;
const initialPhotoSpacing = 0.3; // in cm
const initialPhotoWidthCm = 3.15;
const initialPhotoHeightCm = 4.15;
const initialUnit = 'cm';
const initialCollageLayout: CollageLayoutType = 'grid';
const initialCollagePageSize: 'A4' | 'A3' | '4x6' | '5x7' = 'A4';
const initialEditorTab: EditorTab = 'layout';

const PAGE_DIMENSIONS = {
    'A4': { width: 210, height: 297 },
    'A3': { width: 297, height: 420 },
    '4x6': { width: 101.6, height: 152.4 },
    '5x7': { width: 127, height: 177.8 },
};

const defaultPhotoProps = {
    rotation: 0,
    scale: 1,
    scaleX: 1,
    scaleY: 1,
    position: { x: 0, y: 0 },
    zIndex: 1
};


// --- Layout Generation Logic ---
function getGridLayout(images: ImageWithDimensions[], pageWidthMm: number, pageHeightMm: number, spacingMm: number): CollagePhoto[] {
    const numImages = images.length;
    if (numImages === 0) return [];

    const cols = Math.ceil(Math.sqrt(numImages));
    const rows = Math.ceil(numImages / cols);

    const spacingXPx = (spacingMm / pageWidthMm) * 100;
    const spacingYPx = (spacingMm / pageHeightMm) * 100;

    const totalSpacingX = (cols + 1) * spacingXPx;
    const totalSpacingY = (rows + 1) * spacingYPx;

    const photoWidth = (100 - totalSpacingX) / cols;
    const photoHeight = (100 - totalSpacingY) / rows;

    return images.map((img, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        return {
            id: `photo-${index}`,
            src: img.src,
            x: spacingXPx + col * (photoWidth + spacingXPx),
            y: spacingYPx + row * (photoHeight + spacingYPx),
            width: photoWidth,
            height: photoHeight,
            ...defaultPhotoProps,
        };
    });
}

function getMosaicLayout(images: ImageWithDimensions[], pageWidth: number, pageHeight: number, spacing: number): CollagePhoto[] {
    const numImages = images.length;
    if (numImages === 0) return [];
    
    const layouts = {
        1: [{ x: 0, y: 0, w: 1, h: 1 }],
        2: [{ x: 0, y: 0, w: 0.5, h: 1 }, { x: 0.5, y: 0, w: 0.5, h: 1 }],
        3: [{ x: 0, y: 0, w: 0.5, h: 1 }, { x: 0.5, y: 0, w: 0.5, h: 0.5 }, { x: 0.5, y: 0.5, w: 0.5, h: 0.5 }],
        4: [{ x: 0, y: 0, w: 0.5, h: 0.5 }, { x: 0.5, y: 0, w: 0.5, h: 0.5 }, { x: 0, y: 0.5, w: 0.5, h: 0.5 }, { x: 0.5, y: 0.5, w: 0.5, h: 0.5 }],
        5: [{ x: 0, y: 0, w: 0.6, h: 0.6 }, { x: 0.6, y: 0, w: 0.4, h: 0.4 }, { x: 0.6, y: 0.4, w: 0.4, h: 0.6 }, { x: 0, y: 0.6, w: 0.3, h: 0.4 }, { x: 0.3, y: 0.6, w: 0.3, h: 0.4 }],
        6: [{ x: 0, y: 0, w: 2/3, h: 2/3 }, { x: 2/3, y: 0, w: 1/3, h: 1/3 }, { x: 2/3, y: 1/3, w: 1/3, h: 1/3 }, { x: 0, y: 2/3, w: 1/3, h: 1/3 }, { x: 1/3, y: 2/3, w: 1/3, h: 1/3 }, { x: 2/3, y: 2/3, w: 1/3, h: 1/3 }],
    };

    const pattern = layouts[Math.min(numImages, 6) as keyof typeof layouts] || layouts[6];
    
    return images.slice(0, pattern.length).map((img, index) => {
        const item = pattern[index];
        const spacingPercentW = (spacing / pageWidth) * 100;
        const spacingPercentH = (spacing / pageHeight) * 100;

        const w = (item.w * 100) - (spacingPercentW * 1.5);
        const h = (item.h * 100) - (spacingPercentH * 1.5);
        const x = (item.x * 100) + spacingPercentW;
        const y = (item.y * 100) + spacingPercentH;


        return {
            id: `photo-${index}`, src: img.src,
            x, y, width: w, height: h,
            ...defaultPhotoProps
        };
    });
}

function getFreeformLayout(images: ImageWithDimensions[], existingPhotos: CollagePhoto[] = []): CollagePhoto[] {
    const existingCount = existingPhotos.filter(p => !p.isOverlay).length;
    const maxZ = existingPhotos.length > 0 ? Math.max(...existingPhotos.map(p => p.zIndex)) : 0;

    return images.map((img, index) => ({
        id: `photo-${existingCount + index}`, src: img.src,
        x: (index * 10) % 70, y: (index * 15) % 70,
        width: 30, height: 30 * (img.height / img.width),
        rotation: Math.random() * 20 - 10,
        scale: 1, position: { x: 0, y: 0 },
        zIndex: maxZ + index + 1
    }));
}

function getTwoPhotoLayout(layoutType: CollageLayoutType, images: ImageWithDimensions[]): CollagePhoto[] {
    const [img1, img2] = images;
    if (!img1 || !img2) return [];

    switch(layoutType) {
        case 'two-v-split':
             return [
                { id: 'p1', src: img1.src, x: 0, y: 0, width: 50, height: 100, ...defaultPhotoProps }, 
                { id: 'p2', src: img2.src, x: 50, y: 0, width: 50, height: 100, ...defaultPhotoProps }
            ];
        case 'two-h-split':
            return [{ id: 'p1', src: img1.src, x: 0, y: 0, width: 100, height: 50, ...defaultPhotoProps }, { id: 'p2', src: img2.src, x: 0, y: 50, width: 100, height: 50, ...defaultPhotoProps }];
        case 'two-diagonal':
            return [
                { id: 'p1', src: img1.src, x: 0, y: 0, width: 100, height: 100, clipPath: { id: 'diag-top-left', path: 'M0,0 L1,0 L0,1 Z' }, ...defaultPhotoProps },
                { id: 'p2', src: img2.src, x: 0, y: 0, width: 100, height: 100, clipPath: { id: 'diag-bottom-right', path: 'M1,0 L1,1 L0,1 Z' }, ...defaultPhotoProps }
            ];
        case 'two-diagonal-curve':
            return [
                { id: 'p1', src: img1.src, x: 0, y: 0, width: 100, height: 100, clipPath: { id: 'diag-curve-top', path: 'M0,0 L1,0 C0.5,0.5 1,1 L0,1 Z' }, ...defaultPhotoProps },
                { id: 'p2', src: img2.src, x: 0, y: 0, width: 100, height: 100, clipPath: { id: 'diag-curve-bottom', path: 'M1,1 L0,1 C0.5,0.5 0,0 L1,0 Z' }, ...defaultPhotoProps }
            ];
        case 'two-circles':
            return [
                { id: 'p1', src: img1.src, x: 5, y: 25, width: 45, height: 45, clipPath: { id: 'circle', path: 'M0.5,0 A0.5,0.5 0 1,1 0.499,0 Z' }, ...defaultPhotoProps },
                { id: 'p2', src: img2.src, x: 50, y: 25, width: 45, height: 45, clipPath: { id: 'circle', path: 'M0.5,0 A0.5,0.5 0 1,1 0.499,0 Z' }, ...defaultPhotoProps }
            ];
        case 'two-torn':
             return [{ id: 'p1', src: img1.src, x: 0, y: 0, width: 52, height: 100, clipPath: { id: 'torn-left', path: 'M0,0 L1,0 C0.95,0.33 1.05,0.66 0.9,1 L0,1 Z' }, ...defaultPhotoProps }, { id: 'p2', src: img2.src, x: 48, y: 0, width: 52, height: 100, clipPath: { id: 'torn-right', path: 'M0,1 L1,1 L1,0 C0.05,0.33 -0.05,0.66 0.1,1 Z' }, ...defaultPhotoProps }];
        case 'two-hearts-2': // Curved Left (C-Curve)
             return [
                { id: 'p1', src: img1.src, x: 0, y: 0, width: 100, height: 100, clipPath: { id: 'curved-left', path: 'M0,0 L1,0 C0.5,0.5 0.5,0.5 0,1 L0,0 Z' }, ...defaultPhotoProps },
                { id: 'p2', src: img2.src, x: 0, y: 0, width: 100, height: 100, clipPath: { id: 'curved-right', path: 'M1,0 L1,1 C0.5,0.5 0.5,0.5 1,0 Z' }, ...defaultPhotoProps }
            ];
        case 'two-hearts-3': // Pentagon/Gem
             return [
                { id: 'p1', src: img1.src, x: 0, y: 0, width: 50, height: 100, clipPath: { id: 'pentagon-left', path: 'M1,0 L1,1 L0,0.8 L0,0.2 Z' }, ...defaultPhotoProps },
                { id: 'p2', src: img2.src, x: 50, y: 0, width: 50, height: 100, clipPath: { id: 'pentagon-right', path: 'M0,0 L1,0.2 L1,0.8 L0,1 Z' }, ...defaultPhotoProps }
            ];
        case 'two-hearts-4': // Side by side hearts
             return [
                { id: 'p1', src: img1.src, x: 5, y: 25, width: 45, height: 45, clipPath: { id: 'heart', path: 'M0.5,1 C0.5,1,0,0.75,0,0.5 C0,0.25,0.25,0,0.5,0 C0.75,0,1,0.25,1,0.5 C1,0.75,0.5,1,0.5,1 Z' }, ...defaultPhotoProps},
                { id: 'p2', src: img2.src, x: 50, y: 25, width: 45, height: 45, clipPath: { id: 'heart', path: 'M0.5,1 C0.5,1,0,0.75,0,0.5 C0,0.25,0.25,0,0.5,0 C0.75,0,1,0.25,1,0.5 C1,0.75,0.5,1,0.5,1 Z' }, ...defaultPhotoProps}
            ];
        case 'two-hearts-nested': {
            const heartPath = 'M0.5,1 C0.5,1,0,0.75,0,0.5 C0,0.25,0.25,0,0.5,0 C0.75,0,1,0.25,1,0.5 C1,0.75,0.5,1,0.5,1 Z';
            return [
                { id: 'p1', src: img1.src, x: 10, y: 10, width: 80, height: 80, clipPath: { id: 'heart-large', path: heartPath }, ...defaultPhotoProps, zIndex: 1, position: {x: 0, y: -10} },
                { id: 'p2', src: img2.src, x: 30, y: 30, width: 40, height: 40, clipPath: { id: 'heart-small', path: heartPath }, ...defaultPhotoProps, zIndex: 2, position: {x: 0, y: -10} }
            ];
        }
        case 'two-film':
             return [
                { id: 'p1', src: img1.src, x: 10.5, y: 13, width: 79, height: 35.5, ...defaultPhotoProps },
                { id: 'p2', src: img2.src, x: 10.5, y: 51.5, width: 79, height: 35.5, ...defaultPhotoProps },
                { id: 'p3', src: '/assets/film-overlay.png', x: 0, y: 0, width: 100, height: 100, isOverlay: true, ...defaultPhotoProps, zIndex: 10 },
             ];
        case 'two-text-heart':
            return [
                { id: 'p1', src: img1.src, x: 5, y: 5, width: 90, height: 90, ...defaultPhotoProps }, 
                { id: 'p2', src: '/assets/heart-text.png', x: 5, y: 5, width: 90, height: 90, isOverlay: true, ...defaultPhotoProps, zIndex: 10 }
            ];
        case 'two-text-see':
             return [
                { id: 'p1', src: img1.src, x: 5, y: 5, width: 90, height: 90, ...defaultPhotoProps }, 
                { id: 'p2', src: '/assets/see-love-text.png', x: 5, y: 5, width: 90, height: 90, isOverlay: true, ...defaultPhotoProps, zIndex: 10 }
            ];
        case 'two-love-text':
             return [
                { id: 'p1', src: img1.src, x: 5, y: 5, width: 90, height: 90, ...defaultPhotoProps }, 
                { id: 'p2', src: '/assets/love-text.png', x: 5, y: 5, width: 90, height: 90, isOverlay: true, ...defaultPhotoProps, zIndex: 10 }
            ];
        default:
            return [];
    }
}


export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [images, setImages] = useState<ImageWithDimensions[]>([]);
  const [copies, setCopies] = useState<number>(initialCopies);
  
  // Standard photosheet state
  const [photos, setPhotos] = useState<Photo[][]>([]);
  const [currentSheet, setCurrentSheet] = useState<number>(0);
  
  // Collage state
  const [collagePhotos, setCollagePhotos] = useState<CollagePhoto[]>([]);
  const [collageLayout, setCollageLayout] = useState<CollageLayoutType>(initialCollageLayout);
  const [collagePageSize, setCollagePageSize] = useState<'A4' | 'A3' | '4x6' | '5x7'>(initialCollagePageSize);
  const [activeEditorTab, setActiveEditorTab] = useState<EditorTab>(initialEditorTab);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [activeCropPhotoId, setActiveCropPhotoId] = useState<string | null>(null);
  
  // Common settings
  const [borderWidth, setBorderWidth] = useState<number>(initialBorderWidth);
  const [photoSpacing, setPhotoSpacing] = useState<number>(initialPhotoSpacing);
  const [photoWidthCm, setPhotoWidthCm] = useState<number>(initialPhotoWidthCm);
  const [photoHeightCm, setPhotoHeightCm] = useState<number>(initialPhotoHeightCm);
  const [unit, setUnit] = useState<Unit>(initialUnit);

  // Effect to recalculate collage layout when dependencies change
  useEffect(() => {
    const pageDims = PAGE_DIMENSIONS[collagePageSize];
    let newLayout: CollagePhoto[] = [];
    const collageImages = images.slice(0); // Use a copy

    if (collageLayout.startsWith('two-')) {
        newLayout = getTwoPhotoLayout(collageLayout, collageImages);
    } else {
        switch(collageLayout) {
            case 'grid':
                newLayout = getGridLayout(collageImages, pageDims.width, pageDims.height, photoSpacing);
                break;
            case 'mosaic':
                newLayout = getMosaicLayout(collageImages, pageDims.width, pageDims.height, photoSpacing);
                break;
            case 'freeform':
                const existingSrcs = collagePhotos.filter(p => !p.isOverlay).map(p => p.src);
                const newImages = collageImages.filter(img => !existingSrcs.includes(img.src));
                const removedSrcs = collagePhotos.filter(p => !collageImages.some(img => img.src === p.src) && !p.isOverlay).map(p => p.src);
                
                let currentPhotos = collagePhotos.filter(p => !removedSrcs.includes(p.src));
                
                if (newImages.length > 0) {
                    const newPhotoLayouts = getFreeformLayout(newImages, currentPhotos);
                    currentPhotos = [...currentPhotos, ...newPhotoLayouts];
                }
                newLayout = currentPhotos;
                break;
        }
    }
    
    if (newLayout.length > 0 || collageImages.length === 0) {
      setCollagePhotos(prevPhotos => {
          return newLayout.map((newPhoto) => {
              // Try to find a photo with the same ID to preserve its state
              const existingPhoto = prevPhotos.find(p => p.id === newPhoto.id);
              // If not found, try to find a photo with the same SRC if it's not an overlay
              const existingBySrc = !newPhoto.isOverlay ? prevPhotos.find(p => p.src === newPhoto.src) : undefined;
              
              const baseLayout = { ...defaultPhotoProps, ...newPhoto };

              if (existingPhoto && !newPhoto.isOverlay) {
                // If layout changes, we might need to reset some properties but keep others
                baseLayout.src = existingPhoto.src;
                return {
                  ...baseLayout,
                  scale: existingPhoto.scale, 
                  position: existingPhoto.position, 
                  rotation: existingPhoto.rotation,
                  zIndex: existingPhoto.zIndex,
                  scaleX: existingPhoto.scaleX,
                };
              }

              if (existingBySrc) {
                 return {
                  ...baseLayout,
                  src: existingBySrc.src, // Ensure src is correct
                  scale: existingBySrc.scale, 
                  position: existingBySrc.position, 
                  rotation: existingBySrc.rotation,
                  zIndex: existingBySrc.zIndex,
                  scaleX: existingBySrc.scaleX,
                };
              }
              
              return baseLayout;
          });
      });
    }
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images, collageLayout, collagePageSize, photoSpacing]);

  useEffect(() => {
    if (images.length === 2) {
      if (!collageLayout.startsWith('two-')) {
        setCollageLayout('two-v-split');
      }
    } else if (images.length > 0) {
        if (collageLayout.startsWith('two-')) {
             setCollageLayout('grid');
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.length]);

  const swapPhoto = useCallback((sourceId: number, targetId: number) => {
    setPhotos(currentSheets => {
      const newSheets = [...currentSheets];
      const currentSheetPhotos = newSheets[currentSheet];
      if (!currentSheetPhotos) return currentSheets;
  
      const sourcePhotoIndex = currentSheetPhotos.findIndex(p => p.id === sourceId);
      const targetPhotoIndex = currentSheetPhotos.findIndex(p => p.id === targetId);
      
      if (sourcePhotoIndex === -1 || targetPhotoIndex === -1) {
        return currentSheets;
      }
      
      const newSheetPhotos = [...currentSheetPhotos];
      // Swap the image sources
      const sourceImageSrc = newSheetPhotos[sourcePhotoIndex].imageSrc;
      newSheetPhotos[sourcePhotoIndex] = { ...newSheetPhotos[sourcePhotoIndex], imageSrc: newSheetPhotos[targetPhotoIndex].imageSrc };
      newSheetPhotos[targetPhotoIndex] = { ...newSheetPhotos[targetPhotoIndex], imageSrc: sourceImageSrc };
      
      newSheets[currentSheet] = newSheetPhotos;
      return newSheets;
    });
  }, [currentSheet]);

  const swapCollagePhoto = useCallback((sourceId: string, targetId: string) => {
      setCollagePhotos(prevPhotos => {
          const sourceIndex = prevPhotos.findIndex(p => p.id === sourceId);
          const targetIndex = prevPhotos.findIndex(p => p.id === targetId);

          if (sourceIndex === -1 || targetIndex === -1) return prevPhotos;
          
          const newPhotos = [...prevPhotos];
          const sourcePhoto = newPhotos[sourceIndex];
          const targetPhoto = newPhotos[targetIndex];

          // Swap only the image src, keep layout properties
          const tempSrc = sourcePhoto.src;
          newPhotos[sourceIndex] = { ...sourcePhoto, src: targetPhoto.src };
          newPhotos[targetIndex] = { ...targetPhoto, src: tempSrc };
          
          return newPhotos;
      });
  }, []);

  const updatePhotoDetails = useCallback((id: string, updates: Partial<CollagePhoto>) => {
    setCollagePhotos(prevPhotos =>
      prevPhotos.map(p => (p.id === id ? { ...p, ...updates } : p))
    );
  }, []);

  const bringForward = useCallback((id: string) => {
    setCollagePhotos(prev => {
        const photos = [...prev].sort((a,b) => a.zIndex - b.zIndex);
        const currentIndex = photos.findIndex(p => p.id === id);
        if (currentIndex < photos.length - 1) {
            const nextPhoto = photos[currentIndex + 1];
            if (nextPhoto) {
                const tempZ = photos[currentIndex].zIndex;
                photos[currentIndex].zIndex = nextPhoto.zIndex;
                nextPhoto.zIndex = tempZ;
            }
        }
        return photos;
    });
  }, []);

  const sendBackward = useCallback((id: string) => {
    setCollagePhotos(prev => {
        const photos = [...prev].sort((a,b) => a.zIndex - b.zIndex);
        const currentIndex = photos.findIndex(p => p.id === id);
        if (currentIndex > 0) {
            const prevPhoto = photos[currentIndex - 1];
            if (prevPhoto && !prevPhoto.isOverlay) {
                const tempZ = photos[currentIndex].zIndex;
                photos[currentIndex].zIndex = prevPhoto.zIndex;
                prevPhoto.zIndex = tempZ;
            }
        }
        return photos;
    });
  }, []);
  
  const resetLayout = useCallback(() => {
    setPhotos([]);
    setCurrentSheet(0);
    setBorderWidth(initialBorderWidth);
    setPhotoSpacing(initialPhotoSpacing);
    setPhotoWidthCm(initialPhotoWidthCm);
    setPhotoHeightCm(initialPhotoHeightCm);
    setUnit(initialUnit);
    setCollagePhotos([]);
    setCollageLayout(initialCollageLayout);
    setCollagePageSize(initialCollagePageSize);
    setActiveEditorTab(initialEditorTab);
    setSelectedPhotoId(null);
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
    setPhotoWidthCm,
    photoHeightCm,
    setPhotoHeightCm,
    unit,
    setUnit,
    resetEditor,
    resetLayout,
    collagePhotos,
    setCollagePhotos,
    collageLayout,
    setCollageLayout,
    collagePageSize,
    setCollagePageSize,
    activeEditorTab,
    setActiveEditorTab,
    selectedPhotoId,
    setSelectedPhotoId,
    activeCropPhotoId,
    setActiveCropPhotoId,
    updatePhotoDetails,
    swapCollagePhoto,
    bringForward,
    sendBackward,
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
