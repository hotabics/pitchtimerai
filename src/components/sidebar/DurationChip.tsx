import { motion, AnimatePresence } from "framer-motion";
import { Timer, ChevronDown, Check } from "lucide-react";
import { useState } from "react";
import { DURATION_PRESETS, formatDurationLabel, getPresetInfo } from "@/hooks/usePitchDuration";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DurationChipProps {
  duration: number;
  onDurationChange?: (duration: number) => void;
  readonly?: boolean;
}

export const DurationChip = ({ duration, onDurationChange, readonly = false }: DurationChipProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const presetInfo = getPresetInfo(duration);

  const handleSelect = (value: number) => {
    onDurationChange?.(value);
    setIsOpen(false);
  };

  if (readonly) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary">
        <Timer className="w-3.5 h-3.5" />
        <span>{formatDurationLabel(duration)}</span>
      </div>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary hover:bg-primary/20 hover:border-primary/30 transition-colors"
        >
          <Timer className="w-3.5 h-3.5" />
          <span>{formatDurationLabel(duration)}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </motion.button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-56 p-2 bg-popover border border-border shadow-xl" 
        align="start"
        sideOffset={8}
      >
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground px-2 py-1">
            Pitch Duration
          </p>
          {DURATION_PRESETS.map((preset) => (
            <motion.button
              key={preset.value}
              whileHover={{ x: 2 }}
              onClick={() => handleSelect(preset.value)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                duration === preset.value
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-accent text-foreground'
              }`}
            >
              <div className="flex flex-col items-start">
                <span className="font-medium">{preset.label}</span>
                <span className="text-xs text-muted-foreground">{preset.description}</span>
              </div>
              <AnimatePresence>
                {duration === preset.value && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                  >
                    <Check className="w-4 h-4 text-primary" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
