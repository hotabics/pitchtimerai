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
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={removable ? onRemove : onSelect}
      className={cn(
        "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border",
        selected
          ? "bg-primary text-primary-foreground border-primary shadow-md"
          : "bg-card text-foreground border-border hover:border-primary/50 hover:bg-primary/5"
      )}
    >
      {selected && !removable && <Check className="w-3.5 h-3.5" />}
      <span>{label}</span>
      {removable && (
        <X className="w-3.5 h-3.5 hover:text-destructive transition-colors" />
      )}
    </motion.button>
  );
};
