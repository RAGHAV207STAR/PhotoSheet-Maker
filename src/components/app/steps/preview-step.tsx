
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
import html2canvas from 'html2canvas';


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
  
  const generateCleanedSheet = async (sheetIndex: number): Promise<HTMLElement | null> => {
    // We need to operate on the DOM for html2canvas
    const originalContainer = document.getElementById('sheet-container');
    if (!originalContainer) return null;

    // We can't use the ref here as we might not be on the current sheet
    const originalSheet = originalContainer.querySelector(`#sheet-${sheetIndex}`);
    if (!originalSheet) return null;

    const clone = originalSheet.cloneNode(true) as HTMLElement;

    // Clean the cloned node
    clone.querySelectorAll('.photo-item').forEach(node => {
        const img = node.querySelector("img");
        // Remove the node if it's a placeholder (no img src)
        if (!img || !img.src || img.src.trim() === "") {
            node.remove();
        } else {
            // Otherwise, remove border and background for clean export
            (node as HTMLElement).style.border = "none";
            (node as HTMLElement).style.background = "none";
        }
    });

    // Remove placeholder icons if any exist in the structure
    clone.querySelectorAll(".placeholder-icon").forEach(icon => icon.remove());
    
    // The clone is now ready for rendering
    return clone;
  };


  const handleDownloadPng = async () => {
    if (photos.length === 0 || images.length === 0) {
      toast({ title: 'Sheet not ready', description: 'Please add photos and configure your sheet.', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    toast({ title: 'Generating Image...', description: 'This may take a moment.' });
    
    try {
        const cleanedSheet = await generateCleanedSheet(currentSheet);
        if (!cleanedSheet) throw new Error("Could not generate cleaned sheet element.");
        
        // Temporarily append to body to ensure it's rendered for html2canvas
        document.body.appendChild(cleanedSheet);

        const canvas = await html2canvas(cleanedSheet, {
            backgroundColor: '#ffffff', // Ensure background is white
            scale: 3, // For higher resolution (approx 300 DPI)
            useCORS: true, // Important for external images
        });
        
        document.body.removeChild(cleanedSheet);

        const link = document.createElement("a");
        link.download = `photosheet-page-${currentSheet + 1}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();

        toast({
            title: "Download Complete",
            description: "Your photo sheet has been downloaded successfully.",
        });
        saveToHistory();

    } catch (error) {
        console.error("PNG Generation Error:", error);
        toast({
            title: 'Image Generation Failed',
            description: 'An unexpected error occurred. Please try again.',
            variant: 'destructive',
        });
    } finally {
        setIsProcessing(false);
    }
  };
  
  const handlePrint = () => {
     if (photos.length === 0 || images.length === 0) {
      toast({ title: 'Sheet not generated', description: 'Please upload an image first.', variant: 'destructive' });
      return;
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
                  <Button variant="default" size="lg" disabled={images.length === 0 || isProcessing} onClick={handleDownloadPng}>
                      {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                      {isProcessing ? 'Generating...' : 'Download PNG'}
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

    