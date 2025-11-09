"use client";

import { useState } from 'react';
import { useEditor } from '@/context/editor-context';
import EditablePhoto from '../editable-photo';
import { cn } from '@/lib/utils';

interface HandleProps {
  id: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  style: React.CSSProperties;
  onDrag: (id: string, dx: number, dy: number) => void;
  onDragEnd: () => void;
}

const ResizeHandle = ({ id, position, style, onDrag, onDragEnd }: HandleProps) => {
    const [isDragging, setIsDragging] = useState(false);

    const handlePointerDown = (e: React.PointerEvent) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        
        setIsDragging(true);
        const target = e.currentTarget as HTMLElement;
        target.setPointerCapture(e.pointerId);

        const startPos = { x: e.clientX, y: e.clientY };

        const onPointerMove = (moveEvent: PointerEvent) => {
            const dx = moveEvent.clientX - startPos.x;
            const dy = moveEvent.clientY - startPos.y;
            onDrag(id, dx, dy);
        };

        const onPointerUp = () => {
            setIsDragging(false);
            target.removeEventListener('pointermove', onPointerMove);
            target.removeEventListener('pointerup', onPointerUp);
            target.releasePointerCapture(e.pointerId);
            onDragEnd();
        };

        target.addEventListener('pointermove', onPointerMove);
        target.addEventListener('pointerup', onPointerUp);
    };

    return (
        <div
            className={cn(
                "absolute bg-transparent z-20 group/handle hover:bg-primary/50 transition-colors",
                (position === 'left' || position === 'right') && "cursor-ew-resize",
                (position === 'top' || position === 'bottom') && "cursor-ns-resize",
                isDragging && "bg-primary/50"
            )}
            style={style}
            onPointerDown={handlePointerDown}
        >
             <div className={cn(
                "absolute bg-primary rounded-full opacity-0 group-hover/handle:opacity-100 transition-opacity",
                (position === 'left' || position === 'right') ? "w-1 h-8 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" : "h-1 w-8 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
             )} />
        </div>
    )
}

