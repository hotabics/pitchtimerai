import { motion, AnimatePresence } from "framer-motion";
import { Clock, FileText, Users, Presentation, AlertCircle, Lightbulb, DollarSign, Package, ChevronUp, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

export interface BriefData {
  projectName?: string;
  description?: string;
  audience?: string;
  audienceLabel?: string;
  demoStyle?: string;
  demoLabel?: string;
  problem?: string;
  solution?: string;
  monetization?: string[];
  generationTier?: string;
  prepTime?: number;
}

// Hook for smooth counting animation
const useCountUp = (target: number, duration: number = 1000) => {
  const [current, setCurrent] = useState(target);
  const prevTarget = useRef(target);

  useEffect(() => {
    if (prevTarget.current === target) return;
    
    const startValue = prevTarget.current;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const newValue = Math.round(startValue + (target - startValue) * easeOut);
      
      setCurrent(newValue);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevTarget.current = target;
      }
    };
    
    requestAnimationFrame(animate);
  }, [target, duration]);

  return current;
};

interface ProjectBriefProps {
  data: BriefData;
  currentStep: number;
}

const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins.toString().padStart(2, "0")}m`;
  }
  return `${mins}m`;
};

const BriefItem = ({
  icon: Icon,
  label,
  value,
  delay = 0,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.3 }}
    className="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0"
  >
    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
      <Icon className="w-4 h-4 text-primary" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className="text-sm text-foreground mt-0.5 truncate">{value}</p>
    </div>
  </motion.div>
);

export const ProjectBrief = ({ data, currentStep }: ProjectBriefProps) => {
  const isMobile = useIsMobile();
  const [isExpanded, setIsExpanded] = useState(false);

  const prepTime = data.prepTime || 315; // Default 5h 15m (Manual Grind time)
  const animatedPrepTime = useCountUp(prepTime, 800);
  const isFinalTime = prepTime <= 30;
  const hasData = data.projectName || data.audience || data.demoStyle || data.problem || data.solution;

  const briefItems = [
    data.projectName && { icon: FileText, label: "Project", value: data.projectName },
    data.audienceLabel && { icon: Users, label: "Audience", value: data.audienceLabel },
    data.demoLabel && { icon: Presentation, label: "Demo Style", value: data.demoLabel },
    data.problem && { icon: AlertCircle, label: "Problem", value: data.problem.slice(0, 60) + (data.problem.length > 60 ? "..." : "") },
    data.solution && { icon: Lightbulb, label: "Solution", value: data.solution.slice(0, 60) + (data.solution.length > 60 ? "..." : "") },
    data.monetization?.length && { icon: DollarSign, label: "Monetization", value: data.monetization.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(", ") },
    data.generationTier && { icon: Package, label: "Package", value: data.generationTier },
  ].filter(Boolean) as { icon: React.ElementType; label: string; value: string }[];

  // Mobile drawer version
  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <motion.div
          layout
          className="bg-background/95 backdrop-blur-xl border-t border-border/50 shadow-lg"
        >
          {/* Always visible header */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full px-4 py-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
                isFinalTime 
                  ? 'bg-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.4)]' 
                  : 'bg-gradient-to-br from-primary/20 to-primary/10'
              }`}>
                <Clock className={`w-5 h-5 transition-colors duration-500 ${isFinalTime ? 'text-emerald-400' : 'text-primary'}`} />
              </div>
              <div className="text-left">
                <p className="text-xs text-muted-foreground">Prep Time</p>
                <p className={`text-lg font-bold tabular-nums transition-all duration-500 ${
                  isFinalTime 
                    ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]' 
                    : 'text-time-low'
                }`}>{formatTime(animatedPrepTime)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {briefItems.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {briefItems.length} items
                </span>
              )}
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </button>

          {/* Expandable content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 max-h-[50vh] overflow-y-auto">
                  <div className="space-y-1">
                    {briefItems.map((item, index) => (
                      <BriefItem
                        key={item.label}
                        icon={item.icon}
                        label={item.label}
                        value={item.value}
                        delay={index * 0.05}
                      />
                    ))}
                  </div>
                  {briefItems.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Start filling in your project details...
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }

  // Desktop sidebar version
  return (
    <aside className="hidden lg:block w-[35%] max-w-md border-l border-border/50 bg-muted/30">
      <div className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto p-6">
        {/* Header with Time Counter */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-foreground">Project Brief</h2>
            <span className="text-xs text-muted-foreground">Step {currentStep}/7</span>
          </div>

          {/* Time Counter Card */}
          <motion.div
            layout
            className={`p-4 rounded-xl border transition-all duration-500 ${
              isFinalTime 
                ? 'bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-transparent border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.3)]' 
                : 'bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 ${
                isFinalTime 
                  ? 'bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                  : 'bg-primary/10'
              }`}>
                <Clock className={`w-6 h-6 transition-colors duration-500 ${isFinalTime ? 'text-emerald-400' : 'text-primary'}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Prep Time</p>
                <motion.p
                  key={animatedPrepTime}
                  initial={{ scale: 1.1, opacity: 0.8 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`text-2xl font-bold tabular-nums transition-all duration-500 ${
                    isFinalTime 
                      ? 'text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.7)]' 
                      : 'text-time-low'
                  }`}
                >
                  {formatTime(animatedPrepTime)}
                </motion.p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Flight Plan / Receipt Style List */}
        <div className="space-y-1">
          <AnimatePresence mode="popLayout">
            {briefItems.map((item, index) => (
              <BriefItem
                key={item.label}
                icon={item.icon}
                label={item.label}
                value={item.value}
                delay={index * 0.05}
              />
            ))}
          </AnimatePresence>
        </div>

        {briefItems.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Your project details will appear here as you fill them in...
            </p>
          </motion.div>
        )}

        {/* Decorative receipt footer */}
        {briefItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 pt-4 border-t border-dashed border-border"
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Items collected</span>
              <span className="font-mono">{briefItems.length} / 7</span>
            </div>
          </motion.div>
        )}
      </div>
    </aside>
  );
};
