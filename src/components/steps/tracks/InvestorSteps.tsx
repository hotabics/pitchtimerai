import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Target, BarChart3, TrendingUp, DollarSign, Banknote, HelpCircle } from "lucide-react";
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

// Step 1: The Opportunity
interface OpportunityStepProps {
  onNext: (opportunity: string) => void;
  onBack: () => void;
  initialValue?: string;
  idea?: string;
}

export const InvestorOpportunityStep = ({ onNext, onBack, initialValue = "", idea = "" }: OpportunityStepProps) => {
  const [opportunity, setOpportunity] = useState(initialValue);

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
    type: "investor-opportunity-suggestions",
    idea,
    fallbackSuggestions: [
      "SMBs lose $10K annually to inventory mismanagement, affecting 68% of retailers",
      "Enterprise teams waste 15+ hours weekly on manual reporting tasks",
      "Customer churn costs SaaS companies 5-25x more than retention",
      "Security breaches cost SMBs an average of $120K per incident",
    ],
  });

  const hasContent = opportunity.trim() || hasSelection;

  return (
    <WizardStep title="The Opportunity" subtitle="Problem cost & frequency - why is this worth solving?">
      <div className="flex-1 flex flex-col">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Target className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-sm text-muted-foreground">Quantify the pain: How much does this problem cost? How often does it occur?</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="opportunity">Problem Cost & Frequency</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger><HelpCircle className="w-4 h-4 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent className="max-w-xs"><p>Example: "SMBs lose $10K/year to inventory mismanagement. 68% face this issue monthly."</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              id="opportunity"
              placeholder="e.g., Enterprise teams waste 15 hours/week on manual reporting. 89% of Fortune 500 companies face this problem..."
              value={opportunity}
              onChange={(e) => setOpportunity(e.target.value)}
              className="min-h-[100px] resize-none"
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
          <Button variant="default" size="lg" onClick={() => onNext(getCombinedValue(opportunity))} disabled={!hasContent} className="w-full">
            Continue <ArrowRight className="w-5 h-5" />
          </Button>
          <Button variant="ghost" onClick={onBack} className="w-full"><ArrowLeft className="w-4 h-4" /> Back</Button>
        </motion.div>
      </div>
    </WizardStep>
  );
};

// Step 2: Market Size
interface MarketStepProps {
  onNext: (market: string) => void;
  onBack: () => void;
  initialValue?: string;
  idea?: string;
}

export const InvestorMarketStep = ({ onNext, onBack, initialValue = "", idea = "" }: MarketStepProps) => {
  const [market, setMarket] = useState(initialValue);

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
    type: "investor-market-suggestions",
    idea,
    fallbackSuggestions: [
      "Global market size: $45B TAM with 12% annual growth rate",
      "US mid-market segment: $12B SAM, underserved by current solutions",
      "Target SOM: $300M achievable within 5 years (2.5% market share)",
      "Enterprise segment growing 20% YoY, driven by digital transformation",
    ],
  });

  const hasContent = market.trim() || hasSelection;

  return (
    <WizardStep title="Market Size" subtitle="TAM/SAM/SOM or Target Segment">
      <div className="flex-1 flex flex-col">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-sm text-muted-foreground">Show the size of the prize - VCs need to see a big enough market</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="market">Market Size</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger><HelpCircle className="w-4 h-4 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent className="max-w-xs"><p>TAM = Total market. SAM = Serviceable market. SOM = Obtainable market</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              id="market"
              placeholder="e.g., TAM: $45B global expense management..."
              value={market}
              onChange={(e) => setMarket(e.target.value)}
              className="min-h-[100px] resize-none"
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
          <Button variant="default" size="lg" onClick={() => onNext(getCombinedValue(market))} disabled={!hasContent} className="w-full">
            Continue <ArrowRight className="w-5 h-5" />
          </Button>
          <Button variant="ghost" onClick={onBack} className="w-full"><ArrowLeft className="w-4 h-4" /> Back</Button>
        </motion.div>
      </div>
    </WizardStep>
  );
};

// Step 3: Traction
interface TractionStepProps {
  onNext: (traction: string) => void;
  onBack: () => void;
  initialValue?: string;
  idea?: string;
}

