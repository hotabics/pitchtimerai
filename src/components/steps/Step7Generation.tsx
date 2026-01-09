import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles, FileText, Clock, Mic, CheckCircle, Loader2, FastForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WizardStep } from "@/components/WizardStep";
import { useState, useCallback, useMemo, useRef } from "react";
import { trackConfigs, TrackType } from "@/lib/tracks";
import { trackEvent } from "@/utils/analytics";
import { getSoundEnabled } from "@/utils/soundSettings";
import confetti from "canvas-confetti";

interface Step7GenerationProps {
  onNext: (tier: string, tierLabel: string) => void;
  onBack: () => void;
  track?: TrackType;
  idea?: string;
}

const generationSteps = [
  { id: "analyze", label: "Analyzing your inputs", duration: 1200 },
  { id: "structure", label: "Structuring your narrative", duration: 1500 },
  { id: "script", label: "Writing your script", duration: 2000 },
  { id: "timing", label: "Adding timing cues", duration: 800 },
  { id: "polish", label: "Polishing transitions", duration: 1000 },
];

// Play a success chime using Web Audio API
const playSuccessSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    
    // Create a pleasant two-tone chime
    const playTone = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + startTime);
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + startTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + startTime + duration);
      
      oscillator.start(audioContext.currentTime + startTime);
      oscillator.stop(audioContext.currentTime + startTime + duration);
    };
    
    // Two ascending tones for success
    playTone(523.25, 0, 0.2);     // C5
    playTone(659.25, 0.15, 0.3);  // E5
    playTone(783.99, 0.3, 0.4);   // G5
  } catch (e) {
    console.log("Audio not available:", e);
  }
};

// Trigger haptic feedback if available
const triggerHaptic = () => {
  if (navigator.vibrate) {
    navigator.vibrate([50, 30, 100]); // Short pattern
  }
};

// Fire confetti celebration
const fireConfetti = () => {
  const duration = 2000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899'],
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899'],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };
  frame();
};

