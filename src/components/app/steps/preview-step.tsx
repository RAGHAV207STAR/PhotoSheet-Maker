
"use client";

import { useEditor, type PageSize, type ImageWithDimensions, type Photo } from '@/context/editor-context';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useState, useMemo, useEffect } from 'react';
import SheetPreview from '../sheet-preview';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useUser, useFirestore, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp, doc } from 'firebase/firestore';
import { ArrowLeft, ChevronLeft, ChevronRight, FileImage, FileText, Loader2, Printer, RotateCcw, RectangleVertical, RectangleHorizontal, Settings, Image as ImageIcon, Layout, Type, AlignCenter, AlignLeft, AlignRight, AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd, Expand, Shrink, RotateCw, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDraggable } from '@dnd-kit/core';
import Image from 'next/image';
import { SortableContext } from '@dnd-kit/sortable';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface PreviewStepProps {
  onBack: () => void;
}

type ProcessingAction = 'png' | 'pdf' | 'print' | null;

const PAGE_SIZE_OPTIONS: PageSize[] = ['A4', 'Letter', 'Legal', 'Tabloid', 'A3', 'A5', '4x6in', '5x7in', 'Custom'];

const DraggableUploadedImage = ({ img }: { img: ImageWithDimensions }) => {
    const { attributes, listeners, setNodeRef } = useDraggable({
        id: img.src,
        data: { isFromUploadedList: true, image: img }
    });
    return (
        <div ref={setNodeRef} {...listeners} {...attributes} className="w-20 h-20 relative cursor-grab rounded-md overflow-hidden shadow-md touch-none flex-shrink-0 bg-secondary">
            <Image src={img.src} alt="Uploaded photo" fill className="object-cover" />
        </div>
    )
}

