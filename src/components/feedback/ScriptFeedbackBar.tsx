// Script Feedback Bar - Thumbs up/down with "Why?" tag cloud and undo

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, ThumbsDown, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logFeedback, undoFeedback, ScriptDislikeReason } from '@/services/feedbackService';
import { cn } from '@/lib/utils';

interface ScriptFeedbackBarProps {
  scriptId?: string;
  className?: string;
}

const dislikeReasons: { id: ScriptDislikeReason; label: string }[] = [
  { id: 'too_long', label: 'Too Long' },
  { id: 'too_generic', label: 'Too Generic' },
  { id: 'wrong_tone', label: 'Wrong Tone' },
  { id: 'inaccurate_info', label: 'Inaccurate Info' },
];

const UNDO_TIMEOUT_MS = 5000;

export const ScriptFeedbackBar = ({ scriptId, className }: ScriptFeedbackBarProps) => {
  const [feedbackGiven, setFeedbackGiven] = useState<'up' | 'down' | null>(null);
  const [showReasons, setShowReasons] = useState(false);
  const [selectedReason, setSelectedReason] = useState<ScriptDislikeReason | null>(null);
  const [lastFeedbackId, setLastFeedbackId] = useState<string | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const [undoCountdown, setUndoCountdown] = useState(5);
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

  const startUndoTimer = () => {
    setShowUndo(true);
    setUndoCountdown(5);
    
    // Countdown interval
    countdownRef.current = setInterval(() => {
      setUndoCountdown(prev => {
        if (prev <= 1) {
          clearTimers();
          setShowUndo(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Timeout to hide undo
    undoTimerRef.current = setTimeout(() => {
      clearTimers();
      setShowUndo(false);
    }, UNDO_TIMEOUT_MS);
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  const handleThumbsUp = async () => {
    if (feedbackGiven) return;
    setFeedbackGiven('up');
    setShowReasons(false);
    const id = await logFeedback('script_thumbs_up', { scriptId });
    if (id) {
      setLastFeedbackId(id);
      startUndoTimer();
    }
  };

  const handleThumbsDown = () => {
    if (feedbackGiven === 'down') return;
    setFeedbackGiven('down');
    setShowReasons(true);
  };

  const handleReasonSelect = async (reason: ScriptDislikeReason) => {
    setSelectedReason(reason);
    setShowReasons(false);
    const id = await logFeedback('script_thumbs_down', { scriptId, reason });
    if (id) {
      setLastFeedbackId(id);
      startUndoTimer();
    }
  };

  const handleUndo = async () => {
    if (!lastFeedbackId) return;
    
    clearTimers();
    setShowUndo(false);
    
    const success = await undoFeedback(lastFeedbackId);
    if (success) {
      setFeedbackGiven(null);
      setSelectedReason(null);
      setLastFeedbackId(null);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Main feedback bar */}
      <div className="flex items-center justify-center gap-4 py-3 px-4 rounded-lg bg-muted/30 border border-border/50">
        <span className="text-sm text-muted-foreground">How was this script?</span>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleThumbsUp}
            disabled={feedbackGiven !== null}
            className={cn(
              "h-8 w-8 p-0 transition-all",
              feedbackGiven === 'up' 
                ? "text-success bg-success/10 hover:bg-success/10" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ThumbsUp className={cn(
              "w-4 h-4 transition-transform",
              feedbackGiven === 'up' && "scale-110"
            )} />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleThumbsDown}
            disabled={feedbackGiven === 'up' || selectedReason !== null}
            className={cn(
              "h-8 w-8 p-0 transition-all",
              feedbackGiven === 'down' 
                ? "text-destructive bg-destructive/10 hover:bg-destructive/10" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ThumbsDown className={cn(
              "w-4 h-4 transition-transform",
              feedbackGiven === 'down' && "scale-110"
            )} />
          </Button>
        </div>

        {/* Undo button with countdown */}
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
                className="h-7 px-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Undo2 className="w-3.5 h-3.5" />
                Undo ({undoCountdown}s)
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* "Why?" Tag Cloud */}
      <AnimatePresence>
        {showReasons && feedbackGiven === 'down' && !selectedReason && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap justify-center gap-2 py-2">
              <span className="text-xs text-muted-foreground mr-2 self-center">Why?</span>
              {dislikeReasons.map((reason) => (
                <motion.button
                  key={reason.id}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleReasonSelect(reason.id)}
                  className="px-3 py-1.5 text-xs font-medium rounded-full bg-muted hover:bg-muted-foreground/20 text-muted-foreground hover:text-foreground transition-colors border border-border/50"
                >
                  {reason.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
