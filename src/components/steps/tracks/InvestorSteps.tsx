import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Target, BarChart3, TrendingUp, DollarSign, Banknote, HelpCircle, Sparkles, Loader2, RefreshCw } from "lucide-react";
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
  accentColor = "emerald",
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

// Step 1: The Opportunity
interface OpportunityStepProps {
  onNext: (opportunity: string) => void;
  onBack: () => void;
  initialValue?: string;
  idea?: string;
}

export const InvestorOpportunityStep = ({ onNext, onBack, initialValue = "", idea = "" }: OpportunityStepProps) => {
  const [opportunity, setOpportunity] = useState(initialValue);
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
        body: { type: "investor-opportunity-suggestions", idea },
      });
      if (error) throw error;
      if (data?.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions.map((text: string, i: number) => ({ id: `s-${i}`, text })));
      }
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
      setSuggestions([
        { id: "s1", text: "SMBs lose $10K annually to inventory mismanagement, affecting 68% of retailers" },
        { id: "s2", text: "Enterprise teams waste 15+ hours weekly on manual reporting tasks" },
        { id: "s3", text: "Customer churn costs SaaS companies 5-25x more than retention" },
        { id: "s4", text: "Security breaches cost SMBs an average of $120K per incident" },
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
    if (opportunity.trim()) parts.push(opportunity.trim());
    return parts.join(". ");
  };

  const hasContent = opportunity.trim() || selectedSuggestions.length > 0;

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

// Step 2: Market Size
interface MarketStepProps {
  onNext: (market: string) => void;
  onBack: () => void;
  initialValue?: string;
  idea?: string;
}

export const InvestorMarketStep = ({ onNext, onBack, initialValue = "", idea = "" }: MarketStepProps) => {
  const [market, setMarket] = useState(initialValue);
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
        body: { type: "investor-market-suggestions", idea },
      });
      if (error) throw error;
      if (data?.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions.map((text: string, i: number) => ({ id: `s-${i}`, text })));
      }
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
      setSuggestions([
        { id: "s1", text: "Global market size: $45B TAM with 12% annual growth rate" },
        { id: "s2", text: "US mid-market segment: $12B SAM, underserved by current solutions" },
        { id: "s3", text: "Target SOM: $300M achievable within 5 years (2.5% market share)" },
        { id: "s4", text: "Enterprise segment growing 20% YoY, driven by digital transformation" },
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
    if (market.trim()) parts.push(market.trim());
    return parts.join(". ");
  };

  const hasContent = market.trim() || selectedSuggestions.length > 0;

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

// Step 3: Traction
interface TractionStepProps {
  onNext: (traction: string) => void;
  onBack: () => void;
  initialValue?: string;
  idea?: string;
}

export const InvestorTractionStep = ({ onNext, onBack, initialValue = "", idea = "" }: TractionStepProps) => {
  const [traction, setTraction] = useState(initialValue);
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
        body: { type: "investor-traction-suggestions", idea },
      });
      if (error) throw error;
      if (data?.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions.map((text: string, i: number) => ({ id: `s-${i}`, text })));
      }
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
      setSuggestions([
        { id: "s1", text: "2,500 active users with 40% month-over-month growth" },
        { id: "s2", text: "$15K MRR with 90% customer retention rate" },
        { id: "s3", text: "3 enterprise pilots including Fortune 500 companies" },
        { id: "s4", text: "8,000+ waitlist signups from organic marketing" },
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
    if (traction.trim()) parts.push(traction.trim());
    return parts.join(". ");
  };

  const hasContent = traction.trim() || selectedSuggestions.length > 0;

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

// Step 4: Business Model
interface BusinessModelStepProps {
  onNext: (model: string) => void;
  onBack: () => void;
  initialValue?: string;
  idea?: string;
}

export const InvestorBusinessModelStep = ({ onNext, onBack, initialValue = "", idea = "" }: BusinessModelStepProps) => {
  const [model, setModel] = useState(initialValue);
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
        body: { type: "investor-business-model-suggestions", idea },
      });
      if (error) throw error;
      if (data?.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions.map((text: string, i: number) => ({ id: `s-${i}`, text })));
      }
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
      setSuggestions([
        { id: "s1", text: "SaaS subscription: $29/mo starter, $99/mo team, $299/mo enterprise" },
        { id: "s2", text: "Freemium model with premium features at $49/mo" },
        { id: "s3", text: "Usage-based pricing: $0.10 per transaction processed" },
        { id: "s4", text: "LTV: $2,400 | CAC: $200 | 12x LTV/CAC ratio" },
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
    if (model.trim()) parts.push(model.trim());
    return parts.join(". ");
  };

  const hasContent = model.trim() || selectedSuggestions.length > 0;

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

// Step 5: The Ask
interface AskStepProps {
  onNext: (ask: string) => void;
  onBack: () => void;
  initialValue?: string;
  idea?: string;
}

export const InvestorAskStep = ({ onNext, onBack, initialValue = "", idea = "" }: AskStepProps) => {
  const [ask, setAsk] = useState(initialValue);
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
        body: { type: "investor-ask-suggestions", idea },
      });
      if (error) throw error;
      if (data?.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions.map((text: string, i: number) => ({ id: `s-${i}`, text })));
      }
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
      setSuggestions([
        { id: "s1", text: "Raising $500K: 50% engineering, 30% sales, 20% operations for 18-month runway" },
        { id: "s2", text: "Seeking $1M seed to reach $100K MRR and Series A readiness" },
        { id: "s3", text: "Pre-seed of $250K to validate product-market fit with 1,000 users" },
        { id: "s4", text: "Bridge round of $300K for 12-month runway to profitability" },
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
    if (ask.trim()) parts.push(ask.trim());
    return parts.join(". ");
  };

  const hasContent = ask.trim() || selectedSuggestions.length > 0;

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