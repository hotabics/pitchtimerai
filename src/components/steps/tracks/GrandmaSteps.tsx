import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Heart, Frown, Sparkles as SparklesIcon, Gift, ShieldCheck, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { trackEvent } from "@/utils/analytics";

// Step 1: The Connection
interface ConnectionStepProps {
  onNext: (connection: string) => void;
  onBack: () => void;
  initialValue?: string;
  idea?: string;
}

export const GrandmaConnectionStep = ({ onNext, onBack, initialValue = "", idea = "" }: ConnectionStepProps) => {
  const [connection, setConnection] = useState(initialValue);

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
    type: "grandma-connection-suggestions",
    idea,
    fallbackSuggestions: [
      "I want you to understand what I've been working on because I know you'll be proud",
      "I'm excited to share this because you always encouraged me to follow my dreams",
      "This is something that could help people like our family",
      "I want you to see how technology can make life easier",
    ],
  });

  const hasContent = connection.trim() || hasSelection;

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
            onRegenerate={regenerate}
            accentColor="pink"
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
            trackEvent('Wizard Step: Completed', { track: 'grandma', step: 'connection', hasAISuggestion: hasSelection });
            onNext(getCombinedValue(connection));
          }} disabled={!hasContent} className="w-full">
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
    type: "grandma-pain-suggestions",
    idea,
    fallbackSuggestions: [
      "You know how it's hard to remember which pills to take and when?",
      "Remember when finding a recipe meant looking through stacks of old books?",
      "You know how frustrating it is when you can't reach family easily?",
      "It's like when you have to wait in long lines just to pay a bill",
    ],
  });

  const hasContent = pain.trim() || hasSelection;

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
            trackEvent('Wizard Step: Completed', { track: 'grandma', step: 'pain', hasAISuggestion: hasSelection });
            onNext(getCombinedValue(pain));
          }} disabled={!hasContent} className="w-full">
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
    type: "grandma-analogy-suggestions",
    idea,
    fallbackSuggestions: [
      "It's like a friendly alarm clock that reminds you of important things",
      "It's like having a helpful assistant available anytime you need",
      "It's like a recipe box that never loses any recipes",
      "It's like a telephone that also shows pictures of your family",
    ],
  });

  const hasContent = analogy.trim() || hasSelection;

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
            trackEvent('Wizard Step: Completed', { track: 'grandma', step: 'analogy', hasAISuggestion: hasSelection });
            onNext(getCombinedValue(analogy));
          }} disabled={!hasContent} className="w-full">
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
    type: "grandma-benefits-suggestions",
    idea,
    fallbackSuggestions: [
      "It helps you stay connected with family without any confusing buttons",
      "You'll never miss an important appointment or reminder again",
      "It makes everyday tasks simpler so you have more time for what you love",
      "It's always there to help, like having a patient friend nearby",
    ],
  });

  const hasContent = benefits.trim() || hasSelection;

  return (
    <WizardStep title="The Benefits" subtitle="What good things will happen?">
      <div className="flex-1 flex flex-col">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Gift className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-sm text-muted-foreground">Focus on how it improves her life, not features</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="benefits">Life Improvements</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger><HelpCircle className="w-4 h-4 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent className="max-w-xs"><p>Think: "This means you'll never have to worry about..."</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="benefits"
              placeholder="e.g., This means you'll always know when to take your medicine..."
              value={benefits}
              onChange={(e) => setBenefits(e.target.value)}
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
            isRateLimited={isRateLimited}
            remainingAttempts={remainingAttempts}
            cooldownSeconds={cooldownSeconds}
          />
        </motion.div>

        <div className="flex-1" />

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-6 space-y-3">
          <Button variant="default" size="lg" onClick={() => {
            trackEvent('Wizard Step: Completed', { track: 'grandma', step: 'benefits', hasAISuggestion: hasSelection });
            onNext(getCombinedValue(benefits));
          }} disabled={!hasContent} className="w-full">
            Continue <ArrowRight className="w-5 h-5" />
          </Button>
          <Button variant="ghost" onClick={onBack} className="w-full"><ArrowLeft className="w-4 h-4" /> Back</Button>
        </motion.div>
      </div>
    </WizardStep>
  );
};

// Step 5: Safety / Trust
interface SafetyStepProps {
  onNext: (safety: string) => void;
  onBack: () => void;
  initialValue?: string;
  idea?: string;
}

export const GrandmaSafetyStep = ({ onNext, onBack, initialValue = "", idea = "" }: SafetyStepProps) => {
  const [safety, setSafety] = useState(initialValue);

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
    type: "grandma-safety-suggestions",
    idea,
    fallbackSuggestions: [
      "It's completely safe and you can't accidentally break anything",
      "Your personal information is protected just like at the bank",
      "It's as easy as making a phone call - no complicated steps",
      "Millions of people just like you use it every day without any problems",
    ],
  });

  const hasContent = safety.trim() || hasSelection;

  return (
    <WizardStep title="Safety & Trust" subtitle="Address her concerns about technology">
      <div className="flex-1 flex flex-col">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-sm text-muted-foreground">Reassure her that it's safe and easy to use</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="safety">Reassurance</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger><HelpCircle className="w-4 h-4 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent className="max-w-xs"><p>Address common fears: "Is it safe?", "Will I break it?", "Is it hard to learn?"</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="safety"
              placeholder="e.g., It's completely safe - you can't break anything by pressing the wrong button..."
              value={safety}
              onChange={(e) => setSafety(e.target.value)}
              className="h-12"
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
            trackEvent('Wizard Step: Completed', { track: 'grandma', step: 'safety', hasAISuggestion: hasSelection });
            onNext(getCombinedValue(safety));
          }} disabled={!hasContent} className="w-full">
            Finish <ArrowRight className="w-5 h-5" />
          </Button>
          <Button variant="ghost" onClick={onBack} className="w-full"><ArrowLeft className="w-4 h-4" /> Back</Button>
        </motion.div>
      </div>
    </WizardStep>
  );
};
