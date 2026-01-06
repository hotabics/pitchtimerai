import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Users, Zap, Code, CheckCircle, HelpCircle, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WizardStep } from "@/components/WizardStep";
import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";

interface PainSuggestion {
  id: string;
  text: string;
}

// Step 1: The Pain
interface PainStepProps {
  onNext: (pain: string) => void;
  onBack: () => void;
  initialValue?: string;
  idea?: string;
}

export const HackathonPainStep = ({ onNext, onBack, initialValue = "", idea = "" }: PainStepProps) => {
  const [pain, setPain] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<PainSuggestion[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (idea) {
      fetchSuggestions();
    }
  }, [idea]);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-pitch", {
        body: {
          type: "pain-suggestions",
          idea,
        },
      });

      if (error) throw error;

      if (data?.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(
          data.suggestions.map((text: string, index: number) => ({
            id: `suggestion-${index}`,
            text,
          }))
        );
      }
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
      // Fallback suggestions
      setSuggestions([
        { id: "s1", text: "Users spend too much time on repetitive manual tasks" },
        { id: "s2", text: "Existing solutions are too complex or expensive" },
        { id: "s3", text: "Critical information is scattered across multiple tools" },
        { id: "s4", text: "No real-time visibility into key metrics or status" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSuggestion = (id: string) => {
    setSelectedSuggestions((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  // Combine custom input with selected suggestions
  const getCombinedPain = () => {
    const selectedTexts = suggestions
      .filter((s) => selectedSuggestions.includes(s.id))
      .map((s) => s.text);
    
    const parts = [...selectedTexts];
    if (pain.trim()) {
      parts.push(pain.trim());
    }
    return parts.join(". ");
  };

  const hasContent = pain.trim() || selectedSuggestions.length > 0;

  return (
    <WizardStep
      title="The Pain Point"
      subtitle="Who has the problem and when does it happen?"
    >
      <div className="flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4 mb-6 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-violet-500" />
          </div>
          <p className="text-sm text-muted-foreground">
            Be specific about WHO experiences this and WHEN it happens
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
              <Label htmlFor="pain">Pain Point Description</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Example: "Small business owners waste 3+ hours daily on manual inventory tracking, especially during busy seasons"</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="pain"
              placeholder="e.g., Freelancers lose track of invoices when managing multiple clients..."
              value={pain}
              onChange={(e) => setPain(e.target.value)}
              className="h-12"
            />
          </div>

          {/* AI Suggestions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-500" />
                <Label className="text-sm text-muted-foreground">AI Suggestions (select any that apply)</Label>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedSuggestions([]);
                  fetchSuggestions();
                }}
                disabled={isLoading}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                Regenerate
              </Button>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
                <span className="ml-2 text-sm text-muted-foreground">Generating suggestions...</span>
              </div>
            ) : (
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <motion.div
                    key={suggestion.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + index * 0.05 }}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                      selectedSuggestions.includes(suggestion.id)
                        ? "border-violet-500 bg-violet-500/10"
                        : "border-border hover:border-violet-500/50 hover:bg-muted/50"
                    }`}
                    onClick={() => toggleSuggestion(suggestion.id)}
                  >
                    <Checkbox
                      checked={selectedSuggestions.includes(suggestion.id)}
                      onCheckedChange={() => toggleSuggestion(suggestion.id)}
                      className="mt-0.5"
                    />
                    <span className="text-sm leading-relaxed">{suggestion.text}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
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
            onClick={() => onNext(getCombinedPain())}
            disabled={!hasContent}
            className="w-full"
          >
            Continue
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

// Step 2: The Fix
interface FixStepProps {
  onNext: (fix: string) => void;
  onBack: () => void;
  initialValue?: string;
  idea?: string;
  pain?: string;
}

interface FixSuggestion {
  id: string;
  text: string;
}

export const HackathonFixStep = ({ onNext, onBack, initialValue = "", idea = "", pain = "" }: FixStepProps) => {
  const [fix, setFix] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<FixSuggestion[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (idea) {
      fetchSuggestions();
    }
  }, [idea]);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-pitch", {
        body: {
          type: "fix-suggestions",
          idea,
          context: { pain },
        },
      });

      if (error) throw error;

      if (data?.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(
          data.suggestions.map((text: string, index: number) => ({
            id: `suggestion-${index}`,
            text,
          }))
        );
      }
    } catch (error) {
      console.error("Failed to fetch fix suggestions:", error);
      // Fallback suggestions
      setSuggestions([
        { id: "s1", text: "Automates the entire workflow with AI-powered assistance" },
        { id: "s2", text: "Provides a unified dashboard for real-time tracking" },
        { id: "s3", text: "Uses smart notifications to keep users informed" },
        { id: "s4", text: "Integrates with existing tools for seamless adoption" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSuggestion = (id: string) => {
    setSelectedSuggestions((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const getCombinedFix = () => {
    const selectedTexts = suggestions
      .filter((s) => selectedSuggestions.includes(s.id))
      .map((s) => s.text);
    
    const parts = [...selectedTexts];
    if (fix.trim()) {
      parts.push(fix.trim());
    }
    return parts.join(". ");
  };

  const hasContent = fix.trim() || selectedSuggestions.length > 0;

  return (
    <WizardStep
      title="The Fix"
      subtitle="How does it work in 1-2 sentences?"
    >
      <div className="flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4 mb-6 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-sm text-muted-foreground">
            Keep it simple - one clear sentence explaining the solution
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
              <Label htmlFor="fix">Your Solution</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Example: "We auto-generate invoices from time logs and send payment reminders automatically"</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="fix"
              placeholder="e.g., An AI that reads receipts and auto-categorizes expenses..."
              value={fix}
              onChange={(e) => setFix(e.target.value)}
              className="h-12"
            />
          </div>

          {/* AI Suggestions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <Label className="text-sm text-muted-foreground">AI Suggestions (select any that apply)</Label>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedSuggestions([]);
                  fetchSuggestions();
                }}
                disabled={isLoading}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                Regenerate
              </Button>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                <span className="ml-2 text-sm text-muted-foreground">Generating suggestions...</span>
              </div>
            ) : (
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <motion.div
                    key={suggestion.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + index * 0.05 }}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                      selectedSuggestions.includes(suggestion.id)
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-border hover:border-emerald-500/50 hover:bg-muted/50"
                    }`}
                    onClick={() => toggleSuggestion(suggestion.id)}
                  >
                    <Checkbox
                      checked={selectedSuggestions.includes(suggestion.id)}
                      onCheckedChange={() => toggleSuggestion(suggestion.id)}
                      className="mt-0.5"
                    />
                    <span className="text-sm leading-relaxed">{suggestion.text}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
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
            onClick={() => onNext(getCombinedFix())}
            disabled={!hasContent}
            className="w-full"
          >
            Continue
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

// Step 3: Hackathon Progress (Critical - replaces demo)
interface ProgressStepProps {
  onNext: (progress: string) => void;
  onBack: () => void;
  initialValue?: string;
  idea?: string;
}

interface ProgressSuggestion {
  id: string;
  text: string;
}

export const HackathonProgressStep = ({ onNext, onBack, initialValue = "", idea = "" }: ProgressStepProps) => {
  const [progress, setProgress] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<ProgressSuggestion[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (idea) {
      fetchSuggestions();
    }
  }, [idea]);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-pitch", {
        body: {
          type: "progress-suggestions",
          idea,
        },
      });

      if (error) throw error;

      if (data?.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(
          data.suggestions.map((text: string, index: number) => ({
            id: `suggestion-${index}`,
            text,
          }))
        );
      }
    } catch (error) {
      console.error("Failed to fetch progress suggestions:", error);
      setSuggestions([
        { id: "s1", text: "Built with React + Supabase for real-time data sync" },
        { id: "s2", text: "Implemented AI processing using OpenAI GPT-4 API" },
        { id: "s3", text: "Created responsive dashboard with Tailwind CSS" },
        { id: "s4", text: "Integrated authentication and user management system" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSuggestion = (id: string) => {
    setSelectedSuggestions((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const getCombinedProgress = () => {
    const selectedTexts = suggestions
      .filter((s) => selectedSuggestions.includes(s.id))
      .map((s) => s.text);
    
    const parts = [...selectedTexts];
    if (progress.trim()) {
      parts.push(progress.trim());
    }
    return parts.join(". ");
  };

  const hasContent = progress.trim() || selectedSuggestions.length > 0;

  return (
    <WizardStep
      title="Hackathon Progress"
      subtitle="What did you actually build? (This replaces your demo)"
    >
      <div className="flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4 mb-6 border-2 border-violet-500/30"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Code className="w-5 h-5 text-violet-500" />
            </div>
            <span className="text-sm font-semibold text-violet-400">CRITICAL SECTION</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Without a live demo, this section proves you built something real. Describe your architecture, user flow, and technical logic.
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
              <Label htmlFor="progress">Architecture, Flow & Logic</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Include: Tech stack used, main components built, data flow, key algorithms or logic implemented</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              id="progress"
              placeholder="e.g., Built with React + Supabase. Core features: 
1. OCR receipt scanner using Tesseract.js
2. GPT-4 categorization API
3. Real-time expense dashboard..."
              value={progress}
              onChange={(e) => setProgress(e.target.value)}
              className="min-h-[120px] resize-none"
            />
          </div>

          {/* AI Suggestions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-500" />
                <Label className="text-sm text-muted-foreground">AI Tech Stack Ideas (select any that apply)</Label>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedSuggestions([]);
                  fetchSuggestions();
                }}
                disabled={isLoading}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                Regenerate
              </Button>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
                <span className="ml-2 text-sm text-muted-foreground">Generating suggestions...</span>
              </div>
            ) : (
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <motion.div
                    key={suggestion.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + index * 0.05 }}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                      selectedSuggestions.includes(suggestion.id)
                        ? "border-violet-500 bg-violet-500/10"
                        : "border-border hover:border-violet-500/50 hover:bg-muted/50"
                    }`}
                    onClick={() => toggleSuggestion(suggestion.id)}
                  >
                    <Checkbox
                      checked={selectedSuggestions.includes(suggestion.id)}
                      onCheckedChange={() => toggleSuggestion(suggestion.id)}
                      className="mt-0.5"
                    />
                    <span className="text-sm leading-relaxed">{suggestion.text}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
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
            onClick={() => onNext(getCombinedProgress())}
            disabled={!hasContent}
            className="w-full"
          >
            Continue
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

// Step 4: Feasibility
interface FeasibilityStepProps {
  onNext: (feasibility: string) => void;
  onBack: () => void;
  initialValue?: string;
}

export const HackathonFeasibilityStep = ({ onNext, onBack, initialValue = "" }: FeasibilityStepProps) => {
  const [feasibility, setFeasibility] = useState(initialValue);

  return (
    <WizardStep
      title="Feasibility"
      subtitle="Why is this realistic? (Tech stack, cost, scalability)"
    >
      <div className="flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4 mb-6 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-sm text-muted-foreground">
            Prove this can work in the real world with real constraints
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
              <Label htmlFor="feasibility">Technical & Business Feasibility</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Include: Technologies used, estimated costs, infrastructure requirements, scalability plan</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              id="feasibility"
              placeholder="e.g., Uses free tier of Supabase (up to 50k users). OCR costs ~$0.001/image. Can handle 10k concurrent users with current setup..."
              value={feasibility}
              onChange={(e) => setFeasibility(e.target.value)}
              className="min-h-[120px] resize-none"
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
            onClick={() => onNext(feasibility)}
            disabled={!feasibility.trim()}
            className="w-full"
          >
            Continue
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
