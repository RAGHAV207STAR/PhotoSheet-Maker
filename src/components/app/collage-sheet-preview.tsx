"use client";

import { useEditor } from '@/context/editor-context';
import { Image as ImageIcon } from 'lucide-react';
import GridLayout from './layouts/grid-layout';
import MosaicLayout from './layouts/mosaic-layout';
import FreeformLayout from './layouts/freeform-layout';

const PAGE_DIMENSIONS = {
    'A4': { width: 210, height: 297 },
    'A3': { width: 297, height: 420 },
    '4x6': { width: 101.6, height: 152.4 },
    '5x7': { width: 127, height: 177.8 },
};

export default function CollageSheetPreview() {
    const { images, collageLayout, collagePageSize, setSelectedPhotoId, collagePhotos } = useEditor();
    
    const pageDims = PAGE_DIMENSIONS[collagePageSize];
    const aspectRatio = pageDims.width / pageDims.height;
    
    const renderLayout = () => {
        switch (collageLayout) {
            case 'grid':
            case 'two-v-split':
            case 'two-h-split':
            case 'two-torn':
            case 'two-hearts':
            case 'two-hearts-2':
            case 'two-hearts-3':
            case 'two-hearts-4':
            case 'two-film':
            case 'two-text-heart':
            case 'two-text-see':
            case 'two-love-text':
                return <GridLayout />;
            case 'mosaic':
                return <MosaicLayout />;
            case 'freeform':
                return <FreeformLayout />;
            default:
                return <GridLayout />;
        }
    };

    const handleDeselect = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).id === 'collage-sheet') {
            setSelectedPhotoId(null);
        }
    }
    
    const allClipPaths = collagePhotos.map(p => p.clipPath).filter(Boolean);
    const uniqueClipPaths = Array.from(new Map(allClipPaths.map(cp => [cp!.id, cp])).values());


    return (
        <div 
          id="collage-sheet" 
          className="printable-area w-full relative bg-white shadow-lg cursor-pointer"
          style={{ aspectRatio: `${aspectRatio}` }}
          onClick={handleDeselect}
        >
            {uniqueClipPaths.length > 0 && (
                <svg width="0" height="0">
                    <defs>
                        {uniqueClipPaths.map(cp => cp && (
                            <clipPath key={cp.id} id={cp.id} clipPathUnits="objectBoundingBox">
                                <path d={cp.path} />
                            </clipPath>
                        ))}
                    </defs>
                </svg>
            )}
            {images.length > 0 ? (
                renderLayout()
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-muted-foreground p-4 no-print">
                    <ImageIcon className="h-12 w-12 mb-4" />
                    <h3 className="text-lg font-semibold">Collage Preview</h3>
                    <p className="text-sm max-w-xs mx-auto">Your collage will appear here. Add some photos to get started.</p>
                </div>
            )}
        </div>
    );
}
