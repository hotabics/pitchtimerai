import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Heart, Frown, Sparkles as SparklesIcon, Gift, ShieldCheck, HelpCircle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WizardStep } from "@/components/WizardStep";
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

// Reusable AI Suggestions component with skeleton loading
const AISuggestions = ({
  suggestions,
  selectedSuggestions,
  isLoading,
  onToggle,
  onRegenerate,
  accentColor = "pink",
  label = "AI Suggestions (select any that apply)",
}: {
  suggestions: Suggestion[];
  selectedSuggestions: string[];
  isLoading: boolean;
  onToggle: (id: string) => void;
  onRegenerate: () => void;
  accentColor?: string;
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
        <SparklesIcon className={`w-4 h-4 text-${accentColor}-500`} />
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
                ? `border-${accentColor}-500 bg-${accentColor}-500/10`
                : `border-border hover:border-${accentColor}-500/50 hover:bg-muted/50`
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

// Step 1: The Connection
interface ConnectionStepProps {
  onNext: (connection: string) => void;
  onBack: () => void;
  initialValue?: string;
  idea?: string;
}

export const GrandmaConnectionStep = ({ onNext, onBack, initialValue = "", idea = "" }: ConnectionStepProps) => {
  const [connection, setConnection] = useState(initialValue);
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
        body: { type: "grandma-connection-suggestions", idea },
      });
      if (error) throw error;
      if (data?.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions.map((text: string, i: number) => ({ id: `s-${i}`, text })));
      }
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
      setSuggestions([
        { id: "s1", text: "I want you to understand what I've been working on because I know you'll be proud" },
        { id: "s2", text: "I'm excited to share this because you always encouraged me to follow my dreams" },
        { id: "s3", text: "This is something that could help people like our family" },
        { id: "s4", text: "I want you to see how technology can make life easier" },
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
    if (connection.trim()) parts.push(connection.trim());
    return parts.join(". ");
  };

  const hasContent = connection.trim() || selectedSuggestions.length > 0;

  return (
    <WizardStep title="The Connection" subtitle="Why do you care about her knowing this?">
      <div className="flex-1 flex flex-col">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
            <Heart className="w-5 h-5 text-pink-500" />
          </div>
          <p className="text-sm text-muted-foreground">Start with WHY this matters to you personally - emotion first!</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="connection">Your Personal "Why"</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger><HelpCircle className="w-4 h-4 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent className="max-w-xs"><p>Don't use technical jargon! Speak from the heart.</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="connection"
              placeholder="e.g., I want you to understand what I've been working on..."
              value={connection}
              onChange={(e) => setConnection(e.target.value)}
              className="h-12"
            />
          </div>
          <AISuggestions
            suggestions={suggestions}
            selectedSuggestions={selectedSuggestions}
            isLoading={isLoading}
            onToggle={toggleSuggestion}
            onRegenerate={() => { setSelectedSuggestions([]); fetchSuggestions(); }}
            accentColor="pink"
          />
        </motion.div>

        <div className="flex-1" />

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-6 space-y-3">
          <Button variant="default" size="lg" onClick={() => onNext(getCombined())} disabled={!hasContent} className="w-full">
            Continue <ArrowRight className="w-5 h-5" />
          </Button>
          <Button variant="ghost" onClick={onBack} className="w-full"><ArrowLeft className="w-4 h-4" /> Back</Button>
        </motion.div>
      </div>
    </WizardStep>
  );
};

// Step 2: The Pain (Relatable)
interface PainStepProps {
  onNext: (pain: string) => void;
  onBack: () => void;
  initialValue?: string;
  idea?: string;
}

