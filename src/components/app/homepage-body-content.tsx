
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Download, Zap, Printer, Settings, ShieldCheck, Gift, FileQuestion } from 'lucide-react';
import { usePWAInstall } from '@/hooks/use-pwa-install';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CollageTeaser } from './collage-teaser';
import { useState, useEffect } from 'react';

const copyOptions = [1, 2, 4, 6, 8, 10, 12, 20, 30];

interface HomepageBodyContentProps {
    onCollageClick: () => void;
}

export default function HomepageBodyContent({ onCollageClick }: HomepageBodyContentProps) {
  const [selectedCopies, setSelectedCopies] = useState<number | null>(null);
  const router = useRouter();
  const { canInstall, install } = usePWAInstall();
  const { toast } = useToast();

  const handleInstallClick = () => {
    if (canInstall) {
      install();
    } else {
      toast({
        title: "Installation Not Available",
        description: "Your browser does not support PWA installation, or it's not ready. Please try again later.",
      });
    }
  }

  useEffect(() => {
    if (selectedCopies !== null) {
      const params = new URLSearchParams();
      params.set('copies', selectedCopies.toString());
      router.push(`/editor?${params.toString()}`);
    }
  }, [selectedCopies, router]);

  const features = [
    { 
      icon: Gift, 
      title: "Completely Free", 
      description: "Create unlimited photo sheets and collages without any cost. Our tool is 100% free." 
    },
    { 
      icon: Zap, 
      title: "Fast and Easy", 
      description: "From upload to download in under a minute. Our streamlined process saves you time." 
    },
    { 
      icon: Printer,
      title: "Print-Ready Sheets",
      description: "We automatically arrange your photos on standard-sized sheets, perfectly optimized for printing." 
    },
    { 
      icon: Settings, 
      title: "Customizable Layouts", 
      description: "Easily adjust spacing, borders, and photo sizes to meet your specific requirements." 
    },
    { 
      icon: ShieldCheck, 
      title: "No Installation Needed", 
      description: "Works directly in your browser. Install it as a PWA for an even better offline experience." 
    }
  ];

  return (
      <>
          {canInstall && (
              <div className="py-4 flex justify-center">
                  <Button onClick={handleInstallClick} size="lg" className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg transform transition-all hover:scale-105">
                      <Download className="mr-2 h-4 w-4"/>
                      Install App
                  </Button>
              </div>
          )}

          <div className="w-full max-w-4xl">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="rounded-2xl bg-white/60 backdrop-blur-sm border border-white/20 p-1 shadow-2xl"
            >
              <Card className="w-full bg-transparent border-0 rounded-xl p-0 relative">
                <div className="rounded-xl p-6">
                    <CardHeader className="text-center p-0 pb-6">
                      <CardTitle className="text-2xl font-bold tracking-tight text-slate-800">Passport Photo Quick Start</CardTitle>
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
                            onClick={() => setSelectedCopies(num)}
                          >
                            {num}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                </div>
              </Card>
            </motion.div>
          </div>

          <div className="w-full max-w-4xl">
             <CollageTeaser onCollageClick={onCollageClick} />
          </div>
  
          <section className="w-full max-w-4xl mx-auto py-12 px-4 md:px-0 text-slate-800">
              <div className="text-center">
                  <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl animate-gradient-shift bg-[length:200%_auto] text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-700">
                      Your All-in-One Photo Solution
                  </h2>
                  <p className="mt-4 text-lg text-slate-600">
                      Welcome to Photosheet Maker, the simplest way to prepare photos for any occasion. Create print-ready passport, visa, and ID photos in seconds, or unleash your creativity with our flexible photo collage maker. No software, no sign-ups, no hassle.
                  </p>
                  <p className="mt-2 text-lg text-slate-600">
                      Whether you need a sheet of official photos or a beautiful collage of your favorite memories, our powerful online tools have you covered. The intuitive interface guides you through the process, from uploading images to customizing the final layout. Get professional results instantly.
                  </p>
              </div>
  
              <div className="mt-12">
                  <h3 className="text-3xl font-bold text-center mb-8 animate-gradient-shift bg-[length:200%_auto] text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-700">Why Choose Photosheet Maker?</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {features.map((feature, index) => (
                        <Card key={index} className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-shadow">
                          <CardHeader className="flex flex-row items-center gap-4 pb-2">
                            <div className="p-2 bg-gradient-to-br from-cyan-100 to-blue-200 rounded-lg">
                              <feature.icon className="h-6 w-6 text-blue-600" />
                            </div>
                            <CardTitle className="text-lg font-semibold">{feature.title}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-slate-600">{feature.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
              </div>
  
              <div className="mt-16">
                  <div className="flex flex-col items-center text-center mb-8">
                      <FileQuestion className="h-10 w-10 mb-2 text-blue-600" />
                      <h3 className="text-3xl font-bold text-center animate-gradient-shift bg-[length:200%_auto] text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-700">Frequently Asked Questions</h3>
                  </div>
                  <Accordion type="single" collapsible className="w-full space-y-4">
                       <AccordionItem value="item-1" className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg rounded-lg">
                          <AccordionTrigger className="px-6 text-left">How does the collage maker work?</AccordionTrigger>
                          <AccordionContent className="px-6">
                          Simply click the "Photo Collage" card, upload multiple images, and then arrange them on the sheet. You can use our automatic layout feature for a quick grid or switch to manual mode to drag, resize, and position each photo exactly how you want it.
                          </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-2" className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg rounded-lg">
                          <AccordionTrigger className="px-6 text-left">How do I make a passport photo online with this tool?</AccordionTrigger>
                          <AccordionContent className="px-6">
                          To make a passport photo online, simply select the number of copies you need from the "Quick Start" section, upload your image on the next screen, and our tool will automatically arrange it on an A4 sheet. You can then download the sheet as a PDF and print it.
                          </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-3" className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg rounded-lg">
                          <AccordionTrigger className="px-6 text-left">Is this passport size photo maker really free?</AccordionTrigger>
                          <AccordionContent className="px-6">
                          Yes, absolutely! Photosheet Maker is a completely free tool for both passport photos and collages. You can create and download as many photo sheets as you need without any charges.
                          </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-4" className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg rounded-lg">
                          <AccordionTrigger className="px-6 text-left">What happens to my uploaded photos?</AccordionTrigger>
                          <AccordionContent className="px-6">
                          Your privacy is important. If you are not logged in, your photos are processed in your browser and are never stored on our servers. If you are logged in, your generated sheets are saved to your private history for easy reprinting, protected by security rules.
                          </AccordionContent>
                      </AccordionItem>
                       <AccordionItem value="item-5" className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg rounded-lg">
                          <AccordionTrigger className="px-6 text-left">What's the best way to print the photosheet?</AccordionTrigger>
                          <AccordionContent className="px-6">
                          For best results, download the generated PDF and print it on the appropriate paper size (e.g., A4 photo paper). Ensure your printer settings are set to '100%' or 'Actual Size' to avoid scaling issues.
                          </AccordionContent>
                      </AccordionItem>
                  </Accordion>
              </div>
              
              <div className="mt-16 w-full">
                  <Card className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 shadow-2xl animate-gradient-shift bg-[length:200%_auto]">
                      <CardContent className="p-8 flex flex-col items-center text-center">
                          <h3 className="text-3xl font-bold">Ready to Start?</h3>
                          <p className="mt-2 text-lg text-blue-100">Create your perfect photo layout now — it’s free!</p>
                          <Button asChild size="lg" className="mt-6 bg-white text-blue-600 hover:bg-blue-50 shadow-md hover:shadow-lg transition-all">
                              <Link href="#top">Select an Option Above to Begin</Link>
                          </Button>
                      </CardContent>
                  </Card>
              </div>
          </section>
      </>
  );
}
