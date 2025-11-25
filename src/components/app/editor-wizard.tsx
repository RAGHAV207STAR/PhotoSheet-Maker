
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEditor, type EditorState } from '@/context/editor-context';
import UploadStep from './steps/upload-step';
import PreviewStep from './steps/preview-step';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { GoogleSpinner } from '../ui/google-spinner';
import SelectCopiesStep from './steps/select-copies-step';
import { AnimatePresence, motion } from 'framer-motion';
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { PhotoItem } from './sheet-preview';
import type { ImageWithDimensions, Photo } from '@/context/editor-context';
import Image from 'next/image';

interface Photosheet {
  id: string;
  thumbnailUrl: string; 
  copies: number;
  editorState: EditorState;
}

type WizardStep = 'select-copies' | 'upload-photos' | 'page-setup';

function DraggableOverlayContent({ item }: { item: Photo | ImageWithDimensions }) {
    if ('src' in item) {
        return (
             <div className="w-24 h-24 relative rounded-lg shadow-xl overflow-hidden bg-background">
                <Image src={item.src} alt="dragged image" fill className="object-cover" />
            </div>
        )
    }
    return (
        <div className="w-24 h-24">
            <PhotoItem
                photo={item}
                borderWidth={2}
                borderColor="#000000"
                isDragging
            />
        </div>
    )
}

export default function EditorWizard() {
  const [step, setStep] = useState<WizardStep>('select-copies');
  const { 
      setEditorState, 
      setCopies: setEditorCopies, 
      resetEditor,
      photos, 
      images,
      swapPhotoItems,
      placeImageInSlot,
  } = useEditor();

  const [activeDragItem, setActiveDragItem] = useState<Photo | ImageWithDimensions | null>(null);

  const sensors = useSensors(
      useSensor(PointerSensor),
      useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
      useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragEndEvent) => {
      const { active } = event;
      const activeId = active.id as string;
  
      const sheetPhoto = photos.flat().find(p => p.id.toString() === activeId);
      if (sheetPhoto) {
        setActiveDragItem(sheetPhoto);
        return;
      }
  
      const uploadedImage = images.find(img => img.src === activeId);
      if (uploadedImage) {
        setActiveDragItem(uploadedImage);
        return;
      }
  };

  const handleDragEnd = (event: DragEndEvent) => {
      setActiveDragItem(null);
      const { active, over } = event;
  
      if (!over) return;
  
      const activeId = active.id.toString();
      const overId = over.id.toString();
  
      if (activeId === overId) return;
  
      const isDraggingFromUploadedList = !!(active.data.current?.isFromUploadedList);
  
      if (isDraggingFromUploadedList) {
        const imageToPlace = images.find(img => img.src === activeId);
        if (imageToPlace) {
          placeImageInSlot(imageToPlace.src, parseInt(overId, 10));
        }
      } else {
        swapPhotoItems(parseInt(activeId, 10), parseInt(overId, 10));
      }
  };


  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const { user } = useUser();

  const historyId = searchParams.get('historyId');
  const copiesParam = searchParams.get('copies');
  
  const photosheetDocRef = useMemoFirebase(() => {
      if (!firestore || !historyId || !user) return null;
      return doc(firestore, 'users', user.uid, 'photosheets', historyId);
  }, [firestore, historyId, user]);

  const { data: photosheet, isLoading } = useDoc<Photosheet>(photosheetDocRef);

  useEffect(() => {
    if (historyId) return;
    if (!searchParams.toString()) resetEditor();
    
    if (copiesParam) {
      const parsedCopies = parseInt(copiesParam, 10);
      if (!isNaN(parsedCopies)) {
        setEditorCopies(parsedCopies);
        setStep('upload-photos');
      }
    } else {
      setStep('select-copies');
    }

  }, [historyId, copiesParam, resetEditor, setEditorCopies, searchParams]);

  useEffect(() => {
    if (historyId && photosheet && photosheet.editorState) {
        setEditorState(photosheet.editorState);
        setStep('page-setup');
    }
  }, [historyId, photosheet, setEditorState]);

  const goTo = (nextStep: WizardStep) => setStep(nextStep);
  
  if (historyId && isLoading) {
    return (
       <div className="w-full h-screen flex flex-col items-center justify-center gap-4">
        <GoogleSpinner />
        <p className="text-muted-foreground font-semibold">Loading from History...</p>
      </div>
    )
  }
  
  const renderStep = () => {
      switch (step) {
          case 'select-copies':
              return <SelectCopiesStep onContinue={() => goTo('upload-photos')} />;
          case 'upload-photos':
              return <UploadStep onContinue={() => goTo('page-setup')} onBack={() => goTo('select-copies')} />;
          case 'page-setup':
              return <PreviewStep onBack={() => goTo('upload-photos')} />;
          default:
              return <SelectCopiesStep onContinue={() => goTo('upload-photos')} />;
      }
  }

  return (
    <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col flex-grow bg-background">
          <AnimatePresence mode="wait">
              <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                  className="flex-grow flex flex-col"
              >
                  {renderStep()}
              </motion.div>
          </AnimatePresence>
      </div>
       <DragOverlay>
          {activeDragItem ? (
              <DraggableOverlayContent item={activeDragItem} />
          ) : null}
      </DragOverlay>
    </DndContext>
  );
}
