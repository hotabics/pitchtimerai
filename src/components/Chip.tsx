import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChipProps {
  label: string;
  selected?: boolean;
  onSelect?: () => void;
  onRemove?: () => void;
  removable?: boolean;
}

export const Chip = ({
  label,
  selected = false,
  onSelect,
  onRemove,
  removable = false,
}: ChipProps) => {
  return (
    <motion.button
      whileHover={{ scale: 1.08, y: -2 }}
      whileTap={{ scale: 0.92 }}
      onClick={removable ? onRemove : onSelect}
      className={cn(
        "relative inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border overflow-hidden",
        selected
          ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30"
          : "bg-card text-foreground border-border hover:border-primary/50 hover:bg-accent hover:shadow-md"
      )}
    >
      {/* Selection glow effect */}
      {selected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        />
      )}
      
      <motion.span
        initial={false}
        animate={{ 
          width: selected && !removable ? "auto" : 0,
          opacity: selected && !removable ? 1 : 0,
          marginRight: selected && !removable ? 4 : 0
        }}
        className="overflow-hidden"
      >
        <Check className="w-3.5 h-3.5" />
      </motion.span>
      
      <span className="relative z-10">{label}</span>
      
      {removable && (
        <motion.span
          whileHover={{ rotate: 90, scale: 1.2 }}
          transition={{ duration: 0.2 }}
        >
          <X className="w-3.5 h-3.5 hover:text-destructive transition-colors" />
        </motion.span>
      )}
    </motion.button>
  );
};
