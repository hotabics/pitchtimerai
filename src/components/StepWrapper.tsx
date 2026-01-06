import { motion } from "framer-motion";
import { ReactNode } from "react";

interface StepWrapperProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export const StepWrapper = ({ children, title, subtitle }: StepWrapperProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="flex flex-col min-h-[calc(100vh-80px)] pt-24 pb-8 px-4"
    >
      <div className="max-w-lg mx-auto w-full flex-1 flex flex-col">
        {(title || subtitle) && (
          <div className="mb-6">
            {title && (
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="text-2xl font-bold text-foreground"
              >
                {title}
              </motion.h1>
            )}
            {subtitle && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.3 }}
                className="mt-2 text-muted-foreground"
              >
                {subtitle}
              </motion.p>
            )}
          </div>
        )}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex-1 flex flex-col"
        >
          {children}
        </motion.div>
      </div>
    </motion.div>
  );
};
