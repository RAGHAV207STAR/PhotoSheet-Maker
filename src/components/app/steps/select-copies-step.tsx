
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useEditor } from '@/context/editor-context';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface SelectCopiesStepProps {
  onContinue: () => void;
}

const copyOptions = [1, 2, 4, 6, 8, 10, 12, 20, 30];

export default function SelectCopiesStep({ onContinue }: SelectCopiesStepProps) {
  const { copies, setCopies } = useEditor();
  const [selectedCopies, setSelectedCopies] = useState<number | null>(copies > 0 ? copies : null);

  const handleSelect = (num: number) => {
    setSelectedCopies(num);
    setCopies(num);
  };
  
  const handleContinue = () => {
      if (selectedCopies !== null) {
          onContinue();
      }
  }

  return (
    <div className="flex flex-col flex-1 bg-background justify-center items-center p-4">
        <main className="w-full max-w-2xl mx-auto flex-grow flex flex-col justify-center gap-8 pb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl bg-white/60 backdrop-blur-sm border border-white/20 p-1 shadow-2xl"
            >
              <Card className="w-full bg-transparent border-0 rounded-xl p-0 relative">
                <div className="rounded-xl p-6">
                    <CardHeader className="text-center p-0 pb-6">
                      <CardTitle className="text-2xl font-bold tracking-tight text-slate-800">Step 1: Select Copies</CardTitle>
                      <CardDescription className="text-slate-600">How many photos do you need on the sheet?</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="grid grid-cols-3 gap-4 w-full">
                        {copyOptions.map((num) => (
                          <Button
                            key={num}
                            variant={selectedCopies === num ? 'default' : 'secondary'}
                            className={cn(
                              "py-6 text-xl font-bold rounded-lg transition-all duration-300 transform",
                              selectedCopies === num 
                                ? "shadow-lg scale-105 ring-2 ring-offset-2 ring-primary ring-offset-background" 
                                : "shadow-md hover:scale-105 hover:shadow-lg"
                            )}
                            onClick={() => handleSelect(num)}
                          >
                            {num}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                </div>
              </Card>
            </motion.div>
        </main>
        <footer className="bg-background/80 backdrop-blur-sm border-t p-4 fixed bottom-0 left-0 right-0 z-10 no-print">
            <div className="w-full max-w-lg mx-auto">
                <Button onClick={handleContinue} className="w-full" size="lg" disabled={selectedCopies === null}>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </footer>
    </div>
  );
}
