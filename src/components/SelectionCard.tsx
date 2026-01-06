import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectionCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export const SelectionCard = ({
  title,
  description,
  icon,
  selected = false,
  onClick,
  className,
}: SelectionCardProps) => {
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={cn(
        "relative w-full p-4 rounded-xl border-2 text-left transition-all duration-200",
        selected
          ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
          : "border-border bg-card hover:border-primary/50 hover:shadow-md hover:bg-accent/50",
        className
      )}
    >
      {/* Ripple effect on selection */}
      {selected && (
        <motion.div
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 rounded-xl bg-primary pointer-events-none"
          style={{ transformOrigin: "center" }}
        />
      )}
      
      <div className="relative flex items-start gap-3">
        {icon && (
          <motion.div 
            animate={{ 
              rotate: selected ? [0, -10, 10, 0] : 0,
              scale: selected ? [1, 1.1, 1] : 1
            }}
            transition={{ duration: 0.3 }}
            className={cn(
              "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-200",
              selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}
          >
            {icon}
          </motion.div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base text-foreground">
            {title}
          </h3>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}
        </div>
        <motion.div
          initial={false}
          animate={{ 
            scale: selected ? 1 : 0,
            rotate: selected ? 0 : -180
          }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          className="flex-shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
        >
          <Check className="w-4 h-4 text-primary-foreground" />
        </motion.div>
      </div>
    </motion.button>
  );
};
