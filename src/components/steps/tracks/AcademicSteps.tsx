import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, BookOpen, Target, FlaskConical, LineChart, GraduationCap, HelpCircle } from "lucide-react";
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

// Step 1: Topic & Context
interface TopicStepProps {
  onNext: (topic: string) => void;
  onBack: () => void;
  initialValue?: string;
}

export const AcademicTopicStep = ({ onNext, onBack, initialValue = "" }: TopicStepProps) => {
  const [topic, setTopic] = useState(initialValue);

  return (
    <WizardStep
      title="Topic & Context"
      subtitle="Thesis title and its relevance to the field"
    >
      <div className="flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4 mb-6 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-sm text-muted-foreground">
            Start with your thesis title and explain why this research matters
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
              <Label htmlFor="topic">Thesis Title & Relevance</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Include the full title and a brief statement of why this research is important to your field</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              id="topic"
              placeholder="e.g., 
Title: 'Machine Learning Applications in Early Disease Detection: A Comparative Analysis of CNN Architectures'

Relevance: This research addresses the growing need for automated diagnostic tools in healthcare, where early detection can improve survival rates by up to 40%..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="min-h-[160px] resize-none"
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
            onClick={() => onNext(topic)}
            disabled={!topic.trim()}
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

// Step 2: Research Frame
interface ResearchFrameStepProps {
  onNext: (frame: string) => void;
  onBack: () => void;
  initialValue?: string;
}

export const AcademicResearchFrameStep = ({ onNext, onBack, initialValue = "" }: ResearchFrameStepProps) => {
  const [frame, setFrame] = useState(initialValue);

  return (
    <WizardStep
      title="Research Frame"
      subtitle="Goal, Tasks, and Hypothesis"
    >
      <div className="flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4 mb-6 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <Target className="w-5 h-5 text-violet-500" />
          </div>
          <p className="text-sm text-muted-foreground">
            Clearly state what you set out to achieve and prove
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
              <Label htmlFor="frame">Goal, Tasks & Hypothesis</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Structure: 1) Main goal, 2) Specific tasks/objectives, 3) Hypothesis to test</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              id="frame"
              placeholder="e.g., 
GOAL: Develop and validate a CNN-based diagnostic tool for early-stage lung cancer detection

TASKS:
1. Compare 5 CNN architectures on medical imaging dataset
2. Optimize model for accuracy vs. computational efficiency
3. Validate against existing clinical methods

HYPOTHESIS: ResNet-50 architecture will achieve >95% accuracy while maintaining inference time under 2 seconds"
              value={frame}
              onChange={(e) => setFrame(e.target.value)}
              className="min-h-[200px] resize-none"
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
            onClick={() => onNext(frame)}
            disabled={!frame.trim()}
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

// Step 3: Methodology
interface MethodologyStepProps {
  onNext: (methodology: string) => void;
  onBack: () => void;
  initialValue?: string;
}

export const AcademicMethodologyStep = ({ onNext, onBack, initialValue = "" }: MethodologyStepProps) => {
  const [methodology, setMethodology] = useState(initialValue);

  return (
    <WizardStep
      title="Methodology"
      subtitle="Research methods used (Quantitative/Qualitative)"
    >
      <div className="flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4 mb-6 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-sm text-muted-foreground">
            Describe your research approach, data sources, and analytical methods
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
              <Label htmlFor="methodology">Research Methodology</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Include: Research type, data collection methods, sample size, analytical tools, validation approach</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              id="methodology"
              placeholder="e.g., 
APPROACH: Quantitative experimental study

DATA:
• NIH Chest X-ray dataset (112,120 images)
• 70/15/15 train/validation/test split

METHODS:
• Transfer learning with pre-trained ImageNet weights
• 5-fold cross-validation
• Statistical significance testing (p < 0.05)

TOOLS: PyTorch, scikit-learn, SPSS"
              value={methodology}
              onChange={(e) => setMethodology(e.target.value)}
              className="min-h-[200px] resize-none"
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
            onClick={() => onNext(methodology)}
            disabled={!methodology.trim()}
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

// Step 4: Key Results
interface ResultsStepProps {
  onNext: (results: string) => void;
  onBack: () => void;
  initialValue?: string;
}

export const AcademicResultsStep = ({ onNext, onBack, initialValue = "" }: ResultsStepProps) => {
  const [results, setResults] = useState(initialValue);

  return (
    <WizardStep
      title="Key Results"
      subtitle="3-5 main findings (data-based)"
    >
      <div className="flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4 mb-6 border-2 border-emerald-500/30"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <LineChart className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="text-sm font-semibold text-emerald-400">DATA-DRIVEN FINDINGS</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Present your key findings with specific numbers and statistical significance
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
              <Label htmlFor="results">Main Findings</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Include specific metrics, percentages, p-values, and comparisons to baselines</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              id="results"
              placeholder="e.g., 
1. ResNet-50 achieved 96.3% accuracy (p < 0.001), exceeding baseline by 12%

2. Inference time: 1.8s average (within clinical workflow requirements)

3. Sensitivity: 94.7%, Specificity: 97.1%

4. Model performed consistently across age groups (variance < 3%)

5. Transfer learning reduced training time by 78% vs. training from scratch"
              value={results}
              onChange={(e) => setResults(e.target.value)}
              className="min-h-[200px] resize-none"
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
            onClick={() => onNext(results)}
            disabled={!results.trim()}
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

// Step 5: Conclusions
interface ConclusionsStepProps {
  onNext: (conclusions: string) => void;
  onBack: () => void;
  initialValue?: string;
}

export const AcademicConclusionsStep = ({ onNext, onBack, initialValue = "" }: ConclusionsStepProps) => {
  const [conclusions, setConclusions] = useState(initialValue);

  return (
    <WizardStep
      title="Conclusions"
      subtitle="Main analytical conclusion and contributions"
    >
      <div className="flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4 mb-6 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-sm text-muted-foreground">
            Summarize what your research proves and its contribution to the field
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
              <Label htmlFor="conclusions">Conclusions & Contributions</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Include: Main conclusion, theoretical/practical contributions, limitations, future research directions</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              id="conclusions"
              placeholder="e.g., 
CONCLUSION:
This research demonstrates that transfer learning with ResNet-50 provides a viable, accurate, and efficient solution for early-stage lung cancer detection.

CONTRIBUTIONS:
• Novel optimization technique for medical imaging CNNs
• Validated benchmark dataset with clinical annotations
• Open-source implementation for reproducibility

LIMITATIONS:
Single-institution dataset; requires multi-center validation

FUTURE WORK:
Integration with PACS systems; real-time deployment study"
              value={conclusions}
              onChange={(e) => setConclusions(e.target.value)}
              className="min-h-[220px] resize-none"
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
            onClick={() => onNext(conclusions)}
            disabled={!conclusions.trim()}
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
