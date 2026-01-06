import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Zap } from "lucide-react";

interface TimeCounterProps {
  targetMinutes: number;
  isComplete?: boolean;
}

export const TimeCounter = ({ targetMinutes, isComplete = false }: TimeCounterProps) => {
  const [displayMinutes, setDisplayMinutes] = useState(900); // Start at 15h = 900min
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (displayMinutes === targetMinutes) return;

    setIsAnimating(true);
    const diff = displayMinutes - targetMinutes;
    const duration = Math.min(1500, Math.max(500, diff * 2));
    const steps = Math.min(60, Math.max(20, diff));
    const stepDuration = duration / steps;
    const stepSize = diff / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayMinutes(targetMinutes);
        setIsAnimating(false);
        clearInterval(interval);
      } else {
        setDisplayMinutes(Math.round(displayMinutes - stepSize * currentStep));
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [targetMinutes, displayMinutes]);

  const hours = Math.floor(displayMinutes / 60);
  const minutes = displayMinutes % 60;

  const getTimeColor = () => {
    if (displayMinutes <= 60) return "text-time-low";
    if (displayMinutes <= 360) return "text-time-medium";
    return "text-time-high";
  };

  const getBgColor = () => {
    if (displayMinutes <= 60) return "bg-success/10";
    if (displayMinutes <= 360) return "bg-warning/10";
    return "bg-destructive/10";
  };

  return (
    <motion.div
      layout
      className={`fixed top-0 left-0 right-0 z-50 ${getBgColor()} backdrop-blur-xl border-b border-border/50`}
    >
      <div className="max-w-lg mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div
              animate={isAnimating ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 0.5, repeat: isAnimating ? Infinity : 0, ease: "linear" }}
            >
              {isComplete ? (
                <Zap className="w-5 h-5 text-success fill-success" />
              ) : (
                <Clock className={`w-5 h-5 ${getTimeColor()}`} />
              )}
            </motion.div>
            <span className="text-sm font-medium text-muted-foreground">
              {isComplete ? "Time Saved" : "Estimated Time"}
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={displayMinutes}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`font-bold text-2xl tabular-nums ${getTimeColor()} ${
                isComplete ? "pulse-success rounded-full px-3 py-1" : ""
              }`}
            >
              {hours > 0 && <span>{hours}h </span>}
              <span>{minutes.toString().padStart(2, "0")}m</span>
            </motion.div>
          </AnimatePresence>
        </div>

        {!isComplete && (
          <motion.div
            className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="h-full gradient-time-saved rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${((900 - displayMinutes) / 870) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
