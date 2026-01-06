import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Code, Figma, Video, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WizardStep } from "@/components/WizardStep";
import { useState } from "react";

interface Step3DemoProps {
  onNext: (demoType: string, demoLabel: string) => void;
  onBack: () => void;
}

const demoOptions = [
  {
    id: "live",
    label: "Live Code / App",
    description: "I will mirror my screen and show the real product.",
    subtext: "High Risk, High Reward",
    icon: Code,
    color: "from-red-500/20 to-red-600/10",
    iconColor: "text-red-500",
    riskLevel: "high",
  },
  {
    id: "prototype",
    label: "Clickable Prototype",
    description: "Figma, Adobe XD, or similar interactive mockup.",
    subtext: "Safe & Professional",
    icon: Figma,
    color: "from-purple-500/20 to-purple-600/10",
    iconColor: "text-purple-500",
    riskLevel: "medium",
  },
  {
    id: "video",
    label: "Video Walkthrough",
    description: "Pre-recorded video showing the product in action.",
    subtext: "Safest Option",
    icon: Video,
    color: "from-blue-500/20 to-blue-600/10",
    iconColor: "text-blue-500",
    riskLevel: "low",
  },
  {
    id: "none",
    label: "No Demo",
    description: "Slides only - focus on the story and vision.",
    subtext: "Pure Storytelling",
    icon: SlidersHorizontal,
    color: "from-slate-500/20 to-slate-600/10",
    iconColor: "text-slate-500",
    riskLevel: "none",
  },
];

export const Step3Demo = ({ onNext, onBack }: Step3DemoProps) => {
  const [selected, setSelected] = useState("");

  const handleNext = () => {
    const option = demoOptions.find((d) => d.id === selected);
    if (option) {
      onNext(selected, option.label);
    }
  };

  return (
    <WizardStep
      title="Will you show a Live Demo?"
      subtitle="This helps AI choreograph your stage movements and timing"
    >
      <div className="flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4 mb-6 text-sm text-muted-foreground"
        >
          💡 A well-timed demo can be the highlight of your pitch. Choose based on your confidence and preparation time.
        </motion.div>

        <div className="space-y-3">
          {demoOptions.map((option, index) => {
            const Icon = option.icon;
            const isSelected = selected === option.id;

            return (
              <motion.button
                key={option.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                whileHover={{ scale: 1.01, x: 4 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setSelected(option.id)}
                className={`relative w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${option.color}`}
                >
                  <Icon
                    className={`w-7 h-7 ${
                      isSelected ? "text-primary" : option.iconColor
                    }`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3
                      className={`font-semibold ${
                        isSelected ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {option.label}
                    </h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        option.riskLevel === "high"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : option.riskLevel === "medium"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                          : option.riskLevel === "low"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400"
                      }`}
                    >
                      {option.subtext}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {option.description}
                  </p>
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
