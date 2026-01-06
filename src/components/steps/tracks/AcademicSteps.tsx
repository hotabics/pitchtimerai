import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, BookOpen, Target, FlaskConical, LineChart, GraduationCap, HelpCircle, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

interface Suggestion {
  id: string;
  text: string;
}

// Reusable AI Suggestions component
const AISuggestions = ({
  suggestions,
  selectedSuggestions,
  isLoading,
  onToggle,
  onRegenerate,
  accentColor = "blue",
}: {
  suggestions: Suggestion[];
  selectedSuggestions: string[];
  isLoading: boolean;
  onToggle: (id: string) => void;
  onRegenerate: () => void;
  accentColor?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 }}
    className="space-y-3"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Sparkles className={`w-4 h-4 text-${accentColor}-500`} />
        <Label className="text-sm text-muted-foreground">AI Suggestions (select any that apply)</Label>
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
      <div className="flex items-center justify-center py-6">
        <Loader2 className={`w-5 h-5 animate-spin text-${accentColor}-500`} />
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

// Step 1: Topic & Context
interface TopicStepProps {
  onNext: (topic: string) => void;
  onBack: () => void;
  initialValue?: string;
  idea?: string;
}

export const AcademicTopicStep = ({ onNext, onBack, initialValue = "", idea = "" }: TopicStepProps) => {
  const [topic, setTopic] = useState(initialValue);
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
        body: { type: "academic-topic-suggestions", idea },
      });
      if (error) throw error;
      if (data?.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions.map((text: string, i: number) => ({ id: `s-${i}`, text })));
      }
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
      setSuggestions([
        { id: "s1", text: "Addresses critical gap in current literature with novel methodology" },
        { id: "s2", text: "Has significant real-world applications in healthcare/industry" },
        { id: "s3", text: "Builds on established theoretical frameworks with new insights" },
        { id: "s4", text: "Provides reproducible results that advance the field substantially" },
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
    if (topic.trim()) parts.push(topic.trim());
    return parts.join(". ");
  };

  const hasContent = topic.trim() || selectedSuggestions.length > 0;

  return (
    <WizardStep title="Topic & Context" subtitle="Thesis title and its relevance to the field">
      <div className="flex-1 flex flex-col">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-sm text-muted-foreground">Start with your thesis title and explain why this research matters</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="topic">Thesis Title & Relevance</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger><HelpCircle className="w-4 h-4 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent className="max-w-xs"><p>Include the full title and why this research is important</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              id="topic"
              placeholder="e.g., Title: 'Machine Learning Applications in Early Disease Detection'..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="min-h-[120px] resize-none"
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

// Step 2: Research Frame
interface ResearchFrameStepProps {
  onNext: (frame: string) => void;
  onBack: () => void;
  initialValue?: string;
  idea?: string;
}

export const AcademicResearchFrameStep = ({ onNext, onBack, initialValue = "", idea = "" }: ResearchFrameStepProps) => {
  const [frame, setFrame] = useState(initialValue);
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
        body: { type: "academic-frame-suggestions", idea },
      });
      if (error) throw error;
      if (data?.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions.map((text: string, i: number) => ({ id: `s-${i}`, text })));
      }
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
      setSuggestions([
        { id: "s1", text: "Hypothesis: The proposed method achieves 95% accuracy with 50% less computation" },
        { id: "s2", text: "Goal: Develop and validate a novel framework for automated analysis" },
        { id: "s3", text: "Objective: Compare performance across 5 different architectures" },
        { id: "s4", text: "Task: Optimize model for accuracy while maintaining real-time inference" },
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
    if (frame.trim()) parts.push(frame.trim());
    return parts.join(". ");
  };

  const hasContent = frame.trim() || selectedSuggestions.length > 0;

  return (
    <WizardStep title="Research Frame" subtitle="Goal, Tasks, and Hypothesis">
      <div className="flex-1 flex flex-col">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <Target className="w-5 h-5 text-violet-500" />
          </div>
          <p className="text-sm text-muted-foreground">Clearly state what you set out to achieve and prove</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="frame">Goal, Tasks & Hypothesis</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger><HelpCircle className="w-4 h-4 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent className="max-w-xs"><p>Structure: 1) Main goal, 2) Specific tasks, 3) Hypothesis</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              id="frame"
              placeholder="e.g., GOAL: Develop and validate a CNN-based diagnostic tool..."
              value={frame}
              onChange={(e) => setFrame(e.target.value)}
              className="min-h-[120px] resize-none"
            />
          </div>
          <AISuggestions
            suggestions={suggestions}
            selectedSuggestions={selectedSuggestions}
            isLoading={isLoading}
            onToggle={toggleSuggestion}
            onRegenerate={() => { setSelectedSuggestions([]); fetchSuggestions(); }}
            accentColor="violet"
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

// Step 3: Methodology
interface MethodologyStepProps {
  onNext: (methodology: string) => void;
  onBack: () => void;
  initialValue?: string;
  idea?: string;
}

export const AcademicMethodologyStep = ({ onNext, onBack, initialValue = "", idea = "" }: MethodologyStepProps) => {
  const [methodology, setMethodology] = useState(initialValue);
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
        body: { type: "academic-methodology-suggestions", idea },
      });
      if (error) throw error;
      if (data?.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions.map((text: string, i: number) => ({ id: `s-${i}`, text })));
      }
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
      setSuggestions([
        { id: "s1", text: "Quantitative analysis using 10,000-sample dataset with 5-fold cross-validation" },
        { id: "s2", text: "Mixed methods: surveys (n=500) combined with 20 in-depth interviews" },
        { id: "s3", text: "Experimental design with control group and statistical significance testing" },
        { id: "s4", text: "Longitudinal study over 12 months tracking key performance indicators" },
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
    if (methodology.trim()) parts.push(methodology.trim());
    return parts.join(". ");
  };

  const hasContent = methodology.trim() || selectedSuggestions.length > 0;

  return (
    <WizardStep title="Methodology" subtitle="Research methods used (Quantitative/Qualitative)">
      <div className="flex-1 flex flex-col">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-sm text-muted-foreground">Describe your research approach, data sources, and analytical methods</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="methodology">Research Methodology</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger><HelpCircle className="w-4 h-4 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent className="max-w-xs"><p>Include: Research type, data collection, sample size, tools</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              id="methodology"
              placeholder="e.g., APPROACH: Quantitative experimental study..."
              value={methodology}
              onChange={(e) => setMethodology(e.target.value)}
              className="min-h-[120px] resize-none"
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

// Step 4: Key Results
interface ResultsStepProps {
  onNext: (results: string) => void;
  onBack: () => void;
  initialValue?: string;
  idea?: string;
}

export const AcademicResultsStep = ({ onNext, onBack, initialValue = "", idea = "" }: ResultsStepProps) => {
  const [results, setResults] = useState(initialValue);
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
        body: { type: "academic-results-suggestions", idea },
      });
      if (error) throw error;
      if (data?.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions.map((text: string, i: number) => ({ id: `s-${i}`, text })));
      }
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
      setSuggestions([
        { id: "s1", text: "Achieved 96.3% accuracy (p < 0.001), exceeding baseline by 12%" },
        { id: "s2", text: "Reduced processing time by 78% while maintaining quality metrics" },
        { id: "s3", text: "Strong correlation found (r = 0.87) between key variables" },
        { id: "s4", text: "Model performed consistently across subgroups (variance < 3%)" },
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
    if (results.trim()) parts.push(results.trim());
    return parts.join(". ");
  };

  const hasContent = results.trim() || selectedSuggestions.length > 0;

  return (
    <WizardStep title="Key Results" subtitle="3-5 main findings (data-based)">
      <div className="flex-1 flex flex-col">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4 mb-6 border-2 border-emerald-500/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <LineChart className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="text-sm font-semibold text-emerald-400">DATA-DRIVEN FINDINGS</span>
          </div>
          <p className="text-sm text-muted-foreground">Present your key findings with specific numbers and statistical significance</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="results">Main Findings</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger><HelpCircle className="w-4 h-4 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent className="max-w-xs"><p>Include specific metrics, percentages, p-values, comparisons</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              id="results"
              placeholder="e.g., 1. ResNet-50 achieved 96.3% accuracy (p < 0.001)..."
              value={results}
              onChange={(e) => setResults(e.target.value)}
              className="min-h-[120px] resize-none"
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

// Step 5: Conclusions
interface ConclusionsStepProps {
  onNext: (conclusions: string) => void;
  onBack: () => void;
  initialValue?: string;
  idea?: string;
}

export const AcademicConclusionsStep = ({ onNext, onBack, initialValue = "", idea = "" }: ConclusionsStepProps) => {
  const [conclusions, setConclusions] = useState(initialValue);
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
        body: { type: "academic-conclusions-suggestions", idea },
      });
      if (error) throw error;
      if (data?.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions.map((text: string, i: number) => ({ id: `s-${i}`, text })));
      }
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
      setSuggestions([
        { id: "s1", text: "Novel optimization technique reduces training time by 78% while maintaining accuracy" },
        { id: "s2", text: "Results validate hypothesis and provide foundation for future research" },
        { id: "s3", text: "Open-source implementation enables reproducibility and further development" },
        { id: "s4", text: "Findings have direct applications in industry and clinical settings" },
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
    if (conclusions.trim()) parts.push(conclusions.trim());
    return parts.join(". ");
  };

  const hasContent = conclusions.trim() || selectedSuggestions.length > 0;

  return (
    <WizardStep title="Conclusions" subtitle="Main analytical conclusion and contributions">
      <div className="flex-1 flex flex-col">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-sm text-muted-foreground">Summarize what your research proves and its contribution to the field</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="conclusions">Conclusions & Contributions</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger><HelpCircle className="w-4 h-4 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent className="max-w-xs"><p>Include: Main conclusion, contributions, limitations, future work</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              id="conclusions"
              placeholder="e.g., CONCLUSION: This research demonstrates..."
              value={conclusions}
              onChange={(e) => setConclusions(e.target.value)}
              className="min-h-[120px] resize-none"
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