export const GrandmaPainStep = ({ onNext, onBack, initialValue = "", idea = "" }: PainStepProps) => {
  const [pain, setPain] = useState(initialValue);
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
        body: { type: "grandma-pain-suggestions", idea },
      });
      if (error) throw error;
      if (data?.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions.map((text: string, i: number) => ({ id: `s-${i}`, text })));
      }
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
      setSuggestions([
        { id: "s1", text: "You know how it's hard to remember which pills to take and when?" },
        { id: "s2", text: "Remember when finding a recipe meant looking through stacks of old books?" },
        { id: "s3", text: "You know how frustrating it is when you can't reach family easily?" },
        { id: "s4", text: "It's like when you have to wait in long lines just to pay a bill" },
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
    if (pain.trim()) parts.push(pain.trim());
    return parts.join(". ");
  };

  const hasContent = pain.trim() || selectedSuggestions.length > 0;

  return (
    <WizardStep title="The Pain" subtitle="A relatable situation she would understand">
      <div className="flex-1 flex flex-col">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Frown className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-sm text-muted-foreground">Use everyday examples she can relate to</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="pain">Relatable Problem</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger><HelpCircle className="w-4 h-4 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent className="max-w-xs"><p>Use simple language! "You know how it's hard to..."</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="pain"
              placeholder="e.g., You know how it's hard to remember which pills to take?"
              value={pain}
              onChange={(e) => setPain(e.target.value)}
              className="h-12"
            />
          </div>
          <AISuggestions
            suggestions={suggestions}
            selectedSuggestions={selectedSuggestions}
            isLoading={isLoading}
            onToggle={toggleSuggestion}
            onRegenerate={() => { setSelectedSuggestions([]); fetchSuggestions(); }}
            accentColor="amber"
          />
        </motion.div>

        <div className="flex-1" />

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-6 space-y-3">
          <Button variant="default" size="lg" onClick={() => onNext(getCombined())} disabled={!hasContent} className="w-full">
            Continue <ArrowRight className="w-5 h-5" />
          </Button>
          <Button variant="ghost" onClick={onBack} className="w-full"><ArrowLeft className="w-4 h-4" /> Back</Button>
        </motion.div>
      </div>
    </WizardStep>
  );
};

// Step 3: The Analogy
interface AnalogyStepProps {
  onNext: (analogy: string) => void;
  onBack: () => void;
  initialValue?: string;
  idea?: string;
}

export const GrandmaAnalogyStep = ({ onNext, onBack, initialValue = "", idea = "" }: AnalogyStepProps) => {
  const [analogy, setAnalogy] = useState(initialValue);
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
        body: { type: "grandma-analogy-suggestions", idea },
      });
      if (error) throw error;
      if (data?.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions.map((text: string, i: number) => ({ id: `s-${i}`, text })));
      }
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
      setSuggestions([
        { id: "s1", text: "It's like a friendly alarm clock that reminds you of important things" },
        { id: "s2", text: "It's like having a helpful assistant available anytime you need" },
        { id: "s3", text: "It's like a recipe box that never loses any recipes" },
        { id: "s4", text: "It's like a telephone that also shows pictures of your family" },
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
    if (analogy.trim()) parts.push(analogy.trim());
    return parts.join(". ");
  };

  const hasContent = analogy.trim() || selectedSuggestions.length > 0;

  return (
    <WizardStep title="The Analogy" subtitle="It's like a [familiar thing] for [your thing]">
      <div className="flex-1 flex flex-col">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4 mb-6 border-2 border-amber-500/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <SparklesIcon className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-sm font-semibold text-amber-400">THE MAGIC COMPARISON</span>
          </div>
          <p className="text-sm text-muted-foreground">Compare your product to something she uses daily</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="analogy">Your Analogy</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger><HelpCircle className="w-4 h-4 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent className="max-w-xs"><p>Format: "It's like a [thing she knows] but for [what it does]"</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="analogy"
              placeholder="e.g., It's like a friendly alarm clock that reminds you..."
              value={analogy}
              onChange={(e) => setAnalogy(e.target.value)}
              className="h-12"
            />
          </div>
          <AISuggestions
            suggestions={suggestions}
            selectedSuggestions={selectedSuggestions}
            isLoading={isLoading}
            onToggle={toggleSuggestion}
            onRegenerate={() => { setSelectedSuggestions([]); fetchSuggestions(); }}
            accentColor="amber"
          />
        </motion.div>

        <div className="flex-1" />

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-6 space-y-3">
          <Button variant="default" size="lg" onClick={() => onNext(getCombined())} disabled={!hasContent} className="w-full">
            Continue <ArrowRight className="w-5 h-5" />
          </Button>
          <Button variant="ghost" onClick={onBack} className="w-full"><ArrowLeft className="w-4 h-4" /> Back</Button>
        </motion.div>
      </div>
    </WizardStep>
  );
};

// Step 4: The Benefits
interface BenefitsStepProps {
  onNext: (benefits: string) => void;
  onBack: () => void;
  initialValue?: string;
  idea?: string;
}

