import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export const ProgressIndicator = ({ currentStep, totalSteps }: ProgressIndicatorProps) => {
  const progress = (currentStep / (totalSteps - 1)) * 100;
  
  return (
    <div className="w-full max-w-xs mx-auto px-4 py-2">
      {/* Progress bar */}
      <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-success rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
      
      {/* Step dots */}
      <div className="flex justify-between mt-2">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          
          return (
            <motion.div
              key={index}
              initial={false}
              animate={{
                scale: isCurrent ? 1.2 : 1,
              }}
              className="relative"
            >
              <motion.div
                className="flex items-center justify-center rounded-full transition-colors"
                animate={{
                  backgroundColor: isCompleted 
                    ? "hsl(var(--success))" 
                    : isCurrent 
                      ? "hsl(var(--primary))" 
                      : "hsl(var(--muted))",
                }}
                style={{
                  width: 20,
                  height: 20,
                }}
              >
                {isCompleted ? (
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                ) : (
                  <span className="text-[10px] font-bold text-white">{index + 1}</span>
                )}
              </motion.div>
              
              {isCurrent && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary/50"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
