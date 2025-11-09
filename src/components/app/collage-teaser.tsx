
"use client";

import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Sparkles, LayoutGrid, Heart, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { CollageHeroImage, PlaceHolderImages } from "@/lib/placeholder-images";

const MotionCard = motion.div;

interface CollageTeaserProps {
    onCollageClick: () => void;
}

const FloatingCard = ({ className, children, delay = 0 }: { className?: string, children: React.ReactNode, delay?: number }) => (
  <MotionCard
    initial={{ y: 20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ delay: delay + 0.5, type: 'spring', stiffness: 100, damping: 10, mass: 0.5 }}
    className={`absolute bg-white p-1.5 rounded-lg shadow-xl border ${className}`}
  >
    <div className="relative w-full h-full rounded-md overflow-hidden">
        {children}
    </div>
  </MotionCard>
);

export function CollageTeaser({ onCollageClick }: CollageTeaserProps) {
  const p1 = PlaceHolderImages[0];
  const p2 = PlaceHolderImages[1];
  const p3 = PlaceHolderImages[2];

  return (
    <div className="relative w-full bg-gradient-to-br from-slate-50 via-sky-100 to-blue-100 rounded-2xl p-6 md:p-8 overflow-hidden shadow-lg border border-white/50">
      <div className="grid md:grid-cols-2 gap-8 items-center">
        {/* Left Content */}
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="z-10"
        >
          <Badge className="mb-4 bg-yellow-400 text-yellow-900 hover:bg-yellow-400/90 font-semibold shadow">
            <Sparkles className="mr-2 h-4 w-4 text-yellow-700" />
            New Feature
          </Badge>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-800">
            Photo Collage
          </h2>
          <p className="mt-3 text-base md:text-lg text-slate-600">
            Easily combine your favorite photos into beautiful, unique layouts. Your story, your way.
          </p>
          <div className="mt-6">
            <Button
              size="lg"
              onClick={onCollageClick}
              className="bg-slate-800 text-white shadow-md hover:bg-slate-700 transition-all transform hover:scale-105"
            >
              Create a Collage
            </Button>
          </div>
        </motion.div>

        {/* Right Visuals */}
        <div className="relative h-64 md:h-80 -mr-8 md:mr-0">
            <FloatingCard className="w-40 h-28 rotate-[-15deg] top-4 left-0" delay={0}>
                 <Image src={p1.imageUrl} alt={p1.description} fill className="object-cover" data-ai-hint={p1.imageHint}/>
            </FloatingCard>
            
            <FloatingCard className="w-48 h-32 rotate-[5deg] top-12 left-1/2 -translate-x-1/2 z-10" delay={0.2}>
                 <Image src={p2.imageUrl} alt={p2.description} fill className="object-cover" data-ai-hint={p2.imageHint}/>
                 <div className="absolute inset-0 bg-white/20 flex items-center justify-center">
                    <div className="p-2 rounded-full bg-white/50 backdrop-blur-sm">
                        <Heart className="w-6 h-6 text-pink-500 fill-current" />
                    </div>
                 </div>
            </FloatingCard>
            
            <FloatingCard className="w-32 h-40 rotate-[12deg] bottom-0 right-4" delay={0.4}>
                <Image src={p3.imageUrl} alt={p3.description} fill className="object-cover" data-ai-hint={p3.imageHint}/>
            </FloatingCard>
        </div>
      </div>
    </div>
  );
}
