import { motion } from "framer-motion";
import { Sparkles, Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepWrapper } from "@/components/StepWrapper";

interface Step7SummaryProps {
  data: {
    idea: string;
    duration: number;
    audience: string;
    problem: string;
    persona: { description: string; keywords: string[] };
    pitch: string;
    models: string[];
  };
  onGenerate: () => void;
}

export const Step7Summary = ({ data, onGenerate }: Step7SummaryProps) => {
  const summaryItems = [
    { label: "Idea", value: data.idea },
    { label: "Duration", value: `${data.duration} minutes` },
    { label: "Audience", value: data.audience.charAt(0).toUpperCase() + data.audience.slice(1) },
    { label: "Problem", value: data.problem.slice(0, 100) + (data.problem.length > 100 ? "..." : "") },
    { label: "Pitch Style", value: data.pitch.slice(0, 80) + "..." },
    { label: "Revenue", value: data.models.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(", ") },
  ];

  return (
    <StepWrapper>
      <div className="flex-1 flex flex-col justify-center">
        {/* Time Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-8 mb-8"
        >
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Without AI</p>
            <p className="text-3xl font-bold text-time-high line-through opacity-60">15h 00m</p>
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center"
          >
            <Clock className="w-6 h-6 text-success" />
          </motion.div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">With PitchDeck AI</p>
            <motion.p
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="text-3xl font-bold text-time-low pulse-success rounded-lg px-2"
            >
              30m
            </motion.p>
          </div>
        </motion.div>

        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-xl p-5 mb-6"
        >
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Check className="w-5 h-5 text-success" />
            Your Pitch Summary
          </h3>
          <div className="space-y-3">
            {summaryItems.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className="flex gap-3"
              >
                <span className="text-sm font-medium text-muted-foreground w-20 flex-shrink-0">
                  {item.label}
                </span>
                <span className="text-sm text-foreground">{item.value}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Generate Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            variant="time"
            size="xl"
            onClick={onGenerate}
            className="w-full"
          >
            <Sparkles className="w-5 h-5" />
            Generate Winning Pitch
          </Button>
        </motion.div>
      </div>
    </StepWrapper>
  );
};
