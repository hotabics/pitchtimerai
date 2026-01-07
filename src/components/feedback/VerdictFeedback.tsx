// Verdict Feedback - Was the jury verdict helpful?

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logFeedback } from '@/services/feedbackService';
import { cn } from '@/lib/utils';

interface VerdictFeedbackProps {
  className?: string;
}

export const VerdictFeedback = ({ className }: VerdictFeedbackProps) => {
  const [responded, setResponded] = useState<'helpful' | 'not_helpful' | null>(null);

  const handleResponse = (isHelpful: boolean) => {
    const response = isHelpful ? 'helpful' : 'not_helpful';
    setResponded(response);
    logFeedback(isHelpful ? 'verdict_helpful' : 'verdict_not_helpful');
  };

  if (responded) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          "flex items-center justify-center gap-2 py-2 text-sm",
          responded === 'helpful' ? "text-success" : "text-muted-foreground",
          className
        )}
      >
        <Check className="w-4 h-4" />
        <span>Thanks for your feedback!</span>
      </motion.div>
    );
  }

  return (
    <div className={cn("space-y-2 pt-4 border-t border-border/50", className)}>
      <p className="text-xs text-muted-foreground text-center">Was this feedback helpful?</p>
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleResponse(true)}
          className="h-8 px-3 text-xs font-medium text-muted-foreground hover:text-success hover:bg-success/10 gap-1.5"
        >
          <Check className="w-3.5 h-3.5" />
          Yes, spot on
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleResponse(false)}
          className="h-8 px-3 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5"
        >
          <X className="w-3.5 h-3.5" />
          No, it missed the point
        </Button>
      </div>
    </div>
  );
};
