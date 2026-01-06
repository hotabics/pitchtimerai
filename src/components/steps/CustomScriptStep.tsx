import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { FileText, Clock, AlertTriangle, Upload, Lock } from "lucide-react";
import { WizardStep } from "@/components/WizardStep";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface CustomScriptStepProps {
  onNext: (script: string) => void;
  onBack: () => void;
  initialValue?: string;
}

const MAX_WORDS = 450;
const MAX_DURATION_SECONDS = 180; // 3 minutes
const WPM = 130; // words per minute baseline

export const CustomScriptStep = ({ onNext, onBack, initialValue = "" }: CustomScriptStepProps) => {
  const [script, setScript] = useState(initialValue);

  const stats = useMemo(() => {
    const words = script.trim().split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    const estimatedSeconds = Math.round((wordCount / WPM) * 60);
    const estimatedMinutes = Math.floor(estimatedSeconds / 60);
    const remainingSeconds = estimatedSeconds % 60;
    
    return {
      wordCount,
      estimatedSeconds,
      estimatedTime: estimatedMinutes > 0 
        ? `${estimatedMinutes}:${remainingSeconds.toString().padStart(2, '0')}`
        : `0:${remainingSeconds.toString().padStart(2, '0')}`,
      isOverLimit: wordCount > MAX_WORDS || estimatedSeconds > MAX_DURATION_SECONDS,
      wordPercentage: Math.min((wordCount / MAX_WORDS) * 100, 100),
      timePercentage: Math.min((estimatedSeconds / MAX_DURATION_SECONDS) * 100, 100),
    };
  }, [script]);

  const canContinue = script.trim().length > 20 && !stats.isOverLimit;

  const handleContinue = () => {
    if (canContinue) {
      onNext(script.trim());
    }
  };

  return (
    <WizardStep
      title="Paste Your Pitch Script"
      subtitle="We'll structure it into sections and help you practice delivery"
    >
      <div className="space-y-6">
        {/* Privacy notice */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-4 py-3"
        >
          <Lock className="w-4 h-4 flex-shrink-0" />
          <span>This script is private and used only to coach your delivery.</span>
        </motion.div>

        {/* Script input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="Paste your pitch script here...

Example:
Good morning everyone! I'm here to tell you about EcoTrash AI - a revolutionary way to make recycling effortless.

Every year, 91% of plastic isn't recycled. Not because people don't care, but because sorting trash is confusing. Which bin does this coffee cup go in?

That's where EcoTrash AI comes in. Point your phone at any item, and our AI tells you exactly which bin it belongs in. We've made it fun with gamification - earn points, compete with friends, and track your environmental impact..."
            className={cn(
              "min-h-[280px] text-base leading-relaxed resize-none transition-colors",
              stats.isOverLimit && "border-destructive focus-visible:ring-destructive"
            )}
          />
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-4"
        >
          {/* Word count */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Words</span>
              </div>
              <span className={cn(
                "font-mono font-medium",
                stats.wordCount > MAX_WORDS ? "text-destructive" : "text-foreground"
              )}>
                {stats.wordCount} / {MAX_WORDS}
              </span>
            </div>
            <Progress 
              value={stats.wordPercentage} 
              className={cn(
                "h-2",
                stats.wordCount > MAX_WORDS && "[&>div]:bg-destructive"
              )}
            />
          </div>

          {/* Estimated time */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Est. Time</span>
              </div>
              <span className={cn(
                "font-mono font-medium",
                stats.estimatedSeconds > MAX_DURATION_SECONDS ? "text-destructive" : "text-foreground"
              )}>
                {stats.estimatedTime} / 3:00
              </span>
            </div>
            <Progress 
              value={stats.timePercentage} 
              className={cn(
                "h-2",
                stats.estimatedSeconds > MAX_DURATION_SECONDS && "[&>div]:bg-destructive"
              )}
            />
          </div>
        </motion.div>

        {/* Warning if over limit */}
        {stats.isOverLimit && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20"
          >
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-destructive">Script exceeds 3-minute limit</p>
              <p className="text-destructive/80 mt-1">
                Please shorten your script to {MAX_WORDS} words or less for optimal practice.
              </p>
            </div>
          </motion.div>
        )}

        {/* Continue button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="pt-4"
        >
          <Button
            onClick={handleContinue}
            disabled={!canContinue}
            size="lg"
            className="w-full"
          >
            Structure My Script
          </Button>
        </motion.div>
      </div>
    </WizardStep>
  );
};
