

"use client";

import { useEditor, CollageLayoutType } from "@/context/editor-context";
import { cn } from "@/lib/utils";
import { AppWindow, Heart, Film, Rows, Columns, Grip, Star, Circle, Spline, Pentagon, Waves, Square } from "lucide-react";
import { motion } from "framer-motion";

interface Layout {
  id: CollageLayoutType;
  name: string;
  isPro?: boolean;
}

const defaultLayouts: Layout[] = [
  { id: 'grid', name: 'Grid' },
  { id: 'mosaic', name: 'Mosaic' },
  { id: 'freeform', name: 'Freeform' },
];

const twoPhotoLayouts: Layout[] = [
    { id: 'two-v-split', name: 'Split' },
    { id: 'two-h-split', name: 'Rows' },
    { id: 'two-diagonal', name: 'Diagonal'},
    { id: 'two-hearts-nested', name: 'Nested' },
    { id: 'two-hearts-4', name: 'Hearts' },
    { id: 'two-hearts-2', name: 'Curve', isPro: true },
    { id: 'two-diagonal-curve', name: 'Wave', isPro: true },
    { id: 'two-hearts-3', name: 'Gem', isPro: true },
    { id: 'two-circles', name: 'Circles' },
    { id: 'two-film', name: 'Film', isPro: true },
];

const LayoutThumbnail = ({ type }: { type: CollageLayoutType }) => {
    // Simple visual representations of layouts
    if (type === 'grid') return <Grip className="w-8 h-8 text-muted-foreground/80" />;
    if (type === 'mosaic') return (
        <div className="grid grid-cols-3 grid-rows-2 gap-0.5 w-full h-full p-2">
            <div className="col-span-2 row-span-2 bg-slate-300 rounded-sm"></div>
            <div className="bg-slate-300 rounded-sm"></div>
            <div className="bg-slate-300 rounded-sm"></div>
        </div>
    );
    if (type === 'freeform') return <Star className="w-8 h-8 text-muted-foreground/80" />;
    if (type === 'two-v-split') return <Columns className="w-8 h-8 text-slate-500" />;
    if (type === 'two-h-split') return <Rows className="w-8 h-8 text-slate-500" />;
    if (type === 'two-diagonal-curve') return <Waves className="w-8 h-8 text-slate-500" />;
    if (type === 'two-circles') return (
         <div className="relative w-full h-full flex items-center justify-center">
            <Circle className="w-6 h-6 absolute text-slate-500" style={{left: '15%'}} />
            <Circle className="w-6 h-6 absolute text-slate-500" style={{right: '15%'}} />
        </div>
    );
    if (type === 'two-diagonal') return (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" className="w-8 h-8 text-slate-500"><path d="M22 2 L 2 22" /></svg>
    );
    if (type === 'two-torn') return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-slate-400">
            <path d="M4 2h16v20H4z" stroke="none" />
            <path d="M11.5 2 L 12.5 4 L 11.5 6 L 12.5 8 L 11.5 10 L 12.5 12 L 11.5 14 L 12.5 16 L 11.5 18 L 12.5 20 L 11.5 22" />
        </svg>
    );
    if (type === 'two-hearts-2') return <Spline className="w-8 h-8 text-slate-500" />; // Curved
    if (type === 'two-hearts-3') return <Pentagon className="w-8 h-8 text-slate-500" />; // Gem
     if (type === 'two-love-text') return <span className="text-sm font-serif text-slate-400">LOVE</span>;
     if (type === 'two-hearts-4') return ( // Hearts
        <div className="relative w-full h-full flex items-center justify-center">
            <Heart className="w-8 h-8 text-slate-500" />
        </div>
     );
    if (type === 'two-hearts-nested') return (
        <div className="relative w-full h-full flex items-center justify-center">
            <Heart className="w-8 h-8 text-slate-500 fill-slate-300" />
            <Heart className="w-4 h-4 absolute text-white fill-current" />
        </div>
    );
    if (type === 'two-film') return <Film className="w-8 h-8 text-slate-500" />;
    if (type === 'two-text-heart') return <span className="text-[9px] font-serif text-slate-400">Follow<br/>Heart</span>;
    return <Square className="w-8 h-8 text-muted-foreground/80" />;
}


export function LayoutPicker() {
  const { collageLayout, setCollageLayout, images } = useEditor();

  const layouts = images.length === 2 ? twoPhotoLayouts : defaultLayouts;

  const handleLayoutClick = (layout: Layout) => {
    setCollageLayout(layout.id);
  };
  
  const renderLayouts = (isTwoPhoto: boolean) => (
    layouts.map((layout) => (
      <motion.div
        key={layout.id}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => handleLayoutClick(layout)}
        title={layout.name}
        className={cn(`relative flex flex-col items-center justify-center flex-shrink-0 
          rounded-xl overflow-hidden
          cursor-pointer transition-all duration-300
          border-2`,
          isTwoPhoto ? "w-20 h-20 bg-white" : "w-24 h-24 bg-card",
          collageLayout === layout.id
            ? "border-primary ring-2 ring-primary/50"
            : "border-border hover:border-muted-foreground/30",
          layout.isPro && "opacity-80 hover:opacity-100"
        )}
      >
        <div className="w-full h-full flex items-center justify-center p-2">
           <LayoutThumbnail type={layout.id} />
        </div>
        
        {layout.isPro && (
          <div className="absolute top-1 right-1 bg-yellow-400/90 rounded-full p-0.5 shadow-md">
            <Star size={10} className="text-yellow-900" fill="currentColor"/>
          </div>
        )}
      </motion.div>
    ))
  );

  if (images.length === 2) {
    return (
      <div className="w-full">
        <div className="flex overflow-x-auto gap-3 py-2 px-4 no-scrollbar">
           {renderLayouts(true)}
        </div>
      </div>
    );
  }

  // Default picker for other image counts
  return (
    <div className="flex justify-center overflow-x-auto gap-4 p-4 no-scrollbar">
      {layouts.map((layout) => (
        <button
          key={layout.id}
          className={cn(
            "relative w-24 h-24 rounded-lg flex flex-col items-center justify-center transition-all duration-300 group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            collageLayout === layout.id 
              ? "border-2 border-primary bg-primary/10 shadow-lg scale-105" 
              : "border border-border bg-card hover:bg-muted/80 hover:border-muted-foreground/50"
          )}
          onClick={() => handleLayoutClick(layout)}
        >
          <div className="w-10 h-10 mb-1 flex items-center justify-center">
             <LayoutThumbnail type={layout.id} />
          </div>
          <span className={cn(
              "text-xs font-semibold tracking-wide",
               collageLayout === layout.id ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
          )}>
            {layout.name}
          </span>
        </button>
      ))}
    </div>
  )
}
