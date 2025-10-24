
"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEditor } from '@/context/editor-context';
import UploadStep from './steps/upload-step';
import PreviewStep from './steps/preview-step';
import { Logo } from '../icons/logo';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

interface Photosheet {
  id: string;
  imageUrl: string;
  copies: number;
}

export default function EditorWizard() {
  const [step, setStep] = useState(1);
  const { setCopies, setImage } = useEditor();
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
        setImage(photosheet.imageUrl);
        setCopies(photosheet.copies);
        setStep(2);
    } else {
        if (copiesParam) {
            const parsedCopies = parseInt(copiesParam, 10);
            if (!isNaN(parsedCopies)) {
                setCopies(parsedCopies);
            }
        }
    }
  }, [copiesParam, setCopies, photosheet, setImage]);

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);
  
  if (isLoading && historyId) {
    return (
       <div className="w-full h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Logo className="h-6 w-6 animate-spin" />
          <span className="font-semibold">Loading from History...</span>
        </div>
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
