import { motion } from "framer-motion";
import { Zap, PenLine, Palette, Mic, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StepWrapper } from "@/components/StepWrapper";
import { useState } from "react";

interface Step1HookProps {
  onNext: (idea: string) => void;
}

const timeSavings = [
  { 
    icon: PenLine, 
    label: "Writing", 
    before: "5h", 
    after: "0h",
    gradient: "from-orange-500 to-red-500",
    bgGradient: "from-orange-500/20 to-red-500/20"
  },
  { 
    icon: Palette, 
    label: "Designing", 
    before: "4h", 
    after: "0h",
    gradient: "from-purple-500 to-pink-500",
    bgGradient: "from-purple-500/20 to-pink-500/20"
  },
  { 
    icon: Mic, 
    label: "Practicing", 
    before: "6h", 
    after: "30m",
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-500/20 to-cyan-500/20"
  },
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
          className="text-center mb-4"
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-purple-500/20 text-primary text-sm font-semibold mb-3 border border-primary/30"
            animate={{ boxShadow: ["0 0 20px rgba(99, 102, 241, 0.3)", "0 0 40px rgba(99, 102, 241, 0.5)", "0 0 20px rgba(99, 102, 241, 0.3)"] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="w-4 h-4" />
            AI-Powered Pitch Builder
          </motion.div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            From <span className="text-time-high">15 Hours</span> to{" "}
            <span className="text-time-low">30 Minutes</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Let AI do the heavy lifting while you focus on winning
          </p>
        </motion.div>

        {/* Input Section - Moved Higher */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3 mb-6"
        >
          <div className="relative">
            <Input
              placeholder="What's your hackathon idea?"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              className="h-14 text-base pl-4 pr-4 rounded-xl border-2 border-primary/30 focus:border-primary bg-background/50 backdrop-blur-sm transition-all"
            />
          </div>
          <Button
            variant="hero"
            size="xl"
            onClick={() => idea.trim() && onNext(idea)}
            disabled={!idea.trim()}
            className="w-full shadow-lg shadow-primary/30"
          >
            <Zap className="w-5 h-5" />
            Start Optimization
            <ArrowRight className="w-5 h-5" />
          </Button>
        </motion.div>

        {/* Time Savings - Text Style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <p className="text-center text-xs text-muted-foreground uppercase tracking-wider">How we save your time</p>
          
          <div className="space-y-3">
            {timeSavings.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center`}>
                    <item.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-foreground font-medium">{item.label}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-time-high line-through opacity-60">{item.before}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <span className="text-time-low font-semibold">{item.after}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Total Savings */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="pt-2 text-center"
          >
            <p className="text-xs text-muted-foreground">Total saved:</p>
            <p className="text-xl font-bold text-time-low">14h 30m</p>
          </motion.div>
        </motion.div>
      </div>
    </StepWrapper>
  );
};
