import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Edit2, Lightbulb, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SelectionCard } from "@/components/SelectionCard";
import { StepWrapper } from "@/components/StepWrapper";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Step3ProblemProps {
  idea: string;
  onNext: (problem: string) => void;
  onBack: () => void;
}

interface Problem {
  id: string;
  title: string;
  description: string;
}

export const Step3Problem = ({ idea, onNext, onBack }: Step3ProblemProps) => {
  const [selected, setSelected] = useState("");
  const [customMode, setCustomMode] = useState(false);
  const [customProblem, setCustomProblem] = useState("");
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('generate-pitch', {
          body: { type: 'problems', idea }
        });

        if (error) throw error;
        
        if (data?.result) {
          setProblems(data.result);
        }
      } catch (error) {
        console.error('Failed to generate problems:', error);
        toast({
          title: "AI Generation Failed",
          description: "Using fallback suggestions. You can also write your own.",
          variant: "destructive"
        });
        // Fallback problems
        setProblems([
          { id: "1", title: "Efficiency Gap", description: `Teams struggle to organize and execute "${idea}" effectively due to fragmented tools.` },
          { id: "2", title: "Complexity Issue", description: `Current solutions for "${idea}" are too complex, leaving users frustrated.` },
          { id: "3", title: "Accessibility Barrier", description: `There's no affordable way to implement "${idea}" for small teams.` },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProblems();
  }, [idea, toast]);

  const handleNext = () => {
    if (customMode && customProblem.trim()) {
      onNext(customProblem);
    } else if (selected) {
      const problem = problems.find((p) => p.id === selected);
      if (problem) onNext(problem.description);
    }
  };

  return (
    <StepWrapper
      title="The Problem"
      subtitle="What pain point does your solution address?"
    >
      <div className="flex-1 flex flex-col">
        {!customMode ? (
          <>
            <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
              <Lightbulb className="w-4 h-4 text-warning" />
              <span>AI-generated based on your idea</span>
            </div>

            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Analyzing your idea...</p>
              </div>
            ) : (
              <div className="space-y-3 flex-1">
                {problems.map((problem, index) => (
                  <motion.div
                    key={problem.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.1 }}
                  >
                    <SelectionCard
                      title={problem.title || `Option ${index + 1}`}
                      description={problem.description}
                      selected={selected === problem.id}
                      onClick={() => setSelected(problem.id)}
                    />
                  </motion.div>
                ))}
              </div>
            )}

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              onClick={() => setCustomMode(true)}
              className="mt-4 flex items-center justify-center gap-2 text-sm text-primary font-medium hover:underline"
            >
              <Edit2 className="w-4 h-4" />
              Write my own problem statement
            </motion.button>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col"
          >
            <Textarea
              placeholder="Describe the problem your solution addresses..."
              value={customProblem}
              onChange={(e) => setCustomProblem(e.target.value)}
              className="flex-1 min-h-[150px] resize-none text-base"
            />
            <button
              onClick={() => setCustomMode(false)}
              className="mt-4 text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to suggestions
            </button>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 space-y-3"
        >
          <Button
            variant="default"
            size="lg"
            onClick={handleNext}
            disabled={isLoading || (customMode ? !customProblem.trim() : !selected)}
            className="w-full"
          >
            Confirm Problem
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
