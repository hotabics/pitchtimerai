// Version Comparison Bar - Shows after regeneration

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logFeedback } from '@/services/feedbackService';
import { cn } from '@/lib/utils';

interface VersionComparisonBarProps {
  onDismiss?: () => void;
  className?: string;
}

export const VersionComparisonBar = ({ onDismiss, className }: VersionComparisonBarProps) => {
  const [responded, setResponded] = useState(false);

  const handleResponse = (isBetter: boolean) => {
    setResponded(true);
    logFeedback('script_comparison', { isNewVersionBetter: isBetter });
    setTimeout(() => {
      onDismiss?.();
    }, 2000);
  };

  if (responded) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          "flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-success/10 border border-success/20",
          className
        )}
      >
        <Check className="w-4 h-4 text-success" />
        <span className="text-sm text-success">Feedback recorded!</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center justify-center gap-4 py-3 px-4 rounded-lg bg-primary/5 border border-primary/20",
        className
      )}
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowRight className="w-4 h-4" />
        <span>Is this version better?</span>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleResponse(true)}
          className="h-7 px-3 text-xs font-medium hover:bg-success/10 hover:text-success"
        >
          Yes
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleResponse(false)}
          className="h-7 px-3 text-xs font-medium hover:bg-destructive/10 hover:text-destructive"
        >
          No
        </Button>
      </div>
    </motion.div>
  );
};
