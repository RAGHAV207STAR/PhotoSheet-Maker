
"use client";

import { useState, useRef, ChangeEvent, DragEvent, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, Image as ImageIcon, Wand2, Download, Trash2, Palette, Sparkles, ArrowLeft, KeyRound, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleSpinner } from '@/components/ui/google-spinner';
import { removeBackground } from '@/ai/flows/remove-background-flow';
import { generateBackground } from '@/ai/flows/generate-background-flow';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type EditorStage = 'upload' | 'edit';
type ProcessingState = 'idle' | 'removing_bg' | 'generating_bg';

const colorPalette = [
  'transparent', '#FFFFFF', '#E2E8F0', '#A8A29E', '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
];

export default function BackgroundEditorPage() {
  const [stage, setStage] = useState<EditorStage>('upload');
  
  // Image states
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [subjectImage, setSubjectImage] = useState<string | null>(null); // Image with transparent BG
  const [finalImage, setFinalImage] = useState<string | null>(null); // Image with new BG color or AI BG

  // UI states
  const [isDragging, setIsDragging] = useState(false);
  const [processingState, setProcessingState] = useState<ProcessingState>('idle');
  const [backgroundColor, setBackgroundColor] = useState<string>('transparent');
  const [prompt, setPrompt] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const isProcessing = processingState !== 'idle';
  const currentImage = finalImage || subjectImage || originalImage;

  const handleRemoveBackground = async () => {
    if (!originalImage) return;

    setProcessingState('removing_bg');
    setSubjectImage(null);
    setFinalImage(null);

    try {
      const result = await removeBackground({ photoDataUri: originalImage });
      if (result.error) {
        throw new Error(result.error);
      }
      if (result.imageDataUri) {
        setSubjectImage(result.imageDataUri);
        setFinalImage(result.imageDataUri); // Show the subject image immediately
        setBackgroundColor('transparent');
        toast({ title: 'Background Removed!', description: 'You can now change the background.' });
      } else {
        throw new Error('AI did not return an image.');
      }
    } catch (error: any) {
      toast({ 
        variant: 'destructive', 
        title: 'An Error Occurred', 
        description: error.message || 'Failed to remove background.' 
      });
      // Don't reset, let user try again
      setFinalImage(originalImage);
    } finally {
      setProcessingState('idle');
    }
  };

  const handleFile = (file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setOriginalImage(result);
        setSubjectImage(null); // Reset subject
        setFinalImage(result); // Show original image first
        setStage('edit');
      };
      reader.readAsDataURL(file);
    } else if (file) {
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: "Please select a valid image file (e.g., JPG, PNG).",
      });
    }
  };
  
  const resetToUpload = () => {
    setStage('upload');
    setOriginalImage(null);
    setSubjectImage(null);
    setFinalImage(null);
    setBackgroundColor('transparent');
    setPrompt('');
    setProcessingState('idle');
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleGenerateBackground = async () => {
    if (!subjectImage || !prompt) return;

    setProcessingState('generating_bg');
    setFinalImage(null); // Clear final image to show loader
    try {
      const result = await generateBackground({ prompt });
      if (result.error) {
        throw new Error(result.error);
      }
      if (result.imageDataUri) {
        const generatedBg = result.imageDataUri;
        
        // Composite the subject onto the new background
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const bgImg = new window.Image();
        
        bgImg.onload = () => {
            const subjectImg = new window.Image();
            subjectImg.onload = () => {
                canvas.width = bgImg.width;
                canvas.height = bgImg.height;
                if(ctx) {
                    ctx.drawImage(bgImg, 0, 0);
                    // Center and scale the subject image to fit
                    const canvasAspectRatio = canvas.width / canvas.height;
                    const subjectAspectRatio = subjectImg.width / subjectImg.height;
                    
                    let drawWidth, drawHeight, x, y;

                    if (canvasAspectRatio > subjectAspectRatio) {
                        // Canvas is wider than subject, so height is the limiting dimension
                        drawHeight = canvas.height * 0.9; // Use 90% of canvas height
                        drawWidth = drawHeight * subjectAspectRatio;
                    } else {
                        // Canvas is taller or same aspect ratio, so width is limiting
                        drawWidth = canvas.width * 0.9; // Use 90% of canvas width
                        drawHeight = drawWidth / subjectAspectRatio;
                    }

                    x = (canvas.width - drawWidth) / 2;
                    y = (canvas.height - drawHeight) / 2;

                    ctx.drawImage(subjectImg, x, y, drawWidth, drawHeight);
                }
                setFinalImage(canvas.toDataURL('image/png'));
            };
            subjectImg.src = subjectImage;
        };
        bgImg.src = generatedBg;

        setBackgroundColor('transparent'); // Reset color if AI bg is applied
        toast({ title: 'New Background Generated!', description: 'The AI has created a new scene for your subject.' });
      } else {
        throw new Error('AI did not return an image.');
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'An Error Occurred', description: error.message || 'Failed to generate background.' });
      setFinalImage(subjectImage); // Restore subject image on failure
    } finally {
      setProcessingState('idle');
    }
  }
  
  useEffect(() => {
    const imageToUse = subjectImage; // Always start from the subject image for color changes
    if (imageToUse && backgroundColor !== 'transparent') {
        const newFinalImage = document.createElement('canvas');
        const ctx = newFinalImage.getContext('2d');
        const img = new window.Image();
        img.onload = () => {
            newFinalImage.width = img.width;
            newFinalImage.height = img.height;
            if(ctx) {
              ctx.fillStyle = backgroundColor;
              ctx.fillRect(0, 0, newFinalImage.width, newFinalImage.height);
              ctx.drawImage(img, 0, 0);
            }
            setFinalImage(newFinalImage.toDataURL('image/png'));
        };
        img.src = imageToUse;
    } else if (subjectImage && backgroundColor === 'transparent') {
        setFinalImage(subjectImage);
    }
  }, [backgroundColor, subjectImage]);

  const handleDownload = () => {
    const imageToDownload = finalImage || subjectImage || originalImage;
    if (!imageToDownload) return;
    const link = document.createElement('a');
    link.href = imageToDownload;
    link.download = 'edited-photo.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Download Started' });
  };

  // Drag and drop handlers
  const onFileInputChange = (event: ChangeEvent<HTMLInputElement>) => handleFile(event.target.files?.[0] || null);
  const handleDrop = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); handleFile(e.dataTransfer.files?.[0] || null); };
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };


  return (
    <div className="flex flex-col flex-grow items-center justify-center p-4 sm:p-6 md:p-8 bg-gradient-to-br from-slate-50 to-blue-100">
      <AnimatePresence mode="wait">
        {stage === 'upload' ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-2xl flex flex-col items-center"
          >
            <div className="text-center mb-8">
              <h1 className="text-4xl font-extrabold tracking-tight bg-[length:200%_auto] text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-pink-500 to-blue-600 animate-gradient-shift">AI Background Editor</h1>
              <p className="text-muted-foreground mt-2 text-lg">Upload a photo to magically edit its background.</p>
            </div>
            <Card className="shadow-2xl border-0 bg-white/50 backdrop-blur-lg w-full">
              <CardContent className="p-4 sm:p-6">
                <div 
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "group aspect-[4/3] w-full rounded-lg bg-slate-100/50 flex items-center justify-center relative border-2 border-dashed transition-all duration-300 cursor-pointer",
                    isDragging ? "border-purple-500 bg-purple-500/10 ring-4 ring-purple-500/20" : "border-slate-300/70 hover:border-purple-400/80",
                  )}
                >
                  <div className="flex flex-col items-center gap-6 text-center p-4 transition-transform duration-300 group-hover:scale-105">
                    <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg">
                      <div className="absolute inset-0.5 rounded-full bg-slate-50" />
                      <div className="absolute -inset-1 animate-gradient-shift rounded-full bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 opacity-20 blur-lg transition-all duration-500 group-hover:opacity-50" />
                      <ImageIcon className="relative z-10 h-12 w-12 text-purple-500/80 transition-colors duration-300 group-hover:text-purple-600" />
                    </div>
                    <div>
                        <p className="text-lg font-semibold text-slate-700">Drag & Drop Your Image</p>
                        <p className="text-sm text-muted-foreground mt-1">or click to select a file</p>
                    </div>
                    <Button size="lg" variant="default" className="text-base pointer-events-none bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg text-white">
                      <Upload className="mr-2 h-5 w-5"/>
                      Choose a File
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            <input type="file" ref={fileInputRef} onChange={onFileInputChange} accept="image/*" className="hidden" />
          </motion.div>
        ) : (
          <motion.div
            key="edit"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-6xl"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                 <Card className="shadow-2xl border-0 bg-white/50 backdrop-blur-lg w-full">
                    <CardContent className="p-4">
                      <div 
                        className="aspect-[4/3] w-full rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center relative transition-colors duration-300"
                        style={{ backgroundColor: subjectImage && backgroundColor !== 'transparent' ? backgroundColor : 'transparent' }}
                      >
                        <AnimatePresence mode="wait">
                          {processingState === 'removing_bg' ? (
                             <motion.div
                              key="processing"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-0 z-10 flex flex-col items-center justify-center text-white p-4"
                            >
                              {originalImage && <Image src={originalImage} alt="Processing" fill style={{objectFit:"contain"}} className="opacity-50" />}
                              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/50 via-pink-500/50 to-blue-600/50 animate-gradient-shift" />
                              <div className="relative flex flex-col items-center gap-4">
                                <motion.div animate={{ scale: [1, 1.2, 1], rotate: [-10, 10, -10] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
                                  <Sparkles className="h-12 w-12 drop-shadow-lg" />
                                </motion.div>
                                <p className="font-semibold text-lg drop-shadow-md">
                                  Removing background...
                                </p>
                              </div>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="image-container"
                              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                              className="w-full h-full"
                            >
                              {currentImage && !isProcessing && (
                                <div className="relative w-full h-full bg-cover bg-center" style={{ backgroundImage: subjectImage && backgroundColor !== 'transparent' ? 'none' : `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='8' ry='8' stroke='%23E2E8F0FF' stroke-width='2' stroke-dasharray='6%2c 14' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e")`}}>
                                  <Image src={currentImage} alt="Image to edit" fill style={{objectFit:"contain"}} key={currentImage} />
                                </div>
                              )}
                               {processingState === 'generating_bg' && (
                                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-white bg-slate-900/50">
                                   <GoogleSpinner />
                                   <p className="font-semibold text-lg mt-4">Generating background...</p>
                                </div>
                               )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </CardContent>
                 </Card>
              </div>
    
              <div className="lg:col-span-1">
                <Card className="shadow-2xl border-0 bg-white/50 backdrop-blur-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Wand2 className="text-purple-500" />
                      AI Tools
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     <AnimatePresence>
                        {!subjectImage && (
                             <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                            >
                                <Button onClick={handleRemoveBackground} disabled={isProcessing || !originalImage} className="w-full">
                                    {processingState === 'removing_bg' ? <><GoogleSpinner className="mr-2 h-4 w-4 border-white/50 border-r-white"/> Removing...</> : 'Remove Background'}
                                </Button>
                             </motion.div>
                        )}
                    </AnimatePresence>
                    <AnimatePresence>
                    {subjectImage && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="space-y-4"
                        >
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><Palette className="h-5 w-5" /> Change Background Color</Label>
                                <div className="grid grid-cols-9 gap-2">
                                    {colorPalette.map(color => (
                                        <TooltipProvider key={color} delayDuration={0}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <button
                                                        onClick={() => setBackgroundColor(color)}
                                                        className={cn(
                                                            "w-full aspect-square rounded-full border-2 transition-all flex items-center justify-center",
                                                            backgroundColor === color ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-slate-300',
                                                            color === 'transparent' && 'bg-cover bg-center'
                                                        )}
                                                        style={{ 
                                                            backgroundColor: color === 'transparent' ? '#fff' : color,
                                                            backgroundImage: color === 'transparent' ? `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0 L100 100 M100 0 L0 100' stroke-width='4' stroke='red'/%3E%3C/svg%3E")` : 'none',
                                                         }}
                                                        aria-label={`Set background to ${color}`}
                                                    >
                                                        {color === 'transparent' && <X className="h-4 w-4 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"/>}
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{color === 'transparent' ? 'Clear Color' : color}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    ))}
                                </div>
                            </div>

                             <div className="space-y-3">
                                 <Label htmlFor="prompt" className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><Sparkles className="h-5 w-5 text-amber-500" /> Generate AI Background</Label>
                                 <Textarea id="prompt" placeholder="e.g., a sunny beach with palm trees" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
                                 <Button onClick={handleGenerateBackground} disabled={isProcessing || !prompt} className="w-full">
                                    {processingState === 'generating_bg' ? <><GoogleSpinner className="mr-2 h-4 w-4 border-white/50 border-r-white"/> Generating...</> : 'Generate'}
                                 </Button>
                             </div>
                        </motion.div>
                    )}
                    </AnimatePresence>
    
                    <Separator />

                    <div className="space-y-3">
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" className="w-full">
                                    <KeyRound className="mr-2 h-4 w-4"/>
                                    API Access
                                    <Badge variant="secondary" className="ml-2">Coming Soon</Badge>
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Feature Coming Soon!</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        API access for developers is on our roadmap. Stay tuned for future updates!
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogAction>OK</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                        <Button variant="secondary" className="w-full" size="lg" onClick={handleDownload} disabled={isProcessing}>
                            <Download className="mr-2" />
                            Download Image
                        </Button>
                    </div>
    
                    <Button 
                        variant="ghost" 
                        className="w-full justify-start text-muted-foreground"
                        onClick={resetToUpload}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4"/>
                        Upload Another Image
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
