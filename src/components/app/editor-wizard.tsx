
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
    if (photosheet) {
        setImages([photosheet.imageUrl]); // History loads a single image
        setCopies(photosheet.copies);
        setStep(2);
    } else if (copiesParam) {
        resetEditor(); 
        const parsedCopies = parseInt(copiesParam, 10);
        if (!isNaN(parsedCopies)) {
            setCopies(parsedCopies);
        }
        setStep(1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copiesParam, photosheet, historyId]);


  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => {
    setStep(s => s - 1)
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
