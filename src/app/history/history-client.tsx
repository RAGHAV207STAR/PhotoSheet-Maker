
"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, Timestamp, doc, writeBatch, deleteDoc } from 'firebase/firestore';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogIn, History as HistoryIcon, Printer, Trash2, X, Download, MoreVertical, View, Image as ImageIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ImagePreviewDialog } from '@/components/app/image-preview-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';


interface Photosheet {
  id: string;
  imageUrl: string;
  copies: number;
  createdAt: Timestamp | null;
}

interface HistoryItemProps {
    sheet: Photosheet;
    selectionMode: boolean;
    isSelected: boolean;
    onToggleSelect: (id: string, isShiftClick: boolean) => void;
    setSelectionMode: (mode: boolean) => void;
    handleDelete: (id: string) => Promise<void>;
}

function HistoryItem({ sheet, selectionMode, isSelected, onToggleSelect, setSelectionMode, handleDelete }: HistoryItemProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const pressTimer = useRef<NodeJS.Timeout | null>(null);
    const didLongPress = useRef(false);
    const isMobile = useIsMobile();

    const date = sheet.createdAt ? sheet.createdAt.toDate() : new Date();

    const confirmDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await handleDelete(sheet.id);
        setIsDeleteDialogOpen(false);
    };

    const handlePointerDown = () => {
        if (!isMobile) return;
        didLongPress.current = false;
        pressTimer.current = setTimeout(() => {
            didLongPress.current = true;
            if (!selectionMode) {
                setSelectionMode(true);
                onToggleSelect(sheet.id, false);
            }
        }, 500); // 500ms for a long press
    };

    const handlePointerUp = () => {
        if (!isMobile) return;
        if (pressTimer.current) {
            clearTimeout(pressTimer.current);
        }
    };
    
    const handleCardClick = (e: React.MouseEvent) => {
        if (didLongPress.current) {
            e.preventDefault();
            return;
        }

        if (selectionMode) {
            onToggleSelect(sheet.id, e.shiftKey);
        } else {
            if (!isMobile) {
                // On desktop, a single click enters selection mode and selects the item
                setSelectionMode(true);
                onToggleSelect(sheet.id, false);
            } else {
                // On mobile, a single tap opens the preview
                setIsPreviewOpen(true);
            }
        }
    };

    const navigateToEditor = () => {
        router.push(`/editor?historyId=${sheet.id}`);
    };
    
    const handleActionWithMessage = (action: 'Download' | 'Print') => {
        toast({
            title: `Redirecting to Editor`,
            description: `Please ${action} your sheet from the editor page for the best quality.`,
        });
        navigateToEditor();
    };

    const handlePreviewImage = () => {
        setIsPreviewOpen(true);
    };
    
    if (!sheet.createdAt) {
      return (
        <Card>
            <Skeleton className="aspect-[4/3] w-full" />
            <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </div>
        </Card>
      );
    }

    return (
        <>
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <Card 
                    className={cn("group flex flex-col transition-all duration-300 relative overflow-hidden cursor-pointer shadow-md hover:shadow-xl hover:scale-[1.02]",
                        isSelected && "ring-2 ring-primary ring-offset-2 shadow-xl scale-[1.02]",
                    )}
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp} 
                    onClick={handleCardClick}
                >
                    <div className="relative">
                        {selectionMode && (
                            <div className="absolute top-2 right-2 z-10 bg-background/80 rounded-full p-1 pointer-events-none flex items-center justify-center">
                                <Checkbox
                                    checked={isSelected}
                                    className="h-5 w-5"
                                    aria-label="Select photosheet"
                                />
                            </div>
                        )}
                        <CardContent className="p-0">
                            <div className="relative aspect-[4/3] w-full rounded-t-lg overflow-hidden bg-gray-100">
                                <Image src={sheet.imageUrl} alt={`Photosheet from ${format(date, "MMMM d, yyyy")}`} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </CardContent>
                    </div>
                    <div className="p-4 flex-grow flex flex-col bg-card rounded-b-lg">
                        <div className="flex justify-between items-start">
                            <div className="flex-grow">
                                <p className="font-semibold">{format(date, "MMMM d, yyyy")}</p>
                                <p className="text-sm text-muted-foreground">{sheet.copies} copies</p>
                                <p className="text-xs text-muted-foreground mt-2">{format(date, "'at' h:mm a")}</p>
                            </div>
                            {!selectionMode && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 -mr-2 -mt-2" onClick={(e) => e.stopPropagation()}>
                                            <MoreVertical className="h-4 w-4" />
                                            <span className="sr-only">More options</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenuItem onClick={handlePreviewImage}>
                                            <ImageIcon className="mr-2 h-4 w-4" />
                                            Preview Image
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={navigateToEditor}>
                                            <View className="mr-2 h-4 w-4" />
                                            Preview Sheet
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleActionWithMessage('Download')}>
                                            <Download className="mr-2 h-4 w-4" />
                                            Download
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleActionWithMessage('Print')}>
                                            <Printer className="mr-2 h-4 w-4" />
                                            Print
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <AlertDialogTrigger asChild>
                                            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </div>
                </Card>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this photosheet from your history.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <ImagePreviewDialog 
                isOpen={isPreviewOpen} 
                onOpenChange={setIsPreviewOpen}
                imageUrl={sheet.imageUrl}
                onViewSheet={navigateToEditor}
                title={`Photo from ${format(date, "MMMM d, yyyy")}`}
            />
        </>
    );
}

const HistorySkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
             <Card key={i}>
                <Skeleton className="aspect-[4/3] w-full" />
                <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
            </Card>
        ))}
    </div>
)


export function HistoryPageClient() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const lastSelectedId = useRef<string | null>(null);

  const photosheetsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
        collection(firestore, 'users', user.uid, 'photosheets'), 
        orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  const { data: photosheets, isLoading: isHistoryLoading, error } = useCollection<Photosheet>(photosheetsQuery);

  const handleToggleSelect = useCallback((id: string, isShiftClick: boolean) => {
    const allIds = photosheets ? photosheets.map(p => p.id) : [];
    
    setSelectedIds(prev => {
        const newSelected = new Set(prev);
        
        if (isShiftClick && lastSelectedId.current && lastSelectedId.current !== id && allIds.length > 0) {
            const lastIndex = allIds.indexOf(lastSelectedId.current);
            const currentIndex = allIds.indexOf(id);

            if (lastIndex !== -1 && currentIndex !== -1) {
                const start = Math.min(lastIndex, currentIndex);
                const end = Math.max(lastIndex, currentIndex);
                const idsToSelect = allIds.slice(start, end + 1);
                
                const areAllInRangeSelected = idsToSelect.every(rangeId => newSelected.has(rangeId));

                if (areAllInRangeSelected) {
                    idsToSelect.forEach(rangeId => {
                        newSelected.delete(rangeId);
                    });
                } else {
                    idsToSelect.forEach(rangeId => {
                        newSelected.add(rangeId);
                    });
                }
            } else {
                 newSelected.has(id) ? newSelected.delete(id) : newSelected.add(id);
            }
        } else {
             if (newSelected.has(id)) {
                newSelected.delete(id);
            } else {
                newSelected.add(id);
            }
        }
        
        if (newSelected.size === 0 && selectionMode) {
            setSelectionMode(false);
        } else if (newSelected.size > 0 && !selectionMode) {
            setSelectionMode(true);
        }
        
        return newSelected;
    });

    if (!isShiftClick || !lastSelectedId.current) {
        lastSelectedId.current = id;
    }
  }, [photosheets, selectionMode]);
  
  const handleSelectAll = () => {
    if (!photosheets) return;
    if (selectedIds.size === photosheets.length) {
      setSelectedIds(new Set());
      setSelectionMode(false);
    } else {
      setSelectedIds(new Set(photosheets.map(p => p.id)));
      if (!selectionMode) setSelectionMode(true);
    }
  };

  const handleDelete = async (id: string) => {
    if (!firestore || !user) return;
    try {
        await deleteDoc(doc(firestore, 'users', user.uid, 'photosheets', id));
        toast({
            title: "Photosheet Deleted",
            variant: "destructive"
        });
    } catch (e) {
        console.error(e);
        toast({
            variant: "destructive",
            title: "Deletion Failed",
            description: "Could not delete the photosheet. Please try again."
        });
    }
  };

  const handleBulkDelete = async () => {
    if (!firestore || !user || selectedIds.size === 0) return;

    const batch = writeBatch(firestore);
    selectedIds.forEach(id => {
      const docRef = doc(firestore, 'users', user.uid, 'photosheets', id);
      batch.delete(docRef);
    });

    try {
      await batch.commit();
      toast({
        title: `${selectedIds.size} Photosheet(s) Permanently Deleted`,
        variant: 'destructive'
      });
      setSelectedIds(new Set());
      setSelectionMode(false);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Action Failed',
        description: 'An error occurred during bulk deletion.',
      });
    }
  };

  const handleBulkAction = (action: 'print' | 'download') => {
      toast({
          title: 'Not Implemented',
          description: `Bulk ${action} is not yet available.`,
      });
  }

  useEffect(() => {
    if (!selectionMode) {
      setSelectedIds(new Set());
      lastSelectedId.current = null;
    }
  }, [selectionMode]);


  if (isUserLoading) {
    return (
        <div className="flex flex-col flex-1 bg-background p-4 sm:p-6 md:p-8 pb-20 md:pb-8">
             <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold tracking-tight">History</h1>
            </div>
            <HistorySkeleton />
      </div>
    )
  }

  if (!user) {
    return (
       <div className="flex flex-col flex-1 items-center justify-center p-4 animate-gradient-shift bg-[length:200%_auto] bg-gradient-to-br from-cyan-100 via-blue-200 to-purple-200">
         <Card className="w-full max-w-md text-center bg-white/30 backdrop-blur-lg border border-white/20 shadow-lg">
            <CardHeader className="items-center p-6 sm:p-8">
                <div className="p-4 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_4px_20px_rgba(3,105,161,0.3)] mb-4">
                    <LogIn className="h-12 w-12 text-white" />
                </div>
                <CardTitle className="text-3xl font-extrabold tracking-tight">Access Your History</CardTitle>
                <CardDescription className="text-foreground/80 text-base mt-2">Log in to view your saved photosheets and print them anytime.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 sm:p-8 pt-0">
                <Button asChild className="w-full bg-slate-900 text-white hover:bg-slate-800 shadow-md hover:shadow-lg transition-all" size="lg">
                    <Link href="/login">
                        Go to Login
                    </Link>
                </Button>
            </CardContent>
         </Card>
       </div>
    )
  }

  const allSelected = photosheets && photosheets.length > 0 && selectedIds.size === photosheets.length;

  return (
    <div className="flex flex-col flex-1 bg-background p-4 sm:p-6 md:p-8 pb-32 md:pb-8">
        <div className="flex justify-between items-center mb-8">
            <h1 className={cn("animate-gradient-shift bg-[length:200%_auto] font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 transition-all",
                selectionMode ? 'text-2xl' : 'text-4xl'
            )}>
                {selectionMode ? `Selected ${selectedIds.size} item(s)` : 'History'}
            </h1>
        </div>
        
        {isHistoryLoading && (
            <HistorySkeleton />
        )}
        
        {error && (
             <div className="flex-grow flex flex-col items-center justify-center text-center -mt-16">
                <HistoryIcon className="h-16 w-16 text-destructive mb-4" />
                <h2 className="text-2xl font-bold text-destructive">Permission Denied</h2>
                <p className="text-muted-foreground max-w-sm">Could not load history due to a permissions error. Please ensure your Firestore security rules are configured correctly.</p>
                 <pre className="mt-4 p-4 bg-secondary text-left text-xs rounded-md w-full max-w-lg overflow-x-auto"><code>{error.message}</code></pre>
            </div>
        )}

        {!isHistoryLoading && !error && photosheets && photosheets.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {photosheets.map(sheet => 
                    <HistoryItem 
                        key={sheet.id} 
                        sheet={sheet}
                        selectionMode={selectionMode}
                        setSelectionMode={setSelectionMode}
                        isSelected={selectedIds.has(sheet.id)}
                        onToggleSelect={handleToggleSelect}
                        handleDelete={handleDelete}
                    />
                )}
            </div>
        )}
        
        {selectionMode && (
            <div className="fixed bottom-[80px] md:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-lg z-50">
                <TooltipProvider>
                    <div className="bg-background/80 backdrop-blur-md border rounded-xl shadow-2xl p-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                             <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => setSelectionMode(false)}>
                                        <X className="h-5 w-5" />
                                        <span className="sr-only">Cancel Selection</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Cancel Selection</p>
                                </TooltipContent>
                            </Tooltip>
                            <div 
                                className="flex items-center space-x-2 p-2 rounded-md cursor-pointer hover:bg-secondary"
                                onClick={handleSelectAll}
                            >
                                <Checkbox id="select-all-checkbox" checked={!!allSelected} aria-label="Select all items" />
                                <Label htmlFor="select-all-checkbox" className="font-semibold text-sm cursor-pointer">
                                    {allSelected ? 'None' : 'All'}
                                </Label>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon" onClick={() => handleBulkAction('download')} disabled={selectedIds.size === 0}>
                                        <Download className="h-4 w-4" />
                                        <span className="sr-only">Download Selected</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Download Selected</p>
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon" onClick={() => handleBulkAction('print')} disabled={selectedIds.size === 0}>
                                        <Printer className="h-4 w-4" />
                                         <span className="sr-only">Print Selected</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Print Selected</p>
                                </TooltipContent>
                            </Tooltip>
                            <AlertDialog>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="icon" disabled={selectedIds.size === 0}>
                                                <Trash2 className="h-4 w-4" />
                                                <span className="sr-only">Delete Selected</span>
                                            </Button>
                                        </AlertDialogTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Delete Selected</p>
                                    </TooltipContent>
                                </Tooltip>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will permanently delete {selectedIds.size} item(s). This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                </TooltipProvider>
            </div>
        )}

        {!isHistoryLoading && !error && (!photosheets || photosheets.length === 0) && (
            <div className="flex-grow flex flex-col items-center justify-center text-center -mt-16">
                <HistoryIcon className="h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-2xl font-bold">No History Yet</h2>
                <p className="text-muted-foreground max-w-xs">Your generated photosheets will appear here.</p>
                <Button asChild size="lg" className="mt-6">
                    <Link href="/">
                        Create a Photosheet
                    </Link>
                </Button>
            </div>
        )}
    </div>
  );
}
