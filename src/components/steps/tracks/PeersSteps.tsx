import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Zap, Flame, Sparkles, PartyPopper, Rocket, GitCompare, Heart, MessageCircle, HelpCircle, AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WizardStep } from "@/components/WizardStep";
import { Chip } from "@/components/Chip";
import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { SuggestionSkeleton } from "@/components/ui/suggestion-skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";

interface Suggestion {
  id: string;
  text: string;
}

// Shared accent style for Peers track - vibrant purple/coral
const peersAccentBg = "bg-gradient-to-br from-fuchsia-500/20 to-purple-500/10";
const peersAccentBorder = "border-fuchsia-500/30";
const peersAccentText = "text-fuchsia-400";
const peersIconBg = "bg-fuchsia-500/20";

// Reusable AI Suggestions component with skeleton loading
const AISuggestions = ({
  suggestions,
  selectedSuggestions,
  isLoading,
  onToggle,
  onRegenerate,
  label = "AI Suggestions (select any that apply)",
}: {
  suggestions: Suggestion[];
  selectedSuggestions: string[];
  isLoading: boolean;
  onToggle: (id: string) => void;
  onRegenerate: () => void;
  label?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 }}
    className="space-y-3"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-fuchsia-500" />
        <Label className="text-sm text-muted-foreground">{label}</Label>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRegenerate}
        disabled={isLoading}
        className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
      >
        <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
        Regenerate
      </Button>
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
                ? "border-fuchsia-500 bg-fuchsia-500/10"
                : "border-border hover:border-fuchsia-500/50 hover:bg-muted/50"
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

// Step 1: The Hook
interface HookStepProps {
  onNext: (hook: string) => void;
  onBack: () => void;
  initialValue?: string;
  idea?: string;
}

