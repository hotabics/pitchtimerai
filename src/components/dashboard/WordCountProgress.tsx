import { motion } from "framer-motion";
import { FileText, Check, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

const SPEAKING_RATE = 130; // words per minute

interface WordCountProgressProps {
  actualWordCount: number;
  targetDuration: number;
  className?: string;
}

export const WordCountProgress = ({
  actualWordCount,
  targetDuration,
  className,
}: WordCountProgressProps) => {
  const targetWordCount = Math.round(targetDuration * SPEAKING_RATE);
  const percentage = Math.min((actualWordCount / targetWordCount) * 100, 120);
  const diff = actualWordCount - targetWordCount;
  const diffPercent = Math.abs(diff) / targetWordCount * 100;
  
  // Determine status
  const isOnTarget = diffPercent <= 10;
  const isOver = diff > 0;
  const isUnder = diff < 0;
  const isCritical = diffPercent > 25;

  const getStatusColor = () => {
    if (isOnTarget) return "emerald";
    if (isCritical) return "red";
    return "amber";
  };

  const statusColor = getStatusColor();

  const colorClasses = {
    emerald: {
      bg: "bg-emerald-500",
      bgLight: "bg-emerald-500/10",
      text: "text-emerald-600",
      border: "border-emerald-500/30",
    },
    amber: {
      bg: "bg-amber-500",
      bgLight: "bg-amber-500/10",
      text: "text-amber-600",
      border: "border-amber-500/30",
    },
    red: {
      bg: "bg-red-500",
      bgLight: "bg-red-500/10",
      text: "text-red-600",
      border: "border-red-500/30",
    },
  };

  const colors = colorClasses[statusColor];

  const getStatusMessage = () => {
    if (isOnTarget) return "On target";
    if (isOver) return `${Math.abs(diff)} words over`;
    return `${Math.abs(diff)} words under`;
  };

  const getIcon = () => {
    if (isOnTarget) return Check;
    if (isOver) return TrendingUp;
    return TrendingDown;
  };

  const StatusIcon = getIcon();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-3 rounded-xl border transition-all",
        colors.bgLight,
        colors.border,
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Word Count</span>
        </div>
        <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", colors.bgLight, colors.text)}>
          <StatusIcon className="w-3 h-3" />
          <span>{getStatusMessage()}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 bg-muted rounded-full overflow-hidden mb-2">
        {/* Target indicator at 100% */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-foreground/30 z-10"
          style={{ left: `${Math.min(100 / 1.2, 83.33)}%` }}
        />
        
        {/* Actual progress */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percentage / 1.2, 100)}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={cn("absolute top-0 bottom-0 left-0 rounded-full", colors.bg)}
        />
      </div>

      {/* Labels */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          <span className="font-bold tabular-nums">{actualWordCount}</span>
          <span className="text-muted-foreground">words</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <span>Target:</span>
          <span className="font-medium tabular-nums">{targetWordCount}</span>
          <span>({targetDuration < 1 ? `${targetDuration * 60}s` : `${targetDuration}min`})</span>
        </div>
      </div>

      {/* Tip for off-target */}
      {!isOnTarget && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-2 pt-2 border-t border-border/50"
        >
          <div className="flex items-start gap-1.5">
            <AlertTriangle className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              {isOver 
                ? "Your script is longer than the target. Consider trimming some sections or choosing a longer duration."
                : "Your script is shorter than the target. You may want to expand your points or choose a shorter duration."
              }
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
