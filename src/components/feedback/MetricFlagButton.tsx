// Metric Flag Button - Report inaccuracy for specific metrics with undo

import { useState, useEffect, useRef } from 'react';
import { Flag, Undo2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { logFeedback, undoFeedback } from '@/services/feedbackService';
import { cn } from '@/lib/utils';

interface MetricFlagButtonProps {
  metricName: string;
  className?: string;
}

const UNDO_TIMEOUT_MS = 5000;

export const MetricFlagButton = ({ metricName, className }: MetricFlagButtonProps) => {
  const [flagged, setFlagged] = useState(false);
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

  const handleFlag = async () => {
    if (flagged) return;
    setFlagged(true);
    
    const id = await logFeedback('metric_inaccuracy', { metricName });
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
      setFlagged(false);
      setFeedbackId(null);
    }
  };

  return (
    <TooltipProvider>
      <div className={cn("inline-flex items-center gap-1", className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleFlag}
              disabled={flagged}
              className={cn(
                "p-1 rounded transition-all",
                flagged 
                  ? "text-warning cursor-default" 
                  : "text-muted-foreground/40 hover:text-warning/70 hover:bg-warning/10"
              )}
            >
              <Flag className={cn("w-3 h-3", flagged && "fill-warning")} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {flagged ? "Inaccuracy reported" : "Report Inaccuracy"}
          </TooltipContent>
        </Tooltip>

        {showUndo && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleUndo}
                className="p-1 rounded text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-all"
              >
                <Undo2 className="w-3 h-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              Undo ({countdown}s)
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
};
