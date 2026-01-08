import { motion } from "framer-motion";
import { Sparkles, BarChart3, Skull, BookOpen, Zap, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type HookStyle = "auto" | "statistic" | "villain" | "story" | "contrarian" | "question";

interface HookStyleOption {
  id: HookStyle;
  label: string;
  shortLabel: string;
  description: string;
  icon: typeof Sparkles;
  example: string;
}

const hookStyleOptions: HookStyleOption[] = [
  {
    id: "auto",
    label: "Auto (Best Match)",
    shortLabel: "Auto",
    description: "AI picks the best style for your track",
    icon: Sparkles,
    example: "Let the AI decide based on your audience",
  },
  {
    id: "statistic",
    label: "Shock Me (Hard Fact)",
    shortLabel: "Statistic",
    description: "Start with a quantifiable, eye-opening fact",
    icon: BarChart3,
    example: '"70% of food is wasted before it reaches your plate..."',
  },
  {
    id: "villain",
    label: "The Enemy",
    shortLabel: "Villain",
    description: "Immediately identify the villain (inefficiency, cost, time)",
    icon: Skull,
    example: '"Manual data entry is the silent killer of productivity."',
  },
  {
    id: "story",
    label: "Make Them Feel (Story)",
    shortLabel: "Story",
    description: "Start with a specific micro-moment or anecdote",
    icon: BookOpen,
    example: '"Last Tuesday, I tried to buy a train ticket..."',
  },
  {
    id: "contrarian",
    label: "Provoke (Bold Statement)",
    shortLabel: "Contrarian",
    description: "State something counter-intuitive or controversial",
    icon: Zap,
    example: '"Marketing is dead. Community is the new king."',
  },
  {
    id: "question",
    label: "Engage (Question)",
    shortLabel: "Question",
    description: "Ask the audience something relatable",
    icon: HelpCircle,
    example: '"Who here has ever lost their keys?"',
  },
];

interface HookStyleSelectorProps {
  value: HookStyle;
  onChange: (style: HookStyle) => void;
  compact?: boolean;
}

export const HookStyleSelector = ({ value, onChange, compact = false }: HookStyleSelectorProps) => {
  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {hookStyleOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = value === option.id;
          
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{option.shortLabel}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">Opening Style</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {hookStyleOptions.map((option, index) => {
          const Icon = option.icon;
          const isSelected = value === option.id;

          return (
            <motion.button
              key={option.id}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onChange(option.id)}
              className={cn(
                "relative p-3 rounded-xl border-2 text-left transition-all",
                isSelected
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border bg-card hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              <div className="flex items-start gap-2">
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    isSelected ? "bg-primary/20" : "bg-muted"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4",
                      isSelected ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-sm font-medium leading-tight",
                      isSelected ? "text-primary" : "text-foreground"
                    )}
                  >
                    {option.shortLabel}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {option.description}
                  </p>
                </div>
              </div>

              {isSelected && (
                <motion.div
                  layoutId="hook-style-check"
                  className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                >
                  <svg
                    className="w-3 h-3 text-primary-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
      
      {/* Example preview */}
      {value !== "auto" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-muted/50 rounded-lg p-3 border border-border/50"
        >
          <p className="text-xs text-muted-foreground mb-1">Example opening:</p>
          <p className="text-sm italic text-foreground/80">
            {hookStyleOptions.find((o) => o.id === value)?.example}
          </p>
        </motion.div>
      )}
    </div>
  );
};

// Helper to get recommended hook styles based on track
export function getRecommendedHookStyles(track: string): HookStyle[] {
  switch (track) {
    case "investor":
      return ["statistic", "villain"];
    case "hackathon-no-demo":
    case "hackathon-with-demo":
    case "judges":
      return ["villain", "question"];
    case "grandma":
    case "nontech":
      return ["story"];
    case "academic":
      return ["statistic", "contrarian"];
    case "peers":
      return ["question", "story"];
    default:
      return ["statistic", "villain", "story", "contrarian", "question"];
  }
}

// Helper to select a random hook style for variety
export function selectRandomHookStyle(exclude: HookStyle[] = []): HookStyle {
  const allStyles: HookStyle[] = ["statistic", "villain", "story", "contrarian", "question"];
  const available = allStyles.filter((s) => !exclude.includes(s));
  return available[Math.floor(Math.random() * available.length)];
}
