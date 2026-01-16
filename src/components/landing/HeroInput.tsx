import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Rocket, Sparkles, AlertTriangle, Clock, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const MAX_IDEA_LENGTH = 500;
const WARNING_THRESHOLD = 0.8; // 80% of max

// Estimate generation time based on idea complexity
const getEstimatedTime = (ideaLength: number): { min: number; max: number; label: string } => {
  if (ideaLength === 0) return { min: 0, max: 0, label: "" };
  if (ideaLength < 50) return { min: 8, max: 12, label: "~10 sec" };
  if (ideaLength < 150) return { min: 12, max: 18, label: "~15 sec" };
  if (ideaLength < 300) return { min: 18, max: 25, label: "~20 sec" };
  return { min: 25, max: 35, label: "~30 sec" };
};

interface HeroInputProps {
  onSubmit: (idea: string) => void;
}

export const HeroInput = ({ onSubmit }: HeroInputProps) => {
  const [idea, setIdea] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const charCount = idea.length;
  const isNearLimit = charCount >= MAX_IDEA_LENGTH * WARNING_THRESHOLD;
  const isAtLimit = charCount >= MAX_IDEA_LENGTH;
  const remainingChars = MAX_IDEA_LENGTH - charCount;
  
  const estimatedTime = useMemo(() => getEstimatedTime(charCount), [charCount]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Auto-truncate if somehow exceeds limit
    if (value.length <= MAX_IDEA_LENGTH) {
      setIdea(value);
    } else {
      setIdea(value.slice(0, MAX_IDEA_LENGTH));
    }
  };

  const handleSubmit = () => {
    if (idea.trim()) {
      // Truncate to safe limit before sending
      const safeIdea = idea.trim().slice(0, MAX_IDEA_LENGTH);
      onSubmit(safeIdea);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && idea.trim()) {
      handleSubmit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.6 }}
      className="w-full max-w-xl mx-auto px-4"
    >
      <div className="relative">
        {/* Glow effect behind input */}
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
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/50" />
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <input
                      type="text"
                      value={idea}
                      onChange={handleInputChange}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      onKeyDown={handleKeyDown}
                      maxLength={MAX_IDEA_LENGTH}
                      placeholder="What are you building? (e.g., Tinder for rescue dogs...)"
                      className="
                        w-full h-14 pl-12 pr-10 
                        bg-transparent text-foreground text-base
                        placeholder:text-muted-foreground/60
                        focus:outline-none
                        rounded-xl
                      "
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs p-3 space-y-2">
                    <p className="font-semibold text-sm">💡 What makes a great pitch idea?</p>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• <strong>Be specific:</strong> "AI tutor for dyslexic kids" beats "education app"</li>
                      <li>• <strong>Show the hook:</strong> "Uber for dog walking" instantly communicates value</li>
                      <li>• <strong>Include the problem:</strong> "Reduces hiring time from weeks to hours"</li>
                      <li>• <strong>Name your audience:</strong> "For busy parents who..." adds clarity</li>
                    </ul>
                    <p className="text-xs text-muted-foreground/80 pt-1 border-t border-border">
                      Examples: "Spotify for podcasters", "A CRM that actually updates itself", "Plant care app using phone camera AI"
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 hover:text-muted-foreground cursor-help transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs p-3 space-y-2">
                    <p className="font-semibold text-sm">💡 What makes a great pitch idea?</p>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• <strong>Be specific:</strong> "AI tutor for dyslexic kids" beats "education app"</li>
                      <li>• <strong>Show the hook:</strong> "Uber for dog walking" instantly communicates value</li>
                      <li>• <strong>Include the problem:</strong> "Reduces hiring time from weeks to hours"</li>
                      <li>• <strong>Name your audience:</strong> "For busy parents who..." adds clarity</li>
                    </ul>
                    <p className="text-xs text-muted-foreground/80 pt-1 border-t border-border">
                      Examples: "Spotify for podcasters", "A CRM that actually updates itself", "Plant care app using phone camera AI"
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!idea.trim()}
              size="lg"
              className="
                h-14 px-6 sm:px-8 rounded-xl
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
          
          {/* Character count and estimated time indicators */}
          {charCount > 0 && (
            <div className="flex items-center justify-between mt-2 px-2 text-xs">
              {/* Estimated generation time */}
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span>Est. generation: <span className="font-medium text-foreground/80">{estimatedTime.label}</span></span>
              </div>
              
              {/* Character count */}
              <div className={`
                flex items-center gap-1.5 transition-colors
                ${isAtLimit ? "text-destructive" : isNearLimit ? "text-yellow-500" : "text-muted-foreground"}
              `}>
                {isNearLimit && (
                  <AlertTriangle className="w-3.5 h-3.5" />
                )}
                <span className="font-medium">
                  {charCount}/{MAX_IDEA_LENGTH}
                </span>
                {isAtLimit && (
                  <span className="text-destructive/80 ml-1">Limit reached</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Helper text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="text-center text-xs text-muted-foreground mt-4"
      >
        <span className="inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-time-low animate-pulse" />
          No signup required to start
        </span>
      </motion.p>
    </motion.div>
  );
};
