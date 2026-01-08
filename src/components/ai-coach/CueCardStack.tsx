// Cue Card Stack Component - Alternative to Teleprompter for bullet point delivery

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  Timer, 
  Mic, 
  Hand, 
  Check,
  Play,
  Pause
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type AdvanceMode = 'manual' | 'timer' | 'voice';

interface CueCardStackProps {
  bulletPoints: string[];
  currentTranscript?: string;
  isRecording: boolean;
  onCardChange?: (index: number) => void;
}

// Helper to extract significant words from text
const getSignificantWords = (text: string): string[] => {
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
    'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as',
    'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'and', 'or', 'but', 'if', 'then', 'because', 'so', 'that', 'this',
    'it', 'its', 'we', 'our', 'you', 'your', 'they', 'their', 'he', 'she',
  ]);
  
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));
};

export const CueCardStack = ({
  bulletPoints,
  currentTranscript = '',
  isRecording,
  onCardChange,
}: CueCardStackProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [advanceMode, setAdvanceMode] = useState<AdvanceMode>('manual');
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [timerProgress, setTimerProgress] = useState(0);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [matchDetected, setMatchDetected] = useState(false);
  const [lastSwitchTime, setLastSwitchTime] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownRef = useRef(false);

  const currentCard = bulletPoints[currentIndex] || '';
  const nextCard = bulletPoints[currentIndex + 1] || null;
  const prevCard = currentIndex > 0 ? bulletPoints[currentIndex - 1] : null;

  const goToNext = useCallback(() => {
    if (currentIndex < bulletPoints.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setTimerProgress(0);
      setLastSwitchTime(Date.now());
      cooldownRef.current = true;
      // 3 second cooldown for voice mode
      setTimeout(() => { cooldownRef.current = false; }, 3000);
      onCardChange?.(currentIndex + 1);
    }
  }, [currentIndex, bulletPoints.length, onCardChange]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setTimerProgress(0);
      onCardChange?.(currentIndex - 1);
    }
  }, [currentIndex, onCardChange]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      if ((e.code === 'Space' || e.code === 'ArrowRight') && advanceMode === 'manual') {
        e.preventDefault();
        goToNext();
      } else if (e.code === 'ArrowLeft' && advanceMode === 'manual') {
        e.preventDefault();
        goToPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [advanceMode, goToNext, goToPrev]);

  // Timer mode
  useEffect(() => {
    if (advanceMode !== 'timer' || !isRecording || isTimerPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimerProgress(prev => {
        const newProgress = prev + (100 / timerSeconds);
        if (newProgress >= 100) {
          goToNext();
          return 0;
        }
        return newProgress;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [advanceMode, isRecording, timerSeconds, isTimerPaused, goToNext]);

  // Voice mode - keyword matching
  useEffect(() => {
    if (advanceMode !== 'voice' || !isRecording || cooldownRef.current) return;

    const currentCardWords = getSignificantWords(currentCard);
    const recentWords = getSignificantWords(currentTranscript.split(' ').slice(-15).join(' '));
    
    let matchCount = 0;
    for (const word of recentWords) {
      if (currentCardWords.some(cardWord => 
        cardWord.includes(word) || word.includes(cardWord)
      )) {
        matchCount++;
      }
    }

    // Check for match + silence (simplified: just check if transcript stopped growing)
    if (matchCount >= 2) {
      setMatchDetected(true);
      // Brief delay to show match feedback
      setTimeout(() => {
        setMatchDetected(false);
        goToNext();
      }, 500);
    }
  }, [currentTranscript, currentCard, advanceMode, isRecording, goToNext]);

  return (
    <div className="w-full space-y-4">
      {/* Mode Selector */}
      <div className="flex items-center justify-center gap-2 p-1 bg-black/40 rounded-lg">
        <button
          onClick={() => setAdvanceMode('manual')}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
            advanceMode === 'manual'
              ? "bg-cyan-500/20 text-cyan-400"
              : "text-white/50 hover:text-white/80"
          )}
        >
          <Hand className="w-3.5 h-3.5" />
          Manual
        </button>
        <button
          onClick={() => setAdvanceMode('timer')}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
            advanceMode === 'timer'
              ? "bg-cyan-500/20 text-cyan-400"
              : "text-white/50 hover:text-white/80"
          )}
        >
          <Timer className="w-3.5 h-3.5" />
          Timer
        </button>
        <button
          onClick={() => setAdvanceMode('voice')}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
            advanceMode === 'voice'
              ? "bg-cyan-500/20 text-cyan-400"
              : "text-white/50 hover:text-white/80"
          )}
        >
          <Mic className="w-3.5 h-3.5" />
          AI Voice
        </button>
      </div>

      {/* Card Stack */}
      <div className="relative h-[160px]">
        <AnimatePresence mode="popLayout">
          {/* Current Card */}
          <motion.div
            key={`card-${currentIndex}`}
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              boxShadow: matchDetected 
                ? '0 0 30px rgba(34, 197, 94, 0.5)' 
                : '0 10px 40px rgba(0,0,0,0.3)'
            }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              "absolute inset-x-0 top-0 rounded-xl p-6",
              "bg-gradient-to-b from-white/10 to-white/5",
              "border border-white/20 backdrop-blur-md",
              matchDetected && "border-green-400/50"
            )}
          >
            {/* Progress bar for timer mode */}
            {advanceMode === 'timer' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 rounded-b-xl overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                  style={{ width: `${timerProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            )}

            {/* Card number */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              <span className="text-xs text-white/40">
                {currentIndex + 1} / {bulletPoints.length}
              </span>
              {matchDetected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center"
                >
                  <Check className="w-3 h-3 text-white" />
                </motion.div>
              )}
            </div>

            {/* Content */}
            <p className="text-xl md:text-2xl font-medium text-white leading-relaxed text-center">
              {currentCard}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Next Card Preview */}
        {nextCard && (
          <div className="absolute inset-x-4 bottom-0 h-12 rounded-b-xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-center justify-center px-4 -z-10">
            <span className="text-xs text-white/30 mr-2">Next:</span>
            <p className="text-xs text-white/40 truncate">{nextCard}</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        {advanceMode === 'manual' && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPrev}
              disabled={currentIndex === 0}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={goToNext}
              disabled={currentIndex >= bulletPoints.length - 1}
              className="bg-cyan-500/20 border-cyan-400/30 text-cyan-400 hover:bg-cyan-500/30"
            >
              Next
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </>
        )}

        {advanceMode === 'timer' && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-white/60">Seconds:</Label>
              <Input
                type="number"
                value={timerSeconds}
                onChange={(e) => setTimerSeconds(Math.max(5, parseInt(e.target.value) || 30))}
                className="w-16 h-8 text-xs bg-white/10 border-white/20 text-white"
                min={5}
                max={120}
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsTimerPaused(!isTimerPaused)}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              {isTimerPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </Button>
          </div>
        )}

        {advanceMode === 'voice' && (
          <div className="flex items-center gap-2 text-white/60">
            <div className={cn(
              "w-3 h-3 rounded-full",
              cooldownRef.current ? "bg-amber-400" : "bg-green-400 animate-pulse"
            )} />
            <span className="text-xs">
              {cooldownRef.current ? "Cooldown..." : "Listening for keywords..."}
            </span>
          </div>
        )}
      </div>

      {/* Keyboard hint for manual mode */}
      {advanceMode === 'manual' && (
        <p className="text-center text-[10px] text-white/30">
          Press <kbd className="px-1 py-0.5 rounded bg-white/10">Space</kbd> or <kbd className="px-1 py-0.5 rounded bg-white/10">→</kbd> to advance
        </p>
      )}
    </div>
  );
};
