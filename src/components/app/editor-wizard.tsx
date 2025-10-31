
"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEditor } from '@/context/editor-context';
import UploadStep from './steps/upload-step';
import PreviewStep from './steps/preview-step';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { GoogleSpinner } from '../ui/google-spinner';

interface Photosheet {
  id: string;
  imageUrl: string; 
  copies: number;
}

export default function EditorWizard() {
  const [step, setStep] = useState(1);
  const { setCopies, setImages, resetEditor } = useEditor();
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
    // This effect runs when the component mounts or when the dependencies change.
    // It decides the initial state of the editor based on URL params.
    
    // If we're loading from a history entry:
    if (photosheet) {
        setImages([photosheet.imageUrl]);
        setCopies(photosheet.copies);
        setStep(2); // Go directly to preview
        return; // Stop further processing
    }

    // If we are navigating from the homepage with a 'copies' param:
    if (copiesParam) {
        const parsedCopies = parseInt(copiesParam, 10);
        if (!isNaN(parsedCopies)) {
            resetEditor(); // Clear any previous state
            setCopies(parsedCopies);
            setImages([]); // Ensure images are cleared for a new session
            setStep(1); // Start at the upload step
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copiesParam, historyId, photosheet, resetEditor, setCopies, setImages]);


  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => {
    // When going back from preview to upload, we should clear the images
    // but keep the number of copies selected from the homepage.
    setImages([]);
    setStep(1);
  };

  if (isLoading && historyId) {
    return (
       <div className="w-full h-screen flex flex-col items-center justify-center gap-4">
        <GoogleSpinner />
        <p className="text-muted-foreground font-semibold">Loading from History...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-grow bg-background">
        {step === 1 && <UploadStep onContinue={nextStep} />}
        {step === 2 && <PreviewStep onBack={prevStep} />}
    </div>
  );
}
