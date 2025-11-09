
"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEditor } from '@/context/editor-context';
import UploadStep from './steps/upload-step';
import PreviewStep from './steps/preview-step';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { GoogleSpinner } from '../ui/google-spinner';
import CollagePreviewStep from './steps/collage-preview-step';

interface Photosheet {
  id: string;
  imageUrls: string[]; 
  copies: number;
}

export default function EditorWizard() {
  const [step, setStep] = useState(1);
  const { setCopies, setImages, resetEditor, images } = useEditor();
  const searchParams = useSearchParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();

  const historyId = searchParams.get('historyId');
  const copiesParam = searchParams.get('copies');
  const flowParam = searchParams.get('flow');
  
  const photosheetDocRef = useMemoFirebase(() => {
      if (!firestore || !historyId || !user) return null;
      return doc(firestore, 'users', user.uid, 'photosheets', historyId);
  }, [firestore, historyId, user]);

  const { data: photosheet, isLoading } = useDoc<Photosheet>(photosheetDocRef);

  useEffect(() => {
    // This effect now correctly handles initialization based on URL params.
    if (historyId) {
        if (photosheet) {
            resetEditor();
            setImages(photosheet.imageUrls.map(src => ({ src, width: 500, height: 500 }))); // Assume default dimensions
            if (photosheet.copies) {
                setCopies(photosheet.copies);
            }
            // For now, history items always go to the passport editor.
            // This can be expanded later if collage history is added.
            setStep(2);
        }
        // If loading, we just wait. The component will re-render when `isLoading` changes.
        return;
    }
    
    if (flowParam === 'collage') {
        if (images.length === 0) {
            router.push('/');
            return;
        }
        // Don't change step or reset data, just let the component render the collage step.
        return; 
    }

    // Default case: New passport flow.
    // This runs if no historyId and no collage flow is specified.
    resetEditor();
    if (copiesParam) {
        const parsedCopies = parseInt(copiesParam, 10);
        if (!isNaN(parsedCopies)) {
            setCopies(parsedCopies);
        }
    }
    setStep(1);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyId, photosheet, flowParam, copiesParam]);


  const nextStep = () => {
    setStep(2);
  };

  const prevStep = () => {
    setStep(1);
  };
  
  const handleCollageBack = () => {
      // For collage, going back means returning to the homepage where the uploader is.
      // The images are preserved in context, so the uploader will show them.
      router.push('/');
  }

  // Loading state for history item
  if (historyId && isLoading) {
    return (
       <div className="w-full h-screen flex flex-col items-center justify-center gap-4">
        <GoogleSpinner />
        <p className="text-muted-foreground font-semibold">
            Loading from History...
        </p>
      </div>
    )
  }
  
  if (flowParam === 'collage') {
      return (
        <div className="flex flex-col flex-grow bg-slate-100">
            <CollagePreviewStep onBack={handleCollageBack} />
        </div>
      );
  }

  // Standard passport photo flow
  return (
    <div className="flex flex-col flex-grow bg-background">
        {step === 1 && <UploadStep onContinue={nextStep} />}
        {step === 2 && <PreviewStep onBack={prevStep} />}
    </div>
  );
}
