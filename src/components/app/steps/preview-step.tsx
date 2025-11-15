
"use client";

import { useEditor } from '@/context/editor-context';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useRef } from 'react';
import SheetPreview from '../sheet-preview';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Download, Printer, RotateCcw, ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import jsPDF from 'jspdf';


interface PreviewStepProps {
  onBack: () => void;
}

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
    displayPhotoWidth,
    displayPhotoHeight,
    setPhotoSize,
    unit,
    setUnit,
    resetLayout,
  } = useEditor();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const sheetContainerRef = useRef<HTMLDivElement>(null);
  
  const [localWidth, setLocalWidth] = useState(displayPhotoWidth.toFixed(2));
  const [localHeight, setLocalHeight] = useState(displayPhotoHeight.toFixed(2));

  const totalSheets = photos.length;

  useEffect(() => {
    setLocalWidth(displayPhotoWidth.toFixed(2));
    setLocalHeight(displayPhotoHeight.toFixed(2));
  }, [displayPhotoWidth, displayPhotoHeight]);

  const handleDimensionBlur = () => {
    const newWidth = parseFloat(localWidth);
    const newHeight = parseFloat(localHeight);
    
    if ((!isNaN(newWidth) && newWidth > 0) || (!isNaN(newHeight) && newHeight > 0)) {
        setPhotoSize({ 
            width: !isNaN(newWidth) && newWidth > 0 ? newWidth : undefined, 
            height: !isNaN(newHeight) && newHeight > 0 ? newHeight: undefined 
        }, unit);
    }
  };


  const saveToHistory = () => {
    if (!user || !firestore || images.length === 0) {
      return;
    }
    
    const firstImageSrc = images[0]?.src;
    if (!firstImageSrc) {
      console.warn("Could not save to history: no source image available.");
      return;
    }
    
    const photosheetData = {
      userId: user.uid,
      thumbnailUrl: firstImageSrc,
      copies: copies,
      createdAt: serverTimestamp(),
    };
    
    addDocumentNonBlocking(collection(firestore, 'users', user.uid, 'photosheets'), photosheetData)
    .catch(error => {
        console.error("Failed to save history:", error);
        toast({
            variant: "destructive",
            title: "Could Not Save History",
            description: "There was an error saving your sheet to history.",
        });
    });
  }

  const generateSheetImage = async (sheetIndex: number): Promise<string | null> => {
    const sheetData = photos[sheetIndex];
    if (!sheetData) return null;

    const canvas = document.createElement('canvas');
    // A4 at 300 DPI
    const a4_width_px = 2480;
    const a4_height_px = 3508;
    canvas.width = a4_width_px;
    canvas.height = a4_height_px;
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;
    
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const imageLoadPromises: Promise<void>[] = [];

    // Filter out empty placeholders before processing
    const filledPhotos = sheetData.filter(photo => photo.imageSrc);

    filledPhotos.forEach(photo => {
        const promise = new Promise<void>((resolve, reject) => {
            const imageToDraw = new Image();
            imageToDraw.crossOrigin = 'anonymous';
            imageToDraw.src = photo.imageSrc;
            imageToDraw.onload = () => {
                const left = (photo.x / 100) * a4_width_px;
                const top = (photo.y / 100) * a4_height_px;
                const width = (photo.width / 100) * a4_width_px;
                const height = (photo.height / 100) * a4_height_px;
                
                ctx.drawImage(imageToDraw, left, top, width, height);

                if (borderWidth > 0) {
                    ctx.strokeStyle = '#000000';
                    // Scale borderWidth based on 300 DPI canvas vs screen size.
                    const dpiScalingFactor = a4_width_px / (sheetContainerRef.current?.offsetWidth || 210 * 3.78); // Approx conversion mm to px
                    ctx.lineWidth = borderWidth * dpiScalingFactor;
                    ctx.strokeRect(left, top, width, height);
                }
                resolve();
            };
            imageToDraw.onerror = reject;
        });
        imageLoadPromises.push(promise);
    });

    await Promise.all(imageLoadPromises);
    
    // Return high-quality PNG
    return canvas.toDataURL('image/png', 1.0);
  };


  const handleDownloadPdf = async () => {
    if (photos.length === 0 || images.length === 0) {
      toast({ title: 'Sheet not ready', description: 'Please add photos and configure your sheet.', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    toast({ title: 'Generating PDF...', description: 'This may take a moment for all pages.' });
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    try {
        for (let i = 0; i < photos.length; i++) {
            const imgData = await generateSheetImage(i);
            if (imgData) {
                if (i > 0) {
                    pdf.addPage();
                }
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
            }
        }

        pdf.save('photosheet.pdf');

        toast({
            title: "Download Complete",
            description: "Your photo sheet has been downloaded successfully.",
        });
        saveToHistory();
    } catch (error) {
        console.error("PDF Generation Error:", error);
        toast({
            title: 'PDF Generation Failed',
            description: 'An unexpected error occurred. Please try again.',
            variant: 'destructive',
        });
    } finally {
        setIsProcessing(false);
    }
  };
  
  const handlePrint = async () => {
    if (photos.length === 0 || images.length === 0) {
      toast({ title: 'Sheet not generated', description: 'Please upload an image first.', variant: 'destructive' });
      return;
    }
  
    setIsProcessing(true);
    toast({
      title: 'Preparing for Print...',
      description: 'Generating high-resolution images for printing.',
    });
  
    const printContainer = document.createElement('div');
    printContainer.id = 'print-wrapper';
    
    try {
        for (let i = 0; i < photos.length; i++) {
            const imgData = await generateSheetImage(i);
            if (imgData) {
                const imgElement = document.createElement('img');
                imgElement.src = imgData;
                imgElement.style.width = '210mm';
                imgElement.style.height = '297mm';
                imgElement.classList.add('printable-area');
                printContainer.appendChild(imgElement);
            }
        }

        document.body.appendChild(printContainer);
        
        saveToHistory();
        
        // Allow images to render before printing
        setTimeout(() => {
            window.print();
            document.body.removeChild(printContainer);
            setIsProcessing(false);
        }, 500);

    } catch (error) {
        console.error("Print preparation error:", error);
        toast({
            title: "Print failed",
            description: "Could not prepare the document for printing.",
            variant: "destructive"
        });
        if(printContainer.parentElement) {
            document.body.removeChild(printContainer);
        }
        setIsProcessing(false);
    }
  };

  const handleReset = () => {
    resetLayout();
    toast({
      title: 'Layout Reset',
      description: 'All adjustments have been returned to their defaults.',
    });
  }

  const handleBack = () => {
    onBack();
  }

  return (
    <div className="flex-grow w-full h-full flex flex-col lg:flex-row p-4 sm:p-6 lg:p-8 gap-8 pb-20 lg:pb-8">
      {/* Preview Column */}
      <div className="flex-1 flex flex-col items-center justify-start w-full h-full min-h-0">
          <div className="text-center mb-4 lg:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Customize Your Photosheet</h1>
            <p className="text-muted-foreground mt-1">Drag photos to arrange them. Settings update the layout live.</p>
          </div>
          <div className="w-full max-w-md shadow-lg border rounded-lg bg-gray-200 p-2">
              <div className="w-full aspect-[210/297] relative">
                  <SheetPreview ref={sheetContainerRef} />
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

      {/* Settings Column */}
      <div className="w-full lg:w-[420px] lg:max-w-[420px] flex-shrink-0 no-print">
        <Card className="bg-white/60 backdrop-blur-lg border-0 shadow-lg rounded-xl sticky top-24">
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
                          onBlur={handleDimensionBlur}
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
                                onBlur={handleDimensionBlur}
                                className="pr-10"
                                step="0.01"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">{unit}</span>
                        </div>
                    </div>
                  </div>
              </div>
              
              <Separator />
              <h3 className="text-sm font-medium -mb-2">Layout</h3>
              <div className="space-y-6 pt-2">
                <div className="grid gap-2">
                    <Label htmlFor="border-slider">Border Width: <span className="font-bold">{borderWidth}px</span></Label>
                    <Slider
                        id="border-slider"
                        min={0}
                        max={5}
                        step={1}
                        value={[borderWidth]}
                        onValueChange={setBorderWidth}
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
                        onValueChange={setPhotoSpacing}
                    />
                </div>
              </div>

              <Separator />
               <div className="grid grid-cols-2 gap-3">
                  <Button variant="default" size="lg" disabled={images.length === 0 || isProcessing} onClick={handleDownloadPdf}>
                      {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                      {isProcessing ? 'Generating...' : 'Download PDF'}
                  </Button>

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
    </div>
  );
}

    