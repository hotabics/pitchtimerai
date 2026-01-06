import { motion } from "framer-motion";
import { Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SuggestionSkeleton } from "@/components/ui/suggestion-skeleton";

export interface Suggestion {
  id: string;
  text: string;
}

interface AISuggestionsProps {
  suggestions: Suggestion[];
  selectedSuggestions: string[];
  isLoading: boolean;
  onToggle: (id: string) => void;
  onRegenerate: () => void;
  accentColor?: "pink" | "amber" | "fuchsia" | "cyan" | "emerald" | "blue" | "purple";
  label?: string;
  isRateLimited?: boolean;
  remainingAttempts?: number;
  cooldownSeconds?: number;
}

const colorClasses = {
  pink: {
    icon: "text-pink-500",
    selectedBorder: "border-pink-500",
    selectedBg: "bg-pink-500/10",
    hoverBorder: "hover:border-pink-500/50",
  },
  amber: {
    icon: "text-amber-500",
    selectedBorder: "border-amber-500",
    selectedBg: "bg-amber-500/10",
    hoverBorder: "hover:border-amber-500/50",
  },
  fuchsia: {
    icon: "text-fuchsia-500",
    selectedBorder: "border-fuchsia-500",
    selectedBg: "bg-fuchsia-500/10",
    hoverBorder: "hover:border-fuchsia-500/50",
  },
  cyan: {
    icon: "text-cyan-500",
    selectedBorder: "border-cyan-500",
    selectedBg: "bg-cyan-500/10",
    hoverBorder: "hover:border-cyan-500/50",
  },
  emerald: {
    icon: "text-emerald-500",
    selectedBorder: "border-emerald-500",
    selectedBg: "bg-emerald-500/10",
    hoverBorder: "hover:border-emerald-500/50",
  },
  blue: {
    icon: "text-blue-500",
    selectedBorder: "border-blue-500",
    selectedBg: "bg-blue-500/10",
    hoverBorder: "hover:border-blue-500/50",
  },
  purple: {
    icon: "text-purple-500",
    selectedBorder: "border-purple-500",
    selectedBg: "bg-purple-500/10",
    hoverBorder: "hover:border-purple-500/50",
  },
};

