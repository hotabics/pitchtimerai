import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/Chip";
import { StepWrapper } from "@/components/StepWrapper";
import { useState } from "react";

interface Step6BusinessProps {
  onNext: (models: string[]) => void;
  onBack: () => void;
}

const businessModels = [
  { id: "subscription", label: "Subscription", emoji: "📅" },
  { id: "commission", label: "Commission", emoji: "💰" },
  { id: "freemium", label: "Freemium", emoji: "🎁" },
  { id: "ads", label: "Ads", emoji: "📢" },
  { id: "licensing", label: "Licensing", emoji: "📜" },
  { id: "marketplace", label: "Marketplace", emoji: "🏪" },
];

export const Step6Business = ({ onNext, onBack }: Step6BusinessProps) => {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleModel = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((s) => s !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  return (
    <StepWrapper
      title="Business Model"
      subtitle="How will you monetize your solution?"
    >
      <div className="flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4 mb-6 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-success" />
          </div>
          <p className="text-sm text-muted-foreground">
            Select one or more revenue models that fit your business
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-3"
        >
          {businessModels.map((model, index) => (
            <motion.div
              key={model.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + index * 0.05 }}
            >
              <Chip
                label={`${model.emoji} ${model.label}`}
                selected={selected.includes(model.id)}
                onSelect={() => toggleModel(model.id)}
              />
            </motion.div>
          ))}
        </motion.div>

        <div className="flex-1" />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 space-y-3"
        >
          <Button
            variant="default"
            size="lg"
            onClick={() => onNext(selected)}
            disabled={selected.length === 0}
            className="w-full"
          >
            Finalize Strategy
            <ArrowRight className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            onClick={onBack}
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </motion.div>
      </div>
    </StepWrapper>
  );
};
