
import { Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { HistoryLoader } from './history-loader';

// This is now a server component that wraps the client component.
export default function HistoryPage() {
  // We can perform server-side checks here if needed in the future.
  return (
    <Suspense fallback={
        <div className="flex flex-col flex-1 bg-background p-4 sm:p-6 md:p-8 pb-20 md:pb-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold tracking-tight">History</h1>
            </div>
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
        </div>
    }>
      <HistoryLoader />
    </Suspense>
  );
}
