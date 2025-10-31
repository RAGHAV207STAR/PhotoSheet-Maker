"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex flex-col flex-1 items-center justify-center min-h-screen p-4 bg-gradient-to-br from-red-50 to-orange-100">
            <Card className="w-full max-w-lg text-center bg-white/50 backdrop-blur-lg border border-destructive/20 shadow-lg">
                <CardHeader className="items-center p-6 sm:p-8">
                    <div className="p-4 rounded-full bg-gradient-to-br from-red-400 to-orange-500 shadow-[0_4px_20px_rgba(239,68,68,0.3)] mb-4">
                        <AlertTriangle className="h-12 w-12 text-white" />
                    </div>
                    <CardTitle className="text-3xl font-extrabold tracking-tight text-destructive">
                        Something Went Wrong
                    </CardTitle>
                    <CardDescription className="text-foreground/80 text-base mt-2">
                        An unexpected error occurred. Please try reloading the application.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6 sm:p-8 pt-0">
                    <Button onClick={() => reset()} size="lg" className="w-full">
                        Try Again
                    </Button>
                </CardContent>
            </Card>
        </div>
      </body>
    </html>
  );
}