export const AISuggestions = ({
  suggestions,
  selectedSuggestions,
  isLoading,
  onToggle,
  onRegenerate,
  accentColor = "fuchsia",
  label = "AI Suggestions (select any that apply)",
  isRateLimited = false,
  remainingAttempts,
  cooldownSeconds = 0,
}: AISuggestionsProps) => {
  const colors = colorClasses[accentColor];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className={`w-4 h-4 ${colors.icon}`} />
          <Label className="text-sm text-muted-foreground">{label}</Label>
        </div>
        <div className="flex items-center gap-2">
          {remainingAttempts !== undefined && remainingAttempts > 0 && !isRateLimited && (
            <span className="text-xs text-muted-foreground">
              {remainingAttempts} left
            </span>
          )}
          {isRateLimited && cooldownSeconds > 0 && (
            <span className="text-xs text-destructive">
              Wait {cooldownSeconds}s
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onRegenerate}
            disabled={isLoading || isRateLimited}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Regenerate
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <SuggestionSkeleton count={4} />
      ) : (
        <div className="space-y-2">
          {suggestions.map((suggestion, index) => (
            <motion.div
              key={suggestion.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 + index * 0.05 }}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                selectedSuggestions.includes(suggestion.id)
                  ? `${colors.selectedBorder} ${colors.selectedBg}`
                  : `border-border ${colors.hoverBorder} hover:bg-muted/50`
              }`}
              onClick={() => onToggle(suggestion.id)}
            >
              <Checkbox
                checked={selectedSuggestions.includes(suggestion.id)}
                onCheckedChange={() => onToggle(suggestion.id)}
                className="mt-0.5"
              />
              <span className="text-sm leading-relaxed">{suggestion.text}</span>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

// Helper hook for managing AI suggestions state
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface UseSuggestionsOptions {
  type: string;
  idea: string;
  context?: Record<string, unknown>;
  fallbackSuggestions: string[];
}

// Rate limiting constants
const MAX_REGENERATIONS = 5;
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const COOLDOWN_MS = 30000; // 30 seconds

// Track suggestion selection for analytics
const trackSuggestionSelection = async (type: string, text: string, selected: boolean) => {
  if (!selected) return; // Only track selections, not deselections
  
  try {
    await supabase.from("suggestion_analytics").insert({
      suggestion_type: type,
      suggestion_text: text,
    });
  } catch (error) {
    console.error("Failed to track suggestion:", error);
  }
};

export const useSuggestions = ({ type, idea, context, fallbackSuggestions }: UseSuggestionsOptions) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Rate limiting state
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(MAX_REGENERATIONS);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const attemptsRef = useRef<number[]>([]);
  const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup cooldown interval on unmount
  useEffect(() => {
    return () => {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
    };
  }, []);

  const checkRateLimit = useCallback((): boolean => {
    const now = Date.now();
    
    // Clean up old attempts outside the window
    attemptsRef.current = attemptsRef.current.filter(
      (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
    );

    // Check if we're at the limit
    if (attemptsRef.current.length >= MAX_REGENERATIONS) {
      setIsRateLimited(true);
      setCooldownSeconds(Math.ceil(COOLDOWN_MS / 1000));
      
      // Start countdown
      cooldownIntervalRef.current = setInterval(() => {
        setCooldownSeconds((prev) => {
          if (prev <= 1) {
            setIsRateLimited(false);
            attemptsRef.current = [];
            setRemainingAttempts(MAX_REGENERATIONS);
            if (cooldownIntervalRef.current) {
              clearInterval(cooldownIntervalRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      toast({
        title: "Rate limit reached",
        description: `Please wait ${Math.ceil(COOLDOWN_MS / 1000)} seconds before regenerating again.`,
        variant: "destructive",
      });
      
      return false;
    }

    // Record this attempt
    attemptsRef.current.push(now);
    setRemainingAttempts(MAX_REGENERATIONS - attemptsRef.current.length);
    
    return true;
  }, []);

  const fetchSuggestions = useCallback(async (isInitialLoad = false) => {
    if (!idea) return;
    
    // Skip rate limit check for initial load
    if (!isInitialLoad && !checkRateLimit()) {
      return;
    }
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-pitch", {
        body: { type, idea, context },
      });
      
      if (error) throw error;
      
      if (data?.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions.map((text: string, i: number) => ({ id: `s-${i}`, text })));
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
      
      const { dismiss } = toast({
        title: "Couldn't load AI suggestions",
        description: "Using default suggestions instead.",
        variant: "destructive",
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              dismiss();
              fetchSuggestions();
            }}
            className="shrink-0"
          >
            Retry
          </Button>
        ),
      });
      
      setSuggestions(fallbackSuggestions.map((text, i) => ({ id: `s-${i}`, text })));
    } finally {
      setIsLoading(false);
    }
  }, [idea, type, context, fallbackSuggestions, checkRateLimit]);

  useEffect(() => {
    if (idea) fetchSuggestions(true);
  }, [idea]);

  const toggleSuggestion = (id: string) => {
    const suggestion = suggestions.find((s) => s.id === id);
    const isCurrentlySelected = selectedSuggestions.includes(id);
    
    // Track selection for analytics
    if (suggestion && !isCurrentlySelected) {
      trackSuggestionSelection(type, suggestion.text, true);
    }
    
    setSelectedSuggestions((prev) => 
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const regenerate = () => {
    setSelectedSuggestions([]);
    fetchSuggestions(false);
  };

  const getSelectedTexts = () => {
    return suggestions.filter((s) => selectedSuggestions.includes(s.id)).map((s) => s.text);
  };

  const getCombinedValue = (userInput: string) => {
    const selected = getSelectedTexts();
    const parts = [...selected];
    if (userInput.trim()) parts.push(userInput.trim());
    return parts.join(". ");
  };

  return {
    suggestions,
    selectedSuggestions,
    isLoading,
    toggleSuggestion,
    regenerate,
    getSelectedTexts,
    getCombinedValue,
    hasSelection: selectedSuggestions.length > 0,
    isRateLimited,
    remainingAttempts,
    cooldownSeconds,
  };
};
