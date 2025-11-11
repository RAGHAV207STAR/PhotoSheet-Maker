
"use client";

import { useEditor } from '@/context/editor-context';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import SheetPreview from '../sheet-preview';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useUser, useFirestore } from '@/firebase';
import { collection, serverTimestamp, addDoc } from 'firebase/firestore';
import { Download, Printer, RotateCcw, ArrowLeft, ChevronLeft, ChevronRight, FileDown, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import * as htmlToImage from 'html-to-image';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';


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
    currentSheet,
    setCurrentSheet,
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
    resetLayout,
  } = useEditor();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  
  // Local state for smoother input
  const [localWidth, setLocalWidth] = useState('');
  const [localHeight, setLocalHeight] = useState('');

  const totalSheets = photos.length;

  useEffect(() => {
    // Sync local state when global state changes (e.g., on init or unit change)
    const displayWidth = unit === 'cm' ? photoWidthCm : photoWidthCm * CM_TO_IN;
    const displayHeight = unit === 'cm' ? photoHeightCm : photoHeightCm * IN_TO_CM;
    setLocalWidth(displayWidth.toFixed(2));
    setLocalHeight(displayHeight.toFixed(2));
  }, [photoWidthCm, photoHeightCm, unit]);

  const saveToHistory = () => {
    if (user && firestore && images.length > 0) {
      const firstImageSrc = images[0]?.src;
      if (!firstImageSrc) {
        console.warn("Could not save to history: no source image available.");
        return;
      }
      
      const photosheetData = {
        userId: user.uid, // Add userId for security rule validation
        thumbnailUrl: firstImageSrc,
        copies: copies,
        createdAt: serverTimestamp(),
      };
      
      const historyCollection = collection(firestore, 'users', user.uid, 'photosheets');
      addDoc(historyCollection, photosheetData).catch(error => {
          console.error("Failed to save history:", error);
      });
    }
  }

  const handleDownloadPdf = async () => {
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

        for (const [index, sheet] of photos.entries()) {
            if (index > 0) {
                pdf.addPage();
            }

            const sheetElement = document.getElementById(`sheet-${index}`);
            if (sheetElement) {
                const dataUrl = await htmlToImage.toPng(sheetElement, { pixelRatio: 3 });
                pdf.addImage(dataUrl, 'PNG', 0, 0, sheetWidthMm, sheetHeightMm);
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

  const handleDownloadImage = async () => {
     if (photos.length === 0 || images.length === 0) {
       toast({ title: 'Sheet not ready', description: 'Please upload at least one image.', variant: 'destructive' });
       return;
    }

    const sheetElement = document.getElementById(`sheet-${currentSheet}`);
    if (!sheetElement) {
      toast({ title: 'Preview not found', description: 'Could not find the sheet preview element.', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    toast({
      title: 'Generating Image',
      description: 'Your image is being created...',
    });

    try {
      const dataUrl = await htmlToImage.toPng(sheetElement, { pixelRatio: 3 });
      const link = document.createElement('a');
      link.download = `photosheet-page-${currentSheet + 1}.png`;
      link.href = dataUrl;
      link.click();
      saveToHistory();
    } catch (error) {
      console.error("Error generating image:", error);
      toast({
            title: 'Download Failed',
            description: 'An error occurred while generating the image.',
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

    // The print CSS will handle showing all pages
    setTimeout(() => {
      window.print();
      setIsProcessing(false);
    }, 500);
  }

  const handleReset = () => {
    resetLayout();
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

  const handleBack = () => {
    onBack();
  }

  return (
    <>
      <div className="w-full flex-grow flex flex-col p-4 sm:p-6 lg:p-8 justify-center items-center pb-20 md:pb-8">
        <main className="w-full max-w-6xl flex flex-col lg:flex-row items-start justify-center gap-8">
            
            <div className="w-full lg:w-1/2 flex-shrink-0">
              <div className="text-center mb-4">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Customize Your Photosheet</h1>
                  <p className="text-muted-foreground mt-1">Drag and drop photos to arrange them on the current sheet.</p>
              </div>
              <div id="print-wrapper">
                <div className="aspect-[210/297] w-full max-w-lg mx-auto shadow-lg overflow-hidden border bg-white">
                    <SheetPreview />
                </div>
              </div>

               {totalSheets > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-4 no-print">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => setCurrentSheet(s => Math.max(0, s - 1))}
                      disabled={currentSheet === 0}
                    >
                      <ChevronLeft />
                    </Button>
                    <span className="font-medium text-muted-foreground">
                      Sheet {currentSheet + 1} of {totalSheets}
                    </span>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => setCurrentSheet(s => Math.min(totalSheets - 1, s + 1))}
                      disabled={currentSheet === totalSheets - 1}
                    >
                      <ChevronRight />
                    </Button>
                  </div>
                )}

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
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="default" size="lg" disabled={images.length === 0 || isProcessing}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                <DropdownMenuItem onClick={handleDownloadPdf}>
                                    <FileDown className="mr-2 h-4 w-4" />
                                    Download as PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleDownloadImage}>
                                    <ImageIcon className="mr-2 h-4 w-4" />
                                    Download as Image
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button variant="secondary" onClick={handlePrint} disabled={images.length === 0 || isProcessing} size="lg">
                            <Printer className="mr-2 h-4 w-4" />
                            Print
                        </Button>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                        <Button variant="ghost" onClick={handleBack} className="text-muted-foreground">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Change Photos
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
