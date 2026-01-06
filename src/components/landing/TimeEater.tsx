import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Rocket, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TimeEaterProps {
  onSubmit: (idea: string) => void;
}

interface TaskBar {
  id: string;
  label: string;
  hours: number;
  color: string;
  collapsedColor: string;
  collapses: boolean;
  highlight?: string;
}

const tasks: TaskBar[] = [
  { 
    id: "structuring", 
    label: "Structuring", 
    hours: 2, 
    color: "bg-slate-400", 
    collapsedColor: "bg-emerald-500",
    collapses: true 
  },
  { 
    id: "slides", 
    label: "Slide Design", 
    hours: 6, 
    color: "bg-red-400", 
    collapsedColor: "bg-emerald-500",
    collapses: true,
    highlight: "Biggest Time Sink"
  },
  { 
    id: "script", 
    label: "Scriptwriting", 
    hours: 3, 
    color: "bg-orange-400", 
    collapsedColor: "bg-emerald-500",
    collapses: true 
  },
  { 
    id: "demo", 
    label: "Demo Prep", 
    hours: 2, 
    color: "bg-yellow-400", 
    collapsedColor: "bg-emerald-500",
    collapses: true 
  },
  { 
    id: "rehearse", 
    label: "Rehearsing", 
    hours: 4, 
    color: "bg-blue-400", 
    collapsedColor: "bg-blue-400",
    collapses: false 
  },
];

const TOTAL_MANUAL_HOURS = 17;
const TOTAL_AI_MINUTES = 30;

