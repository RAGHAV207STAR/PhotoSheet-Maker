
"use client";

import { useMemo, useState, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, Timestamp, doc, writeBatch } from 'firebase/firestore';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogIn, History as HistoryIcon, Printer, Trash2, Undo, Share, X, CheckSquare, Square, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';


interface Photosheet {
  id: string;
  imageUrl: string;
  copies: number;
  createdAt: Timestamp | null;
  userId?: string;
}

interface HistoryItemProps {
    sheet: Photosheet;
    selectionMode: boolean;
    isSelected: boolean;
    onToggleSelect: (id: string) => void;
    setSelectionMode: (mode: boolean) => void;
}

function HistoryItem({ sheet, selectionMode, isSelected, onToggleSelect, setSelectionMode }: HistoryItemProps) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    const date = sheet.createdAt ? sheet.createdAt.toDate() : new Date();

    const handleReprint = (e: React.MouseEvent) => {
        e.stopPropagation();
        const params = new URLSearchParams();
        params.set('historyId', sheet.id);
        router.push(`/editor?${params.toString()}`);
    }

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!firestore || !sheet.userId) return;

        setIsDeleting(true);
        setIsVisible(false);

        const deleteTimeout = setTimeout(() => {
            const docRef = doc(firestore, 'users', sheet.userId!, 'photosheets', sheet.id);
            deleteDocumentNonBlocking(docRef);
            toast({
                title: "Photosheet Permanently Deleted",
                description: "The item has been removed from your history.",
            });
        }, 5000); // 5-second delay before permanent deletion

        toast({
            title: "Photosheet Deleted",
            description: "This item has been moved to trash.",
            action: (
                <Button variant="secondary" size="sm" onClick={() => {
                    clearTimeout(deleteTimeout);
                    setIsDeleting(false);
                    setIsVisible(true);
                    toast({
                        title: "Deletion Canceled",
                        description: "The photosheet has been restored.",
                    });
                }}>
                    <Undo className="mr-2 h-4 w-4" />
                    Undo
                </Button>
            ),
        });
    };

    const handleCardClick = () => {
        if (!selectionMode) {
            setSelectionMode(true);
        }
        onToggleSelect(sheet.id);
    };
    
    if (!isVisible) {
      return null;
    }

    if (!sheet.createdAt || !sheet.userId) {
      // Data is not yet fully populated from the server, render a placeholder or nothing
      return (
        <Card>
            <Skeleton className="aspect-[4/3] w-full" />
            <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="p-4 pt-0">
                <Skeleton className="h-10 w-full" />
            </div>
        </Card>
      );
    }

    return (
        <Card 
            className={cn("flex flex-col transition-all duration-200 relative cursor-pointer",
                isSelected && "ring-2 ring-primary ring-offset-2"
            )}
            onClick={handleCardClick}
        >
            {selectionMode && (
                 <div className="absolute top-2 right-2 z-10 bg-background/80 rounded-sm p-1">
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onToggleSelect(sheet.id)}
                        className="h-5 w-5"
                        aria-label="Select photosheet"
                    />
                </div>
            )}
            <CardContent className="p-0">
                <div className="relative aspect-[4/3] w-full rounded-t-md overflow-hidden bg-gray-100">
                    <Image src={sheet.imageUrl} alt={`Photosheet from ${format(date, "MMMM d, yyyy")}`} layout="fill" objectFit="cover" />
                </div>
            </CardContent>
            <div className="p-4 flex-grow flex flex-col">
                <p className="font-semibold">Photosheet</p>
                <p className="text-sm text-muted-foreground">{sheet.copies} copies</p>
                <p className="text-xs text-muted-foreground mt-2">{format(date, "MMMM d, yyyy 'at' h:mm a")}</p>
            </div>
            <CardFooter className="p-4 pt-0">
                 <div className="w-full grid grid-cols-2 gap-2">
                    <Button onClick={handleReprint} variant="secondary" disabled={isDeleting || selectionMode}>
                        <Printer className="mr-2 h-4 w-4" />
                        Reprint
                    </Button>
                    <Button variant="destructive" className="w-full" onClick={handleDelete} disabled={isDeleting || selectionMode}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}

const HistorySkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
             <Card key={i}>
                <Skeleton className="aspect-[4/3] w-full" />
                <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="p-4 pt-0">
                    <Skeleton className="h-10 w-full" />
                </div>
            </Card>
        ))}
    </div>
)


export default function HistoryPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const photosheetsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'photosheets'), orderBy('createdAt', 'desc'));
  }, [firestore, user]);

  const { data: photosheets, isLoading: isHistoryLoading } = useCollection<Photosheet>(photosheetsQuery);

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };
  
  const handleSelectAll = () => {
    if (photosheets) {
        if(selectedIds.length === photosheets.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(photosheets.map(p => p.id));
        }
    }
  }

  const handleBulkDelete = async () => {
    if (!firestore || !user || selectedIds.length === 0) return;

    const batch = writeBatch(firestore);
    selectedIds.forEach(id => {
      const docRef = doc(firestore, 'users', user!.uid, 'photosheets', id);
      batch.delete(docRef);
    });

    try {
      await batch.commit();
      toast({
        title: `${selectedIds.length} Photosheet(s) Deleted`,
        description: 'The selected items have been permanently removed.',
      });
      setSelectedIds([]);
      setSelectionMode(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Deletion Failed',
        description: 'An error occurred while deleting the photosheets.',
      });
    }
  };
  
  const handleBulkAction = (action: 'print' | 'share') => {
      toast({
          title: 'Coming Soon!',
          description: `Bulk ${action} functionality will be available in a future update.`,
          action: <Button variant="secondary" size="sm">OK</Button>
      });
  }

  useEffect(() => {
    if (!selectionMode) {
      setSelectedIds([]);
    }
  }, [selectionMode]);

  useEffect(() => {
    // If all items are deselected, and we are in selection mode, exit it.
    if (selectionMode && photosheets && selectedIds.length === 0 && photosheets.length > 0) {
      setSelectionMode(false);
    }
  }, [selectedIds, selectionMode, photosheets]);


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

  return (
    <div className="flex flex-col flex-1 bg-background p-4 sm:p-6 md:p-8 pb-32 md:pb-8">
        <div className="flex justify-between items-center mb-8">
            <h1 className={cn("animate-gradient-shift bg-[length:200%_auto] font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600",
                selectionMode ? 'text-3xl' : 'text-4xl'
            )}>
                {selectionMode ? `Selected ${selectedIds.length} item(s)` : 'History'}
            </h1>
        </div>
        
        {isHistoryLoading && (
            <HistorySkeleton />
        )}

        {!isHistoryLoading && photosheets && photosheets.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {photosheets.map(sheet => 
                    <HistoryItem 
                        key={sheet.id} 
                        sheet={{...sheet, userId: user.uid}}
                        selectionMode={selectionMode}
                        setSelectionMode={setSelectionMode}
                        isSelected={selectedIds.includes(sheet.id)}
                        onToggleSelect={handleToggleSelect}
                    />
                )}
            </div>
        )}
        
        {selectionMode && photosheets && photosheets.length > 0 && (
            <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-2 z-50">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                           {selectedIds.length === photosheets.length ? <CheckSquare className="mr-2 h-4 w-4 text-primary" /> : <Square className="mr-2 h-4 w-4 text-muted-foreground" /> }
                           Select All
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleBulkAction('print')}>
                            <Printer className="h-4 w-4" />
                        </Button>
                         <Button variant="outline" size="icon" onClick={() => handleBulkAction('share')}>
                            <Share className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="icon" onClick={handleBulkDelete} disabled={selectedIds.length === 0}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                         <Button variant="secondary" size="icon" onClick={() => setSelectionMode(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        )}

        {!isHistoryLoading && (!photosheets || photosheets.length === 0) && (
            <div className="flex-grow flex flex-col items-center justify-center text-center -mt-16">
                <HistoryIcon className="h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-2xl font-bold">No History Yet</h2>
                <p className="text-muted-foreground max-w-xs">Your generated photosheets will appear here.</p>
                <Button asChild className="mt-6">
                    <Link href="/">
                        Create a Photosheet
                    </Link>
                </Button>
            </div>
        )}
    </div>
  );
}

    

    
