
"use client";

import dynamic from 'next/dynamic';
import { GoogleSpinner } from '@/components/ui/google-spinner';
import { EditorLoader } from './editor-loader';

// The EditorWizard component uses client-side hooks (useSearchParams, useContext),
// so it must be loaded on the client. We use dynamic import to code-split it.
const EditorWizard = dynamic(() => import('@/components/app/editor-wizard'), {
    loading: () => <div className="w-full h-screen flex flex-col items-center justify-center gap-4">
        <GoogleSpinner />
        <p className="text-muted-foreground font-semibold">Loading Editor...</p>
    </div>,
    ssr: false // Ensure this component only renders on the client
});

export default function EditorPage() {
  return <EditorLoader />;
}
