import { motion } from "framer-motion";
import { Clock, Users, Briefcase, Heart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { SelectionCard } from "@/components/SelectionCard";
import { StepWrapper } from "@/components/StepWrapper";
import { useState } from "react";

interface Step2SpecsProps {
  onNext: (specs: { duration: number; audience: string }) => void;
}

const audiences = [
  { id: "judges", label: "Technical Judges", description: "Industry experts evaluating innovation", icon: <Briefcase className="w-5 h-5" /> },
  { id: "team", label: "Team Members", description: "Internal alignment and collaboration", icon: <Users className="w-5 h-5" /> },
  { id: "nontech", label: "Non-Technical Audience", description: "Investors, users, and general public", icon: <Heart className="w-5 h-5" /> },
];

export const Step2Specs = ({ onNext }: Step2SpecsProps) => {
  const [duration, setDuration] = useState([3]);
  const [audience, setAudience] = useState("");

  return (
    <StepWrapper
      title="Pitch Specifications"
      subtitle="Let's tailor your pitch to your audience"
    >
      <div className="flex-1 flex flex-col">
        {/* Duration Slider */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-medium text-foreground">
              Pitch Duration
            </label>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10">
              <Clock className="w-4 h-4 text-primary" />
              <span className="font-bold text-primary">{duration[0]} min</span>
            </div>
          </div>
          <Slider
            value={duration}
            onValueChange={setDuration}
            min={1}
            max={10}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>1 min</span>
            <span>10 min</span>
          </div>
        </motion.div>

        {/* Audience Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1"
        >
          <label className="text-sm font-medium text-foreground block mb-4">
            Target Audience
          </label>
          <div className="space-y-3">
            {audiences.map((aud, index) => (
              <motion.div
                key={aud.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <SelectionCard
                  title={aud.label}
                  description={aud.description}
                  icon={aud.icon}
                  selected={audience === aud.id}
                  onClick={() => setAudience(aud.id)}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Next Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6"
        >
          <Button
            variant="default"
            size="lg"
            onClick={() => audience && onNext({ duration: duration[0], audience })}
            disabled={!audience}
            className="w-full"
          >
            Next
            <ArrowRight className="w-5 h-5" />
          </Button>
        </motion.div>
      </div>
    </StepWrapper>
  );
};