const GlobalSettingsPanel = () => {
    const { 
        borderWidth, setBorderWidth, borderColor, setBorderColor, photoSpacing, setPhotoSpacing,
        displayPhotoWidth, displayPhotoHeight, setPhotoSize, unit, setUnit, pageSize, setPageSize,
        displayPageWidth, displayPageHeight, setPageDimensions,
        orientation, setOrientation, displayPageMargins, setPageMargins, resetLayout
    } = useEditor();

    const { toast } = useToast();

    // Local state for debounced inputs
    const [localPhotoWidth, setLocalPhotoWidth] = useState(() => displayPhotoWidth.toFixed(2));
    const [localPhotoHeight, setLocalPhotoHeight] = useState(() => displayPhotoHeight.toFixed(2));
    const [localPageWidth, setLocalPageWidth] = useState(() => displayPageWidth.toFixed(2));
    const [localPageHeight, setLocalPageHeight] = useState(() => displayPageHeight.toFixed(2));
    const [localBorderWidth, setLocalBorderWidth] = useState(() => borderWidth);
    const [localPhotoSpacing, setLocalPhotoSpacing] = useState(() => photoSpacing);
    const [localMargins, setLocalMargins] = useState(() => displayPageMargins);

    // Sync local state when context values change
    useEffect(() => { setLocalPhotoWidth(displayPhotoWidth.toFixed(2)); }, [displayPhotoWidth]);
    useEffect(() => { setLocalPhotoHeight(displayPhotoHeight.toFixed(2)); }, [displayPhotoHeight]);
    useEffect(() => { setLocalPageWidth(displayPageWidth.toFixed(2)); }, [displayPageWidth]);
    useEffect(() => { setLocalPageHeight(displayPageHeight.toFixed(2)); }, [displayPageHeight]);
    useEffect(() => { setLocalBorderWidth(borderWidth); }, [borderWidth]);
    useEffect(() => { setLocalPhotoSpacing(photoSpacing); }, [photoSpacing]);
    useEffect(() => { setLocalMargins(displayPageMargins); }, [displayPageMargins]);

    const handlePhotoDimensionBlur = () => {
        const newWidth = parseFloat(localPhotoWidth);
        const newHeight = parseFloat(localPhotoHeight);
        if ((!isNaN(newWidth) && newWidth > 0) || (!isNaN(newHeight) && newHeight > 0)) {
            setPhotoSize({ width: !isNaN(newWidth) && newWidth > 0 ? newWidth : undefined, height: !isNaN(newHeight) && newHeight > 0 ? newHeight : undefined }, unit);
        }
    };
    const handlePageDimensionBlur = () => {
        const newWidth = parseFloat(localPageWidth);
        const newHeight = parseFloat(localPageHeight);
        if ((!isNaN(newWidth) && newWidth > 0) || (!isNaN(newHeight) && newHeight > 0)) {
            setPageDimensions({ width: !isNaN(newWidth) && newWidth > 0 ? newWidth : undefined, height: !isNaN(newHeight) && newHeight > 0 ? newHeight : undefined }, unit);
        }
    };
    const handleMarginChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'top' | 'right' | 'bottom' | 'left') => {
        const { value } = e.target;
        setLocalMargins(prev => ({...prev, [side]: value}));
    };
    const handleMarginBlur = (side: 'top' | 'right' | 'bottom' | 'left') => {
        const value = parseFloat(localMargins[side as keyof typeof localMargins].toString());
        if(!isNaN(value) && value >= 0) {
            setPageMargins({ [side]: value }, unit);
        }
    };
    const handleReset = () => {
        resetLayout();
        toast({ title: 'Layout Reset', description: 'All adjustments have been returned to their defaults.' });
    };

    return (
        <>
            <CardHeader>
                <CardTitle>Sheet Settings</CardTitle>
            </CardHeader>
            <CardContent>
                <Accordion type="multiple" defaultValue={['export']} className="w-full">
                    <AccordionItem value="page-settings">
                        <AccordionTrigger className="text-sm font-semibold flex items-center text-muted-foreground hover:no-underline">
                            <div className="flex items-center gap-2">
                                <Settings className="h-4 w-4" /> Page Settings
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="page-size-select">Page Size</Label>
                                <Select value={pageSize} onValueChange={(value) => setPageSize(value as PageSize)}>
                                <SelectTrigger id="page-size-select"><SelectValue placeholder="Select a page size" /></SelectTrigger>
                                <SelectContent>{PAGE_SIZE_OPTIONS.map(size => (<SelectItem key={size} value={size}>{size}</SelectItem>))}</SelectContent>
                                </Select>
                            </div>

                            {pageSize === 'Custom' && (
                                <div className="space-y-4 rounded-md border bg-slate-50/50 p-3">
                                    <Label className='font-semibold text-xs'>Custom Page Dimensions</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <Label htmlFor="page-width-input" className="text-xs">Width</Label>
                                            <div className="relative"><Input id="page-width-input" type="number" value={localPageWidth} onChange={(e) => setLocalPageWidth(e.target.value)} onBlur={handlePageDimensionBlur} className="pr-10 h-9" step="0.01" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">{unit}</span></div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="page-height-input" className="text-xs">Height</Label>
                                            <div className="relative"><Input id="page-height-input" type="number" value={localPageHeight} onChange={(e) => setLocalPageHeight(e.target.value)} onBlur={handlePageDimensionBlur} className="pr-10 h-9" step="0.01" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">{unit}</span></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            <div className="space-y-2">
                                <Label className='font-medium'>Page Margins</Label>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                    {['top', 'bottom', 'left', 'right'].map((side) => (
                                        <div key={side} className="space-y-1">
                                            <Label htmlFor={`margin-${side}-input`} className="capitalize text-xs font-normal">{side}</Label>
                                            <div className="relative"><Input id={`margin-${side}-input`} type="number" value={localMargins[side as keyof typeof localMargins]} onChange={(e) => handleMarginChange(e, side as keyof typeof localMargins)} onBlur={() => handleMarginBlur(side as keyof typeof localMargins)} className="pr-10 h-9" step="0.1" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">{unit}</span></div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Page Orientation</Label>
                                <div className="flex items-center gap-2 rounded-md bg-secondary p-1 w-full">
                                    <Button variant={orientation === 'portrait' ? 'default' : 'ghost'} size="sm" className={cn("h-8 px-3 w-full", orientation === 'portrait' && 'bg-background shadow-sm')} onClick={() => setOrientation('portrait')}><RectangleVertical className="mr-2 h-4 w-4" /> Portrait</Button>
                                    <Button variant={orientation === 'landscape' ? 'default' : 'ghost'} size="sm" className={cn("h-8 px-3 w-full", orientation === 'landscape' && 'bg-background shadow-sm')} onClick={() => setOrientation('landscape')}><RectangleHorizontal className="mr-2 h-4 w-4" /> Landscape</Button>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="photo-layout">
                         <AccordionTrigger className="text-sm font-semibold flex items-center text-muted-foreground hover:no-underline">
                            <div className="flex items-center gap-2">
                                <ImageIcon className="h-4 w-4" /> Photo &amp; Layout
                            </div>
                        </AccordionTrigger>
                         <AccordionContent className="space-y-4 pt-4">
                            <div className="flex justify-between items-center gap-4">
                                <Label>Photo Size Unit</Label>
                                <Tabs defaultValue="cm" value={unit} onValueChange={(value) => setUnit(value as 'cm' | 'in')} className="w-auto">
                                    <TabsList className="grid w-full grid-cols-2 h-8"><TabsTrigger value="cm" className="text-xs h-6">cm</TabsTrigger><TabsTrigger value="in" className="text-xs h-6">in</TabsTrigger></TabsList>
                                </Tabs>
                            </div>
                            <div className="rounded-md border bg-slate-50/50 p-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label htmlFor="width-input" className="text-xs">Width</Label>
                                        <div className="relative"><Input id="width-input" type="number" value={localPhotoWidth} onChange={(e) => setLocalPhotoWidth(e.target.value)} onBlur={handlePhotoDimensionBlur} className="pr-10 h-9" step="0.01" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">{unit}</span></div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="height-input" className="text-xs">Height</Label>
                                        <div className="relative"><Input id="height-input" type="number" value={localPhotoHeight} onChange={(e) => setLocalPhotoHeight(e.target.value)} onBlur={handlePhotoDimensionBlur} className="pr-10 h-9" step="0.01" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">{unit}</span></div>
                                    </div>
                                </div>
                            </div>
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="border-slider">Border Width: <span className="font-bold">{localBorderWidth}px</span></Label>
                                    <Slider id="border-slider" min={0} max={10} step={1} value={[localBorderWidth]} onValueChange={(value) => setLocalBorderWidth(value[0])} onValueCommit={setBorderWidth} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="spacing-slider">Photo Spacing: <span className="font-bold">{localPhotoSpacing.toFixed(1)}{unit}</span></Label>
                                    <Slider id="spacing-slider" min={0} max={2} step={0.1} value={[localPhotoSpacing]} onValueChange={(value) => setLocalPhotoSpacing(value[0])} onValueCommit={setPhotoSpacing} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="border-color">Border Color</Label>
                                    <div className="relative">
                                        <Input id="border-color" type="text" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} className="pr-12 h-9" />
                                        <Input type="color" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-10 p-1 cursor-pointer bg-transparent border-0" />
                                    </div>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                     <AccordionItem value="export">
                        <AccordionTrigger className="text-sm font-semibold flex items-center text-muted-foreground hover:no-underline">
                            <div className="flex items-center gap-2">
                                <Download className="h-4 w-4" /> Export
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4">
                            <PreviewActions />
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

                <div className="pt-2">
                    <Button variant="ghost" onClick={handleReset} className="text-muted-foreground w-full"><RotateCcw className="mr-2 h-4 w-4" />Reset All Layout Settings</Button>
                </div>
            </CardContent>
        </>
    )
}

const PhotoSettingsPanel = ({ photo, onBack }: { photo: Photo, onBack: () => void }) => {
    const { updatePhotoText, updatePhotoStyle, rotatePhoto, togglePhotoFit } = useEditor();

    return (
        <>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2" onClick={onBack}><ArrowLeft className="h-4 w-4"/></Button>
                    <CardTitle>Photo Settings</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-4">
                    <h3 className="text-sm font-semibold flex items-center text-muted-foreground"><ImageIcon className="mr-2 h-4 w-4" /> Photo Style</h3>
                    <div className="grid grid-cols-2 gap-2 pl-2">
                       <Button variant="outline" onClick={() => rotatePhoto(photo.id)}><RotateCw className="mr-2 h-4 w-4" /> Rotate</Button>
                       <Button variant="outline" onClick={() => togglePhotoFit(photo.id)}>
                           {photo.fit === 'cover' ? <Shrink className="mr-2 h-4 w-4" /> : <Expand className="mr-2 h-4 w-4" />}
                           {photo.fit === 'cover' ? 'Contain' : 'Cover'}
                       </Button>
                    </div>
                </div>

                <Separator />

                <div className="space-y-4">
                    <h3 className="text-sm font-semibold flex items-center text-muted-foreground"><Type className="mr-2 h-4 w-4" /> Text Overlay</h3>
                    <div className="space-y-2 pl-2">
                         <Input
                            id={`text-overlay-${photo.id}`}
                            type="text"
                            placeholder="Enter text..."
                            value={photo.text}
                            onChange={(e) => updatePhotoText(photo.id, e.target.value)}
                            className="h-9"
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor={`text-color-${photo.id}`} className="text-xs">Color</Label>
                                <div className="relative">
                                    <Input id={`text-color-${photo.id}`} type="text" value={photo.textColor} onChange={(e) => updatePhotoStyle(photo.id, { textColor: e.target.value })} className="pr-10 h-9" />
                                    <Input type="color" value={photo.textColor} onChange={(e) => updatePhotoStyle(photo.id, { textColor: e.target.value })} className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-8 p-1 cursor-pointer bg-transparent border-0" />
                                </div>
                            </div>
                             <div>
                                <Label htmlFor={`font-size-${photo.id}`} className="text-xs">Font Size (%)</Label>
                                <Input id={`font-size-${photo.id}`} type="number" value={photo.fontSize} onChange={(e) => updatePhotoStyle(photo.id, { fontSize: parseInt(e.target.value, 10) || 0 })} className="h-9" />
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs">Horizontal Align</Label>
                            <div className="flex items-center gap-1 rounded-md bg-secondary p-1 w-full">
                                <Button variant={photo.textAlign === 'left' ? 'default' : 'ghost'} size="icon" className='h-7 w-7 flex-1' onClick={() => updatePhotoStyle(photo.id, {textAlign: 'left'})}><AlignLeft/></Button>
                                <Button variant={photo.textAlign === 'center' ? 'default' : 'ghost'} size="icon" className='h-7 w-7 flex-1' onClick={() => updatePhotoStyle(photo.id, {textAlign: 'center'})}><AlignCenter/></Button>
                                <Button variant={photo.textAlign === 'right' ? 'default' : 'ghost'} size="icon" className='h-7 w-7 flex-1' onClick={() => updatePhotoStyle(photo.id, {textAlign: 'right'})}><AlignRight/></Button>
                            </div>
                        </div>
                         <div>
                            <Label className="text-xs">Vertical Align</Label>
                            <div className="flex items-center gap-1 rounded-md bg-secondary p-1 w-full">
                                <Button variant={photo.textVerticalAlign === 'top' ? 'default' : 'ghost'} size="icon" className='h-7 w-7 flex-1' onClick={() => updatePhotoStyle(photo.id, {textVerticalAlign: 'top'})}><AlignVerticalJustifyStart/></Button>
                                <Button variant={photo.textVerticalAlign === 'middle' ? 'default' : 'ghost'} size="icon" className='h-7 w-7 flex-1' onClick={() => updatePhotoStyle(photo.id, {textVerticalAlign: 'middle'})}><AlignVerticalJustifyCenter/></Button>
                                <Button variant={photo.textVerticalAlign === 'bottom' ? 'default' : 'ghost'} size="icon" className='h-7 w-7 flex-1' onClick={() => updatePhotoStyle(photo.id, {textVerticalAlign: 'bottom'})}><AlignVerticalJustifyEnd/></Button>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </>
    )
}

const PreviewActions = () => {
    const { toast } = useToast();
    const { photos, images, currentSheet, saveToHistory } = useEditor();
    const [isProcessing, setIsProcessing] = useState<ProcessingAction>(null);

    const generateCanvas = async (sheetIndex: number): Promise<HTMLCanvasElement> => {
        const { default: html2canvas } = await import('html2canvas');
        const printWrapper = document.getElementById('print-wrapper-for-print');
        if (!printWrapper) throw new Error("Print wrapper element not found.");
        const sheetElementToClone = document.querySelector(`#sheet-${sheetIndex}`) as HTMLElement;
        if (!sheetElementToClone) throw new Error(`Sheet element with index ${sheetIndex} not found.`);

        printWrapper.innerHTML = ''; 
        const clonedSheet = sheetElementToClone.cloneNode(true) as HTMLElement;
        printWrapper.appendChild(clonedSheet);
        printWrapper.style.display = 'block';
        
        const canvas = await html2canvas(clonedSheet, {
            scale: 4, useCORS: true, allowTaint: true, logging: false, backgroundColor: '#ffffff', removeContainer: true,
            onclone: (clonedDoc) => {
              clonedDoc.querySelectorAll('.placeholder-icon').forEach(el => el.remove());
              clonedDoc.querySelectorAll('.photo-item:not(:has(img[src]))').forEach(el => (el as HTMLElement).style.display = 'none');
            }
        });

        printWrapper.style.display = 'none';
        printWrapper.innerHTML = '';
        return canvas;
    }
  
    const handleDownloadPng = async () => {
        if (photos.length === 0 || images.length === 0) {
        toast({ title: 'Sheet not ready', description: 'Please add photos and configure your sheet.', variant: 'destructive' });
        return;
        }
        setIsProcessing('png');
        toast({ title: 'Generating Image...', description: 'This may take a moment for high quality export.' });
        try {
            const canvas = await generateCanvas(currentSheet);
            const dataUrl = canvas.toDataURL('image/png', 1.0);
            const link = document.createElement("a");
            link.download = `photosheet-page-${currentSheet + 1}.png`;
            link.href = dataUrl;
            link.click();
            saveToHistory();
        } catch (error) {
            console.error("PNG Generation Error:", error);
            toast({ title: 'Image Generation Failed', description: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.', variant: 'destructive' });
        } finally {
            setIsProcessing(null);
        }
    };

    const handleDownloadPdf = async () => {
        if (photos.length === 0 || images.length === 0) {
        toast({ title: 'Sheet not ready', description: 'Please add photos and configure your sheet.', variant: 'destructive' });
        return;
        }
        setIsProcessing('pdf');
        toast({ title: 'Generating PDF...', description: 'This may take a few moments for all pages.' });
        try {
        const { default: jsPDF } = await import('jspdf');
        const firstCanvas = await generateCanvas(0);
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [firstCanvas.width, firstCanvas.height], compress: false });
        pdf.addImage(firstCanvas.toDataURL('image/png', 1.0), "PNG", 0, 0, firstCanvas.width, firstCanvas.height, undefined, "FAST");
        for (let i = 1; i < photos.length; i++) {
            pdf.addPage([firstCanvas.width, firstCanvas.height], 'portrait');
            const canvas = await generateCanvas(i);
            pdf.addImage(canvas.toDataURL('image/png', 1.0), 'PNG', 0, 0, canvas.width, canvas.height, undefined, 'FAST');
        }
        pdf.save('photosheet.pdf');
        saveToHistory();
        } catch (error) {
        console.error("PDF Generation Error:", error);
        toast({ title: 'PDF Generation Failed', description: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.', variant: 'destructive' });
        } finally {
            setIsProcessing(null);
        }
    }
  
    const handlePrint = async () => {
        if (photos.length === 0 || images.length === 0) {
            toast({ title: 'Sheet not generated', description: 'Please upload an image first.', variant: 'destructive' });
            return;
        }
        setIsProcessing('print');
        const printWrapper = document.getElementById('print-wrapper-for-print');
        if (!printWrapper) {
            console.error("Print wrapper for printing not found");
            setIsProcessing(null);
            return;
        }
        printWrapper.innerHTML = '';
        for (let i = 0; i < photos.length; i++) {
            const sheetElement = document.querySelector(`#sheet-${i}`) as HTMLElement | null;
            if (sheetElement) {
                const clone = sheetElement.cloneNode(true) as HTMLElement;
                clone.querySelectorAll('.placeholder-icon').forEach(el => el.remove());
                clone.querySelectorAll('.photo-item:not(:has(img[src]))').forEach(el => (el as HTMLElement).style.display = 'none');
                printWrapper.appendChild(clone);
            }
        }
        saveToHistory();
        window.print();
        setIsProcessing(null);
    };

    return (
         <TooltipProvider>
            <div className="flex w-full items-center justify-center gap-2">
                <Tooltip>
                    <TooltipTrigger asChild>
                    <Button variant="outline" className="flex-1" disabled={images.length === 0 || !!isProcessing} onClick={handleDownloadPng}>
                        {isProcessing === 'png' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileImage className="mr-2 h-4 w-4" />}
                        PNG
                    </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Download Current Sheet as PNG</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                    <Button variant="outline" className="flex-1" disabled={images.length === 0 || !!isProcessing} onClick={handleDownloadPdf}>
                        {isProcessing === 'pdf' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                        PDF
                    </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Download All Sheets as PDF</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                    <Button variant="outline" className="flex-1" disabled={images.length === 0 || !!isProcessing} onClick={handlePrint}>
                        {isProcessing === 'print' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                        Print
                    </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Print All Sheets</p></TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    )
}

export default function PreviewStep({ onBack }: PreviewStepProps) {
  const { 
    images, 
    photos,
    currentSheet,
    setCurrentSheet,
    borderWidth, 
    borderColor,
    pageWidthCm,
    pageHeightCm,
    selectedPhotoId,
    setSelectedPhotoId,
    saveToHistory
  } = useEditor();

  const totalSheets = photos.length;
  const photosOnCurrentSheet = useMemo(() => photos[currentSheet] || [], [photos, currentSheet]);
  const selectedPhoto = useMemo(() => {
    if (selectedPhotoId === null) return null;
    return photos.flat().find(p => p.id === selectedPhotoId) || null;
  }, [selectedPhotoId, photos]);

  const aspectRatio = useMemo(() => {
    if (pageWidthCm > 0 && pageHeightCm > 0) {
        return `${pageWidthCm}/${pageHeightCm}`;
    }
    return '210/297';
  }, [pageWidthCm, pageHeightCm]);

  const currentPhotoIds = useMemo(() => photosOnCurrentSheet.map(p => p.id), [photosOnCurrentSheet]);

  return (
    <div className="flex-grow w-full h-full flex flex-col md:flex-row p-2 sm:p-4 md:p-6 gap-6 pb-24 md:pb-6">
      <div className="flex-1 flex flex-col items-center justify-start w-full h-full min-h-0">
          <div className="text-center mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Arrange &amp; Finalize</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">Drag photos into the sheet. Click a photo to edit its style.</p>
          </div>
           {images.length > 0 && (
              <ScrollArea className="w-full max-w-lg">
                <div className="flex items-center gap-3 p-2">
                    {images.map(img => <DraggableUploadedImage key={img.src} img={img} />)}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
           )}
          <div className="w-full max-w-lg shadow-lg border rounded-lg bg-slate-100 p-2 mt-4">
              <div className="w-full relative" style={{aspectRatio}}>
                  <SortableContext items={currentPhotoIds}>
                    <SheetPreview 
                      photos={photos}
                      currentSheet={currentSheet}
                      borderWidth={borderWidth}
                      borderColor={borderColor}
                    />
                  </SortableContext>
              </div>
          </div>
          {totalSheets > 1 && (
            <div className="flex items-center justify-center gap-4 mt-4 no-print">
              <Button variant="outline" size="icon" onClick={() => setCurrentSheet(s => Math.max(0, s - 1))} disabled={currentSheet === 0}><ChevronLeft /></Button>
              <span className="font-medium text-muted-foreground">Sheet {currentSheet + 1} of {totalSheets}</span>
              <Button variant="outline" size="icon" onClick={() => setCurrentSheet(s => Math.min(totalSheets - 1, s + 1))} disabled={currentSheet === totalSheets - 1}><ChevronRight /></Button>
            </div>
          )}
      </div>

      <div id="print-wrapper-for-print" className="hidden" style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '794px', height: '1123px' }} />

      <div className="w-full md:w-[380px] md:max-w-[380px] flex-shrink-0 no-print">
        <div className="sticky top-20">
            <ScrollArea className="h-[calc(100vh-6rem)]">
              <Card className="bg-white/60 backdrop-blur-lg border-0 shadow-lg rounded-xl">
                  <AnimatePresence mode="wait">
                      <motion.div
                          key={selectedPhoto ? 'photo-settings' : 'global-settings'}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.2 }}
                      >
                          {selectedPhoto ? (
                              <PhotoSettingsPanel photo={selectedPhoto} onBack={() => setSelectedPhotoId(null)} />
                          ) : (
                              <GlobalSettingsPanel />
                          )}
                      </motion.div>
                  </AnimatePresence>
                  <Separator/>
                  <CardContent className="grid grid-cols-1 gap-4 pt-6">
                      <Button variant="outline" onClick={onBack} className="w-full"><ArrowLeft className="mr-2 h-4 w-4" />Change Photos</Button>
                  </CardContent>
              </Card>
            </ScrollArea>
        </div>
      </div>
    </div>
  );
}
