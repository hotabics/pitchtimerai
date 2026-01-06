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
          className="text-center mb-6"
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-purple-500/20 text-primary text-sm font-semibold mb-4 border border-primary/30"
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

        {/* Time Savings Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3 mb-6"
        >
          {timeSavings.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.15 }}
              className={`relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r ${item.bgGradient} border border-white/10`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg`}>
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-lg">{item.label}</p>
                    <p className="text-muted-foreground text-xs">Automated by AI</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-time-high font-bold text-lg line-through opacity-60">{item.before}</p>
                  </div>
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <ArrowRight className="w-5 h-5 text-time-low" />
                  </motion.div>
                  <div className="text-right">
                    <motion.p 
                      className="text-time-low font-bold text-xl"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.2 }}
                    >
                      {item.after}
                    </motion.p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Total Savings Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
          className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-time-low/20 to-emerald-400/20 border border-time-low/30 text-center"
        >
          <p className="text-sm text-muted-foreground mb-1">Total Time Saved</p>
          <motion.p 
            className="text-3xl font-black text-time-low"
            animate={{ textShadow: ["0 0 10px rgba(16, 185, 129, 0.5)", "0 0 20px rgba(16, 185, 129, 0.8)", "0 0 10px rgba(16, 185, 129, 0.5)"] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            14h 30m
          </motion.p>
        </motion.div>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="space-y-3"
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
      </div>
    </StepWrapper>
  );
};
