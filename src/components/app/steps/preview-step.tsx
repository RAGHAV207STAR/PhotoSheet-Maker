
"use client";

import { useEditor } from '@/context/editor-context';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import SheetPreview from '../sheet-preview';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Download, Printer, RotateCcw, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';


interface PreviewStepProps {
  onBack: () => void;
}


const CM_TO_IN = 0.393701;
const IN_TO_CM = 2.54;

export default function PreviewStep({ onBack }: PreviewStepProps) {
  const { 
    images, 
    copies, 
    photos,
    borderWidth, 
    setBorderWidth, 
    photoSpacing, 
    setPhotoSpacing,
    photoWidthCm,
    setPhotoWidthCm,
    photoHeightCm,
    setPhotoHeightCm,
    unit,
    setUnit,
    resetEditor,
  } = useEditor();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  
  // Local state for smoother input
  const [localWidth, setLocalWidth] = useState('');
  const [localHeight, setLocalHeight] = useState('');

  useEffect(() => {
    // Sync local state when global state changes (e.g., on init or unit change)
    const displayWidth = unit === 'cm' ? photoWidthCm : photoWidthCm * CM_TO_IN;
    const displayHeight = unit === 'cm' ? photoHeightCm : photoHeightCm * IN_TO_CM;
    setLocalWidth(displayWidth.toFixed(2));
    setLocalHeight(displayHeight.toFixed(2));
  }, [photoWidthCm, photoHeightCm, unit]);

  const saveToHistory = () => {
    if (user && firestore && images.length > 0) {
      const photosheetData = {
        imageUrl: images[0], // Save the first image to history for the thumbnail
        copies: copies,
        createdAt: serverTimestamp(),
      };
      const historyCollection = collection(firestore, 'users', user.uid, 'photosheets');
      addDocumentNonBlocking(historyCollection, photosheetData);
    }
  }

  const handleDownload = async () => {
    if (photos.length === 0 || images.length === 0) {
       toast({ title: 'Sheet not ready', description: 'Please upload at least one image.', variant: 'destructive' });
       return;
    }

    setIsProcessing(true);
    toast({
      title: 'Preparing Download',
      description: 'Generating high-quality PDF, please wait...',
    });

    try {
        const { default: jsPDF } = await import('jspdf');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });
        
        const sheetWidthMm = pdf.internal.pageSize.getWidth();
        const sheetHeightMm = pdf.internal.pageSize.getHeight();

        for (const photo of photos) {
            if (photo.imageSrc) {
                const xMm = (photo.x / 100) * sheetWidthMm;
                const yMm = (photo.y / 100) * sheetHeightMm;
                const photoWidthOnSheet = (photo.width / 100) * sheetWidthMm;
                const photoHeightOnSheet = (photo.height / 100) * sheetHeightMm;
                
                // Draw image first
                pdf.addImage(photo.imageSrc, 'JPEG', xMm, yMm, photoWidthOnSheet, photoHeightOnSheet, undefined, 'NONE');

                // Draw border on top of the image
                if (borderWidth > 0) {
                  const borderMm = borderWidth * 0.264583; // px to mm conversion
                  pdf.setDrawColor(150, 150, 150); // Gray color for border
                  pdf.setLineWidth(borderMm);
                  pdf.rect(xMm, yMm, photoWidthOnSheet, photoHeightOnSheet);
                }
            }
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
    }
  }


  const handlePrint = () => {
    if (photos.length === 0 || images.length === 0) {
       toast({ title: 'Sheet not generated', description: 'Please upload an image first.', variant: 'destructive' });
       return;
    }
    
    setIsProcessing(true);
    toast({
      title: 'Opening Print Dialog',
      description: 'Use the print dialog to print or save as PDF.',
    });

    saveToHistory();

    setTimeout(() => {
      window.print();
      setIsProcessing(false);
    }, 500);
  }

  const handleReset = () => {
    resetEditor();
    toast({
      title: 'Layout Reset',
      description: 'All adjustments have been returned to their defaults.',
    });
  }

  const updateGlobalSize = () => {
    const newWidth = parseFloat(localWidth);
    if (!isNaN(newWidth) && newWidth > 0) {
      setPhotoWidthCm(unit === 'cm' ? newWidth : newWidth * IN_TO_CM);
    }
    const newHeight = parseFloat(localHeight);
    if (!isNaN(newHeight) && newHeight > 0) {
      setPhotoHeightCm(unit === 'cm' ? newHeight : newHeight * IN_TO_CM);
    }
  };

  const handleInputBlur = () => {
    updateGlobalSize();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      updateGlobalSize();
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <>
      <div className="flex flex-col flex-grow p-4 sm:p-6 lg:p-8 justify-center items-center pb-20 md:pb-8">
        <main className="w-full flex flex-col lg:flex-row items-start justify-center gap-8">
            
            <div className="w-full lg:w-1/2 flex-shrink-0">
              <div className="text-center mb-4">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Customize Your Photosheet</h1>
                  <p className="text-muted-foreground mt-1">Drag and drop photos to arrange them.</p>
              </div>
              <div className="aspect-[210/297] w-full max-w-lg mx-auto shadow-lg overflow-hidden border bg-white">
                  <SheetPreview />
              </div>
            </div>

            <div className="w-full lg:w-1/2 max-w-lg no-print">
              <Card className="bg-white/60 backdrop-blur-lg border-0 shadow-lg rounded-xl">
                <CardHeader>
                    <CardTitle>Sheet Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4 pt-4">
                        <div className="flex justify-between items-center gap-4">
                          <Label>Photo Size Unit</Label>
                          <Tabs defaultValue="cm" value={unit} onValueChange={(value) => setUnit(value as 'cm' | 'in')} className="w-auto">
                              <TabsList className="grid w-full grid-cols-2 h-8">
                                <TabsTrigger value="cm" className="text-xs h-6">cm</TabsTrigger>
                                <TabsTrigger value="in" className="text-xs h-6">in</TabsTrigger>
                              </TabsList>
                            </Tabs>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="width-input">Width</Label>
                            <div className="relative">
                              <Input
                                id="width-input"
                                type="number"
                                value={localWidth}
                                onChange={(e) => setLocalWidth(e.target.value)}
                                onBlur={handleInputBlur}
                                onKeyDown={handleInputKeyDown}
                                className="pr-10"
                                step="0.01"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">{unit}</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="height-input">Height</Label>
                              <div className="relative">
                                  <Input
                                      id="height-input"
                                      type="number"
                                      value={localHeight}
                                      onChange={(e) => setLocalHeight(e.target.value)}
                                      onBlur={handleInputBlur}
                                      onKeyDown={handleInputKeyDown}
                                      className="pr-10"
                                      step="0.01"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">{unit}</span>
                              </div>
                          </div>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="border-slider">Border Width: <span className="font-bold">{borderWidth}px</span></Label>
                        <Slider
                            id="border-slider"
                            min={0}
                            max={5}
                            step={1}
                            value={[borderWidth]}
                            onValueChange={(value) => setBorderWidth(value[0])}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="spacing-slider">Photo Spacing: <span className="font-bold">{photoSpacing.toFixed(1)}cm</span></Label>
                        <Slider
                            id="spacing-slider"
                            min={0}
                            max={2}
                            step={0.1}
                            value={[photoSpacing]}
                            onValueChange={(value) => setPhotoSpacing(value[0])}
                        />
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="default" onClick={handleDownload} disabled={images.length === 0 || isProcessing} size="lg">
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                      </Button>
                      <Button variant="secondary" onClick={handlePrint} disabled={images.length === 0 || isProcessing} size="lg">
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                      </Button>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                        <Button variant="ghost" onClick={onBack} className="text-muted-foreground">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Change Photo
                        </Button>
                        <Button variant="outline" onClick={handleReset} disabled={isProcessing} size="sm">
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Reset Layout
                        </Button>
                    </div>
                </CardContent>
              </Card>
            </div>
        </main>
      </div>
    </>
  );
}
