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

// Step 1: The Pain
interface PainStepProps {
  onNext: (pain: string) => void;
  onBack: () => void;
  initialValue?: string;
}

export const HackathonPainStep = ({ onNext, onBack, initialValue = "" }: PainStepProps) => {
  const [pain, setPain] = useState(initialValue);

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
            onClick={() => onNext(pain)}
            disabled={!pain.trim()}
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
}

export const HackathonFixStep = ({ onNext, onBack, initialValue = "" }: FixStepProps) => {
  const [fix, setFix] = useState(initialValue);

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
            onClick={() => onNext(fix)}
            disabled={!fix.trim()}
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
}

export const HackathonProgressStep = ({ onNext, onBack, initialValue = "" }: ProgressStepProps) => {
  const [progress, setProgress] = useState(initialValue);

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
              className="min-h-[180px] resize-none"
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
            onClick={() => onNext(progress)}
            disabled={!progress.trim()}
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