export const TimeEater = ({ onSubmit }: TimeEaterProps) => {
  const [idea, setIdea] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showSavedBadge, setShowSavedBadge] = useState(false);

  useEffect(() => {
    if (idea.length > 0 && !isTyping) {
      setIsTyping(true);
      // Show the saved badge after animation completes
      const timer = setTimeout(() => {
        setShowSavedBadge(true);
      }, 800);
      return () => clearTimeout(timer);
    } else if (idea.length === 0) {
      setIsTyping(false);
      setShowSavedBadge(false);
    }
  }, [idea, isTyping]);

  const handleSubmit = () => {
    if (idea.trim()) {
      onSubmit(idea.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && idea.trim()) {
      handleSubmit();
    }
  };

  const maxHours = Math.max(...tasks.map(t => t.hours));

  return (
    <div className="w-full max-w-5xl mx-auto px-4">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center">
        {/* Left side - Time Card */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full lg:w-1/2"
        >
          <div className="glass-premium rounded-2xl p-6 border border-white/10 relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            
            {/* Header */}
            <div className="relative flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-medium">
                  {isTyping ? "With PitchDeck AI" : "The Manual Way"}
                </span>
              </div>
              
              {/* Time Counter */}
              <motion.div 
                className="flex items-baseline gap-1"
                key={isTyping ? "ai" : "manual"}
              >
                <motion.span
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`text-3xl font-mono font-bold tracking-tight ${
                    isTyping ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {isTyping ? TOTAL_AI_MINUTES : TOTAL_MANUAL_HOURS}
                </motion.span>
                <span className={`text-lg font-mono ${
                  isTyping ? "text-emerald-400/70" : "text-red-400/70"
                }`}>
                  {isTyping ? "m" : "h"}
                </span>
              </motion.div>
            </div>

            {/* Task Bars */}
            <div className="space-y-3 relative">
              {tasks.map((task, index) => {
                const widthPercent = (task.hours / maxHours) * 100;
                const isCollapsed = isTyping && task.collapses;
                
                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="relative"
                  >
                    <div className="flex items-center gap-3">
                      {/* Task label */}
                      <div className="w-24 flex-shrink-0">
                        <span className="text-xs text-muted-foreground font-medium">
                          {task.label}
                        </span>
                      </div>
                      
                      {/* Bar container */}
                      <div className="flex-1 h-6 bg-white/5 rounded-md overflow-hidden relative">
                        <motion.div
                          className={`h-full rounded-md ${isCollapsed ? task.collapsedColor : task.color}`}
                          initial={{ width: `${widthPercent}%` }}
                          animate={{ 
                            width: isCollapsed ? "5%" : `${widthPercent}%`,
                            opacity: isCollapsed ? 0.7 : 1
                          }}
                          transition={{ 
                            duration: 0.5, 
                            delay: isCollapsed ? index * 0.05 : 0,
                            ease: "easeOut"
                          }}
                          style={{
                            animation: !isTyping ? `pulse 2s ease-in-out infinite ${index * 0.2}s` : "none"
                          }}
                        />
                        
                        {/* Zap icon for collapsed items */}
                        <AnimatePresence>
                          {isCollapsed && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0 }}
                              transition={{ delay: 0.3 + index * 0.05 }}
                              className="absolute left-2 top-1/2 -translate-y-1/2"
                            >
                              <Zap className="w-3 h-3 text-emerald-300" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      
                      {/* Hours label */}
                      <motion.div 
                        className="w-12 text-right"
                        animate={{ 
                          opacity: isCollapsed ? 0.5 : 1 
                        }}
                      >
                        <span className={`text-xs font-mono ${
                          isCollapsed ? "text-emerald-400 line-through" : "text-muted-foreground"
                        }`}>
                          {task.hours}h
                        </span>
                      </motion.div>
                    </div>
                    
                    {/* Highlight label */}
                    {task.highlight && !isTyping && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="absolute -right-2 top-0 text-[10px] text-red-400 font-medium bg-red-400/10 px-2 py-0.5 rounded-full"
                      >
                        {task.highlight}
                      </motion.span>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Saved Badge */}
            <AnimatePresence>
              {showSavedBadge && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.9 }}
                  transition={{ type: "spring", damping: 15 }}
                  className="mt-6 flex justify-center"
                >
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      You just saved 16.5 hours of prep time
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Right side - Input */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="w-full lg:w-1/2"
        >
          <div className="space-y-6">
            {/* Headline */}
            <div className="text-center lg:text-left">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2">
                Start typing to see the{" "}
                <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
                  magic
                </span>
              </h2>
              <p className="text-muted-foreground">
                Watch your prep time vanish as our AI takes over
              </p>
            </div>

            {/* Input */}
            <div className="relative">
              {/* Glow effect */}
              <motion.div
                className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl"
                animate={{
                  opacity: isFocused ? 0.6 : 0.3,
                  scale: isFocused ? 1.02 : 1,
                }}
                transition={{ duration: 0.3 }}
              />

              {/* Input container */}
              <div
                className={`
                  relative glass-premium rounded-2xl p-2 
                  transition-all duration-300
                  ${isFocused ? "ring-2 ring-primary/50 shadow-lg shadow-primary/10" : ""}
                `}
              >
                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/50" />
                    <input
                      type="text"
                      value={idea}
                      onChange={(e) => setIdea(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      onKeyDown={handleKeyDown}
                      placeholder="What's your project idea?"
                      className="
                        w-full h-14 pl-12 pr-4 
                        bg-transparent text-foreground text-base
                        placeholder:text-muted-foreground/60
                        focus:outline-none
                        rounded-xl
                      "
                    />
                  </div>
                  <Button
                    onClick={handleSubmit}
                    disabled={!idea.trim()}
                    size="lg"
                    className="
                      h-14 rounded-xl
                      bg-primary text-primary-foreground
                      hover:bg-primary/90
                      shadow-lg shadow-primary/25
                      disabled:opacity-50 disabled:cursor-not-allowed
                      group
                      transition-all duration-300
                    "
                  >
                    <Rocket className="w-5 h-5 mr-2 group-hover:animate-float" />
                    <span className="font-semibold">Optimise My Pitch</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Helper text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-center lg:text-left text-xs text-muted-foreground"
            >
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                No signup required to start
              </span>
            </motion.p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
