// Version Comparison Bar - Shows after regeneration with undo

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logFeedback, undoFeedback } from '@/services/feedbackService';
import { cn } from '@/lib/utils';

interface VersionComparisonBarProps {
  onDismiss?: () => void;
  className?: string;
}

const UNDO_TIMEOUT_MS = 5000;

export const VersionComparisonBar = ({ onDismiss, className }: VersionComparisonBarProps) => {
  const [responded, setResponded] = useState(false);
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

  const handleResponse = async (isBetter: boolean) => {
    setResponded(true);
    
    const id = await logFeedback('script_comparison', { isNewVersionBetter: isBetter });
    if (id) {
      setFeedbackId(id);
      setShowUndo(true);
      setCountdown(5);

      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearTimers();
            setShowUndo(false);
            setTimeout(() => onDismiss?.(), 500);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      undoTimerRef.current = setTimeout(() => {
        clearTimers();
        setShowUndo(false);
        onDismiss?.();
      }, UNDO_TIMEOUT_MS);
    }
  };

  const handleUndo = async () => {
    if (!feedbackId) return;
    
    clearTimers();
    setShowUndo(false);
    
    const success = await undoFeedback(feedbackId);
    if (success) {
      setResponded(false);
      setFeedbackId(null);
    }
  };

  if (responded) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          "flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-success/10 border border-success/20",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-success" />
          <span className="text-sm text-success">Feedback recorded!</span>
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
                className="h-6 px-2 text-xs gap-1 text-success/70 hover:text-success hover:bg-success/10"
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
