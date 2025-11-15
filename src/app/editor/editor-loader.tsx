
"use client";

import dynamic from 'next/dynamic';
import { GoogleSpinner } from '@/components/ui/google-spinner';

// This component uses useSearchParams, so it must be loaded on the client.
const EditorPageContent = dynamic(() => import('@/components/app/editor-wizard'), {
    loading: () => <div className="w-full h-screen flex flex-col items-center justify-center gap-4">
        <GoogleSpinner />
        <p className="text-muted-foreground font-semibold">Initializing Editor...</p>
    </div>,
    ssr: false
});

export function EditorLoader() {
    return <EditorPageContent />;
}
