import { motion } from "framer-motion";
import { ArrowRight, Gavel, TrendingUp, Users, Coffee, ArrowLeft, GraduationCap, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WizardStep } from "@/components/WizardStep";
import { useState } from "react";

interface Step2AudienceProps {
  onNext: (audience: string, audienceLabel: string) => void;
  onBack: () => void;
}

const audienceOptions = [
  {
    id: "judges",
    label: "Hackathon (The Jury)",
    description: "Innovation & Business Model focus. Industry experts evaluating technical merit.",
    icon: Gavel,
    color: "from-violet-500/20 to-violet-600/10",
    iconColor: "text-violet-500",
  },
  {
    id: "investors",
    label: "The Investors (VCs)",
    description: "Scalability & ROI focus. Looking for market potential and growth metrics.",
    icon: TrendingUp,
    color: "from-emerald-500/20 to-emerald-600/10",
    iconColor: "text-emerald-500",
  },
  {
    id: "users",
    label: "The Users (Crowd)",
    description: "UX & Emotion focus. End users who need to feel the product solves their problem.",
    icon: Users,
    color: "from-blue-500/20 to-blue-600/10",
    iconColor: "text-blue-500",
  },
  {
    id: "academic",
    label: "Academic Commission",
    description: "Thesis defense. Strict structure, methodology, and data-driven arguments.",
    icon: GraduationCap,
    color: "from-indigo-500/20 to-indigo-600/10",
    iconColor: "text-indigo-500",
  },
  {
    id: "peers",
    label: "Students / Friends / Peers",
    description: "Casual pitch. Authentic, relatable, no-BS approach for classmates or clubs.",
    icon: PartyPopper,
    color: "from-fuchsia-500/20 to-purple-600/10",
    iconColor: "text-fuchsia-500",
  },
  {
    id: "nontech",
    label: "Non-Tech (Grandma Test)",
    description: "Simplicity focus. Explain like you're talking to someone new to technology.",
    icon: Coffee,
    color: "from-amber-500/20 to-amber-600/10",
    iconColor: "text-amber-500",
  },
];

export const Step2Audience = ({ onNext, onBack }: Step2AudienceProps) => {
  const [selected, setSelected] = useState("");

  const handleNext = () => {
    const option = audienceOptions.find((a) => a.id === selected);
    if (option) {
      onNext(selected, option.label);
    }
  };

  return (
    <WizardStep
      title="Who needs to be convinced?"
      subtitle="Select your primary audience to tailor the pitch style"
    >
      <div className="flex-1 flex flex-col">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {audienceOptions.map((option, index) => {
            const Icon = option.icon;
            const isSelected = selected === option.id;

            return (
              <motion.button
                key={option.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelected(option.id)}
                className={`relative p-5 rounded-2xl border-2 text-left transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                    : "border-border bg-card hover:border-primary/50 hover:bg-muted/50"
                }`}
              >
                <div
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${option.color} opacity-50`}
                />
                <div className="relative">
                  <div
                    className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center ${
                      isSelected ? "bg-primary/20" : "bg-muted"
                    }`}
                  >
                    <Icon
                      className={`w-6 h-6 ${
                        isSelected ? "text-primary" : option.iconColor
                      }`}
                    />
                  </div>
                  <h3
                    className={`font-semibold mb-1 ${
                      isSelected ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {option.label}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {option.description}
                  </p>
                </div>

                {isSelected && (
                  <motion.div
                    layoutId="audience-check"
                    className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
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
            variant="default"
            size="lg"
            onClick={handleNext}
            disabled={!selected}
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
