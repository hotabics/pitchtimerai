import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Settings, Link2, Sparkles, FileText, Users, Clock, Target, CheckCircle2, ArrowRight, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

const fastTrackSteps = [
  { icon: Link2, label: "Paste URL or Idea", duration: 800 },
  { icon: Sparkles, label: "AI Scrapes & Analyzes", duration: 1200 },
  { icon: FileText, label: "Script Generated!", duration: 1000 },
];

const customizeSteps = [
  { icon: Link2, label: "Paste URL or Idea", duration: 800 },
  { icon: Users, label: "Choose Audience", duration: 1000 },
  { icon: Clock, label: "Set Duration", duration: 800 },
  { icon: Target, label: "Fine-tune Details", duration: 1000 },
  { icon: FileText, label: "Tailored Script!", duration: 800 },
];

interface PathCardProps {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  steps: typeof fastTrackSteps;
  accentColor: string;
}

const PathCard = ({ title, subtitle, icon: TitleIcon, steps, accentColor }: PathCardProps) => {
  const [activeStep, setActiveStep] = useState(-1);
  const [isComplete, setIsComplete] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const runAnimation = useCallback(() => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    setIsComplete(false);
    setActiveStep(0);
    
    let currentStep = 0;
    
    const runSteps = () => {
      if (currentStep < steps.length - 1) {
        setTimeout(() => {
          currentStep++;
          setActiveStep(currentStep);
          runSteps();
        }, steps[currentStep].duration);
      } else {
        setTimeout(() => {
          setIsComplete(true);
          setIsPlaying(false);
        }, steps[currentStep].duration);
      }
    };

    runSteps();
  }, [steps, isPlaying]);

  const resetAnimation = () => {
    setActiveStep(-1);
    setIsComplete(false);
    setIsPlaying(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="relative p-6 rounded-2xl glass-premium border border-white/10 overflow-hidden"
    >
      {/* Accent glow */}
      <div 
        className="absolute top-0 left-0 right-0 h-1 opacity-80"
        style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${accentColor}20` }}
          >
            <TitleIcon className="w-5 h-5" style={{ color: accentColor }} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        {/* Play/Reset Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={isComplete ? resetAnimation : runAnimation}
          disabled={isPlaying}
          className="h-8 px-3 text-xs"
        >
          {isComplete ? (
            <>
              <RotateCcw className="w-3 h-3 mr-1" />
              Replay
            </>
          ) : isPlaying ? (
            <span className="flex items-center gap-1">
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: accentColor }}
              />
              Running...
            </span>
          ) : (
            <>
              <Play className="w-3 h-3 mr-1" />
              Start
            </>
          )}
        </Button>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = activeStep === index;
          const isPast = activeStep > index || isComplete;

          return (
            <motion.div
              key={index}
              className={`
                flex items-center gap-3 p-3 rounded-xl transition-all duration-300
                ${isActive ? 'bg-white/10' : isPast ? 'bg-white/5' : 'bg-transparent'}
              `}
              animate={{
                scale: isActive ? 1.02 : 1,
                x: isActive ? 4 : 0,
              }}
            >
              <div 
                className={`
                  w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300
                  ${isPast ? 'bg-emerald-500/20' : isActive ? 'bg-white/20' : 'bg-white/5'}
                `}
              >
                <AnimatePresence mode="wait">
                  {isPast ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="icon"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <StepIcon 
                        className={`w-4 h-4 transition-colors duration-300 ${isActive ? 'text-foreground' : 'text-muted-foreground/60'}`}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <span className={`text-sm transition-colors duration-300 ${isActive ? 'text-foreground font-medium' : isPast ? 'text-muted-foreground' : 'text-muted-foreground/40'}`}>
                {step.label}
              </span>

              {isActive && (
                <motion.div
                  className="ml-auto"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <div className="w-2 h-2 rounded-full" style={{ background: accentColor }} />
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Completion badge */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            className="mt-4 p-3 rounded-xl text-center"
            style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}30` }}
          >
            <span className="text-sm font-medium" style={{ color: accentColor }}>
              ✨ Ready to present!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Initial state hint */}
      {activeStep === -1 && !isPlaying && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-center text-xs text-muted-foreground/60"
        >
          Click "Start" to see the flow
        </motion.p>
      )}
    </motion.div>
  );
};

export const PathComparisonDemo = () => {
  return (
    <section className="py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-2">
            Two paths, one goal: a{" "}
            <span className="text-primary">winning pitch</span>
          </h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Choose speed or precision — tap "Start" to see how each flow works
          </p>
        </motion.div>

        {/* Path cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <PathCard
            title="Auto-Generate"
            subtitle="~30 seconds • Best for quick demos"
            icon={Zap}
            steps={fastTrackSteps}
            accentColor="hsl(45, 93%, 47%)"
          />
          <PathCard
            title="Customize Pitch"
            subtitle="~2 minutes • Tailored for your audience"
            icon={Settings}
            steps={customizeSteps}
            accentColor="hsl(160, 84%, 39%)"
          />
        </div>

        {/* Hint text */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-muted-foreground mt-6 flex items-center justify-center gap-2"
        >
          <ArrowRight className="w-3 h-3" />
          Both paths lead to the AI Coach for practice
        </motion.p>
      </div>
    </section>
  );
};
