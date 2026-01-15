import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, BookOpen, Target, FlaskConical, LineChart, GraduationCap, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { WizardStep } from "@/components/WizardStep";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AISuggestions, useSuggestions } from "@/components/shared/AISuggestions";
import { trackEvent } from "@/utils/analytics";

// Step 1: Topic & Context
interface TopicStepProps {
  onNext: (topic: string) => void;
  onBack: () => void;
  initialValue?: string;
  idea?: string;
}

export const AcademicTopicStep = ({ onNext, onBack, initialValue = "", idea = "" }: TopicStepProps) => {
  const [topic, setTopic] = useState(initialValue);

  const {
    suggestions,
    selectedSuggestions,
    isLoading,
    toggleSuggestion,
    regenerate,
    getCombinedValue,
    hasSelection,
    isRateLimited,
    remainingAttempts,
    cooldownSeconds,
    hasError,
    retryCount,
    retryWithBackoff,
  } = useSuggestions({
    type: "academic-topic-suggestions",
    idea,
    fallbackSuggestions: [
      "Addresses critical gap in current literature with novel methodology",
      "Has significant real-world applications in healthcare/industry",
      "Builds on established theoretical frameworks with new insights",
      "Provides reproducible results that advance the field substantially",
    ],
  });

  const hasContent = topic.trim() || hasSelection;

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
            onRegenerate={regenerate}
            accentColor="blue"
            isRateLimited={isRateLimited}
            remainingAttempts={remainingAttempts}
            cooldownSeconds={cooldownSeconds}
            hasError={hasError}
            retryCount={retryCount}
            onRetry={retryWithBackoff}
          />
        </motion.div>

        <div className="flex-1" />

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-6 space-y-3">
          <Button variant="default" size="lg" onClick={() => {
            trackEvent('Wizard Step: Completed', { track: 'academic', step: 'topic', hasAISuggestion: hasSelection });
            onNext(getCombinedValue(topic));
          }} disabled={!hasContent} className="w-full">
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

  const {
    suggestions,
    selectedSuggestions,
    isLoading,
    toggleSuggestion,
    regenerate,
    getCombinedValue,
    hasSelection,
    isRateLimited,
    remainingAttempts,
    cooldownSeconds,
  } = useSuggestions({
    type: "academic-frame-suggestions",
    idea,
    fallbackSuggestions: [
      "Hypothesis: The proposed method achieves 95% accuracy with 50% less computation",
      "Goal: Develop and validate a novel framework for automated analysis",
      "Objective: Compare performance across 5 different architectures",
      "Task: Optimize model for accuracy while maintaining real-time inference",
    ],
  });

  const hasContent = frame.trim() || hasSelection;

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
            onRegenerate={regenerate}
            accentColor="purple"
            isRateLimited={isRateLimited}
            remainingAttempts={remainingAttempts}
            cooldownSeconds={cooldownSeconds}
          />
        </motion.div>

        <div className="flex-1" />

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-6 space-y-3">
          <Button variant="default" size="lg" onClick={() => {
            trackEvent('Wizard Step: Completed', { track: 'academic', step: 'research_frame', hasAISuggestion: hasSelection });
            onNext(getCombinedValue(frame));
          }} disabled={!hasContent} className="w-full">
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

  const {
    suggestions,
    selectedSuggestions,
    isLoading,
    toggleSuggestion,
    regenerate,
    getCombinedValue,
    hasSelection,
    isRateLimited,
    remainingAttempts,
    cooldownSeconds,
  } = useSuggestions({
    type: "academic-methodology-suggestions",
    idea,
    fallbackSuggestions: [
      "Quantitative analysis using 10,000-sample dataset with 5-fold cross-validation",
      "Mixed methods: surveys (n=500) combined with 20 in-depth interviews",
      "Experimental design with control group and statistical significance testing",
      "Longitudinal study over 12 months tracking key performance indicators",
    ],
  });

  const hasContent = methodology.trim() || hasSelection;

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
            onRegenerate={regenerate}
            accentColor="amber"
            isRateLimited={isRateLimited}
            remainingAttempts={remainingAttempts}
            cooldownSeconds={cooldownSeconds}
          />
        </motion.div>

        <div className="flex-1" />

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-6 space-y-3">
          <Button variant="default" size="lg" onClick={() => {
            trackEvent('Wizard Step: Completed', { track: 'academic', step: 'methodology', hasAISuggestion: hasSelection });
            onNext(getCombinedValue(methodology));
          }} disabled={!hasContent} className="w-full">
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

  const {
    suggestions,
    selectedSuggestions,
    isLoading,
    toggleSuggestion,
    regenerate,
    getCombinedValue,
    hasSelection,
    isRateLimited,
    remainingAttempts,
    cooldownSeconds,
  } = useSuggestions({
    type: "academic-results-suggestions",
    idea,
    fallbackSuggestions: [
      "Achieved 96.3% accuracy (p < 0.001), exceeding baseline by 12%",
      "Reduced processing time by 78% while maintaining quality metrics",
      "Strong correlation found (r = 0.87) between key variables",
      "Model performed consistently across subgroups (variance < 3%)",
    ],
  });

  const hasContent = results.trim() || hasSelection;

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
            onRegenerate={regenerate}
            accentColor="emerald"
            isRateLimited={isRateLimited}
            remainingAttempts={remainingAttempts}
            cooldownSeconds={cooldownSeconds}
          />
        </motion.div>

        <div className="flex-1" />

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-6 space-y-3">
          <Button variant="default" size="lg" onClick={() => {
            trackEvent('Wizard Step: Completed', { track: 'academic', step: 'results', hasAISuggestion: hasSelection });
            onNext(getCombinedValue(results));
          }} disabled={!hasContent} className="w-full">
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

  const {
    suggestions,
    selectedSuggestions,
    isLoading,
    toggleSuggestion,
    regenerate,
    getCombinedValue,
    hasSelection,
    isRateLimited,
    remainingAttempts,
    cooldownSeconds,
  } = useSuggestions({
    type: "academic-conclusions-suggestions",
    idea,
    fallbackSuggestions: [
      "Novel optimization technique reduces training time by 78% while maintaining accuracy",
      "Results validate hypothesis and provide foundation for future research",
      "Open-source implementation enables reproducibility and further development",
      "Findings have direct applications in industry and clinical settings",
    ],
  });

  const hasContent = conclusions.trim() || hasSelection;

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
            onRegenerate={regenerate}
            accentColor="blue"
            isRateLimited={isRateLimited}
            remainingAttempts={remainingAttempts}
            cooldownSeconds={cooldownSeconds}
          />
        </motion.div>

        <div className="flex-1" />

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-6 space-y-3">
          <Button variant="default" size="lg" onClick={() => {
            trackEvent('Wizard Step: Completed', { track: 'academic', step: 'conclusions', hasAISuggestion: hasSelection });
            onNext(getCombinedValue(conclusions));
          }} disabled={!hasContent} className="w-full">
            Continue <ArrowRight className="w-5 h-5" />
          </Button>
          <Button variant="ghost" onClick={onBack} className="w-full"><ArrowLeft className="w-4 h-4" /> Back</Button>
        </motion.div>
      </div>
    </WizardStep>
  );
};