export const PeersHookStep = ({ onNext, onBack, initialValue = "", idea = "" }: HookStepProps) => {
  const [hook, setHook] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (idea) fetchSuggestions();
  }, [idea]);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-pitch", {
        body: { type: "peers-hook-suggestions", idea },
      });
      if (error) throw error;
      if (data?.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions.map((text: string, i: number) => ({ id: `s-${i}`, text })));
      }
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
      setSuggestions([
        { id: "s1", text: "Have you ever wasted hours doing something that should take minutes?" },
        { id: "s2", text: "Why does everyone just accept that this has to be so complicated?" },
        { id: "s3", text: "Okay but hear me out - what if there was actually a better way?" },
        { id: "s4", text: "I'm honestly shocked more people don't know about this" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSuggestion = (id: string) => {
    setSelectedSuggestions((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };

  const getCombined = () => {
    const selected = suggestions.filter((s) => selectedSuggestions.includes(s.id)).map((s) => s.text);
    const parts = [...selected];
    if (hook.trim()) parts.push(hook.trim());
    return parts.join(" ");
  };

  const hasContent = hook.trim() || selectedSuggestions.length > 0;

  return (
    <WizardStep
      title="Grab their attention instantly 🎯"
      subtitle="The first 10 seconds decide everything"
    >
      <div className="flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl p-4 mb-6 border-2 ${peersAccentBorder} ${peersAccentBg}`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-lg ${peersIconBg} flex items-center justify-center`}>
              <Zap className={`w-5 h-5 ${peersAccentText}`} />
            </div>
            <span className={`text-sm font-semibold ${peersAccentText}`}>KEEP IT REAL 💯</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Start with a question or a shared struggle. If they don&apos;t nod in 10 seconds, you lost them.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="hook">Your Hook</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Ask something they&apos;ll relate to. Make them think &quot;omg yes, me too!&quot;</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              id="hook"
              placeholder="Vai kādam no jums ir bijis, ka...? (Have you ever felt that...?)"
              value={hook}
              onChange={(e) => setHook(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>
          <AISuggestions
            suggestions={suggestions}
            selectedSuggestions={selectedSuggestions}
            isLoading={isLoading}
            onToggle={toggleSuggestion}
            onRegenerate={() => { setSelectedSuggestions([]); fetchSuggestions(); }}
          />
        </motion.div>

        <div className="flex-1" />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 space-y-3"
        >
          <Button
            variant="default"
            size="lg"
            onClick={() => onNext(getCombined())}
            disabled={!hasContent}
            className="w-full bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700"
          >
            Let&apos;s go! 🚀
            <ArrowRight className="w-5 h-5" />
          </Button>
          <Button variant="ghost" onClick={onBack} className="w-full">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </motion.div>
      </div>
    </WizardStep>
  );
};

// Step 2: The Struggle
interface StruggleStepProps {
  onNext: (struggle: string, customStruggle?: string) => void;
  onBack: () => void;
  initialValue?: string;
}

const struggleChips = [
  { id: "no-time", label: "Trūkst laika / No Time", emoji: "⏰" },
  { id: "stress", label: "Stress", emoji: "😤" },
  { id: "boredom", label: "Garlaicība / Boredom", emoji: "😴" },
  { id: "chaos", label: "Haoss / Chaos", emoji: "🌀" },
  { id: "annoying", label: "Besī / Annoying", emoji: "😒" },
];

export const PeersStruggleStep = ({ onNext, onBack, initialValue = "" }: StruggleStepProps) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [customStruggle, setCustomStruggle] = useState("");

  const toggleChip = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((s) => s !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  const handleNext = () => {
    const struggles = selected.map(id => struggleChips.find(c => c.id === id)?.label || id);
    const combined = [...struggles, customStruggle].filter(Boolean).join(", ");
    onNext(combined, customStruggle);
  };

  const hasSelection = selected.length > 0 || customStruggle.trim();

  return (
    <WizardStep
      title="What&apos;s the struggle? 😩"
      subtitle="What pain point hits them in daily life?"
    >
      <div className="flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl p-4 mb-6 flex items-center gap-3 ${peersAccentBg}`}
        >
          <div className={`w-10 h-10 rounded-lg ${peersIconBg} flex items-center justify-center`}>
            <Flame className={`w-5 h-5 ${peersAccentText}`} />
          </div>
          <p className="text-sm text-muted-foreground">
            Don&apos;t blame them. Just identify the struggle. No buzzwords! 🚫
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="flex flex-wrap gap-3">
            {struggleChips.map((chip, index) => (
              <motion.div
                key={chip.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + index * 0.05 }}
              >
                <Chip
                  label={`${chip.emoji} ${chip.label}`}
                  selected={selected.includes(chip.id)}
                  onSelect={() => toggleChip(chip.id)}
                />
              </motion.div>
            ))}
          </div>

          <div className="space-y-2 pt-4">
            <Label htmlFor="customStruggle">Or write your own...</Label>
            <Input
              id="customStruggle"
              placeholder="Something else that bugs them..."
              value={customStruggle}
              onChange={(e) => setCustomStruggle(e.target.value)}
              className="h-12"
            />
          </div>
        </motion.div>

        <div className="flex-1" />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 space-y-3"
        >
          <Button
            variant="default"
            size="lg"
            onClick={handleNext}
            disabled={!hasSelection}
            className="w-full bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700"
          >
            Got it! ✓
            <ArrowRight className="w-5 h-5" />
          </Button>
          <Button variant="ghost" onClick={onBack} className="w-full">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </motion.div>
      </div>
    </WizardStep>
  );
};

// Step 3: The 'Thing' (Simple Definition)
interface ThingStepProps {
  onNext: (thing: string) => void;
  onBack: () => void;
  initialValue?: string;
  idea?: string;
}

export const PeersThingStep = ({ onNext, onBack, initialValue = "", idea = "" }: ThingStepProps) => {
  const [thing, setThing] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isTooLong = thing.length > 140;

  useEffect(() => {
    if (idea) fetchSuggestions();
  }, [idea]);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-pitch", {
        body: { type: "peers-thing-suggestions", idea },
      });
      if (error) throw error;
      if (data?.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions.map((text: string, i: number) => ({ id: `s-${i}`, text })));
      }
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
      setSuggestions([
        { id: "s1", text: "It's an app that automates the boring stuff so you can focus on what matters" },
        { id: "s2", text: "Basically it's like having a smart assistant in your pocket" },
        { id: "s3", text: "Think of it as autopilot for the tedious parts of your day" },
        { id: "s4", text: "It's the tool I wish I had when I was struggling with this" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSuggestion = (id: string) => {
    setSelectedSuggestions((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };

  const getCombined = () => {
    const selected = suggestions.filter((s) => selectedSuggestions.includes(s.id)).map((s) => s.text);
    const parts = [...selected];
    if (thing.trim()) parts.push(thing.trim());
    return parts.join(". ");
  };

  const hasContent = (thing.trim().length > 0 && thing.length <= 140) || selectedSuggestions.length > 0;

  return (
    <WizardStep
      title="What IS it? 🤔"
      subtitle="In human language, not marketing speak"
    >
      <div className="flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl p-4 mb-6 flex items-center gap-3 ${peersAccentBg}`}
        >
          <div className={`w-10 h-10 rounded-lg ${peersIconBg} flex items-center justify-center`}>
            <Sparkles className={`w-5 h-5 ${peersAccentText}`} />
          </div>
          <p className="text-sm text-muted-foreground">
            Explain it like you&apos;re texting a friend. Keep it under 140 chars! 📱
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="thing">Simple Definition</Label>
              <span className={`text-xs ${isTooLong ? 'text-red-500' : 'text-muted-foreground'}`}>
                {thing.length}/140
              </span>
            </div>
            <Input
              id="thing"
              placeholder="It's a simple app that helps you..."
              value={thing}
              onChange={(e) => setThing(e.target.value)}
              className={`h-12 ${isTooLong ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            />
            {isTooLong && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-red-500 text-sm"
              >
                <AlertTriangle className="w-4 h-4" />
                Too complex! Keep it simple. ✂️
              </motion.div>
            )}
          </div>
          <AISuggestions
            suggestions={suggestions}
            selectedSuggestions={selectedSuggestions}
            isLoading={isLoading}
            onToggle={toggleSuggestion}
            onRegenerate={() => { setSelectedSuggestions([]); fetchSuggestions(); }}
          />
        </motion.div>

        <div className="flex-1" />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 space-y-3"
        >
          <Button
            variant="default"
            size="lg"
            onClick={() => onNext(getCombined())}
            disabled={!hasContent}
            className="w-full bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700"
          >
            Perfect! 👌
            <ArrowRight className="w-5 h-5" />
          </Button>
          <Button variant="ghost" onClick={onBack} className="w-full">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </motion.div>
      </div>
    </WizardStep>
  );
};

// Step 4: The 'Why Care?' (Benefits)
interface WhyCareStepProps {
  onNext: (benefits: string[]) => void;
  onBack: () => void;
  initialValue?: string[];
}

export const PeersWhyCareStep = ({ onNext, onBack, initialValue = ["", "", ""] }: WhyCareStepProps) => {
  const [benefit1, setBenefit1] = useState(initialValue[0] || "");
  const [benefit2, setBenefit2] = useState(initialValue[1] || "");
  const [benefit3, setBenefit3] = useState(initialValue[2] || "");

  const hasAtLeastOne = benefit1.trim() || benefit2.trim() || benefit3.trim();

  return (
    <WizardStep
      title="Why should THEY care? 🤩"
      subtitle="Focus on results, not features"
    >
      <div className="flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl p-4 mb-6 border-2 ${peersAccentBorder} ${peersAccentBg}`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-lg ${peersIconBg} flex items-center justify-center`}>
              <PartyPopper className={`w-5 h-5 ${peersAccentText}`} />
            </div>
            <span className={`text-sm font-semibold ${peersAccentText}`}>THIS IS THE MONEY SHOT 💰</span>
          </div>
          <p className="text-sm text-muted-foreground">
            What do they GET out of it? Not what it does, but what it gives them.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-xs font-bold">1</span>
              Saves time / Ietaupa laiku
            </Label>
            <Input
              placeholder="e.g., Get it done in 2 mins instead of 2 hours"
              value={benefit1}
              onChange={(e) => setBenefit1(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-xs font-bold">2</span>
              Makes life easier / Atvieglo dzīvi
            </Label>
            <Input
              placeholder="e.g., No more stressing about deadlines"
              value={benefit2}
              onChange={(e) => setBenefit2(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-fuchsia-500/20 text-fuchsia-500 flex items-center justify-center text-xs font-bold">3</span>
              Gives an edge / Dod priekšrocību
            </Label>
            <Input
              placeholder="e.g., Be the one who always has their stuff together"
              value={benefit3}
              onChange={(e) => setBenefit3(e.target.value)}
              className="h-11"
            />
          </div>
        </motion.div>

        <div className="flex-1" />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 space-y-3"
        >
          <Button
            variant="default"
            size="lg"
            onClick={() => onNext([benefit1, benefit2, benefit3].filter(Boolean))}
            disabled={!hasAtLeastOne}
            className="w-full bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700"
          >
            Fire! 🔥
            <ArrowRight className="w-5 h-5" />
          </Button>
          <Button variant="ghost" onClick={onBack} className="w-full">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </motion.div>
      </div>
    </WizardStep>
  );
};

// Step 5: The 'How-To'
interface HowToStepProps {
  onNext: (howTo: string) => void;
  onBack: () => void;
  initialValue?: string;
}

export const PeersHowToStep = ({ onNext, onBack, initialValue = "" }: HowToStepProps) => {
  const [howTo, setHowTo] = useState(initialValue);

  return (
    <WizardStep
      title="How does it work? ⚡"
      subtitle="The 3-step logic (max)"
    >
      <div className="flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl p-4 mb-6 flex items-center gap-3 ${peersAccentBg}`}
        >
          <div className={`w-10 h-10 rounded-lg ${peersIconBg} flex items-center justify-center`}>
            <Rocket className={`w-5 h-5 ${peersAccentText}`} />
          </div>
          <p className="text-sm text-muted-foreground">
            If you need a manual to explain it, it&apos;s not ready. Keep it stupid simple! 🧠
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="howTo">Quick How-To</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Format: Step 1 → Step 2 → Step 3. Done!</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="howTo"
              placeholder="Open → Click → Done."
              value={howTo}
              onChange={(e) => setHowTo(e.target.value)}
              className="h-12"
            />
          </div>
        </motion.div>

        <div className="flex-1" />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 space-y-3"
        >
          <Button
            variant="default"
            size="lg"
            onClick={() => onNext(howTo)}
            disabled={!howTo.trim()}
            className="w-full bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700"
          >
            Easy! 👍
            <ArrowRight className="w-5 h-5" />
          </Button>
          <Button variant="ghost" onClick={onBack} className="w-full">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </motion.div>
      </div>
    </WizardStep>
  );
};

// Step 6: The Comparison
interface ComparisonStepProps {
  onNext: (comparison: string) => void;
  onBack: () => void;
  initialValue?: string;
  idea?: string;
}

export const PeersComparisonStep = ({ onNext, onBack, initialValue = "", idea = "" }: ComparisonStepProps) => {
  const [comparison, setComparison] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (idea) fetchSuggestions();
  }, [idea]);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-pitch", {
        body: { type: "peers-comparison-suggestions", idea },
      });
      if (error) throw error;
      if (data?.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions.map((text: string, i: number) => ({ id: `s-${i}`, text })));
      }
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
      setSuggestions([
        { id: "s1", text: "Usually we spend hours doing it manually, but this takes seconds" },
        { id: "s2", text: "Instead of juggling 5 different apps, everything's in one place" },
        { id: "s3", text: "No more spreadsheets - it just handles everything automatically" },
        { id: "s4", text: "While others are still figuring it out, you're already done" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSuggestion = (id: string) => {
    setSelectedSuggestions((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };

  const getCombined = () => {
    const selected = suggestions.filter((s) => selectedSuggestions.includes(s.id)).map((s) => s.text);
    const parts = [...selected];
    if (comparison.trim()) parts.push(comparison.trim());
    return parts.join(". ");
  };

  const hasContent = comparison.trim() || selectedSuggestions.length > 0;

  return (
    <WizardStep
      title="Old Way vs New Way 🔄"
      subtitle="Why is this better than what we do now?"
    >
      <div className="flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl p-4 mb-6 flex items-center gap-3 ${peersAccentBg}`}
        >
          <div className={`w-10 h-10 rounded-lg ${peersIconBg} flex items-center justify-center`}>
            <GitCompare className={`w-5 h-5 ${peersAccentText}`} />
          </div>
          <p className="text-sm text-muted-foreground">
            Show the contrast. Make them feel silly for doing it the old way! 😅
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="comparison">The Comparison</Label>
            <Input
              id="comparison"
              placeholder="Usually we do [X], but this lets us do [Y]..."
              value={comparison}
              onChange={(e) => setComparison(e.target.value)}
              className="h-12"
            />
          </div>
          <AISuggestions
            suggestions={suggestions}
            selectedSuggestions={selectedSuggestions}
            isLoading={isLoading}
            onToggle={toggleSuggestion}
            onRegenerate={() => { setSelectedSuggestions([]); fetchSuggestions(); }}
          />
        </motion.div>

        <div className="flex-1" />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 space-y-3"
        >
          <Button
            variant="default"
            size="lg"
            onClick={() => onNext(getCombined())}
            disabled={!hasContent}
            className="w-full bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700"
          >
            Yup! 👊
            <ArrowRight className="w-5 h-5" />
          </Button>
          <Button variant="ghost" onClick={onBack} className="w-full">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </motion.div>
      </div>
    </WizardStep>
  );
};

// Step 7: The Authentic 'Why'
interface AuthenticWhyStepProps {
  onNext: (why: string) => void;
  onBack: () => void;
  initialValue?: string;
  idea?: string;
}

export const PeersAuthenticWhyStep = ({ onNext, onBack, initialValue = "", idea = "" }: AuthenticWhyStepProps) => {
  const [why, setWhy] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (idea) fetchSuggestions();
  }, [idea]);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-pitch", {
        body: { type: "peers-why-suggestions", idea },
      });
      if (error) throw error;
      if (data?.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions.map((text: string, i: number) => ({ id: `s-${i}`, text })));
      }
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
      setSuggestions([
        { id: "s1", text: "I use it every day because it literally saved me during finals week" },
        { id: "s2", text: "I built this because I was so frustrated with the existing options" },
        { id: "s3", text: "Honestly, I wish someone had shown me this a year ago" },
        { id: "s4", text: "It's the tool I needed when I was going through the same thing" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSuggestion = (id: string) => {
    setSelectedSuggestions((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };

  const getCombined = () => {
    const selected = suggestions.filter((s) => selectedSuggestions.includes(s.id)).map((s) => s.text);
    const parts = [...selected];
    if (why.trim()) parts.push(why.trim());
    return parts.join(". ");
  };

  const hasContent = why.trim() || selectedSuggestions.length > 0;

  return (
    <WizardStep
      title="Why are YOU sharing this? 💭"
      subtitle="Personal experience > facts"
    >
      <div className="flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl p-4 mb-6 border-2 ${peersAccentBorder} ${peersAccentBg}`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-lg ${peersIconBg} flex items-center justify-center`}>
              <Heart className={`w-5 h-5 ${peersAccentText}`} />
            </div>
            <span className={`text-sm font-semibold ${peersAccentText}`}>BE REAL 💯</span>
          </div>
          <p className="text-sm text-muted-foreground">
            This is where you connect. Share YOUR story, not a sales pitch.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="why">Your Personal Why</Label>
            <Textarea
              id="why"
              placeholder="I use it myself because... / It saved me when..."
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>
          <AISuggestions
            suggestions={suggestions}
            selectedSuggestions={selectedSuggestions}
            isLoading={isLoading}
            onToggle={toggleSuggestion}
            onRegenerate={() => { setSelectedSuggestions([]); fetchSuggestions(); }}
          />
        </motion.div>

        <div className="flex-1" />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 space-y-3"
        >
          <Button
            variant="default"
            size="lg"
            onClick={() => onNext(getCombined())}
            disabled={!hasContent}
            className="w-full bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700"
          >
            That&apos;s me! ✨
            <ArrowRight className="w-5 h-5" />
          </Button>
          <Button variant="ghost" onClick={onBack} className="w-full">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </motion.div>
      </div>
    </WizardStep>
  );
};

// Step 8: Low-Pressure CTA
interface CTAStepProps {
  onNext: (cta: string) => void;
  onBack: () => void;
  initialValue?: string;
}

const blockedPhrases = ["buy now", "you must", "you need to", "hurry", "limited time", "act now", "don't miss"];

export const PeersCTAStep = ({ onNext, onBack, initialValue = "" }: CTAStepProps) => {
  const [cta, setCta] = useState(initialValue);
  
  const hasBlockedPhrase = blockedPhrases.some(phrase => 
    cta.toLowerCase().includes(phrase)
  );

  return (
    <WizardStep
      title="What should they do next? 🤷"
      subtitle="Keep it chill, no pressure"
    >
      <div className="flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl p-4 mb-6 flex items-center gap-3 ${peersAccentBg}`}
        >
          <div className={`w-10 h-10 rounded-lg ${peersIconBg} flex items-center justify-center`}>
            <MessageCircle className={`w-5 h-5 ${peersAccentText}`} />
          </div>
          <p className="text-sm text-muted-foreground">
            No aggressive sales vibes! Just a friendly nudge. 😊
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="cta">Chill CTA</Label>
            <Input
              id="cta"
              placeholder="If you want, check it out... / Hit me up if interested."
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              className={`h-12 ${hasBlockedPhrase ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            />
            {hasBlockedPhrase && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-red-500 text-sm"
              >
                <AlertTriangle className="w-4 h-4" />
                Whoa! Too salesy. Keep it casual! 😬
              </motion.div>
            )}
          </div>
        </motion.div>

        <div className="flex-1" />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 space-y-3"
        >
          <Button
            variant="default"
            size="lg"
            onClick={() => onNext(cta)}
            disabled={!cta.trim() || hasBlockedPhrase}
            className="w-full bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700"
          >
            Done! Let&apos;s generate! 🎉
            <ArrowRight className="w-5 h-5" />
          </Button>
          <Button variant="ghost" onClick={onBack} className="w-full">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </motion.div>
      </div>
    </WizardStep>
  );
};