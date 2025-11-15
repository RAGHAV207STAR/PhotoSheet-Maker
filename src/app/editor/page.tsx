
"use client";

import { Suspense } from 'react';
import { GoogleSpinner } from '@/components/ui/google-spinner';
import EditorWizard from '@/components/app/editor-wizard';


export default function EditorPage() {
  return (
    <Suspense fallback={
        <div className="w-full h-screen flex flex-col items-center justify-center gap-4">
            <GoogleSpinner />
            <p className="text-muted-foreground font-semibold">Loading Editor...</p>
        </div>
    }>
      <EditorWizard />
    </Suspense>
  );
}
