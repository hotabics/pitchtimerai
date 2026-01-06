import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, MessageCircle, Play, Layers, Shield, HelpCircle, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { WizardStep } from "@/components/WizardStep";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Step 1: Context
interface ContextStepProps {
  onNext: (context: string) => void;
  onBack: () => void;
  initialValue?: string;
}

export const DemoContextStep = ({ onNext, onBack, initialValue = "" }: ContextStepProps) => {
  const [context, setContext] = useState(initialValue);

  return (
    <WizardStep
      title="The Context"
      subtitle="Why is the current solution slow/expensive?"
    >
      <div className="flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4 mb-6 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-sm text-muted-foreground">
            Set up the "before" state to make your demo's "after" feel magical
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
              <Label htmlFor="context">Current Problem Context</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Example: "Traditional expense reporting takes 2+ hours per week and requires manual receipt entry"</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="context"
              placeholder="e.g., Currently, developers spend 30 min setting up boilerplate for each project..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
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
            onClick={() => onNext(context)}
            disabled={!context.trim()}
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

// Step 2: Demo Setup
interface DemoSetupStepProps {
  onNext: (demoFlow: string) => void;
  onBack: () => void;
  initialValue?: string;
}

export const DemoSetupStep = ({ onNext, onBack, initialValue = "" }: DemoSetupStepProps) => {
  const [demoFlow, setDemoFlow] = useState(initialValue);

  return (
    <WizardStep
      title="Demo Flow"
      subtitle="What is the specific user flow you will show?"
    >
      <div className="flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4 mb-6 border-2 border-red-500/30"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <Play className="w-5 h-5 text-red-500" />
            </div>
            <span className="text-sm font-semibold text-red-400">DEMO CHOREOGRAPHY</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Write out each click/step so you can practice the exact sequence
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
              <Label htmlFor="demoFlow">Demo Steps</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Format: Step 1 → Step 2 → Step 3. Include what the audience will see at each moment.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              id="demoFlow"
              placeholder="e.g., 
1. Open app → Show empty dashboard
2. Click 'Scan Receipt' → Camera opens
3. Take photo → AI processes (3 sec)
4. Show auto-categorized expense
5. Click 'Dashboard' → See updated chart"
              value={demoFlow}
              onChange={(e) => setDemoFlow(e.target.value)}
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
            onClick={() => onNext(demoFlow)}
            disabled={!demoFlow.trim()}
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

// Step 3: Architecture Summary
interface ArchitectureStepProps {
  onNext: (architecture: string) => void;
  onBack: () => void;
  initialValue?: string;
}

export const DemoArchitectureStep = ({ onNext, onBack, initialValue = "" }: ArchitectureStepProps) => {
  const [architecture, setArchitecture] = useState(initialValue);

  return (
    <WizardStep
      title="Technical Architecture"
      subtitle="One sentence summary of how it works"
    >
      <div className="flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4 mb-6 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Layers className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-sm text-muted-foreground">
            Keep it brief - judges don't need deep technical details
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
              <Label htmlFor="architecture">Architecture Summary</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Example: "React frontend → Supabase backend → OpenAI API for categorization"</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="architecture"
              placeholder="e.g., Mobile app (React Native) + Cloud functions (AWS Lambda) + AI layer (GPT-4)"
              value={architecture}
              onChange={(e) => setArchitecture(e.target.value)}
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
            onClick={() => onNext(architecture)}
            disabled={!architecture.trim()}
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

// Step 4: Fallback Plan
interface FallbackStepProps {
  onNext: (hasFallback: boolean) => void;
  onBack: () => void;
  initialValue?: boolean;
}

export const DemoFallbackStep = ({ onNext, onBack, initialValue = false }: FallbackStepProps) => {
  const [hasScreenshots, setHasScreenshots] = useState(initialValue);
  const [hasVideo, setHasVideo] = useState(false);
  const [hasMockData, setHasMockData] = useState(false);

  const anyFallback = hasScreenshots || hasVideo || hasMockData;

  return (
    <WizardStep
      title="Fallback Plan"
      subtitle="What's your backup if the demo fails?"
    >
      <div className="flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4 mb-6 border-2 border-amber-500/30"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-sm font-semibold text-amber-400">SAFETY NET</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Live demos can fail. Having a backup shows professionalism and preparation.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors">
              <Checkbox
                id="screenshots"
                checked={hasScreenshots}
                onCheckedChange={(checked) => setHasScreenshots(checked as boolean)}
              />
              <div className="flex-1">
                <Label htmlFor="screenshots" className="cursor-pointer font-medium">
                  Screenshots Ready
                </Label>
                <p className="text-xs text-muted-foreground">High-quality screenshots of each key screen</p>
              </div>
              <CheckSquare className="w-5 h-5 text-muted-foreground" />
            </div>

            <div className="flex items-center space-x-3 p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors">
              <Checkbox
                id="video"
                checked={hasVideo}
                onCheckedChange={(checked) => setHasVideo(checked as boolean)}
              />
              <div className="flex-1">
                <Label htmlFor="video" className="cursor-pointer font-medium">
                  Backup Video
                </Label>
                <p className="text-xs text-muted-foreground">Pre-recorded video of the demo flow</p>
              </div>
              <Play className="w-5 h-5 text-muted-foreground" />
            </div>

            <div className="flex items-center space-x-3 p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors">
              <Checkbox
                id="mockdata"
                checked={hasMockData}
                onCheckedChange={(checked) => setHasMockData(checked as boolean)}
              />
              <div className="flex-1">
                <Label htmlFor="mockdata" className="cursor-pointer font-medium">
                  Mock Data Ready
                </Label>
                <p className="text-xs text-muted-foreground">Pre-loaded demo data to avoid API failures</p>
              </div>
              <Layers className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>

          {!anyFallback && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-amber-500 p-3 bg-amber-500/10 rounded-lg"
            >
              ⚠️ We recommend having at least one fallback ready
            </motion.p>
          )}
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
            onClick={() => onNext(anyFallback)}
            className="w-full"
          >
            {anyFallback ? "Continue (Fallback Ready)" : "Continue Anyway"}
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
