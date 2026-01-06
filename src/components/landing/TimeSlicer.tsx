import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface TimeSlicerProps {
  className?: string;
}

export const TimeSlicer = ({ className }: TimeSlicerProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showAfter, setShowAfter] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(true);
      setTimeout(() => setShowAfter(true), 300);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
        Pitch Preparation Time
      </div>
      
      <div className="flex items-center gap-4 md:gap-8">
        {/* Before */}
        <motion.div 
          className="flex flex-col items-center"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-xs text-muted-foreground mb-2">Average</div>
          <div className="flex items-baseline gap-1">
            <TimeDigit value="1" delay={0} highlight="high" />
            <TimeDigit value="5" delay={0.1} highlight="high" />
            <span className="text-time-high text-xl font-bold mx-1">h</span>
            <TimeDigit value="0" delay={0.2} highlight="high" />
            <TimeDigit value="0" delay={0.3} highlight="high" />
            <span className="text-time-high text-xl font-bold ml-1">m</span>
          </div>
        </motion.div>

        {/* Arrow */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="flex items-center"
        >
          <div className="w-12 h-[2px] bg-gradient-to-r from-time-high to-time-low" />
          <ArrowRight className="w-5 h-5 text-time-low -ml-1" />
        </motion.div>

        {/* After */}
        <motion.div 
          className="flex flex-col items-center"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <div className="text-xs text-muted-foreground mb-2">With Us</div>
          <AnimatePresence mode="wait">
            {showAfter ? (
              <motion.div 
                key="after"
                className="flex items-baseline gap-1"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <TimeDigit value="0" delay={0} highlight="low" animate />
                <span className="text-time-low text-xl font-bold mx-1">h</span>
                <TimeDigit value="3" delay={0.1} highlight="low" animate />
                <TimeDigit value="0" delay={0.2} highlight="low" animate />
                <span className="text-time-low text-xl font-bold ml-1">m</span>
              </motion.div>
            ) : (
              <motion.div 
                key="placeholder"
                className="flex items-baseline gap-1"
              >
                <TimeDigit value="?" delay={0} highlight="medium" />
                <span className="text-time-medium text-xl font-bold mx-1">h</span>
                <TimeDigit value="?" delay={0} highlight="medium" />
                <TimeDigit value="?" delay={0} highlight="medium" />
                <span className="text-time-medium text-xl font-bold ml-1">m</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

interface TimeDigitProps {
  value: string;
  delay?: number;
  highlight: "high" | "medium" | "low";
  animate?: boolean;
}

const TimeDigit = ({ value, delay = 0, highlight, animate }: TimeDigitProps) => {
  const colorClass = {
    high: "text-time-high bg-time-high/10 border-time-high/20",
    medium: "text-time-medium bg-time-medium/10 border-time-medium/20",
    low: "text-time-low bg-time-low/10 border-time-low/20",
  }[highlight];

  return (
    <motion.span
      initial={animate ? { y: -20, opacity: 0 } : undefined}
      animate={animate ? { y: 0, opacity: 1 } : undefined}
      transition={{ delay, type: "spring", stiffness: 400, damping: 20 }}
      className={`inline-flex items-center justify-center w-10 h-12 md:w-12 md:h-14 text-2xl md:text-3xl font-bold rounded-lg border ${colorClass} tabular-nums`}
    >
      {value}
    </motion.span>
  );
};
