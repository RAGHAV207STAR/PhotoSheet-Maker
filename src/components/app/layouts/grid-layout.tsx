"use client";

import { useState } from 'react';
import EditablePhoto from '../editable-photo';
import { useEditor } from '@/context/editor-context';
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

export default function GridLayout() {
    const { collagePhotos, updatePhotoDetails, setCollagePhotos } = useEditor();
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

        const [type, indexStr] = id.split('-');
        const index = parseInt(indexStr, 10);

        setCollagePhotos(currentPhotos => {
            const newPhotos = [...initialLayout];
            
            if (type === 'v') { // Vertical Handle
                const row = Math.floor(index / (Math.round(Math.sqrt(newPhotos.length)) -1));
                const col = index % (Math.round(Math.sqrt(newPhotos.length)) -1);

                const leftPhotoIndex = row * Math.ceil(Math.sqrt(newPhotos.length)) + col;
                const rightPhotoIndex = leftPhotoIndex + 1;
                
                if (newPhotos[leftPhotoIndex] && newPhotos[rightPhotoIndex]) {
                    newPhotos[leftPhotoIndex] = {...newPhotos[leftPhotoIndex], width: initialLayout[leftPhotoIndex].width + dxPercent };
                    newPhotos[rightPhotoIndex] = {...newPhotos[rightPhotoIndex], x: initialLayout[rightPhotoIndex].x + dxPercent, width: initialLayout[rightPhotoIndex].width - dxPercent };
                }
            } else if (type === 'h') { // Horizontal Handle
                 const cols = Math.ceil(Math.sqrt(newPhotos.length));
                 const topPhotoIndex = index;
                 const bottomPhotoIndex = index + cols;
                 if (newPhotos[topPhotoIndex] && newPhotos[bottomPhotoIndex]) {
                    newPhotos[topPhotoIndex] = {...newPhotos[topPhotoIndex], height: initialLayout[topPhotoIndex].height + dyPercent };
                    newPhotos[bottomPhotoIndex] = {...newPhotos[bottomPhotoIndex], y: initialLayout[bottomPhotoIndex].y + dyPercent, height: initialLayout[bottomPhotoIndex].height - dyPercent };
                }
            }

            return newPhotos;
        });
    };
    
    const handleDragEnd = () => {
        setInitialLayout(null);
    }
    
    const renderHandles = () => {
        const handles: JSX.Element[] = [];
        const numImages = collagePhotos.length;
        if (numImages <= 1) return null;

        const cols = Math.ceil(Math.sqrt(numImages));
        const rows = Math.ceil(numImages / cols);

        // Vertical handles
        if (cols > 1) {
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols - 1; c++) {
                    const photoIndex = r * cols + c;
                    const photo = collagePhotos[photoIndex];
                    if (!photo) continue;
                     handles.push(
                        <ResizeHandle
                            key={`v-${r * (cols - 1) + c}`}
                            id={`v-${r * (cols - 1) + c}`}
                            position="right"
                            style={{
                                left: `${photo.x + photo.width - 1}%`,
                                top: `${photo.y}%`,
                                width: `2%`,
                                height: `${photo.height}%`,
                            }}
                            onDrag={handleDrag}
                            onDragEnd={handleDragEnd}
                        />
                    );
                }
            }
        }
        
        // Horizontal handles
        if (rows > 1) {
            for (let r = 0; r < rows - 1; r++) {
                for (let c = 0; c < cols; c++) {
                    const photoIndex = r * cols + c;
                    const photo = collagePhotos[photoIndex];
                     if (!photo || !collagePhotos[photoIndex + cols]) continue;
                     handles.push(
                        <ResizeHandle
                            key={`h-${photoIndex}`}
                            id={`h-${photoIndex}`}
                            position="bottom"
                            style={{
                                left: `${photo.x}%`,
                                top: `${photo.y + photo.height - 1}%`,
                                width: `${photo.width}%`,
                                height: `2%`,
                            }}
                            onDrag={handleDrag}
                            onDragEnd={handleDragEnd}
                        />
                    );
                }
            }
        }

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
