"use client"

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { X, Replace, Wand2, Crop, ImagePlus, FlipHorizontal, RotateCw, Trash2 } from 'lucide-react';
import { useEditor } from '@/context/editor-context';

interface EditToolbarProps {
  onClose: () => void;
  onSwap: () => void;
  onEffect: () => void;
  onCrop: () => void;
  onChange: () => void;
  onMirror: () => void;
  onRotate: () => void;
  onDelete: () => void;
}

interface ToolbarButtonProps {
    onClick: (e: React.MouseEvent) => void;
    tooltip: string;
    children: React.ReactNode;
}

const ToolbarButton = ({ onClick, tooltip, children }: ToolbarButtonProps) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12 rounded-full bg-background/80 text-foreground hover:bg-primary/10 hover:text-primary backdrop-blur-lg shadow-md"
                onClick={onClick}
            >
                {children}
            </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-neutral-800 text-white border-neutral-700">
            <p>{tooltip}</p>
        </TooltipContent>
    </Tooltip>
);


export default function EditToolbar({
  onClose,
  onSwap,
  onEffect,
  onCrop,
  onChange,
  onMirror,
  onRotate,
  onDelete,
}: EditToolbarProps) {
  const { selectedPhotoId } = useEditor();

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  }

  if (!selectedPhotoId) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed bottom-24 md:bottom-[150px] left-1/2 -translate-x-1/2 bg-background/50 text-foreground p-2 rounded-2xl shadow-2xl flex gap-1 items-center z-50 border border-border/10"
      onClick={(e) => e.stopPropagation()}
    >
        <TooltipProvider>
            <ToolbarButton onClick={(e) => handleAction(e, onClose)} tooltip="Close">
                <X />
            </ToolbarButton>
            <div className="w-px h-8 bg-border/50 mx-1" />
            <ToolbarButton onClick={(e) => handleAction(e, onSwap)} tooltip="Swap">
                <Replace />
            </ToolbarButton>
            <ToolbarButton onClick={(e) => handleAction(e, onCrop)} tooltip="Crop">
                <Crop />
            </ToolbarButton>
            <ToolbarButton onClick={(e) => handleAction(e, onMirror)} tooltip="Mirror">
                <FlipHorizontal />
            </ToolbarButton>
            <ToolbarButton onClick={(e) => handleAction(e, onRotate)} tooltip="Rotate">
                <RotateCw />
            </ToolbarButton>
            <ToolbarButton onClick={(e) => handleAction(e, onChange)} tooltip="Change">
                <ImagePlus />
            </ToolbarButton>
            <ToolbarButton onClick={(e) => handleAction(e, onEffect)} tooltip="Effects">
                <Wand2 />
            </ToolbarButton>
            <div className="w-px h-8 bg-border/50 mx-1" />
            <ToolbarButton onClick={(e) => handleAction(e, onDelete)} tooltip="Delete">
                <Trash2 />
            </ToolbarButton>
        </TooltipProvider>
    </motion.div>
  );
}
