import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Heart, Frown, Sparkles, Gift, ShieldCheck, HelpCircle } from "lucide-react";
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

// Step 1: The Connection
interface ConnectionStepProps {
  onNext: (connection: string) => void;
  onBack: () => void;
  initialValue?: string;
}

export const GrandmaConnectionStep = ({ onNext, onBack, initialValue = "" }: ConnectionStepProps) => {
  const [connection, setConnection] = useState(initialValue);

  return (
    <WizardStep
      title="The Connection"
      subtitle="Why do you care about her knowing this?"
    >
      <div className="flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4 mb-6 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
            <Heart className="w-5 h-5 text-pink-500" />
          </div>
          <p className="text-sm text-muted-foreground">
            Start with WHY this matters to you personally - emotion first!
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
              <Label htmlFor="connection">Your Personal "Why"</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>💡 Don't use technical jargon! Speak from the heart about why you're excited.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="connection"
              placeholder="e.g., I want you to understand what I've been working on so hard because I know you'll be proud..."
              value={connection}
              onChange={(e) => setConnection(e.target.value)}
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
            onClick={() => onNext(connection)}
            disabled={!connection.trim()}
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

// Step 2: The Pain (Relatable)
interface PainStepProps {
  onNext: (pain: string) => void;
  onBack: () => void;
  initialValue?: string;
}

export const GrandmaPainStep = ({ onNext, onBack, initialValue = "" }: PainStepProps) => {
  const [pain, setPain] = useState(initialValue);

  return (
    <WizardStep
      title="The Pain"
      subtitle="A relatable situation she would understand"
    >
      <div className="flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4 mb-6 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Frown className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-sm text-muted-foreground">
            Use everyday examples she can relate to - like opening jars or finding recipes
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
              <Label htmlFor="pain">Relatable Problem</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>💡 Use simple language! "You know how it's hard to..." or "Remember when..."</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="pain"
              placeholder="e.g., You know how it's hard to remember which pills to take and when?"
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

// Step 3: The Analogy
interface AnalogyStepProps {
  onNext: (analogy: string) => void;
  onBack: () => void;
  initialValue?: string;
}

export const GrandmaAnalogyStep = ({ onNext, onBack, initialValue = "" }: AnalogyStepProps) => {
  const [analogy, setAnalogy] = useState(initialValue);

  return (
    <WizardStep
      title="The Analogy"
      subtitle="It's like a [familiar thing] for [your thing]"
    >
      <div className="flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4 mb-6 border-2 border-amber-500/30"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-sm font-semibold text-amber-400">THE MAGIC COMPARISON</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Compare your product to something she uses daily - a radio, alarm clock, recipe book, etc.
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
              <Label htmlFor="analogy">Your Analogy</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>💡 Format: "It's like a [thing she knows] but for [what it does]"</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="analogy"
              placeholder="e.g., It's like a friendly alarm clock that reminds you which medicine to take"
              value={analogy}
              onChange={(e) => setAnalogy(e.target.value)}
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
            onClick={() => onNext(analogy)}
            disabled={!analogy.trim()}
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

// Step 4: The Benefits
interface BenefitsStepProps {
  onNext: (benefits: string) => void;
  onBack: () => void;
  initialValue?: string;
}

export const GrandmaBenefitsStep = ({ onNext, onBack, initialValue = "" }: BenefitsStepProps) => {
  const [benefits, setBenefits] = useState(initialValue);

  return (
    <WizardStep
      title="The Benefits"
      subtitle="3 simple things it helps with"
    >
      <div className="flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4 mb-6 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Gift className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-sm text-muted-foreground">
            List 3 simple benefits using words she'd use
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
              <Label htmlFor="benefits">3 Simple Benefits</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>💡 Use action words: "It helps you...", "You can...", "No more..."</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              id="benefits"
              placeholder="e.g., 
1. Never forget to take your medicine again
2. Your kids can check you're okay without calling every day
3. The doctor can see if something's wrong before you feel sick"
              value={benefits}
              onChange={(e) => setBenefits(e.target.value)}
              className="min-h-[140px] resize-none"
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
            onClick={() => onNext(benefits)}
            disabled={!benefits.trim()}
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

// Step 5: Safety
interface SafetyStepProps {
  onNext: (safety: string) => void;
  onBack: () => void;
  initialValue?: string;
}

export const GrandmaSafetyStep = ({ onNext, onBack, initialValue = "" }: SafetyStepProps) => {
  const [safety, setSafety] = useState(initialValue);

  return (
    <WizardStep
      title="Safety & Trust"
      subtitle="Why is it safe/unbreakable?"
    >
      <div className="flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4 mb-6 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-sm text-muted-foreground">
            Address concerns about it being complicated, breaking, or being "hackable"
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
              <Label htmlFor="safety">Safety Reassurance</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>💡 Use reassuring language: "You can't break it", "It's like a lock on a door"</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              id="safety"
              placeholder="e.g., 
• You can't break it by pressing the wrong button
• Only you and your doctor can see your information
• It's like a lock on a diary - nobody else can read it
• If it ever stops working, it tells you right away"
              value={safety}
              onChange={(e) => setSafety(e.target.value)}
              className="min-h-[140px] resize-none"
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
            onClick={() => onNext(safety)}
            disabled={!safety.trim()}
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
