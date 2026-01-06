import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Users, Zap, Code, CheckCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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

// Step 1: The Pain
interface PainStepProps {
  onNext: (pain: string) => void;
  onBack: () => void;
  initialValue?: string;
  idea?: string;
}

export const HackathonPainStep = ({ onNext, onBack, initialValue = "", idea = "" }: PainStepProps) => {
  const [pain, setPain] = useState(initialValue);
  
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
    type: "pain-suggestions",
    idea,
    fallbackSuggestions: [
      "Users spend too much time on repetitive manual tasks",
      "Existing solutions are too complex or expensive",
      "Critical information is scattered across multiple tools",
      "No real-time visibility into key metrics or status",
    ],
  });

  const hasContent = pain.trim() || hasSelection;

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

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 space-y-3"
        >
          <Button
            variant="default"
            size="lg"
            onClick={() => onNext(getCombinedValue(pain))}
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

export const HackathonFixStep = ({ onNext, onBack, initialValue = "", idea = "", pain = "" }: FixStepProps) => {
  const [fix, setFix] = useState(initialValue);

  const {
    suggestions,
    selectedSuggestions,
    isLoading,
    toggleSuggestion,
    regenerate,
    getCombinedValue,
    hasSelection,
  } = useSuggestions({
    type: "fix-suggestions",
    idea,
    context: { pain },
    fallbackSuggestions: [
      "Automates the entire workflow with AI-powered assistance",
      "Provides a unified dashboard for real-time tracking",
      "Uses smart notifications to keep users informed",
      "Integrates with existing tools for seamless adoption",
    ],
  });

  const hasContent = fix.trim() || hasSelection;

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

          <AISuggestions
            suggestions={suggestions}
            selectedSuggestions={selectedSuggestions}
            isLoading={isLoading}
            onToggle={toggleSuggestion}
            onRegenerate={regenerate}
            accentColor="emerald"
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
            onClick={() => onNext(getCombinedValue(fix))}
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

// Step 3: Hackathon Progress
interface ProgressStepProps {
  onNext: (progress: string) => void;
  onBack: () => void;
  initialValue?: string;
  idea?: string;
}

export const HackathonProgressStep = ({ onNext, onBack, initialValue = "", idea = "" }: ProgressStepProps) => {
  const [progress, setProgress] = useState(initialValue);

  const {
    suggestions,
    selectedSuggestions,
    isLoading,
    toggleSuggestion,
    regenerate,
    getCombinedValue,
    hasSelection,
  } = useSuggestions({
    type: "progress-suggestions",
    idea,
    fallbackSuggestions: [
      "Built with React + Supabase for real-time data sync",
      "Implemented AI processing using OpenAI GPT-4 API",
      "Created responsive UI with Tailwind CSS",
      "Added authentication and user management",
    ],
  });

  const hasContent = progress.trim() || hasSelection;

  return (
    <WizardStep
      title="What You Built"
      subtitle="What did you actually build this weekend?"
    >
      <div className="flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4 mb-6 border-2 border-cyan-500/30"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Code className="w-5 h-5 text-cyan-500" />
            </div>
            <span className="text-sm font-semibold text-cyan-400">HACKATHON CRITICAL</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Judges want to see real progress - what features work? What tech did you use?
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
              <Label htmlFor="progress">Technical Progress</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Example: "Built a working MVP with React, integrated OpenAI API for text analysis, and deployed on Vercel"</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              id="progress"
              placeholder="e.g., Built a React app with Supabase backend, integrated Stripe for payments..."
              value={progress}
              onChange={(e) => setProgress(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>

          <AISuggestions
            suggestions={suggestions}
            selectedSuggestions={selectedSuggestions}
            isLoading={isLoading}
            onToggle={toggleSuggestion}
            onRegenerate={regenerate}
            accentColor="cyan"
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
            onClick={() => onNext(getCombinedValue(progress))}
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
      title="Next Steps"
      subtitle="What's the path to making this real?"
    >
      <div className="flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4 mb-6 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-sm text-muted-foreground">
            Show you've thought about the future - what comes after the hackathon?
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
              <Label htmlFor="feasibility">Your Next Steps</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Example: "Next week: user testing with 10 beta users. Next month: launch on Product Hunt"</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              id="feasibility"
              placeholder="e.g., Next week we'll onboard 5 beta users, then iterate based on feedback..."
              value={feasibility}
              onChange={(e) => setFeasibility(e.target.value)}
              className="min-h-[100px] resize-none"
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
            Finish
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