export const GrandmaBenefitsStep = ({ onNext, onBack, initialValue = "", idea = "" }: BenefitsStepProps) => {
  const [benefits, setBenefits] = useState(initialValue);
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
        body: { type: "grandma-benefits-suggestions", idea },
      });
      if (error) throw error;
      if (data?.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions.map((text: string, i: number) => ({ id: `s-${i}`, text })));
      }
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
      setSuggestions([
        { id: "s1", text: "Never forget to take your medicine again" },
        { id: "s2", text: "Your kids can check you're okay without calling every day" },
        { id: "s3", text: "The doctor can see if something's wrong before you feel sick" },
        { id: "s4", text: "Everything important is in one easy place" },
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
    if (benefits.trim()) parts.push(benefits.trim());
    return parts.join(". ");
  };

  const hasContent = benefits.trim() || selectedSuggestions.length > 0;

  return (
    <WizardStep title="The Benefits" subtitle="3 simple things it helps with">
      <div className="flex-1 flex flex-col">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Gift className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-sm text-muted-foreground">List 3 simple benefits using words she'd use</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="benefits">3 Simple Benefits</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger><HelpCircle className="w-4 h-4 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent className="max-w-xs"><p>Use action words: "It helps you...", "No more..."</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              id="benefits"
              placeholder="e.g., Never forget to take your medicine again..."
              value={benefits}
              onChange={(e) => setBenefits(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>
          <AISuggestions
            suggestions={suggestions}
            selectedSuggestions={selectedSuggestions}
            isLoading={isLoading}
            onToggle={toggleSuggestion}
            onRegenerate={() => { setSelectedSuggestions([]); fetchSuggestions(); }}
            accentColor="emerald"
          />
        </motion.div>

        <div className="flex-1" />

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-6 space-y-3">
          <Button variant="default" size="lg" onClick={() => onNext(getCombined())} disabled={!hasContent} className="w-full">
            Continue <ArrowRight className="w-5 h-5" />
          </Button>
          <Button variant="ghost" onClick={onBack} className="w-full"><ArrowLeft className="w-4 h-4" /> Back</Button>
        </motion.div>
      </div>
    </WizardStep>
  );
};

// Step 5: Safety
interface SafetyStepProps {
  onNext: (safety: string) => void;
  onBack: () => void;
  initialValue?: string;
  idea?: string;
}

export const GrandmaSafetyStep = ({ onNext, onBack, initialValue = "", idea = "" }: SafetyStepProps) => {
  const [safety, setSafety] = useState(initialValue);
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
        body: { type: "grandma-safety-suggestions", idea },
      });
      if (error) throw error;
      if (data?.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions.map((text: string, i: number) => ({ id: `s-${i}`, text })));
      }
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
      setSuggestions([
        { id: "s1", text: "You can't break it by pressing the wrong button" },
        { id: "s2", text: "Only you and your family can see your information" },
        { id: "s3", text: "It's like a lock on a diary - nobody else can read it" },
        { id: "s4", text: "If it ever stops working, it tells you right away" },
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
    if (safety.trim()) parts.push(safety.trim());
    return parts.join(". ");
  };

  const hasContent = safety.trim() || selectedSuggestions.length > 0;

  return (
    <WizardStep title="Safety & Trust" subtitle="Why is it safe/unbreakable?">
      <div className="flex-1 flex flex-col">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-sm text-muted-foreground">Address concerns about it being complicated, breaking, or being "hackable"</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="safety">Safety Reassurance</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger><HelpCircle className="w-4 h-4 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent className="max-w-xs"><p>Use reassuring language: "You can't break it", "It's like a lock"</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              id="safety"
              placeholder="e.g., You can't break it by pressing the wrong button..."
              value={safety}
              onChange={(e) => setSafety(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>
          <AISuggestions
            suggestions={suggestions}
            selectedSuggestions={selectedSuggestions}
            isLoading={isLoading}
            onToggle={toggleSuggestion}
            onRegenerate={() => { setSelectedSuggestions([]); fetchSuggestions(); }}
            accentColor="blue"
          />
        </motion.div>

        <div className="flex-1" />

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-6 space-y-3">
          <Button variant="default" size="lg" onClick={() => onNext(getCombined())} disabled={!hasContent} className="w-full">
            Continue <ArrowRight className="w-5 h-5" />
          </Button>
          <Button variant="ghost" onClick={onBack} className="w-full"><ArrowLeft className="w-4 h-4" /> Back</Button>
        </motion.div>
      </div>
    </WizardStep>
  );
};