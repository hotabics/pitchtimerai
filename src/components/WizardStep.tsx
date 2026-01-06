import { motion } from "framer-motion";
import { ReactNode } from "react";

interface WizardStepProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export const WizardStep = ({ children, title, subtitle }: WizardStepProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="min-h-[calc(100vh-3.5rem)] flex flex-col p-6 lg:p-10 pb-24 lg:pb-10"
    >
      <div className="max-w-2xl w-full mx-auto flex-1 flex flex-col">
        <div className="mb-8">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl lg:text-3xl font-bold text-foreground"
          >
            {title}
          </motion.h1>
          {subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mt-2 text-muted-foreground"
            >
              {subtitle}
            </motion.p>
          )}
        </div>

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
