
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
  thumbnailUrl: string; 
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
    if (historyId) {
        if (photosheet) {
            resetEditor();
            if (photosheet.thumbnailUrl) {
                setImages([{ src: photosheet.thumbnailUrl, width: 500, height: 500 }]);
            }
            if (photosheet.copies) {
                setCopies(photosheet.copies);
            }
            setStep(2);
        }
        return;
    }
    
    // Default case: New passport flow.
    resetEditor();
    if (copiesParam) {
        const parsedCopies = parseInt(copiesParam, 10);
        if (!isNaN(parsedCopies)) {
            setCopies(parsedCopies);
        }
    }
    setStep(1);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyId, photosheet, copiesParam]);


  const nextStep = () => {
    setStep(2);
  };

  const prevStep = () => {
    setStep(1);
  };
  
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
  
  // Standard passport photo flow
  return (
    <div className="flex flex-col flex-grow bg-background">
        {step === 1 && <UploadStep onContinue={nextStep} />}
        {step === 2 && <PreviewStep onBack={prevStep} />}
    </div>
  );
}
