import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, FileText, Presentation, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WizardStep } from "@/components/WizardStep";
import { useState } from "react";

interface Step7GenerationProps {
  onNext: (tier: string, tierLabel: string) => void;
  onBack: () => void;
}

const generationTiers = [
  {
    id: "script",
    label: "Script Only",
    description: "AI-generated speech script with timing cues and transitions.",
    price: "Free",
    icon: FileText,
    features: ["Full speech script", "Timing markers", "Transition cues"],
    color: "from-slate-500/20 to-slate-600/10",
    iconColor: "text-slate-500",
  },
  {
    id: "deck",
    label: "Script + Deck",
    description: "Complete script with auto-generated slide layouts and content.",
    price: "Pro",
    icon: Presentation,
    features: ["Everything in Script", "Slide outlines", "Visual suggestions"],
    color: "from-blue-500/20 to-blue-600/10",
    iconColor: "text-blue-500",
    popular: true,
  },
  {
    id: "showstopper",
    label: "The Showstopper",
    description: "Full pitch package with script, slides, demo choreography, and practice mode.",
    price: "Premium",
    icon: Sparkles,
    features: ["Everything in Deck", "Demo choreography", "Practice teleprompter", "Stage directions"],
    color: "from-amber-500/20 to-amber-600/10",
    iconColor: "text-amber-500",
  },
];

export const Step7Generation = ({ onNext, onBack }: Step7GenerationProps) => {
  const [selected, setSelected] = useState("deck");

  const handleNext = () => {
    const tier = generationTiers.find((t) => t.id === selected);
    if (tier) {
      onNext(selected, tier.label);
    }
  };

  return (
    <WizardStep
      title="Choose Your Package"
      subtitle="Select what you'd like AI to generate for you"
    >
      <div className="flex-1 flex flex-col">
        <div className="space-y-4">
          {generationTiers.map((tier, index) => {
            const Icon = tier.icon;
            const isSelected = selected === tier.id;

            return (
              <motion.button
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setSelected(tier.id)}
                className={`relative w-full p-5 rounded-2xl border-2 text-left transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-4 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Most Popular
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${tier.color}`}
                  >
                    <Icon
                      className={`w-7 h-7 ${
                        isSelected ? "text-primary" : tier.iconColor
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3
                        className={`font-semibold ${
                          isSelected ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {tier.label}
                      </h3>
                      <span
                        className={`text-sm font-medium ${
                          tier.price === "Free"
                            ? "text-success"
                            : tier.price === "Pro"
                            ? "text-blue-500"
                            : "text-amber-500"
                        }`}
                      >
                        {tier.price}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {tier.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {tier.features.map((feature) => (
                        <span
                          key={feature}
                          className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0"
                    >
                      <svg
                        className="w-4 h-4 text-primary-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </motion.div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        <div className="flex-1" />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 space-y-3"
        >
          <Button
            variant="time"
            size="xl"
            onClick={handleNext}
            className="w-full"
          >
            <Sparkles className="w-5 h-5" />
            Generate My Pitch
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
