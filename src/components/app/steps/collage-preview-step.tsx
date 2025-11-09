
"use client";

import { useEditor, EditorTab } from '@/context/editor-context';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useState, useMemo, useCallback } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Download, Printer, ArrowLeft, FileDown, Image as ImageIcon, Ruler, Settings, AppWindow, RotateCw, Space, Square, Trash2, FlipHorizontal, Replace, Crop } from 'lucide-react';
import CollageSheetPreview from '../collage-sheet-preview';
import { LayoutPicker } from '../layout-picker';
import * as htmlToImage from 'html-to-image';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatePresence, motion } from 'framer-motion';
import EditToolbar from '../edit-toolbar';


interface CollagePreviewStepProps {
  onBack: () => void;
}

export default function CollagePreviewStep({ onBack }: CollagePreviewStepProps) {
  const { 
    images,
    setImages,
    borderWidth, 
    setBorderWidth, 
    photoSpacing, 
    setPhotoSpacing,
    collagePageSize,
    setCollagePageSize,
    collagePhotos,
    activeEditorTab,
    setActiveEditorTab,
    selectedPhotoId,
    setSelectedPhotoId,
    activeCropPhotoId,
    setActiveCropPhotoId,
    updatePhotoDetails,
    swapCollagePhoto,
  } = useEditor();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const selectedPhoto = useMemo(() => {
    return collagePhotos.find(p => p.id === selectedPhotoId || p.id === activeCropPhotoId);
  }, [collagePhotos, selectedPhotoId, activeCropPhotoId]);

  const handleDownloadPdf = async () => {
    if (collagePhotos.length === 0 || images.length === 0) {
       toast({ title: 'Collage not ready', description: 'Please upload at least one image.', variant: 'destructive' });
       return;
    }

    const sheetElement = document.getElementById('collage-sheet');
    if (!sheetElement) {
        toast({ title: 'Preview not found', description: 'Could not find the sheet preview element.', variant: 'destructive' });
        return;
    }

    setIsProcessing(true);
    toast({
      title: 'Preparing Download',
      description: 'Generating high-quality PDF, please wait...',
    });

    try {
        const { default: jsPDF } = await import('jspdf');

        const pageDimensions = {
            'A4': { width: 210, height: 297 },
            'A3': { width: 297, height: 420 },
            '4x6': { width: 101.6, height: 152.4 },
            '5x7': { width: 127, height: 177.8 },
        };
        const dims = pageDimensions[collagePageSize];

        const pdf = new jsPDF({
            orientation: dims.width > dims.height ? 'landscape' : 'portrait',
            unit: 'mm',
            format: [dims.width, dims.height],
        });
        
        const dataUrl = await htmlToImage.toPng(sheetElement, { pixelRatio: 3 });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
        
        pdf.save('photosheet_collage.pdf');

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
     if (collagePhotos.length === 0 || images.length === 0) {
       toast({ title: 'Collage not ready', description: 'Please upload at least one image.', variant: 'destructive' });
       return;
    }

    const sheetElement = document.getElementById('collage-sheet');
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
      link.download = 'photosheet-collage.png';
      link.href = dataUrl;
      link.click();
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
    if (collagePhotos.length === 0 || images.length === 0) {
       toast({ title: 'Sheet not generated', description: 'Please upload an image first.', variant: 'destructive' });
       return;
    }
    
    setIsProcessing(true);
    toast({
      title: 'Opening Print Dialog',
      description: 'Use the print dialog to print or save as PDF.',
    });

    setTimeout(() => {
      window.print();
      setIsProcessing(false);
    }, 500);
  }

  const handleEnterCropMode = useCallback(() => {
    if (!selectedPhotoId) return;
    setActiveCropPhotoId(selectedPhotoId);
    setSelectedPhotoId(null);
  }, [selectedPhotoId, setActiveCropPhotoId, setSelectedPhotoId]);

  const handleRotate = () => {
    if (!selectedPhoto) return;
    const newRotation = ((selectedPhoto.rotation || 0) + 90) % 360;
    updatePhotoDetails(selectedPhoto.id, { rotation: newRotation });
  }
  
  const handleMirror = () => {
      if (!selectedPhoto) return;
      const newScaleX = -(selectedPhoto.scaleX || 1);
      updatePhotoDetails(selectedPhoto.id, { scaleX: newScaleX });
  }

  const handleDelete = () => {
    if (!selectedPhotoId) return;
    setImages(prev => prev.filter(img => img.src !== selectedPhoto?.src));
    setSelectedPhotoId(null);
  }

  const PageSizeButton = ({ size }: { size: 'A4' | 'A3' | '4x6' | '5x7' }) => (
    <Button
        variant={collagePageSize === size ? 'secondary' : 'ghost'}
        className={`flex-1 ${collagePageSize === size ? "shadow-inner bg-background/50" : ""}`}
        onClick={() => {
            if(activeCropPhotoId) return;
            setCollagePageSize(size)
        }}
        disabled={!!activeCropPhotoId}
    >
        {size}
    </Button>
  );

  return (
    <div className="flex flex-col h-full bg-slate-100 no-print">
      <header className="flex items-center justify-between p-2 flex-shrink-0 border-b bg-card shadow-sm">
        <Button variant="ghost" onClick={onBack} disabled={!!activeCropPhotoId || !!selectedPhotoId}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="flex items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" disabled={isProcessing || !!activeCropPhotoId || !!selectedPhotoId}>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
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
           <Button onClick={handlePrint} disabled={isProcessing || !!activeCropPhotoId || !!selectedPhotoId}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main id="print-wrapper" className="flex-grow flex items-center justify-center p-4 overflow-hidden">
        <div
          key={collagePageSize}
          className="w-full max-w-md bg-white rounded-xl overflow-hidden shadow-lg"
        >
          <CollageSheetPreview />
        </div>
      </main>

      {/* Bottom Controls */}
      <footer className="bg-card border-t flex-shrink-0">
          <AnimatePresence mode="wait">
            {!activeCropPhotoId && !selectedPhotoId && (
                <motion.div 
                  key="main-controls" 
                  className="w-full"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                >
                    <Tabs value={activeEditorTab} onValueChange={(value) => setActiveEditorTab(value as EditorTab)} className="w-full">
                        <TabsList className="grid w-full grid-cols-3 h-14 rounded-none p-0 border-b bg-card">
                            <TabsTrigger value="layout" className="h-full rounded-none text-muted-foreground data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-background">
                                <AppWindow className="mr-2 h-5 w-5"/> Layout
                            </TabsTrigger>
                            <TabsTrigger value="ratio" className="h-full rounded-none text-muted-foreground data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-background">
                                <Ruler className="mr-2 h-5 w-5"/> Page
                            </TabsTrigger>
                            <TabsTrigger value="border" className="h-full rounded-none text-muted-foreground data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-background">
                                <Settings className="mr-2 h-5 w-5"/> Adjust
                            </TabsTrigger>
                        </TabsList>
                        <div className="bg-background">
                            <TabsContent value="layout" className="p-0">
                                <LayoutPicker />
                            </TabsContent>
                            <TabsContent value="ratio" className="p-4">
                                <Card className="bg-slate-100 border-0 shadow-none">
                                    <CardContent className="p-2">
                                        <Label className="text-sm font-medium text-muted-foreground mb-2 block px-2">Page Size</Label>
                                        <div className="flex gap-2 p-1 bg-white rounded-lg border">
                                            <PageSizeButton size="A4" />
                                            <PageSizeButton size="A3" />
                                            <PageSizeButton size="4x6" />
                                            <PageSizeButton size="5x7" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="border" className="p-4">
                                <Card className="bg-slate-100 border-0 shadow-none">
                                    <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                        <div className="grid gap-2">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="spacing-slider" className="flex items-center gap-2 text-muted-foreground text-sm">
                                                    <Space className="w-4 h-4" /> Spacing
                                                </Label>
                                                <span className="font-bold text-sm">{photoSpacing.toFixed(1)}mm</span>
                                            </div>
                                            <Slider
                                                id="spacing-slider"
                                                min={0}
                                                max={10}
                                                step={0.5}
                                                value={[photoSpacing]}
                                                onValueChange={(value) => setPhotoSpacing(value[0])}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                             <div className="flex items-center justify-between">
                                                <Label htmlFor="border-slider" className="flex items-center gap-2 text-muted-foreground text-sm">
                                                    <Square className="w-4 h-4" /> Border
                                                </Label>
                                                <span className="font-bold text-sm">{borderWidth}px</span>
                                            </div>
                                            <Slider
                                                id="border-slider"
                                                min={0}
                                                max={20}
                                                step={1}
                                                value={[borderWidth]}
                                                onValueChange={(value) => setBorderWidth(value[0])}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </div>
                    </Tabs>
                </motion.div>
            )}
          </AnimatePresence>
          
          <AnimatePresence>
            {selectedPhotoId && (
                 <EditToolbar
                    onClose={() => setSelectedPhotoId(null)}
                    onSwap={() => {
                        const otherPhotoId = collagePhotos.find(p => p.id !== selectedPhotoId && !p.isOverlay)?.id;
                        if(otherPhotoId) {
                            swapCollagePhoto(selectedPhotoId, otherPhotoId);
                            setSelectedPhotoId(otherPhotoId);
                        } else {
                            toast({ title: "Swap Failed", description: "No other photo to swap with." })
                        }
                    }}
                    onEffect={() => toast({ title: "Effects: Not implemented" })}
                    onCrop={handleEnterCropMode}
                    onChange={() => toast({ title: "Change: Not implemented" })}
                    onMirror={handleMirror}
                    onRotate={handleRotate}
                    onDelete={handleDelete}
                />
            )}
          </AnimatePresence>
      </footer>
    </div>
  );
}
