
"use client";

import { useRef, useState, useEffect, useCallback, MouseEvent as ReactMouseEvent } from 'react';
import { motion } from 'framer-motion';
import { useEditor, CollagePhoto } from '@/context/editor-context';
import Image from 'next/image';
import { ImageIcon, Move, RotateCw, Trash2, Check, X, Maximize, BringToFront, SendToBack, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Rnd, type DraggableData, type ResizableDelta, type Position } from 'react-rnd';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Slider } from '../ui/slider';
import { useDrag, useDrop, DropTargetMonitor } from 'react-dnd';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface EditablePhotoProps {
  photo: CollagePhoto;
  isFreeform?: boolean;
}

interface DragItem {
    id: string;
    type: 'PHOTO_COLLAGE'
}

export default function EditablePhoto({ photo, isFreeform = false }: EditablePhotoProps) {
  const {
    borderWidth,
    selectedPhotoId,
    setSelectedPhotoId,
    updatePhotoDetails,
    activeCropPhotoId,
    setActiveCropPhotoId,
    swapCollagePhoto,
    setImages,
    collageLayout,
    bringForward,
    sendBackward,
  } = useEditor();
  
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [internalScale, setInternalScale] = useState(photo.scale);
  const [internalPosition, setInternalPosition] = useState(photo.position);

  const initialPinchDistance = useRef<number | null>(null);
  const initialScale = useRef<number>(1);
  
  const isSelected = selectedPhotoId === photo.id;
  const isCropping = activeCropPhotoId === photo.id;

  const [{ isDragging }, drag, preview] = useDrag({
    type: 'PHOTO_COLLAGE',
    item: { id: photo.id, type: 'PHOTO_COLLAGE' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: !isFreeform && !photo.isOverlay,
  });

  const [{ isOver, canDrop }, drop] = useDrop<DragItem, void, { isOver: boolean, canDrop: boolean }>({
    accept: 'PHOTO_COLLAGE',
    drop: (item) => {
        if (item.id !== photo.id && !photo.isOverlay) {
            swapCollagePhoto(item.id, photo.id);
        }
    },
    collect: (monitor: DropTargetMonitor) => ({
        isOver: monitor.isOver() && !photo.isOverlay,
        canDrop: monitor.canDrop() && !photo.isOverlay,
    }),
  });

  const combineRefs = (el: HTMLDivElement) => {
    drag(el);
    drop(el);
  };
  
  useEffect(() => {
    setInternalScale(photo.scale);
    setInternalPosition(photo.position);
  }, [photo.scale, photo.position, photo.id]);

  const handleSelect = (e: React.MouseEvent | React.TouchEvent) => {
    if (photo.isOverlay) return;
    if(isCropping) return;
    e.stopPropagation();
    setSelectedPhotoId(isSelected ? null : photo.id);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isCropping) return;
    if (e.pointerType === 'mouse' && e.button === 0) {
      e.preventDefault();
      e.stopPropagation();
      const target = e.target as HTMLElement;
      const startPos = { x: e.clientX, y: e.clientY };
      
      const onPointerMove = (moveEvent: PointerEvent) => {
          const dx = moveEvent.clientX - startPos.x;
          const dy = moveEvent.clientY - startPos.y;
          setInternalPosition(prev => ({x: prev.x + dx, y: prev.y + dy}));
          startPos.x = moveEvent.clientX;
          startPos.y = moveEvent.clientY;
      };

      const onPointerUp = () => {
          updatePhotoDetails(photo.id, { position: internalPosition });
          target.removeEventListener('pointermove', onPointerMove);
          target.removeEventListener('pointerup', onPointerUp);
          target.releasePointerCapture(e.pointerId);
      };

      target.addEventListener('pointermove', onPointerMove);
      target.addEventListener('pointerup', onPointerUp);
      target.setPointerCapture(e.pointerId);
    }
  };
  
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isCropping || e.touches.length !== 2) return;
    e.stopPropagation();
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    initialPinchDistance.current = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
    initialScale.current = internalScale;
  };

  const handleTouchMove = useCallback((e: TouchEvent) => {
      if (!isCropping || e.touches.length !== 2 || initialPinchDistance.current === null) return;
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      const scaleFactor = currentDistance / initialPinchDistance.current;
      const newScale = Math.max(0.5, Math.min(initialScale.current * scaleFactor, 5));
      setInternalScale(newScale);
      updatePhotoDetails(photo.id, { scale: newScale });
  }, [isCropping, updatePhotoDetails, photo.id]);
  
  const handleTouchEnd = () => {
      initialPinchDistance.current = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!isSelected && !isCropping) return;
    if(photo.isOverlay) return;
    e.preventDefault();
    e.stopPropagation();
    const newScale = internalScale - e.deltaY * 0.001;
    const clampedScale = Math.max(0.5, Math.min(newScale, 5));
    setInternalScale(clampedScale);
    updatePhotoDetails(photo.id, { scale: clampedScale });
  };
  
  const handleDragStopRnd = (e: any, d: DraggableData) => {
      if (!d.node.parentElement) return;
      updatePhotoDetails(photo.id, {
          x: (d.x / d.node.parentElement.clientWidth) * 100,
          y: (d.y / d.node.parentElement.clientHeight) * 100,
      });
  };

  const handleResizeStopRnd = (e: any, direction: any, ref: HTMLElement, delta: ResizableDelta, position: Position) => {
      if (!ref.parentElement) return;
      updatePhotoDetails(photo.id, {
          width: (ref.offsetWidth / ref.parentElement.clientWidth) * 100,
          height: (ref.offsetHeight / ref.parentElement.clientHeight) * 100,
          x: (position.x / ref.parentElement.clientWidth) * 100,
          y: (position.y / ref.parentElement.clientHeight) * 100,
      });
  };

  const handleRotate = () => {
      const newRotation = (photo.rotation + 90) % 360;
      updatePhotoDetails(photo.id, { rotation: newRotation });
  }

  const handleRemove = () => {
      setImages(prev => prev.filter(img => img.src !== photo.src));
      setSelectedPhotoId(null);
  }
  
  const handleApplyCrop = () => {
    updatePhotoDetails(photo.id, { scale: internalScale, position: internalPosition });
    setActiveCropPhotoId(null);
  };
  
  const handleEnterCropMode = () => {
      setActiveCropPhotoId(photo.id);
      setSelectedPhotoId(null);
  }
  
  const photoContent = (
    <div
      id={`photo-div-${photo.id}`}
      className={cn(
        "relative w-full h-full overflow-hidden", 
        isCropping ? "cursor-move" : "cursor-pointer",
        isDragging && 'opacity-30'
       )}
      style={{
        borderWidth: (isFreeform || photo.isOverlay) ? '0px' : `${borderWidth}px`,
        borderColor: 'black',
        borderStyle: 'solid',
        clipPath: photo.clipPath ? `url(#${photo.clipPath.id})` : 'none',
      }}
      onClick={handleSelect}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove as any}
      onTouchEnd={handleTouchEnd}
      ref={!isFreeform ? combineRefs : null}
    >
      {photo.src ? (
        <motion.div
          className="w-full h-full"
          style={{
            transform: `scale(${internalScale}) translate(${internalPosition.x}px, ${internalPosition.y}px) scaleX(${photo.scaleX || 1})`,
          }}
          transition={{ type: "tween", ease: "linear", duration: 0.05 }}
        >
          <Image 
            src={photo.src} 
            alt={`Collage photo ${photo.id}`} 
            className="w-full h-full object-cover pointer-events-none" 
            fill 
            priority
          />
        </motion.div>
      ) : (
        <div className="w-full h-full bg-secondary flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}

      {isCropping && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
            <Move className="text-white/80 w-12 h-12" />
        </div>
       )}

      {!isFreeform && isOver && canDrop && (
         <div className="absolute inset-0 bg-primary/30 ring-2 ring-primary pointer-events-none" />
      )}
    </div>
  );

  if (isFreeform) {
    const parentSheet = document.getElementById('collage-sheet');
    const defaultX = parentSheet ? (photo.x / 100) * parentSheet.clientWidth : 0;
    const defaultY = parentSheet ? (photo.y / 100) * parentSheet.clientHeight : 0;
    
    return (
        <Rnd
            size={{ width: `${photo.width}%`, height: `${photo.height}%` }}
            position={{ x: defaultX , y: defaultY }}
            onDragStop={handleDragStopRnd}
            onResizeStop={handleResizeStopRnd}
            className={cn("overflow-hidden group/rnd", (isSelected || isCropping) && "z-20", isSelected && !isCropping && "ring-2 ring-primary ring-inset")}
            bounds="parent"
            style={{
                transform: `rotate(${photo.rotation}deg)`,
                zIndex: photo.zIndex
            }}
            onMouseDownCapture={handleSelect as (e: ReactMouseEvent) => void}
            disableDragging={isCropping || photo.isOverlay}
            enableResizing={!isCropping && isSelected && !photo.isOverlay}
        >
            {photoContent}
        </Rnd>
    );
  }

  return (
    <div
      className={cn(
          "absolute photo-item",
          photo.isOverlay && "pointer-events-none"
        )}
      style={{
        left: `${photo.x}%`,
        top: `${photo.y}%`,
        width: `${photo.width}%`,
        height: `${photo.height}%`,
        transform: `rotate(${photo.rotation}deg)`,
        zIndex: isSelected ? 10 : photo.zIndex,
      }}
    >
      {photoContent}
       {isSelected && !photo.isOverlay && !activeCropPhotoId && (
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                  <div className="absolute inset-0 pointer-events-none ring-4 ring-primary ring-inset" />
              </PopoverTrigger>
              <PopoverContent className="w-auto p-1" side="top" align="center" sideOffset={10}>
                <TooltipProvider>
                  <div className="flex items-center gap-1 bg-background p-1 rounded-md">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleRemove}><Trash2 className="h-4 w-4" /></Button>
                            </TooltipTrigger>
                             <TooltipContent><p>Remove</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleEnterCropMode}><Maximize className="h-4 w-4" /></Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Crop & Pan</p></TooltipContent>
                        </Tooltip>
                       
                        <div className="w-px h-6 bg-border mx-1" />

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => updatePhotoDetails(photo.id, { scale: Math.max(0.5, internalScale - 0.2) })}><ZoomOut className="h-4 w-4" /></Button>
                            </TooltipTrigger>
                             <TooltipContent><p>Zoom Out</p></TooltipContent>
                        </Tooltip>
                        <Slider 
                            value={[internalScale]} 
                            onValueChange={(val) => updatePhotoDetails(photo.id, { scale: val[0] })}
                            min={0.5} max={5} step={0.1}
                            className="w-24"
                        />
                        <Tooltip>
                            <TooltipTrigger asChild>
                                 <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => updatePhotoDetails(photo.id, { scale: Math.min(5, internalScale + 0.2) })}><ZoomIn className="h-4 w-4" /></Button>
                            </TooltipTrigger>
                             <TooltipContent><p>Zoom In</p></TooltipContent>
                        </Tooltip>
                         <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleRotate}><RotateCw className="h-4 w-4" /></Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Rotate</p></TooltipContent>
                        </Tooltip>
                        {collageLayout === 'freeform' && (
                            <>
                               <div className="w-px h-6 bg-border mx-1" />
                               <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => bringForward(photo.id)}><BringToFront className="h-4 w-4" /></Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Bring Forward</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                         <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => sendBackward(photo.id)}><SendToBack className="h-4 w-4" /></Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Send Backward</p></TooltipContent>
                                </Tooltip>
                            </>
                        )}
                  </div>
                </TooltipProvider>
              </PopoverContent>
          </Popover>
      )}
       {activeCropPhotoId === photo.id && (
            <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 z-30">
                <div className="flex items-center gap-1 bg-background p-1 rounded-full shadow-lg border">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => setActiveCropPhotoId(null)}><X className="h-4 w-4" /></Button>
                    <Slider 
                        value={[internalScale]} 
                        onValueChange={(val) => setInternalScale(val[0])}
                        onValueCommit={(val) => updatePhotoDetails(photo.id, { scale: val[0] })}
                        min={0.5} max={5} step={0.1}
                        className="w-24"
                    />
                    <Button size="icon" className="h-9 w-9 rounded-full" onClick={handleApplyCrop}><Check className="h-4 w-4" /></Button>
                </div>
            </div>
        )}
    </div>
  );
}
