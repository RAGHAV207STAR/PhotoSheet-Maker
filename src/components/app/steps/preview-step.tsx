
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
import { ArrowLeft, ChevronLeft, ChevronRight, FileImage, FileText, Loader2, Printer, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import html2canvas from 'html2canvas';
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
    swapPhotos,
    dragIndex,
    touchTargetIndex,
    dropTargetIndex,
    setDropTargetIndex,
  } = useEditor();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const sheetPreviewRef = useRef<HTMLDivElement>(null);
  
  const [localWidth, setLocalWidth] = useState(displayPhotoWidth.toFixed(2));
  const [localHeight, setLocalHeight] = useState(displayPhotoHeight.toFixed(2));

  const totalSheets = photos.length;

  useEffect(() => {
    setLocalWidth(displayPhotoWidth.toFixed(2));
    setLocalHeight(displayPhotoHeight.toFixed(2));
  }, [displayPhotoWidth, displayPhotoHeight, unit]);

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
        toast({
            variant: "destructive",
            title: "Could Not Save History",
            description: "There was an error saving your sheet to history.",
        });
    });
  }
  
  const handleDownloadPng = async () => {
    if (photos.length === 0 || images.length === 0) {
      toast({ title: 'Sheet not ready', description: 'Please add photos and configure your sheet.', variant: 'destructive' });
      return;
    }

    const sheetElement = sheetPreviewRef.current?.querySelector(`#sheet-${currentSheet}`) as HTMLElement;
    if (!sheetElement) {
       toast({ title: 'Preview element not found', variant: 'destructive' });
       return;
    }

    setIsProcessing(true);
    toast({ title: 'Generating Image...', description: 'This may take a moment for high quality export.' });
    
    try {
        const canvas = await html2canvas(sheetElement, {
            scale: 4, // SUPER HIGH RESOLUTION
            useCORS: true,
            allowTaint: false,
            logging: false,
            backgroundColor: null,
            imageTimeout: 0,
            onclone: (document) => {
              // Remove placeholder elements from the cloned document before capture
              document.querySelectorAll('.placeholder-wrapper').forEach(el => el.remove());
            }
        });

        const dataUrl = canvas.toDataURL('image/png', 1.0);

        const link = document.createElement("a");
        link.download = `photosheet-page-${currentSheet + 1}.png`;
        link.href = dataUrl;
        link.click();

        toast({
            title: "Download Complete",
            description: "Your photo sheet has been downloaded successfully.",
        });
        saveToHistory();

    } catch (error) {
        console.error(error)
        toast({
            title: 'Image Generation Failed',
            description: 'An unexpected error occurred. Please try again.',
            variant: 'destructive',
        });
    } finally {
        setIsProcessing(false);
    }
  };

  const handleDownloadPdf = async () => {
     if (photos.length === 0 || images.length === 0) {
      toast({ title: 'Sheet not ready', description: 'Please add photos and configure your sheet.', variant: 'destructive' });
      return;
    }
    
    setIsProcessing(true);
    toast({ title: 'Generating PDF...', description: 'This may take a few moments for all pages.' });

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const a4WidthMm = 210;
      const a4HeightMm = 297;
      
      for (let i = 0; i < photos.length; i++) {
        const sheetElementToCapture = sheetPreviewRef.current?.querySelector(`#sheet-${i}`) as HTMLElement | null;
        if (!sheetElementToCapture) continue;

        if (i > 0) {
          pdf.addPage();
        }

        const canvas = await html2canvas(sheetElementToCapture, {
            scale: 4, // VERY IMPORTANT for high DPI
            useCORS: true,
            allowTaint: false,
            logging: false,
            backgroundColor: null,
            imageTimeout: 0,
            onclone: (document) => {
              // Remove placeholder elements from the cloned document before capture
              document.querySelectorAll('.placeholder-wrapper').forEach(el => el.remove());
            }
        });
        
        const imgData = canvas.toDataURL('image/png', 1.0);
        
        // A4 aspect ratio
        const pdfWidth = a4WidthMm;
        const pdfHeight = a4HeightMm;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }
      
      pdf.save('photosheet.pdf');

       toast({
            title: "Download Complete",
            description: "Your PDF has been downloaded successfully.",
        });
      saveToHistory();

    } catch (error) {
      console.error(error);
      toast({
        title: 'PDF Generation Failed',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
        setIsProcessing(false);
    }
  }
  
  const handlePrint = async () => {
    if (photos.length === 0 || images.length === 0) {
        toast({ title: 'Sheet not generated', description: 'Please upload an image first.', variant: 'destructive' });
        return;
    }

    const printWrapper = document.getElementById('print-wrapper') || document.createElement('div');
    if (!document.getElementById('print-wrapper')) {
        printWrapper.id = 'print-wrapper';
        document.body.appendChild(printWrapper);
    }
    
    printWrapper.innerHTML = '';
    
    for (let i = 0; i < photos.length; i++) {
        const sheetElement = sheetPreviewRef.current?.querySelector(`#sheet-${i}`) as HTMLElement | null;
        if (sheetElement) {
            const clone = sheetElement.cloneNode(true) as HTMLElement;
            // Remove placeholders from the clone
            clone.querySelectorAll('.placeholder-wrapper').forEach(el => el.remove());
            printWrapper.appendChild(clone);
        }
    }

    saveToHistory();
    window.print();
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
      <div className="flex-1 flex flex-col items-center justify-start w-full h-full min-h-0">
          <div className="text-center mb-4 lg:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Customize Your Photosheet</h1>
            <p className="text-muted-foreground mt-1">Drag photos to arrange them. Settings update the layout live.</p>
          </div>
          <div className="w-full max-w-md shadow-lg border rounded-lg bg-gray-200 p-2">
              <div className="w-full aspect-[210/297] relative">
                  <SheetPreview 
                    ref={sheetPreviewRef} 
                    photos={photos}
                    currentSheet={currentSheet}
                    borderWidth={borderWidth}
                    dropTargetIndex={dropTargetIndex}
                    setDropTargetIndex={setDropTargetIndex}
                    dragIndex={dragIndex}
                    touchTargetIndex={touchTargetIndex}
                    swapPhotos={swapPhotos}
                    key={`${photos.length}-${copies}-${borderWidth}-${photoSpacing}-${unit}-${displayPhotoWidth}-${displayPhotoHeight}`}
                  />
                  <div id="print-wrapper" className="hidden"></div>
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
               <div className="grid grid-cols-1 gap-4">
                  <TooltipProvider>
                    <div className="flex w-full items-center justify-center gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" className="flex-1 text-xs px-2" disabled={images.length === 0 || isProcessing} onClick={handleDownloadPng}>
                                    {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileImage className="h-5 w-5" />}
                                    <span className="ml-2">PNG</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Download PNG (Current Sheet)</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" className="flex-1 text-xs px-2" disabled={images.length === 0 || isProcessing} onClick={handleDownloadPdf}>
                                    {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
                                    <span className="ml-2">PDF</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Download PDF (All Sheets)</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                 <Button variant="outline" className="flex-1 text-xs px-2" disabled={images.length === 0 || isProcessing} onClick={handlePrint}>
                                    {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Printer className="h-5 w-5" />}
                                    <span className="ml-2">Print</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Print</p></TooltipContent>
                        </Tooltip>
                    </div>
                  </TooltipProvider>
                  <Separator />
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Button variant="outline" onClick={handleBack} disabled={isProcessing} className="w-full">
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          <span className="sm:hidden md:inline">Change Photos</span>
                          <span className="hidden sm:inline md:hidden">Photos</span>
                      </Button>
                      <Button variant="ghost" onClick={handleReset} disabled={isProcessing} className="text-muted-foreground w-full">
                          <RotateCcw className="mr-2 h-4 w-4" />
                          <span className="sm:hidden md:inline">Reset Layout</span>
                          <span className="hidden sm:inline md:hidden">Reset</span>
                      </Button>
                  </div>
              </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
