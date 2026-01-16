// Subtle save status indicator component
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Cloud, CloudOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SaveStatusIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSavedAt?: Date | null;
  className?: string;
}

export const SaveStatusIndicator = ({ 
  status, 
  lastSavedAt,
  className 
}: SaveStatusIndicatorProps) => {
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 5 }}
        className={cn(
          'inline-flex items-center gap-1.5 text-xs font-medium transition-colors',
          status === 'saving' && 'text-muted-foreground',
          status === 'saved' && 'text-emerald-500',
          status === 'error' && 'text-destructive',
          status === 'idle' && 'text-muted-foreground/50',
          className
        )}
      >
        {status === 'saving' && (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Saving...</span>
          </>
        )}
        
        {status === 'saved' && (
          <>
            <Check className="w-3 h-3" />
            <span>Saved{lastSavedAt ? ` ${formatTime(lastSavedAt)}` : ''}</span>
          </>
        )}
        
        {status === 'error' && (
          <>
            <CloudOff className="w-3 h-3" />
            <span>Save failed</span>
          </>
        )}
        
        {status === 'idle' && (
          <>
            <Cloud className="w-3 h-3" />
            <span>Not saved</span>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
