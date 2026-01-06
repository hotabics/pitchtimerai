import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Target, BarChart3, TrendingUp, DollarSign, Banknote, HelpCircle } from "lucide-react";
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

// Step 1: The Opportunity
interface OpportunityStepProps {
  onNext: (opportunity: string) => void;
  onBack: () => void;
  initialValue?: string;
}

export const InvestorOpportunityStep = ({ onNext, onBack, initialValue = "" }: OpportunityStepProps) => {
  const [opportunity, setOpportunity] = useState(initialValue);

  return (
    <WizardStep
      title="The Opportunity"
      subtitle="Problem cost & frequency - why is this worth solving?"
    >
      <div className="flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4 mb-6 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Target className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-sm text-muted-foreground">
            Quantify the pain: How much does this problem cost? How often does it occur?
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
              <Label htmlFor="opportunity">Problem Cost & Frequency</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Example: "SMBs lose $10K/year to inventory mismanagement. 68% face this issue monthly."</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              id="opportunity"
              placeholder="e.g., Enterprise teams waste 15 hours/week on manual reporting. 89% of Fortune 500 companies face this problem, costing $2.3M annually per company..."
              value={opportunity}
              onChange={(e) => setOpportunity(e.target.value)}
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
            onClick={() => onNext(opportunity)}
            disabled={!opportunity.trim()}
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

// Step 2: Market Size
interface MarketStepProps {
  onNext: (market: string) => void;
  onBack: () => void;
  initialValue?: string;
}

export const InvestorMarketStep = ({ onNext, onBack, initialValue = "" }: MarketStepProps) => {
  const [market, setMarket] = useState(initialValue);

  return (
    <WizardStep
      title="Market Size"
      subtitle="TAM/SAM/SOM or Target Segment"
    >
      <div className="flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4 mb-6 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-sm text-muted-foreground">
            Show the size of the prize - VCs need to see a big enough market
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
              <Label htmlFor="market">Market Size</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>TAM = Total market. SAM = Serviceable market. SOM = Obtainable market (realistic 3-5 year goal)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              id="market"
              placeholder="e.g., 
TAM: $45B global expense management
SAM: $12B US mid-market segment
SOM: $300M (targeting 2.5% in 5 years)"
              value={market}
              onChange={(e) => setMarket(e.target.value)}
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
            onClick={() => onNext(market)}
            disabled={!market.trim()}
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

// Step 3: Traction
interface TractionStepProps {
  onNext: (traction: string) => void;
  onBack: () => void;
  initialValue?: string;
}

export const InvestorTractionStep = ({ onNext, onBack, initialValue = "" }: TractionStepProps) => {
  const [traction, setTraction] = useState(initialValue);

  return (
    <WizardStep
      title="Traction"
      subtitle="Users, Revenue, Pilots, or Waitlist"
    >
      <div className="flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4 mb-6 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-sm text-muted-foreground">
            Show evidence of demand - even early signals matter
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
              <Label htmlFor="traction">Current Traction</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Include: Active users, revenue, growth rate, notable customers, LOIs, waitlist size</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              id="traction"
              placeholder="e.g., 
• 2,500 active users (40% MoM growth)
• $15K MRR
• 3 enterprise pilots (incl. Fortune 500)
• 8,000 waitlist signups"
              value={traction}
              onChange={(e) => setTraction(e.target.value)}
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
            onClick={() => onNext(traction)}
            disabled={!traction.trim()}
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

// Step 4: Business Model
interface BusinessModelStepProps {
  onNext: (model: string) => void;
  onBack: () => void;
  initialValue?: string;
}

export const InvestorBusinessModelStep = ({ onNext, onBack, initialValue = "" }: BusinessModelStepProps) => {
  const [model, setModel] = useState(initialValue);

  return (
    <WizardStep
      title="Business Model"
      subtitle="Who pays and how much?"
    >
      <div className="flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4 mb-6 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-sm text-muted-foreground">
            Clear monetization = investor confidence
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
              <Label htmlFor="model">Revenue Model</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Include: Pricing tiers, customer segments, unit economics (CAC/LTV)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              id="model"
              placeholder="e.g., 
SaaS subscription:
• Starter: $29/mo (individuals)
• Team: $99/mo (SMBs)
• Enterprise: $499/mo (custom)

LTV: $2,400 | CAC: $200 | 12x ratio"
              value={model}
              onChange={(e) => setModel(e.target.value)}
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
            onClick={() => onNext(model)}
            disabled={!model.trim()}
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

// Step 5: The Ask
interface AskStepProps {
  onNext: (ask: string) => void;
  onBack: () => void;
  initialValue?: string;
}

export const InvestorAskStep = ({ onNext, onBack, initialValue = "" }: AskStepProps) => {
  const [ask, setAsk] = useState(initialValue);

  return (
    <WizardStep
      title="The Ask"
      subtitle="Investment amount & use of funds"
    >
      <div className="flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4 mb-6 border-2 border-emerald-500/30"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Banknote className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="text-sm font-semibold text-emerald-400">THE CLOSE</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Be specific: How much do you need and what will you do with it?
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
              <Label htmlFor="ask">Investment Ask</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Include: Amount, runway it provides, allocation breakdown, milestones it will achieve</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              id="ask"
              placeholder="e.g., 
Raising $500K seed round:
• 40% Engineering (2 hires)
• 30% Sales & Marketing
• 20% Operations
• 10% Buffer

18-month runway to $100K MRR"
              value={ask}
              onChange={(e) => setAsk(e.target.value)}
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
            onClick={() => onNext(ask)}
            disabled={!ask.trim()}
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
