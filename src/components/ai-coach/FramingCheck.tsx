// Framing Check - Silhouette overlay for body positioning

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle, User, Hand, PersonStanding } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FramingCheckProps {
  stream: MediaStream | null;
  onProceed: () => void;
  onSkip: () => void;
}

export const FramingCheck = ({ stream, onProceed, onSkip }: FramingCheckProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFramed, setIsFramed] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Auto-proceed after 3 second countdown when framed
  useEffect(() => {
    if (countdown === null) return;
    
    if (countdown === 0) {
      onProceed();
      return;
    }
    
    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [countdown, onProceed]);

  const handleConfirmFraming = () => {
    setIsFramed(true);
    setCountdown(3);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Position Yourself for Full Body Tracking</h2>
        <p className="text-muted-foreground">
          Step back so we can see your torso and hands (waist-up view)
        </p>
      </div>

      {/* Video with silhouette overlay */}
      <div className="relative aspect-video bg-black rounded-xl overflow-hidden border-2 border-primary/30">
        {/* Video feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover scale-x-[-1]"
        />

        {/* Silhouette guide overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Semi-transparent overlay */}
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Outer mask - darken edges */}
            <defs>
              <mask id="silhouetteMask">
                <rect width="100" height="100" fill="white" />
                {/* Silhouette cutout - upper body */}
                <ellipse cx="50" cy="30" rx="12" ry="15" fill="black" /> {/* Head */}
                <rect x="30" y="40" width="40" height="35" rx="5" fill="black" /> {/* Torso */}
                <rect x="20" y="42" width="12" height="25" rx="3" fill="black" /> {/* Left arm */}
                <rect x="68" y="42" width="12" height="25" rx="3" fill="black" /> {/* Right arm */}
              </mask>
            </defs>
            
            {/* Dark overlay with silhouette cut out */}
            <rect 
              width="100" 
              height="100" 
              fill="rgba(0,0,0,0.5)" 
              mask="url(#silhouetteMask)"
            />
            
            {/* Silhouette outline */}
            <ellipse 
              cx="50" cy="30" rx="12" ry="15" 
              fill="none" 
              stroke="rgba(34, 211, 238, 0.8)" 
              strokeWidth="0.5"
              strokeDasharray="2 1"
            />
            <rect 
              x="30" y="40" width="40" height="35" rx="5" 
              fill="none" 
              stroke="rgba(34, 211, 238, 0.8)" 
              strokeWidth="0.5"
              strokeDasharray="2 1"
            />
            <rect 
              x="20" y="42" width="12" height="25" rx="3" 
              fill="none" 
              stroke="rgba(251, 146, 60, 0.8)" 
              strokeWidth="0.5"
              strokeDasharray="2 1"
            />
            <rect 
              x="68" y="42" width="12" height="25" rx="3" 
              fill="none" 
              stroke="rgba(251, 146, 60, 0.8)" 
              strokeWidth="0.5"
              strokeDasharray="2 1"
            />
          </svg>

          {/* Guide labels */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 text-xs font-medium">
            Align your head here
          </div>
          <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg bg-orange-500/20 border border-orange-500/50 text-orange-400 text-xs font-medium flex items-center gap-1">
            <Hand className="w-3 h-3" />
            Show hands
          </div>
          <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-lg bg-orange-500/20 border border-orange-500/50 text-orange-400 text-xs font-medium flex items-center gap-1">
            <Hand className="w-3 h-3" />
            Show hands
          </div>
        </div>

        {/* Countdown overlay */}
        <AnimatePresence>
          {countdown !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/60"
            >
              <motion.div
                key={countdown}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                className="text-8xl font-bold text-white"
              >
                {countdown === 0 ? (
                  <Check className="w-24 h-24 text-green-400" />
                ) : (
                  countdown
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Checklist */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
          <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center">
            <User className="w-5 h-5 text-cyan-500" />
          </div>
          <div>
            <p className="font-medium text-sm">Head & Face</p>
            <p className="text-xs text-muted-foreground">Center in frame</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
          <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
            <PersonStanding className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <p className="font-medium text-sm">Torso</p>
            <p className="text-xs text-muted-foreground">Shoulders visible</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
          <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
            <Hand className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="font-medium text-sm">Hands</p>
            <p className="text-xs text-muted-foreground">Keep visible, open</p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" onClick={onSkip}>
          Skip Framing Check
        </Button>
        <Button 
          size="lg" 
          onClick={handleConfirmFraming}
          disabled={countdown !== null}
          className="px-8"
        >
          <Check className="w-5 h-5 mr-2" />
          I&apos;m Framed Correctly
        </Button>
      </div>

      {/* Tip */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
        <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-primary">Pro Tip</p>
          <p className="text-muted-foreground">
            Standing 3-4 feet from your camera gives the best full-body tracking. 
            Make sure your hands can move freely without leaving the frame.
          </p>
        </div>
      </div>
    </motion.div>
  );
};
