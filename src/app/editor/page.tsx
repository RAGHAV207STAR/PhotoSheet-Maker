
"use client";

import { Suspense } from 'react';
import EditorWizard from '@/components/app/editor-wizard';

// This component uses useSearchParams, so it must be wrapped in Suspense.
function EditorPageContent() {
  return <EditorWizard />;
}

function EditorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditorPageContent />
    </Suspense>
  );
}

export default EditorPage;
