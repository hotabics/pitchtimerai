import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Globe, Users, MessageSquare, FileText, Check, Sparkles, Lightbulb, AlertCircle, Wrench, Heart } from "lucide-react";
import { useState, useEffect } from "react";

interface AutoGenerateOverlayProps {
  isVisible: boolean;
  isUrlMode: boolean;
  inputValue: string;
  durationMinutes?: number;
  onComplete: () => void;
}

interface Step {
  id: string;
  label: string;
  icon: React.ElementType;
  duration: number; // milliseconds
  section?: string; // Optional section being created
}

const urlSteps: Step[] = [
  { id: 'scan', label: 'Scanning Website...', icon: Globe, duration: 1200 },
  { id: 'extract', label: 'Extracting Key Information...', icon: FileText, duration: 1000 },
  { id: 'hook', label: 'Crafting Your Hook...', icon: Sparkles, duration: 1200, section: 'Hook' },
  { id: 'problem', label: 'Defining The Problem...', icon: AlertCircle, duration: 1000, section: 'Problem' },
  { id: 'solution', label: 'Presenting Your Solution...', icon: Wrench, duration: 1200, section: 'Solution' },
  { id: 'close', label: 'Writing The Close...', icon: Heart, duration: 800, section: 'Close' },
];

const textSteps: Step[] = [
  { id: 'analyze', label: 'Analyzing Your Idea...', icon: Lightbulb, duration: 1000 },
  { id: 'hook', label: 'Crafting Your Hook...', icon: Sparkles, duration: 1200, section: 'Hook' },
  { id: 'problem', label: 'Defining The Problem...', icon: AlertCircle, duration: 1000, section: 'Problem' },
  { id: 'solution', label: 'Presenting Your Solution...', icon: Wrench, duration: 1200, section: 'Solution' },
  { id: 'close', label: 'Writing The Close...', icon: Heart, duration: 800, section: 'Close' },
];

export const AutoGenerateOverlay = ({ 
  isVisible, 
  isUrlMode, 
  inputValue,
  durationMinutes = 3,
  onComplete 
}: AutoGenerateOverlayProps) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const steps = isUrlMode ? urlSteps : textSteps;

  useEffect(() => {
    if (!isVisible) {
      setCurrentStepIndex(0);
      setCompletedSteps([]);
      return;
    }

    const runSteps = async () => {
      for (let i = 0; i < steps.length; i++) {
        setCurrentStepIndex(i);
        await new Promise(resolve => setTimeout(resolve, steps[i].duration));
        setCompletedSteps(prev => [...prev, steps[i].id]);
      }
      // Small delay before completing
      setTimeout(onComplete, 500);
    };

    runSteps();
  }, [isVisible, steps, onComplete]);

  const currentStep = steps[currentStepIndex];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md"
        >
          <div className="max-w-lg w-full mx-4">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center"
              >
                <Sparkles className="w-8 h-8 text-primary" />
              </motion.div>
              
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Auto-Generating Your Pitch
              </h2>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-3">
                {isUrlMode ? (
                  <>Extracting insights from <span className="text-primary font-medium break-all">{inputValue}</span></>
                ) : (
                  <>Creating the perfect pitch for <span className="text-primary font-medium">"{inputValue.slice(0, 50)}{inputValue.length > 50 ? '...' : ''}"</span></>
                )}
              </p>
              
              {/* Duration badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <span>⏱️</span>
                <span>{durationMinutes < 1 ? `${durationMinutes * 60}s` : `${durationMinutes} min`}</span>
                <span className="text-primary/60">•</span>
                <span className="text-primary/80">~{Math.round(durationMinutes * 130)} words</span>
              </div>
            </motion.div>

            {/* Current Section Preview */}
            {currentStep?.section && (
              <motion.div
                key={currentStep.section}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20"
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                  >
                    <currentStep.icon className="w-5 h-5" />
                  </motion.div>
                  <div>
                    <p className="text-xs text-muted-foreground">Currently writing</p>
                    <p className="text-lg font-bold text-foreground">{currentStep.section}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Steps Progress */}
            <div className="space-y-4">
              {steps.map((step, index) => {
                const isCompleted = completedSteps.includes(step.id);
                const isCurrent = index === currentStepIndex && !isCompleted;
                const isPending = index > currentStepIndex;
                const Icon = step.icon;

                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`
                      flex items-center gap-4 p-4 rounded-xl transition-all duration-300
                      ${isCompleted ? 'bg-success/10 border border-success/20' : ''}
                      ${isCurrent ? 'bg-primary/10 border border-primary/30' : ''}
                      ${isPending ? 'bg-muted/30 opacity-50' : ''}
                    `}
                  >
                    {/* Icon */}
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                      ${isCompleted ? 'bg-success text-success-foreground' : ''}
                      ${isCurrent ? 'bg-primary text-primary-foreground' : ''}
                      ${isPending ? 'bg-muted text-muted-foreground' : ''}
                    `}>
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : isCurrent ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>

                    {/* Label */}
                    <div className="flex-1">
                      <p className={`
                        font-medium
                        ${isCompleted ? 'text-success' : ''}
                        ${isCurrent ? 'text-foreground' : ''}
                        ${isPending ? 'text-muted-foreground' : ''}
                      `}>
                        {step.label}
                      </p>
                    </div>

                    {/* Status indicator */}
                    {isCurrent && (
                      <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-xs text-primary font-medium"
                      >
                        Processing...
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Progress bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8"
            >
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-success"
                  initial={{ width: '0%' }}
                  animate={{ 
                    width: `${((completedSteps.length) / steps.length) * 100}%` 
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-center text-xs text-muted-foreground mt-2">
                {completedSteps.length} of {steps.length} steps complete
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
