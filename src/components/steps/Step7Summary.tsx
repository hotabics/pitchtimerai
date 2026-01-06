import { motion } from "framer-motion";
import { Sparkles, Check, Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepWrapper } from "@/components/StepWrapper";
import { useEffect } from "react";
import confetti from "canvas-confetti";

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
  onBack: () => void;
}

export const Step7Summary = ({ data, onGenerate, onBack }: Step7SummaryProps) => {
  useEffect(() => {
    // Fire confetti when component mounts
    const duration = 2000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ["#10b981", "#6366f1", "#f59e0b"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ["#10b981", "#6366f1", "#f59e0b"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

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
            <p className="text-sm text-muted-foreground mb-1">Started at</p>
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
            <p className="text-sm text-muted-foreground mb-1">Now only</p>
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

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-3"
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
          <Button
            variant="ghost"
            onClick={onBack}
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Edit
          </Button>
        </motion.div>
      </div>
    </StepWrapper>
  );
};
