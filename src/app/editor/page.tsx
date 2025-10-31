
"use client";

import { Suspense } from 'react';
import EditorWizard from '@/components/app/editor-wizard';
import { GoogleSpinner } from '@/components/ui/google-spinner';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// This component uses useSearchParams, so it must be wrapped in Suspense.
function EditorPageContent() {
  return <EditorWizard />;
}

export default function EditorPage() {
  return (
    <Suspense fallback={
        <div className="w-full h-screen flex flex-col items-center justify-center gap-4">
            <GoogleSpinner />
            <p className="text-muted-foreground font-semibold">Loading Editor...</p>
        </div>
    }>
        <DndProvider backend={HTML5Backend}>
            <EditorPageContent />
        </DndProvider>
    </Suspense>
  );
}
