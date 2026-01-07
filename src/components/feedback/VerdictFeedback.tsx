// Verdict Feedback - Was the jury verdict helpful? With undo option

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logFeedback, undoFeedback } from '@/services/feedbackService';
import { cn } from '@/lib/utils';

interface VerdictFeedbackProps {
  className?: string;
}

const UNDO_TIMEOUT_MS = 5000;

export const VerdictFeedback = ({ className }: VerdictFeedbackProps) => {
  const [responded, setResponded] = useState<'helpful' | 'not_helpful' | null>(null);
  const [feedbackId, setFeedbackId] = useState<string | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = () => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  const handleResponse = async (isHelpful: boolean) => {
    const response = isHelpful ? 'helpful' : 'not_helpful';
    setResponded(response);
    
    const id = await logFeedback(isHelpful ? 'verdict_helpful' : 'verdict_not_helpful');
    if (id) {
      setFeedbackId(id);
      setShowUndo(true);
      setCountdown(5);

      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearTimers();
            setShowUndo(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      undoTimerRef.current = setTimeout(() => {
        clearTimers();
        setShowUndo(false);
      }, UNDO_TIMEOUT_MS);
    }
  };

  const handleUndo = async () => {
    if (!feedbackId) return;
    
    clearTimers();
    setShowUndo(false);
    
    const success = await undoFeedback(feedbackId);
    if (success) {
      setResponded(null);
      setFeedbackId(null);
    }
  };

  if (responded) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          "flex items-center justify-center gap-3 py-2 text-sm",
          responded === 'helpful' ? "text-success" : "text-muted-foreground",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>Thanks for your feedback!</span>
        </div>
        
        <AnimatePresence>
          {showUndo && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUndo}
                className="h-6 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
              >
                <Undo2 className="w-3 h-3" />
                Undo ({countdown}s)
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
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
