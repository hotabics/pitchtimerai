import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, User, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepWrapper } from "@/components/StepWrapper";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Step4AudienceProps {
  idea: string;
  onNext: (persona: { description: string; keywords: string[] }) => void;
  onBack: () => void;
}

interface Persona {
  description: string;
  keywords: string[];
}

export const Step4Audience = ({ idea, onNext, onBack }: Step4AudienceProps) => {
  const [persona, setPersona] = useState<Persona | null>(null);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPersona = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('generate-pitch', {
          body: { type: 'persona', idea }
        });

        if (error) throw error;
        
        console.log('AI persona response:', data);
        
        if (data?.result && typeof data.result === 'object') {
          const persona = {
            description: data.result.description || '',
            keywords: Array.isArray(data.result.keywords) ? data.result.keywords : []
          };
          setPersona(persona);
          setKeywords(persona.keywords);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error('Failed to generate persona:', error);
        toast({
          title: "AI Generation Failed",
          description: "Using fallback persona.",
          variant: "destructive"
        });
        // Fallback persona
        const fallback = {
          description: `Busy professionals aged 25-40 who work in tech-adjacent industries and are looking for efficient solutions to manage "${idea}".`,
          keywords: ["Time-constrained", "Tech-savvy", "Decision makers", "Innovation seekers", "ROI-focused"]
        };
        setPersona(fallback);
        setKeywords(fallback.keywords);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPersona();
  }, [idea, toast]);

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword));
  };

  if (isLoading) {
    return (
      <StepWrapper
        title="Target Audience"
        subtitle="Who will benefit most from your solution?"
      >
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Identifying your audience...</p>
        </div>
      </StepWrapper>
    );
  }

  return (
    <StepWrapper
      title="Target Audience"
      subtitle="Who will benefit most from your solution?"
    >
      <div className="flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-6 mb-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">Primary Persona</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {persona?.description}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label className="text-sm font-medium text-foreground block mb-3">
            Key Characteristics
            <span className="text-muted-foreground font-normal ml-2">(tap to remove)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword, index) => (
              <motion.button
                key={keyword}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => removeKeyword(keyword)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-colors group"
              >
                <span>{keyword}</span>
                <X className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" />
              </motion.button>
            ))}
          </div>
          {keywords.length === 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              All characteristics removed. You can proceed with a generic audience.
            </p>
          )}
        </motion.div>

        <div className="flex-1" />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 space-y-3"
        >
          <Button
            variant="default"
            size="lg"
            onClick={() => onNext({ description: persona?.description || '', keywords })}
            className="w-full"
          >
            Confirm Audience
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
