import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Rocket, Sparkles, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const MAX_IDEA_LENGTH = 500;
const WARNING_THRESHOLD = 0.8; // 80% of max

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
          
          {/* Character count indicator */}
          {charCount > 0 && (
            <div className={`
              flex items-center justify-end gap-1.5 mt-2 px-2 text-xs transition-colors
              ${isAtLimit ? "text-destructive" : isNearLimit ? "text-yellow-500" : "text-muted-foreground"}
            `}>
              {isNearLimit && (
                <AlertTriangle className="w-3.5 h-3.5" />
              )}
              <span className="font-medium">
                {charCount}/{MAX_IDEA_LENGTH}
              </span>
              {isAtLimit && (
                <span className="text-destructive/80">Character limit reached</span>
              )}
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
