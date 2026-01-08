import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WizardStep } from "@/components/WizardStep";

interface Step7GenerationProps {
  onNext: (tier: string, tierLabel: string) => void;
  onBack: () => void;
}

export const Step7Generation = ({ onNext, onBack }: Step7GenerationProps) => {
  const handleNext = () => {
    onNext("script", "Speech Only");
  };

  return (
    <WizardStep
      title="Ready to Generate"
      subtitle="Your pitch script will be created based on your inputs"
    >
      <div className="flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1 flex items-center justify-center"
        >
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <p className="text-muted-foreground max-w-sm">
              Click below to generate your AI-powered pitch script with timing cues and transitions.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-8 space-y-3"
        >
          <Button
            variant="time"
            size="xl"
            onClick={handleNext}
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
      </div>
    </WizardStep>
  );
};
