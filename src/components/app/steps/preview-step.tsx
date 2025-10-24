
"use client";

import { useEditor } from '@/context/editor-context';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import SheetPreview from '../sheet-preview';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import jsPDF from 'jspdf';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';


interface PreviewStepProps {
  onBack: () => void;
}

export default function PreviewStep({ onBack }: PreviewStepProps) {
  const { image, copies, photos, setPhotos, borderWidth, setBorderWidth, photoSpacing, setPhotoSpacing } = useEditor();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingLabel, setProcessingLabel] = useState('');
  const { user } = useUser();
  const firestore = useFirestore();

  const photoWidthCm = 3.15;
  const photoHeightCm = 4.15;

  const generateSheetLayout = () => {
    const sheetWidthMm = 210;
    const sheetHeightMm = 297;
    const photoWidthMm = photoWidthCm * 10;
    const photoHeightMm = photoHeightCm * 10;
    const spacingMm = photoSpacing * 10;

    const newPhotos = [];
    
    if (copies > 0) {
        const cols = Math.floor((sheetWidthMm - spacingMm) / (photoWidthMm + spacingMm));
        const rows = Math.floor((sheetHeightMm - spacingMm) / (photoHeightMm + spacingMm));

        const effectiveCols = Math.max(1, cols);
      
        const numPhotos = Math.min(copies, effectiveCols * rows);

      for (let i = 0; i < numPhotos; i++) {
        const r = Math.floor(i / effectiveCols);
        const c = i % effectiveCols;

        const xPos = spacingMm + c * (photoWidthMm + spacingMm);
        const yPos = spacingMm + r * (photoHeightMm + spacingMm);

        newPhotos.push({
          id: i,
          x: (xPos / sheetWidthMm) * 100,
          y: (yPos / sheetHeightMm) * 100,
          width: (photoWidthMm / sheetWidthMm) * 100,
          height: (photoHeightMm / sheetHeightMm) * 100,
        });
      }
    }
    
    setPhotos(newPhotos);
  };
  
  useEffect(() => {
    generateSheetLayout();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copies, setPhotos, photoSpacing]);

  const saveToHistory = () => {
    if (user && firestore && image) {
      const photosheetData = {
        userId: user.uid,
        imageUrl: image,
        copies: copies,
        createdAt: serverTimestamp(),
      };
      const historyCollection = collection(firestore, 'users', user.uid, 'photosheets');
      addDocumentNonBlocking(historyCollection, photosheetData);
    }
  }

  const handleDownload = async () => {
    if (photos.length === 0 || !image) {
       toast({ title: 'Sheet not ready', description: 'Please upload an image first.', variant: 'destructive' });
       return;
    }

    setProcessingLabel('Downloading...');
    setIsProcessing(true);
    toast({
      title: 'Preparing Download',
      description: 'Generating high-quality PDF, please wait...',
    });

    try {
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });
        
        const sheetWidthMm = pdf.internal.pageSize.getWidth();
        const sheetHeightMm = pdf.internal.pageSize.getHeight();
        
        // Draw each photo directly onto the PDF
        for (const photo of photos) {
            const xMm = (photo.x / 100) * sheetWidthMm;
            const yMm = (photo.y / 100) * sheetHeightMm;
            const photoWidthOnSheet = (photo.width / 100) * sheetWidthMm;
            const photoHeightOnSheet = (photo.height / 100) * sheetHeightMm;

            // Draw border
            if (borderWidth > 0) {
              const borderMm = borderWidth * 0.264583; // Convert px to mm (approx)
              pdf.setDrawColor(0, 0, 0);
              pdf.setLineWidth(borderMm);
              pdf.rect(xMm, yMm, photoWidthOnSheet, photoHeightOnSheet, 'S');
            }

            // Add the original image
            pdf.addImage(image, 'JPEG', xMm, yMm, photoWidthOnSheet, photoHeightOnSheet, undefined, 'NONE');
        }
        
        pdf.save('photosheet.pdf');
        saveToHistory();

    } catch (error) {
        console.error("Error generating PDF:", error);
        toast({
            title: 'Download Failed',
            description: 'An error occurred while generating the PDF.',
            variant: 'destructive'
        });
    } finally {
        setIsProcessing(false);
        setProcessingLabel('');
    }
  }


  const handlePrint = () => {
    if (photos.length === 0 || !image) {
       toast({ title: 'Sheet not generated', description: 'Please upload an image first.', variant: 'destructive' });
       return;
    }
    
    setProcessingLabel('Printing...');
    setIsProcessing(true);
    toast({
      title: 'Opening Print Dialog',
      description: 'Use the print dialog to print or save as PDF.',
    });

    saveToHistory();

    setTimeout(() => {
      window.print();
      setIsProcessing(false);
      setProcessingLabel('');
    }, 500);
  }

  const handleReset = () => {
    setBorderWidth(1);
    setPhotoSpacing(0.3);
    generateSheetLayout(); // This regenerates the original layout
    toast({
      title: 'Layout Reset',
      description: 'All adjustments have been returned to their defaults.',
    });
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col flex-grow p-4 sm:p-6 lg:p-8 justify-center items-center pb-20 md:pb-8">
        <main className="w-full flex flex-col items-center gap-8">
            <div className="text-center">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Customize Your Photosheet</h1>
                <p className="text-muted-foreground mt-1">Adjust borders, spacing, and print when ready.</p>
            </div>
            <div className="aspect-[210/297] w-full max-w-lg shadow-lg overflow-hidden border bg-white">
                <SheetPreview />
            </div>

            <div className="w-full max-w-lg space-y-6 no-print p-4 sm:p-0">
                <div className="grid gap-2">
                    <Label htmlFor="border-slider">Border Breadth: {borderWidth}px</Label>
                    <Slider
                        id="border-slider"
                        min={0}
                        max={10}
                        step={1}
                        value={[borderWidth]}
                        onValueChange={(value) => setBorderWidth(value[0])}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="spacing-slider">Spacing Between Photos: {photoSpacing}cm</Label>
                     <Slider
                        id="spacing-slider"
                        min={0}
                        max={2}
                        step={0.1}
                        value={[photoSpacing]}
                        onValueChange={(value) => setPhotoSpacing(value[0])}
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                  <Button variant="outline" onClick={handleDownload} disabled={!image || isProcessing} size="lg">
                    Download
                  </Button>
                  <Button variant="default" onClick={handlePrint} disabled={!image || isProcessing} size="lg">
                    Print
                  </Button>
                  <Button variant="secondary" onClick={handleReset} disabled={isProcessing} size="lg">
                    Reset
                  </Button>
                </div>
            </div>
        </main>
      </div>
    </DndProvider>
  );
}
