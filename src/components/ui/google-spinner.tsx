
import { cn } from '@/lib/utils';

interface GoogleSpinnerProps {
  className?: string;
}

export function GoogleSpinner({ className }: GoogleSpinnerProps) {
  return <div className={cn('google-spinner', className)} />;
}
