
"use client";

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, Images, Camera, Folder, ArrowLeft, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import PhotoGrid from './photo-grid';
import { useToast } from '@/hooks/use-toast';
import CameraCapture from './camera-capture';
import { ImageWithDimensions } from '@/context/editor-context';


const MIN_IMAGES = 2;
const MAX_IMAGES = 100;

interface SmartPhotoPickerProps {
  selected: string[];
  setImagesWithDimensions: (images: ImageWithDimensions[] | ((prev: ImageWithDimensions[]) => ImageWithDimensions[])) => void;
  onToggleSelect: (imageUrl: string) => void;
  onAddImages: (images: ImageWithDimensions[]) => void;
  onClose: () => void;
  onDone: () => void;
}

type SourceTab = 'gallery' | 'files' | 'camera';

export default function SmartPhotoPicker({ selected, setImagesWithDimensions, onToggleSelect, onAddImages, onClose, onDone }: SmartPhotoPickerProps) {
  const [activeTab, setActiveTab] = useState<SourceTab>('gallery');
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tabs: { id: SourceTab; icon: React.ElementType; label: string; disabled?: boolean }[] = [
    { id: 'gallery', icon: Images, label: 'Gallery' },
    { id: 'files', icon: Folder, label: 'Files' },
    { id: 'camera', icon: Camera, label: 'Camera' },
  ];

  const handleDone = () => {
     if (selected.length < MIN_IMAGES) {
        toast({
            title: `Select at least ${MIN_IMAGES} photos`,
            description: `You need to select a minimum of ${MIN_IMAGES} photos to create a collage.`,
            variant: "destructive",
        });
        return;
    }
    onDone();
  }

  const handleClose = () => {
    setImagesWithDimensions([]);
    onClose();
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    handleFiles(files);
     // Reset input value to allow selecting the same file again
    if(event.target) {
      event.target.value = "";
    }
  };
  
  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFiles = (files: FileList) => {
    const totalAfterAdd = selected.length + files.length;
    if (totalAfterAdd > MAX_IMAGES) {
      toast({
        title: "Maximum Images Reached",
        description: `You can only select up to ${MAX_IMAGES} photos.`,
        variant: "destructive",
      });
    }

    const imageFiles = Array.from(files)
      .filter(file => file.type.startsWith('image/'))
      .slice(0, MAX_IMAGES - selected.length);
    
    if(imageFiles.length < files.length) {
       toast({
          title: "Some Files Skipped",
          description: `Only image files are accepted. ${files.length - imageFiles.length} file(s) were skipped.`,
        });
    }

    const newImageObjects: ImageWithDimensions[] = [];
    let filesRead = 0;

    if (imageFiles.length === 0) return;

    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        if (src) {
            const img = document.createElement('img');
            img.onload = () => {
                newImageObjects.push({ src, width: img.width, height: img.height });
                filesRead++;
                if (filesRead === imageFiles.length) {
                    onAddImages(newImageObjects);
                }
            };
            img.src = src;
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCapture = (dataUrl: string) => {
    if (selected.length >= MAX_IMAGES) {
      toast({
        title: "Maximum Images Reached",
        description: `You can only select up to ${MAX_IMAGES} photos.`,
        variant: "destructive",
      });
      return;
    }
    const img = document.createElement('img');
    img.onload = () => {
        onAddImages([{ src: dataUrl, width: img.width, height: img.height }]);
    }
    img.src = dataUrl;
  };
  
  const displayedImages = selected.map((url, i) => ({ id: `selected-${i}`, imageUrl: url, description: 'Selected image', imageHint: '' }));

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed inset-0 z-50 bg-background flex flex-col"
    >
      <header className="flex items-center justify-between p-2 border-b bg-white/60 backdrop-blur-md shadow-sm sticky top-0 flex-shrink-0">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handleClose} aria-label="Close picker">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-base sm:text-lg font-semibold whitespace-nowrap">Select Photos</h2>
        </div>
        <div className="flex items-center gap-2">
            <div 
                className={cn(
                    "flex items-center justify-center h-8 w-8 text-sm font-bold border rounded-md transition-all",
                    selected.length > 0 ? "border-purple-500 text-purple-600" : "border-gray-200 text-gray-400"
                )}
            >
                {selected.length}
            </div>
            <Button 
                onClick={handleDone} 
                disabled={selected.length === 0} 
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl shadow-lg disabled:opacity-50"
            >
                Next
            </Button>
        </div>
      </header>
      
      <div className="flex-shrink-0 p-2 border-b bg-white">
        <div className="flex items-center justify-around space-x-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                if(tab.disabled) return;
                if(tab.id === 'files') {
                    handleTriggerUpload();
                } else {
                    setActiveTab(tab.id)
                }
              }}
              disabled={tab.disabled}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 p-2 text-xs font-medium rounded-lg transition-colors",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                activeTab === tab.id
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-100 text-muted-foreground hover:bg-gray-200 hover:text-foreground'
              )}
            >
              <tab.icon className="h-5 w-5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      <main className="flex-1 bg-slate-50 relative">
         <AnimatePresence mode="wait">
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="w-full h-full overflow-y-auto"
            >
                {activeTab === 'gallery' && (
                    <div className="w-full h-full">
                        {selected.length === 0 ? (
                           <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                                <div 
                                    onClick={handleTriggerUpload} 
                                    className="cursor-pointer group flex flex-col items-center justify-center gap-4 p-8 rounded-2xl bg-slate-100 hover:bg-slate-200 transition-colors border border-dashed border-slate-300 hover:border-purple-400"
                                >
                                    <div className="p-4 bg-purple-100 rounded-full group-hover:bg-purple-200 transition-colors">
                                        <Plus className="h-10 w-10 text-purple-600" />
                                    </div>
                                    <div className="text-center">
                                        <h3 className="font-semibold text-slate-800">Add photos</h3>
                                        <p className="text-sm text-slate-500">Tap to select from your device</p>
                                    </div>
                                </div>
                          </div>
                        ) : (
                          <PhotoGrid 
                              images={displayedImages}
                              selected={selected}
                              onToggleSelect={onToggleSelect}
                              onAddClick={handleTriggerUpload}
                          />
                        )}
                    </div>
                )}
                {activeTab === 'camera' && (
                    <CameraCapture onCapture={handleCapture} />
                )}
            </motion.div>
         </AnimatePresence>
      </main>

       <AnimatePresence>
       {selected.length > 0 && (
         <motion.footer 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
            className="flex-shrink-0 p-2 border-t bg-white/95 backdrop-blur-sm overflow-hidden"
         >
            <div className="overflow-x-auto no-scrollbar">
                <div className="w-max">
                    <PhotoGrid 
                        images={displayedImages}
                        selected={selected}
                        onToggleSelect={onToggleSelect}
                        isSelectionPreview={true}
                    />
                </div>
            </div>
         </motion.footer>
       )}
       </AnimatePresence>
       <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
       <div className="flex-shrink-0 h-10 bg-gray-100 flex items-center justify-center text-sm text-gray-400 no-print">
            Space For AD
        </div>
    </motion.div>
  );
}
