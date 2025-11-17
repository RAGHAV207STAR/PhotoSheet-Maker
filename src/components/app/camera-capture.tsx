
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, RefreshCcw, VideoOff, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

interface CameraCaptureProps {
  onCapture: (dataUrl: string) => void;
}

export default function CameraCapture({ onCapture }: CameraCaptureProps) {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const getCameraPermission = useCallback(async () => {
    // Reset states
    setHasCameraPermission(null); // Show loading state
    setCapturedImage(null);
    stopCamera();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasCameraPermission(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in your browser settings to use this feature.',
      });
    }
  }, [stopCamera, toast]);
  
  useEffect(() => {
    getCameraPermission();
    // Cleanup on unmount
    return () => {
      stopCamera();
    };
  }, [getCameraPermission, stopCamera]);


  const handleCapture = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    getCameraPermission();
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      toast({
          title: "Photo Added!",
          description: "The captured photo has been added to your selection.",
      });
      handleRetake(); // Get camera ready for another shot
    }
  };

  if (hasCameraPermission === null) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 gap-4 text-muted-foreground">
          <Camera className="w-16 h-16 animate-pulse" />
          <p className="font-semibold text-lg mt-2">Requesting Camera Access...</p>
          <p className="text-sm text-center max-w-xs">We need your permission to use the camera to take photos.</p>
        </div>
      )
  }

  if (hasCameraPermission === false) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 gap-4">
             <Alert variant="destructive" className="max-w-md">
                <VideoOff className="h-4 w-4" />
                <AlertTitle>Camera Access Denied</AlertTitle>
                <AlertDescription>
                    We need access to your camera to take photos. Please enable camera permissions in your browser settings, then try again.
                </AlertDescription>
            </Alert>
            <Button onClick={getCameraPermission} variant="secondary">Try Again</Button>
        </div>
      )
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 gap-4">
      <div className="relative w-full max-w-lg aspect-video bg-slate-900 rounded-lg shadow-lg overflow-hidden">
        <video
          ref={videoRef}
          className={cn(
              "w-full h-full object-cover transform -scale-x-100", 
              capturedImage && "hidden",
          )}
          autoPlay
          playsInline
          muted
        />

        {capturedImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={capturedImage} alt="Captured" className="w-full h-full object-cover transform -scale-x-100" />
        )}
      </div>

      <div className="flex items-center gap-4">
        {capturedImage ? (
          <>
            <Button variant="outline" onClick={handleRetake} size="lg">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Retake
            </Button>
            <Button onClick={handleConfirm} size="lg" className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
              <Check className="mr-2 h-4 w-4" />
              Confirm
            </Button>
          </>
        ) : (
          <Button onClick={handleCapture} disabled={!hasCameraPermission} size="lg" className="w-32 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
            <Camera className="mr-2 h-4 w-4" />
            Capture
          </Button>
        )}
      </div>
    </div>
  );
}