export const Step7Generation = ({ onNext, onBack, track, idea }: Step7GenerationProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const skipRef = useRef(false);

  const trackConfig = track ? trackConfigs[track] : null;
  const trackName = trackConfig?.name || "Pitch";
  const outputSections = trackConfig?.outputStructure || [];

  // Calculate total and remaining time
  const totalDuration = useMemo(() => 
    generationSteps.reduce((sum, step) => sum + step.duration, 0), 
  []);
  
  const elapsedDuration = useMemo(() => 
    generationSteps
      .slice(0, completedSteps.length)
      .reduce((sum, step) => sum + step.duration, 0),
  [completedSteps.length]);
  
  const remainingTime = Math.ceil((totalDuration - elapsedDuration) / 1000);

  const handleSkipAnimation = useCallback(() => {
    skipRef.current = true;
  }, []);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setCurrentStep(0);
    setCompletedSteps([]);
    skipRef.current = false;

    // Track pitch generation start
    trackEvent('pitch_generation_started', { track, idea: idea?.slice(0, 100) });

    // Animate through generation steps
    for (let i = 0; i < generationSteps.length; i++) {
      if (skipRef.current) {
        // Skip remaining animation - complete all steps immediately
        setCompletedSteps(generationSteps.map(s => s.id));
        setCurrentStep(generationSteps.length - 1);
        break;
      }
      setCurrentStep(i);
      await new Promise((resolve) => setTimeout(resolve, generationSteps[i].duration));
      setCompletedSteps((prev) => [...prev, generationSteps[i].id]);
    }

    // Track pitch generation complete
    trackEvent('pitch_generation_completed', { 
      track, 
      sections_count: outputSections.length,
      skipped: skipRef.current,
    });

    // Play success feedback with confetti (only if sound is enabled)
    if (getSoundEnabled()) {
      playSuccessSound();
    }
    triggerHaptic();
    fireConfetti();

    // Small delay before navigating
    await new Promise((resolve) => setTimeout(resolve, skipRef.current ? 200 : 600));
    onNext("script", "Speech Only");
  }, [onNext, track, idea, outputSections.length]);

  return (
    <WizardStep
      title={isGenerating ? "Crafting Your Pitch" : "Ready to Generate"}
      subtitle={isGenerating ? "This will only take a moment..." : "Review what we'll create for you"}
    >
      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {!isGenerating ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col"
            >
              {/* Preview Card */}
              <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                {/* Header */}
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-7 h-7 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">
                      Your 3-Minute {trackName} Script
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {idea ? `"${idea.slice(0, 50)}${idea.length > 50 ? '...' : ''}"` : "Based on your inputs"}
                    </p>
                  </div>
                </div>

                {/* What's included */}
                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    What you'll get
                  </p>
                  <div className="grid gap-2">
                    <div className="flex items-center gap-3 text-sm">
                      <Mic className="w-4 h-4 text-primary" />
                      <span className="text-foreground">Full speech script with natural pauses</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="text-foreground">Timing markers for each section</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-foreground">Smooth transitions between topics</span>
                    </div>
                  </div>
                </div>

                {/* Script structure preview */}
                {outputSections.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Script Structure
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {outputSections.map((section, index) => (
                        <motion.span
                          key={section}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.1 + index * 0.03 }}
                          className="text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground"
                        >
                          {section}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1" />

              {/* Buttons */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-8 space-y-3"
              >
                <Button
                  variant="time"
                  size="xl"
                  onClick={handleGenerate}
                  className="w-full"
                >
                  <Sparkles className="w-5 h-5" />
                  Generate My Pitch
                </Button>
                <Button variant="ghost" onClick={onBack} className="w-full">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="generating"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center"
            >
              {/* Animated Icon */}
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-8"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-12 h-12 text-primary" />
                </motion.div>
              </motion.div>

              {/* Progress Steps */}
              <div className="w-full max-w-sm space-y-3">
                {generationSteps.map((step, index) => {
                  const isCompleted = completedSteps.includes(step.id);
                  const isCurrent = currentStep === index && !isCompleted;
                  const isPending = index > currentStep;

                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                        isCurrent ? "bg-primary/10" : isCompleted ? "bg-muted/50" : ""
                      }`}
                    >
                      <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                        {isCompleted ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          >
                            <CheckCircle className="w-5 h-5 text-primary" />
                          </motion.div>
                        ) : isCurrent ? (
                          <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                        )}
                      </div>
                      <span
                        className={`text-sm ${
                          isCompleted
                            ? "text-muted-foreground"
                            : isCurrent
                            ? "text-foreground font-medium"
                            : "text-muted-foreground/50"
                        }`}
                      >
                        {step.label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              {/* Progress bar with percentage and time estimate */}
              <div className="w-full max-w-sm mt-8 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <div className="flex items-center gap-3">
                    <motion.span 
                      key={remainingTime}
                      initial={{ opacity: 0.5 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-muted-foreground"
                    >
                      ~{remainingTime}s remaining
                    </motion.span>
                    <motion.span 
                      key={completedSteps.length}
                      initial={{ scale: 1.2, color: "hsl(var(--primary))" }}
                      animate={{ scale: 1, color: "hsl(var(--foreground))" }}
                      className="font-bold text-foreground"
                    >
                      {Math.round((completedSteps.length / generationSteps.length) * 100)}%
                    </motion.span>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{
                      width: `${((completedSteps.length) / generationSteps.length) * 100}%`,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {currentStep < generationSteps.length ? generationSteps[currentStep].label : "Completing..."}
                </p>
              </div>

              {/* Skip Animation Button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="mt-6"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkipAnimation}
                  className="text-muted-foreground hover:text-foreground gap-2"
                >
                  <FastForward className="w-4 h-4" />
                  Skip Animation
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </WizardStep>
  );
};
