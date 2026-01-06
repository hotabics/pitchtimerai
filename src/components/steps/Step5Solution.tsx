import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectionCard } from "@/components/SelectionCard";
import { StepWrapper } from "@/components/StepWrapper";
import { useState } from "react";

interface Step5SolutionProps {
  idea: string;
  onNext: (pitch: string) => void;
}

const generatePitches = (idea: string) => [
  {
    id: "1",
    title: "The Uber Model",
    pitch: `Think of it as "Uber for ${idea}" — we connect demand with supply in real-time, making access instant and seamless.`,
  },
  {
    id: "2",
    title: "The Airbnb Model",
    pitch: `We're building "Airbnb for ${idea}" — unlocking unused resources and creating value for both providers and users.`,
  },
  {
    id: "3",
    title: "The Slack Model",
    pitch: `Imagine "Slack for ${idea}" — a central hub that replaces fragmented tools with one intuitive platform.`,
  },
];

export const Step5Solution = ({ idea, onNext }: Step5SolutionProps) => {
  const [selected, setSelected] = useState("");
  const pitches = generatePitches(idea);

  const handleNext = () => {
    const pitch = pitches.find((p) => p.id === selected);
    if (pitch) onNext(pitch.pitch);
  };

  return (
    <StepWrapper
      title="Your Elevator Pitch"
      subtitle="Choose the analogy that fits best"
    >
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
          <Sparkles className="w-4 h-4 text-warning" />
          <span>AI-crafted pitch variations</span>
        </div>

        <div className="space-y-3 flex-1">
          {pitches.map((pitch, index) => (
            <motion.div
              key={pitch.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
            >
              <SelectionCard
                title={pitch.title}
                description={pitch.pitch}
                selected={selected === pitch.id}
                onClick={() => setSelected(pitch.id)}
              />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <Button
            variant="default"
            size="lg"
            onClick={handleNext}
            disabled={!selected}
            className="w-full"
          >
            Lock In Pitch
            <ArrowRight className="w-5 h-5" />
          </Button>
        </motion.div>
      </div>
    </StepWrapper>
  );
};
