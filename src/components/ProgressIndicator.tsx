import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export const ProgressIndicator = ({ currentStep, totalSteps }: ProgressIndicatorProps) => {
  return (
    <div className="flex items-center justify-center gap-2 py-3">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        
        return (
          <div key={index} className="flex items-center">
            <motion.div
              initial={false}
              animate={{
                scale: isCurrent ? 1 : 0.85,
                backgroundColor: isCompleted 
                  ? "hsl(var(--time-low))" 
                  : isCurrent 
                    ? "hsl(var(--primary))" 
                    : "hsl(var(--muted))",
              }}
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.2, type: "spring", stiffness: 300 }}
              className="relative flex items-center justify-center rounded-full transition-colors"
              style={{
                width: isCurrent ? 32 : 12,
                height: isCurrent ? 32 : 12,
              }}
            >
              {isCompleted && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                </motion.div>
              )}
              {isCurrent && (
                <>
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs font-bold text-white"
                  >
                    {index + 1}
                  </motion.span>
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0, 0.8] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </>
              )}
            </motion.div>
            
            {index < totalSteps - 1 && (
              <motion.div
                className="h-0.5 mx-1 rounded-full overflow-hidden"
                style={{ width: 20 }}
              >
                <motion.div
                  className="h-full rounded-full"
                  initial={false}
                  animate={{
                    width: isCompleted ? "100%" : "0%",
                    backgroundColor: isCompleted 
                      ? "hsl(var(--time-low))" 
                      : "hsl(var(--muted))",
                  }}
                  transition={{ duration: 0.3 }}
                  style={{ background: isCompleted ? undefined : "hsl(var(--muted))" }}
                />
                <div 
                  className="h-full w-full -mt-0.5 bg-muted"
                  style={{ marginTop: "-2px" }}
                />
              </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );
};