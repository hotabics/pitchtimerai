import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";

interface FloatingTutorialButtonProps {
  onClick: () => void;
}

export const FloatingTutorialButton = ({ onClick }: FloatingTutorialButtonProps) => {
  return (
    <motion.button
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 2, duration: 0.5 }}
      onClick={onClick}
      className="
        fixed left-0 top-1/2 -translate-y-1/2 z-50
        flex items-center gap-2
        bg-primary text-primary-foreground
        pl-3 pr-4 py-3
        rounded-r-xl
        shadow-lg shadow-primary/25
        hover:pl-4 hover:shadow-xl hover:shadow-primary/30
        transition-all duration-300
        group
      "
      aria-label="Open tutorial"
    >
      <HelpCircle className="w-5 h-5 group-hover:rotate-12 transition-transform" />
      <span className="text-sm font-medium whitespace-nowrap">
        Tutorial
      </span>
    </motion.button>
  );
};
