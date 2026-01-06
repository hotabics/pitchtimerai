import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectionCard } from "@/components/SelectionCard";
import { StepWrapper } from "@/components/StepWrapper";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Step5SolutionProps {
  idea: string;
  onNext: (pitch: string) => void;
  onBack: () => void;
}

interface Pitch {
  id: string;
  title: string;
  pitch: string;
}

export const Step5Solution = ({ idea, onNext, onBack }: Step5SolutionProps) => {
  const [selected, setSelected] = useState("");
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPitches = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('generate-pitch', {
          body: { type: 'pitches', idea }
        });

        if (error) throw error;
        
        if (data?.result) {
          setPitches(data.result);
        }
      } catch (error) {
        console.error('Failed to generate pitches:', error);
        toast({
          title: "AI Generation Failed",
          description: "Using fallback pitches.",
          variant: "destructive"
        });
        // Fallback pitches
        setPitches([
          { id: "1", title: "The Uber Model", pitch: `Think of it as "Uber for ${idea}" — we connect demand with supply in real-time.` },
          { id: "2", title: "The Airbnb Model", pitch: `We're building "Airbnb for ${idea}" — unlocking unused resources and creating value.` },
          { id: "3", title: "The Slack Model", pitch: `Imagine "Slack for ${idea}" — a central hub that replaces fragmented tools.` },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPitches();
  }, [idea, toast]);

  const handleNext = () => {
    const pitch = pitches.find((p) => p.id === selected);
    if (pitch) onNext(pitch.pitch);
  };

  return (
    <StepWrapper
      title="Your Elevator Pitch"
      subtitle="Choose the analogy that fits best"
    >
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
          <Sparkles className="w-4 h-4 text-warning" />
          <span>AI-crafted pitch variations</span>
        </div>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Crafting your pitches...</p>
          </div>
        ) : (
          <div className="space-y-3 flex-1">
            {pitches.map((pitch, index) => (
              <motion.div
                key={pitch.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
              >
                <SelectionCard
                  title={pitch.title}
                  description={pitch.pitch}
                  selected={selected === pitch.id}
                  onClick={() => setSelected(pitch.id)}
                />
              </motion.div>
            ))}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 space-y-3"
        >
          <Button
            variant="default"
            size="lg"
            onClick={handleNext}
            disabled={isLoading || !selected}
            className="w-full"
          >
            Lock In Pitch
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
