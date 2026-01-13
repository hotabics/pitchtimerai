import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ChevronDown, Zap, Users, Briefcase, Timer, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface DurationPreset {
  value: number;
  label: string;
  description: string;
  icon: typeof Clock;
  category: "quick" | "standard" | "extended";
  wordCount: number;
}

const SPEAKING_RATE = 130; // words per minute

const DURATION_PRESETS: DurationPreset[] = [
  { 
    value: 0.5, 
    label: "30 sec", 
    description: "Elevator Pitch",
    icon: Zap,
    category: "quick",
    wordCount: Math.round(0.5 * SPEAKING_RATE)
  },
  { 
    value: 1, 
    label: "1 min", 
    description: "Quick Intro",
    icon: Timer,
    category: "quick",
    wordCount: Math.round(1 * SPEAKING_RATE)
  },
  { 
    value: 2, 
    label: "2 min", 
    description: "Standard Pitch",
    icon: Clock,
    category: "standard",
    wordCount: Math.round(2 * SPEAKING_RATE)
  },
  { 
    value: 3, 
    label: "3 min", 
    description: "Hackathon Demo",
    icon: Sparkles,
    category: "standard",
    wordCount: Math.round(3 * SPEAKING_RATE)
  },
  { 
    value: 5, 
    label: "5 min", 
    description: "Demo Day",
    icon: Users,
    category: "extended",
    wordCount: Math.round(5 * SPEAKING_RATE)
  },
  { 
    value: 10, 
    label: "10 min", 
    description: "Investor Meeting",
    icon: Briefcase,
    category: "extended",
    wordCount: Math.round(10 * SPEAKING_RATE)
  },
];

interface DurationSelectorProps {
  currentDuration: number;
  actualWordCount?: number;
  onDurationChange: (duration: number) => void;
  isRegenerating?: boolean;
}

export const DurationSelector = ({
  currentDuration,
  actualWordCount,
  onDurationChange,
  isRegenerating,
}: DurationSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const currentPreset = DURATION_PRESETS.find(p => p.value === currentDuration);
  const targetWordCount = Math.round(currentDuration * SPEAKING_RATE);
  
  // Calculate how close actual is to target
  const wordDiff = actualWordCount ? actualWordCount - targetWordCount : 0;
  const isOnTarget = Math.abs(wordDiff) <= targetWordCount * 0.1;
  
  const formatDuration = (minutes: number) => {
    if (minutes < 1) return `${minutes * 60}s`;
    return `${minutes} min`;
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isRegenerating}
          className={cn(
            "gap-2 h-8 px-3 font-medium transition-all",
            "hover:bg-primary/5 hover:border-primary/30",
            isOpen && "border-primary/50 bg-primary/5"
          )}
        >
          <motion.div
            animate={isRegenerating ? { rotate: 360 } : { rotate: 0 }}
            transition={isRegenerating ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
          >
            <Clock className="w-3.5 h-3.5 text-primary" />
          </motion.div>
          <span className="text-xs">
            {formatDuration(currentDuration)}
          </span>
          {actualWordCount && (
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full",
              isOnTarget 
                ? "bg-emerald-500/10 text-emerald-600" 
                : "bg-amber-500/10 text-amber-600"
            )}>
              ~{actualWordCount}w
            </span>
          )}
          <ChevronDown className={cn(
            "w-3 h-3 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )} />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-64 p-2">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal px-2 pb-2">
          Change pitch duration (regenerates script)
        </DropdownMenuLabel>
        
        {/* Quick Pitches */}
        <div className="mb-2">
          <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Quick Pitches
          </div>
          {DURATION_PRESETS.filter(p => p.category === "quick").map((preset) => (
            <DropdownMenuItem
              key={preset.value}
              onClick={() => {
                if (preset.value !== currentDuration) {
                  onDurationChange(preset.value);
                }
                setIsOpen(false);
              }}
              className={cn(
                "flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer",
                preset.value === currentDuration && "bg-primary/10"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                preset.value === currentDuration 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted"
              )}>
                <preset.icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{preset.label}</span>
                  {preset.value === currentDuration && (
                    <span className="text-[10px] text-primary font-medium">Current</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {preset.description} • ~{preset.wordCount} words
                </span>
              </div>
            </DropdownMenuItem>
          ))}
        </div>
        
        <DropdownMenuSeparator />
        
        {/* Standard Pitches */}
        <div className="mb-2">
          <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Standard Pitches
          </div>
          {DURATION_PRESETS.filter(p => p.category === "standard").map((preset) => (
            <DropdownMenuItem
              key={preset.value}
              onClick={() => {
                if (preset.value !== currentDuration) {
                  onDurationChange(preset.value);
                }
                setIsOpen(false);
              }}
              className={cn(
                "flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer",
                preset.value === currentDuration && "bg-primary/10"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                preset.value === currentDuration 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted"
              )}>
                <preset.icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{preset.label}</span>
                  {preset.value === currentDuration && (
                    <span className="text-[10px] text-primary font-medium">Current</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {preset.description} • ~{preset.wordCount} words
                </span>
              </div>
            </DropdownMenuItem>
          ))}
        </div>
        
        <DropdownMenuSeparator />
        
        {/* Extended Pitches */}
        <div>
          <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Extended Presentations
          </div>
          {DURATION_PRESETS.filter(p => p.category === "extended").map((preset) => (
            <DropdownMenuItem
              key={preset.value}
              onClick={() => {
                if (preset.value !== currentDuration) {
                  onDurationChange(preset.value);
                }
                setIsOpen(false);
              }}
              className={cn(
                "flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer",
                preset.value === currentDuration && "bg-primary/10"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                preset.value === currentDuration 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted"
              )}>
                <preset.icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{preset.label}</span>
                  {preset.value === currentDuration && (
                    <span className="text-[10px] text-primary font-medium">Current</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {preset.description} • ~{preset.wordCount} words
                </span>
              </div>
            </DropdownMenuItem>
          ))}
        </div>
        
        {/* Footer tip */}
        <div className="mt-2 pt-2 border-t border-border">
          <p className="text-[10px] text-muted-foreground px-2">
            💡 Tip: 130 words ≈ 1 minute of speaking
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
