import { motion } from "framer-motion";
import { Zap, PenLine, Palette, Mic, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StepWrapper } from "@/components/StepWrapper";
import { useState } from "react";

interface Step1HookProps {
  onNext: (idea: string) => void;
}

const painPoints = [
  { icon: PenLine, label: "Writing", time: "5h", color: "text-time-high" },
  { icon: Palette, label: "Designing", time: "4h", color: "text-time-high" },
  { icon: Mic, label: "Practicing", time: "6h", color: "text-time-high" },
];

export const Step1Hook = ({ onNext }: Step1HookProps) => {
  const [idea, setIdea] = useState("");

  return (
    <StepWrapper>
      <div className="flex-1 flex flex-col justify-center">
        {/* Hero Section */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Zap className="w-4 h-4" />
            AI-Powered Pitch Builder
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Stop Wasting Time on Pitches
          </h1>
          <p className="text-muted-foreground">
            Most hackathon teams spend 15+ hours preparing. Let's fix that.
          </p>
        </motion.div>

        {/* Pain Points */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-3 mb-8"
        >
          {painPoints.map((point, index) => (
            <motion.div
              key={point.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="glass-card rounded-xl p-4 text-center"
            >
              <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-destructive/10 flex items-center justify-center">
                <point.icon className="w-5 h-5 text-time-high" />
              </div>
              <p className="font-semibold text-sm text-foreground">{point.label}</p>
              <p className={`text-lg font-bold ${point.color}`}>{point.time}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          <div className="relative">
            <Input
              placeholder="What's your hackathon idea?"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              className="h-14 text-base pl-4 pr-4 rounded-xl border-2 focus:border-primary transition-all"
            />
          </div>
          <Button
            variant="hero"
            size="xl"
            onClick={() => idea.trim() && onNext(idea)}
            disabled={!idea.trim()}
            className="w-full"
          >
            Start Optimization
            <ArrowRight className="w-5 h-5" />
          </Button>
        </motion.div>
      </div>
    </StepWrapper>
  );
};