export default function MosaicLayout() {
    const { collagePhotos, setCollagePhotos } = useEditor();
    const [initialLayout, setInitialLayout] = useState<typeof collagePhotos | null>(null);

    const handleDrag = (id: string, dx: number, dy: number) => {
        const parent = document.getElementById('collage-sheet');
        if (!parent) return;

        if (!initialLayout) {
            setInitialLayout(JSON.parse(JSON.stringify(collagePhotos)));
            return;
        }

        const dxPercent = (dx / parent.clientWidth) * 100;
        const dyPercent = (dy / parent.clientHeight) * 100;

        setCollagePhotos(currentPhotos => {
            const newPhotos = [...initialLayout];
            
            const [p1Id, p2Id] = id.split('-');
            const photo1Index = newPhotos.findIndex(p => p.id === p1Id);
            const photo2Index = newPhotos.findIndex(p => p.id === p2Id);
            if (photo1Index === -1 || photo2Index === -1) return currentPhotos;
            
            const photo1 = newPhotos[photo1Index];
            const photo2 = newPhotos[photo2Index];

            // Vertical drag
            if (Math.abs(dxPercent) > Math.abs(dyPercent)) {
                if(photo1.x < photo2.x) { // photo1 is left of photo2
                    newPhotos[photo1Index] = {...photo1, width: initialLayout[photo1Index].width + dxPercent};
                    newPhotos[photo2Index] = {...photo2, x: initialLayout[photo2Index].x + dxPercent, width: initialLayout[photo2Index].width - dxPercent};
                } else { // photo1 is right of photo2
                    newPhotos[photo1Index] = {...photo1, x: initialLayout[photo1Index].x + dxPercent, width: initialLayout[photo1Index].width - dxPercent};
                    newPhotos[photo2Index] = {...photo2, width: initialLayout[photo2Index].width + dxPercent};
                }
            } 
            // Horizontal drag
            else {
                 if(photo1.y < photo2.y) { // photo1 is above photo2
                    newPhotos[photo1Index] = {...photo1, height: initialLayout[photo1Index].height + dyPercent};
                    newPhotos[photo2Index] = {...photo2, y: initialLayout[photo2Index].y + dyPercent, height: initialLayout[photo2Index].height - dyPercent};
                } else { // photo1 is below photo2
                    newPhotos[photo1Index] = {...photo1, y: initialLayout[photo1Index].y + dyPercent, height: initialLayout[photo1Index].height - dyPercent};
                    newPhotos[photo2Index] = {...photo2, height: initialLayout[photo2Index].height + dyPercent};
                }
            }

            return newPhotos;
        });
    };

    const handleDragEnd = () => {
        setInitialLayout(null);
    }
    
    const getAdjacentPairs = () => {
        const pairs = new Map<string, {p1: string, p2: string, orientation: 'v' | 'h'}>();
        for (let i = 0; i < collagePhotos.length; i++) {
            for (let j = i + 1; j < collagePhotos.length; j++) {
                const p1 = collagePhotos[i];
                const p2 = collagePhotos[j];

                // Check vertical adjacency (side-by-side)
                if (Math.abs((p1.x + p1.width) - p2.x) < 2 || Math.abs((p2.x + p2.width) - p1.x) < 2) {
                     if (Math.max(p1.y, p2.y) < Math.min(p1.y + p1.height, p2.y + p2.height)) {
                        pairs.set(`${p1.id}-${p2.id}-v`, {p1: p1.id, p2: p2.id, orientation: 'v'});
                     }
                }
                // Check horizontal adjacency (top-bottom)
                if (Math.abs((p1.y + p1.height) - p2.y) < 2 || Math.abs((p2.y + p2.height) - p1.y) < 2) {
                    if (Math.max(p1.x, p2.x) < Math.min(p1.x + p1.width, p2.x + p2.width)) {
                         pairs.set(`${p1.id}-${p2.id}-h`, {p1: p1.id, p2: p2.id, orientation: 'h'});
                    }
                }
            }
        }
        return Array.from(pairs.values());
    }

    const renderHandles = () => {
        const handles: JSX.Element[] = [];
        const pairs = getAdjacentPairs();

        pairs.forEach(pair => {
            const p1 = collagePhotos.find(p => p.id === pair.p1);
            const p2 = collagePhotos.find(p => p.id === pair.p2);
            if(!p1 || !p2) return;

            if (pair.orientation === 'v') {
                const handleX = p1.x < p2.x ? p1.x + p1.width : p2.x + p2.width;
                const handleY = Math.max(p1.y, p2.y);
                const handleHeight = Math.min(p1.y + p1.height, p2.y + p2.height) - handleY;
                handles.push(
                    <ResizeHandle
                        key={`${pair.p1}-${pair.p2}-v`}
                        id={`${pair.p1}-${pair.p2}`}
                        position="right"
                        style={{
                            left: `${handleX - 1}%`, top: `${handleY}%`,
                            width: '2%', height: `${handleHeight}%`
                        }}
                        onDrag={handleDrag} onDragEnd={handleDragEnd}
                    />
                )
            } else {
                 const handleY = p1.y < p2.y ? p1.y + p1.height : p2.y + p2.height;
                 const handleX = Math.max(p1.x, p2.x);
                 const handleWidth = Math.min(p1.x + p1.width, p2.x + p2.width) - handleX;
                 handles.push(
                    <ResizeHandle
                        key={`${pair.p1}-${pair.p2}-h`}
                        id={`${pair.p1}-${pair.p2}`}
                        position="bottom"
                        style={{
                            top: `${handleY - 1}%`, left: `${handleX}%`,
                            height: '2%', width: `${handleWidth}%`
                        }}
                        onDrag={handleDrag} onDragEnd={handleDragEnd}
                    />
                )
            }
        });

        return handles;
    }

    return (
        <>
            {collagePhotos.map(photo => (
                <EditablePhoto key={photo.id} photo={photo} />
            ))}
            {renderHandles()}
        </>
    );
}