export const InvestorTractionStep = ({ onNext, onBack, initialValue = "", idea = "" }: TractionStepProps) => {
  const [traction, setTraction] = useState(initialValue);

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
    type: "investor-traction-suggestions",
    idea,
    fallbackSuggestions: [
      "2,500 active users with 40% month-over-month growth",
      "$15K MRR with 90% customer retention rate",
      "3 enterprise pilots including Fortune 500 companies",
      "8,000+ waitlist signups from organic marketing",
    ],
  });

  const hasContent = traction.trim() || hasSelection;

  return (
    <WizardStep title="Traction" subtitle="Users, Revenue, Pilots, or Waitlist">
      <div className="flex-1 flex flex-col">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-sm text-muted-foreground">Show evidence of demand - even early signals matter</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="traction">Current Traction</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger><HelpCircle className="w-4 h-4 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent className="max-w-xs"><p>Include: Active users, revenue, growth rate, notable customers</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              id="traction"
              placeholder="e.g., 2,500 active users (40% MoM growth)..."
              value={traction}
              onChange={(e) => setTraction(e.target.value)}
              className="min-h-[100px] resize-none"
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
          <Button variant="default" size="lg" onClick={() => onNext(getCombinedValue(traction))} disabled={!hasContent} className="w-full">
            Continue <ArrowRight className="w-5 h-5" />
          </Button>
          <Button variant="ghost" onClick={onBack} className="w-full"><ArrowLeft className="w-4 h-4" /> Back</Button>
        </motion.div>
      </div>
    </WizardStep>
  );
};

// Step 4: Business Model
interface BusinessModelStepProps {
  onNext: (model: string) => void;
  onBack: () => void;
  initialValue?: string;
  idea?: string;
}

export const InvestorBusinessModelStep = ({ onNext, onBack, initialValue = "", idea = "" }: BusinessModelStepProps) => {
  const [model, setModel] = useState(initialValue);

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
    type: "investor-business-model-suggestions",
    idea,
    fallbackSuggestions: [
      "SaaS subscription: $29/mo starter, $99/mo team, $299/mo enterprise",
      "Freemium model with premium features at $49/mo",
      "Usage-based pricing: $0.10 per transaction processed",
      "LTV: $2,400 | CAC: $200 | 12x LTV/CAC ratio",
    ],
  });

  const hasContent = model.trim() || hasSelection;

  return (
    <WizardStep title="Business Model" subtitle="Who pays and how much?">
      <div className="flex-1 flex flex-col">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-sm text-muted-foreground">Clear monetization = investor confidence</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="model">Revenue Model</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger><HelpCircle className="w-4 h-4 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent className="max-w-xs"><p>Include: Pricing tiers, customer segments, unit economics</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              id="model"
              placeholder="e.g., SaaS subscription with tiered pricing..."
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="min-h-[100px] resize-none"
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
          <Button variant="default" size="lg" onClick={() => onNext(getCombinedValue(model))} disabled={!hasContent} className="w-full">
            Continue <ArrowRight className="w-5 h-5" />
          </Button>
          <Button variant="ghost" onClick={onBack} className="w-full"><ArrowLeft className="w-4 h-4" /> Back</Button>
        </motion.div>
      </div>
    </WizardStep>
  );
};

// Step 5: The Ask
interface AskStepProps {
  onNext: (ask: string) => void;
  onBack: () => void;
  initialValue?: string;
  idea?: string;
}

export const InvestorAskStep = ({ onNext, onBack, initialValue = "", idea = "" }: AskStepProps) => {
  const [ask, setAsk] = useState(initialValue);

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
    type: "investor-ask-suggestions",
    idea,
    fallbackSuggestions: [
      "Raising $500K: 50% engineering, 30% sales, 20% operations for 18-month runway",
      "Seeking $1M seed to reach $100K MRR and Series A readiness",
      "Pre-seed of $250K to validate product-market fit with 1,000 users",
      "Bridge round of $300K for 12-month runway to profitability",
    ],
  });

  const hasContent = ask.trim() || hasSelection;

  return (
    <WizardStep title="The Ask" subtitle="Investment amount & use of funds">
      <div className="flex-1 flex flex-col">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4 mb-6 border-2 border-emerald-500/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Banknote className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="text-sm font-semibold text-emerald-400">THE CLOSE</span>
          </div>
          <p className="text-sm text-muted-foreground">Be specific: How much do you need and what will you do with it?</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="ask">Investment Ask</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger><HelpCircle className="w-4 h-4 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent className="max-w-xs"><p>Include: Amount, runway, allocation breakdown, milestones</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              id="ask"
              placeholder="e.g., Raising $500K seed round..."
              value={ask}
              onChange={(e) => setAsk(e.target.value)}
              className="min-h-[100px] resize-none"
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
          <Button variant="default" size="lg" onClick={() => onNext(getCombinedValue(ask))} disabled={!hasContent} className="w-full">
            Continue <ArrowRight className="w-5 h-5" />
          </Button>
          <Button variant="ghost" onClick={onBack} className="w-full"><ArrowLeft className="w-4 h-4" /> Back</Button>
        </motion.div>
      </div>
    </WizardStep>
  );
};