// Live Transcription Display - Word-by-word highlighting animation
// Shows transcription with animated word appearance and highlighting

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LiveTranscriptionDisplayProps {
  transcript: string;
  isComplete: boolean;
  className?: string;
}

export const LiveTranscriptionDisplay = ({
  transcript,
  isComplete,
  className,
}: LiveTranscriptionDisplayProps) => {
  const [visibleWordCount, setVisibleWordCount] = useState(0);
  const [highlightedWordIndex, setHighlightedWordIndex] = useState(-1);
  
  const words = useMemo(() => {
    if (!transcript) return [];
    return transcript.split(/\s+/).filter(w => w.length > 0);
  }, [transcript]);

  // Animate words appearing one by one
  useEffect(() => {
    if (words.length === 0) return;
    
    // Reset when transcript changes
    setVisibleWordCount(0);
    setHighlightedWordIndex(-1);
    
    // Speed based on word count - faster for longer transcripts
    const wordsPerSecond = Math.min(12, Math.max(4, words.length / 8));
    const interval = 1000 / wordsPerSecond;
    
    let currentWord = 0;
    const wordTimer = setInterval(() => {
      currentWord++;
      setVisibleWordCount(currentWord);
      setHighlightedWordIndex(currentWord - 1);
      
      if (currentWord >= words.length) {
        clearInterval(wordTimer);
        // Keep last word highlighted briefly, then clear
        setTimeout(() => setHighlightedWordIndex(-1), 500);
      }
    }, interval);

    return () => clearInterval(wordTimer);
  }, [words]);

  // Mark complete instantly if isComplete changes
  useEffect(() => {
    if (isComplete && words.length > 0) {
      setVisibleWordCount(words.length);
      setHighlightedWordIndex(-1);
    }
  }, [isComplete, words.length]);

  if (!transcript && !isComplete) {
    return (
      <div className={cn("text-center py-8", className)}>
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <motion.span
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Listening
          </motion.span>
          <motion.div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <motion.span
                key={i}
                className="w-1.5 h-1.5 bg-primary rounded-full"
                animate={{ y: [0, -4, 0] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.15,
                }}
              />
            ))}
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {isComplete ? 'Transcription Complete' : 'Live Transcription'}
        </span>
        <span className="text-xs text-muted-foreground">
          {visibleWordCount} / {words.length} words
        </span>
      </div>
      
      {/* Transcription box */}
      <div className="relative bg-muted/30 backdrop-blur-sm rounded-lg p-4 border border-border/50 max-h-40 overflow-y-auto">
        {/* Gradient fade at bottom when scrollable */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-muted/30 to-transparent pointer-events-none rounded-b-lg" />
        
        <p className="text-sm leading-relaxed font-mono">
          <AnimatePresence mode="popLayout">
            {words.slice(0, visibleWordCount).map((word, index) => (
              <motion.span
                key={`${index}-${word}`}
                initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
                animate={{ 
                  opacity: 1, 
                  y: 0, 
                  filter: 'blur(0px)',
                }}
                transition={{
                  duration: 0.2,
                  ease: 'easeOut',
                }}
                className={cn(
                  "inline-block mr-1.5 transition-colors duration-200",
                  index === highlightedWordIndex
                    ? "text-primary font-semibold bg-primary/10 rounded px-0.5"
                    : "text-foreground/80"
                )}
              >
                {word}
              </motion.span>
            ))}
          </AnimatePresence>
          
          {/* Cursor when still typing */}
          {!isComplete && visibleWordCount < words.length && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="inline-block w-0.5 h-4 bg-primary ml-1 align-middle"
            />
          )}
        </p>
      </div>

      {/* Progress indicator */}
      {!isComplete && (
        <div className="mt-2">
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary/60"
              initial={{ width: '0%' }}
              animate={{ width: `${(visibleWordCount / Math.max(words.length, 1)) * 100}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
