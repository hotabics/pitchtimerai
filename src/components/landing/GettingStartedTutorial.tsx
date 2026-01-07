import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Sparkles, Link2, Wand2, Mic, Target, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TutorialStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight?: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    icon: <Sparkles className="w-8 h-8" />,
    title: "Welcome to PitchDeck AI",
    description: "Your AI-powered pitch coach that helps you craft and deliver winning presentations in minutes, not hours.",
    highlight: "Let's take a quick tour!",
  },
  {
    icon: <Link2 className="w-8 h-8" />,
    title: "Magic Input",
    description: "Enter your project name, a brief description, or paste a URL. We'll automatically extract relevant information to build your pitch.",
    highlight: "URLs are auto-scraped!",
  },
  {
    icon: <Wand2 className="w-8 h-8" />,
    title: "Two Ways to Create",
    description: "Choose 'Customize Pitch' for full control over each step, or 'Auto-Generate ⚡' for an instant AI-crafted script.",
    highlight: "One click = full script",
  },
  {
    icon: <Target className="w-8 h-8" />,
    title: "Tailored for Your Audience",
    description: "Select your audience type - Hackathon Judges, Investors, Academics, or even Grandma - and we'll adapt your pitch accordingly.",
    highlight: "Different tracks, different tones",
  },
  {
    icon: <Mic className="w-8 h-8" />,
    title: "AI Speech Coach",
    description: "Practice with our teleprompter, get real-time feedback on eye contact, filler words, and pacing. Perfect your delivery!",
    highlight: "Real-time analysis",
  },
  {
    icon: <BarChart3 className="w-8 h-8" />,
    title: "Track Your Progress",
    description: "See how you improve over time with detailed analytics, WPM tracking, and personalized tips from the AI coach.",
    highlight: "Get better with each practice",
  },
];

interface GettingStartedTutorialProps {
  onComplete: () => void;
}

export const GettingStartedTutorial = ({ onComplete }: GettingStartedTutorialProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(() => {
      localStorage.setItem("pitchdeck-tutorial-completed", "true");
      onComplete();
    }, 300);
  };

  const handleSkip = () => {
    handleComplete();
  };

  const step = tutorialSteps[currentStep];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md"
        >
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.div
              className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-accent/10 blur-3xl"
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 4, repeat: Infinity, delay: 2 }}
            />
          </div>

          {/* Tutorial card */}
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg mx-4"
          >
            <div className="glass-premium rounded-3xl p-8 border border-white/20 shadow-2xl">
              {/* Close button */}
              <button
                onClick={handleSkip}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Skip tutorial"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>

              {/* Progress dots */}
              <div className="flex justify-center gap-2 mb-8">
                {tutorialSteps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentStep
                        ? "w-8 bg-primary"
                        : index < currentStep
                        ? "bg-primary/50"
                        : "bg-white/20"
                    }`}
                  />
                ))}
              </div>

              {/* Step content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="text-center"
                >
                  {/* Icon */}
                  <motion.div
                    className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/20 flex items-center justify-center text-primary"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {step.icon}
                  </motion.div>

                  {/* Title */}
                  <h2 className="text-2xl font-bold text-foreground mb-4">
                    {step.title}
                  </h2>

                  {/* Description */}
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {step.description}
                  </p>

                  {/* Highlight badge */}
                  {step.highlight && (
                    <motion.span
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      className="inline-block px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-medium"
                    >
                      {step.highlight}
                    </motion.span>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8">
                <Button
                  variant="ghost"
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className="gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>

                <span className="text-sm text-muted-foreground">
                  {currentStep + 1} / {tutorialSteps.length}
                </span>

                <Button onClick={handleNext} className="gap-2">
                  {currentStep === tutorialSteps.length - 1 ? (
                    "Get Started"
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>

              {/* Skip link */}
              <div className="text-center mt-4">
                <button
                  onClick={handleSkip}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Skip tutorial
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
