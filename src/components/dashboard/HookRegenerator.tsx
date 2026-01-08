import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, BarChart3, Skull, BookOpen, Zap, HelpCircle, ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type HookStyle = 'statistic' | 'villain' | 'story' | 'contrarian' | 'question';

interface HookStyleOption {
  id: HookStyle;
  label: string;
  description: string;
  icon: typeof BarChart3;
}

const hookStyles: HookStyleOption[] = [
  { id: "statistic", label: "Statistic", description: "Hard facts & numbers", icon: BarChart3 },
  { id: "villain", label: "Villain", description: "Identify the enemy", icon: Skull },
  { id: "story", label: "Story", description: "Personal anecdote", icon: BookOpen },
  { id: "contrarian", label: "Contrarian", description: "Bold statement", icon: Zap },
  { id: "question", label: "Question", description: "Engage the audience", icon: HelpCircle },
];

// Map backend style names to display names
const styleDisplayNames: Record<string, string> = {
  statistic: "Statistic",
  villain: "Villain",
  story: "Story",
  contrarian: "Contrarian",
  question: "Question",
};

interface HookRegeneratorProps {
  currentHook: string;
  currentStyle?: string;
  idea: string;
  track: string;
  onHookRegenerated: (newHook: string, newStyle: string) => void;
}

export const HookRegenerator = ({
  currentHook,
  currentStyle,
  idea,
  track,
  onHookRegenerated,
}: HookRegeneratorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStyle, setLoadingStyle] = useState<HookStyle | null>(null);

  const handleRegenerateHook = async (style: HookStyle) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setLoadingStyle(style);

    try {
      const { data, error } = await supabase.functions.invoke('regenerate-hook', {
        body: {
          currentHook,
          newStyle: style,
          idea,
          track,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      onHookRegenerated(data.newHook, data.style);
      setIsOpen(false);
      
      toast({
        title: "Hook Updated!",
        description: `New ${data.styleName} opening applied`,
      });
    } catch (err) {
      console.error('Failed to regenerate hook:', err);
      toast({
        title: "Regeneration Failed",
        description: err instanceof Error ? err.message : "Failed to regenerate hook",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setLoadingStyle(null);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
        >
          <RefreshCw className="w-3 h-3" />
          <span className="hidden sm:inline">Change Opening</span>
          <ChevronDown className="w-3 h-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="end">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Try a Different Hook</span>
          </div>
          
          {currentStyle && (
            <p className="text-xs text-muted-foreground">
              Currently using: <span className="font-medium text-foreground">{styleDisplayNames[currentStyle] || currentStyle}</span>
            </p>
          )}

          <div className="grid gap-1.5">
            {hookStyles.map((style) => {
              const Icon = style.icon;
              const isCurrent = currentStyle === style.id;
              const isLoadingThis = loadingStyle === style.id;

              return (
                <button
                  key={style.id}
                  onClick={() => handleRegenerateHook(style.id)}
                  disabled={isLoading || isCurrent}
                  className={cn(
                    "flex items-center gap-3 p-2.5 rounded-lg text-left transition-all",
                    isCurrent
                      ? "bg-primary/10 border border-primary/30 cursor-default"
                      : "hover:bg-muted border border-transparent",
                    isLoading && !isLoadingThis && "opacity-50"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-md flex items-center justify-center shrink-0",
                    isCurrent ? "bg-primary/20" : "bg-muted"
                  )}>
                    {isLoadingThis ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <RefreshCw className="w-4 h-4 text-primary" />
                      </motion.div>
                    ) : (
                      <Icon className={cn(
                        "w-4 h-4",
                        isCurrent ? "text-primary" : "text-muted-foreground"
                      )} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn(
                      "text-sm font-medium",
                      isCurrent ? "text-primary" : "text-foreground"
                    )}>
                      {style.label}
                      {isCurrent && (
                        <span className="ml-1.5 text-xs font-normal text-muted-foreground">(current)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{style.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-[10px] text-muted-foreground/70 text-center pt-1">
            Only the opening will change • Rest of script stays the same
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Badge to display current hook style
interface HookStyleBadgeProps {
  style?: string;
}

export const HookStyleBadge = ({ style }: HookStyleBadgeProps) => {
  if (!style) return null;

  const styleConfig = hookStyles.find(s => s.id === style);
  const Icon = styleConfig?.icon || Sparkles;
  const label = styleDisplayNames[style] || style;

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20">
      <Icon className="w-3 h-3" />
      {label} Hook
    </span>
  );
};
