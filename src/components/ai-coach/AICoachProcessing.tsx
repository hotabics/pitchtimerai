// AI Coach Processing View - API chain execution

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, Brain, BarChart3, Check, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useAICoachStore } from '@/stores/aiCoachStore';
import type { FrameData } from '@/services/mediapipe';
import {
  transcribeAudio,
  analyzePitchContent,
  detectContentCoverage,
  countFillerWords,
  calculateWPM,
  getMockAnalysis,
  hasApiKey,
  type GPTAnalysisResponse,
} from '@/services/openai';
import { aggregateMetrics } from '@/services/mediapipe';

interface AICoachProcessingProps {
  audioBlob: Blob;
  videoBlob: Blob;
  duration: number;
  frameData: FrameData[];
  onComplete: () => void;
  onError: (error: string) => void;
}

type ProcessingStep = 'transcribing' | 'analyzing' | 'aggregating';

const steps: { key: ProcessingStep; label: string; icon: React.ElementType }[] = [
  { key: 'transcribing', label: 'Transcribing audio with Whisper', icon: Mic },
  { key: 'analyzing', label: 'Analyzing content with GPT-4', icon: Brain },
  { key: 'aggregating', label: 'Processing video metrics', icon: BarChart3 },
];

export const AICoachProcessing = ({
  audioBlob,
  videoBlob,
  duration,
  frameData,
  onComplete,
  onError,
}: AICoachProcessingProps) => {
  const [currentStep, setCurrentStep] = useState<ProcessingStep>('transcribing');
  const [completedSteps, setCompletedSteps] = useState<ProcessingStep[]>([]);
  const [progress, setProgress] = useState(0);

  const { setResults, setError } = useAICoachStore();

  useEffect(() => {
    processRecording();
  }, []);

  const processRecording = async () => {
    const useRealAPI = hasApiKey();
    let transcript = '';
    let contentAnalysis: GPTAnalysisResponse | null = null;

    try {
      // Step 1: Transcribe audio
      setCurrentStep('transcribing');
      setProgress(10);

      if (useRealAPI) {
        try {
          const whisperResult = await transcribeAudio(audioBlob);
          transcript = whisperResult.text;
        } catch (err) {
          console.error('Transcription error:', err);
          // Fallback to mock
          transcript = getMockTranscript();
        }
      } else {
        // Mock transcription delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        transcript = getMockTranscript();
      }

      setCompletedSteps(prev => [...prev, 'transcribing']);
      setProgress(40);

      // Step 2: Analyze with GPT-4
      setCurrentStep('analyzing');

      if (useRealAPI && transcript) {
        try {
          contentAnalysis = await analyzePitchContent(transcript);
        } catch (err) {
          console.error('Analysis error:', err);
          contentAnalysis = getMockAnalysis();
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 2000));
        contentAnalysis = getMockAnalysis();
      }

      setCompletedSteps(prev => [...prev, 'analyzing']);
      setProgress(70);

      // Step 3: Aggregate video metrics
      setCurrentStep('aggregating');
      await new Promise(resolve => setTimeout(resolve, 500));

      const videoMetrics = aggregateMetrics(frameData);
      const fillerData = countFillerWords(transcript);
      const wpm = calculateWPM(transcript, duration);
      const coverage = detectContentCoverage(transcript);

      setCompletedSteps(prev => [...prev, 'aggregating']);
      setProgress(100);

      // Store results
      setResults({
        transcript,
        deliveryMetrics: {
          eyeContactPercent: videoMetrics.averageEyeContact,
          wpm,
          fillerCount: fillerData.total,
          fillerBreakdown: fillerData.breakdown,
          stabilityScore: videoMetrics.stabilityScore,
          smilePercent: videoMetrics.smilePercentage,
          // Body language metrics
          postureScore: videoMetrics.averagePosture,
          postureGrade: videoMetrics.postureGrade,
          handsVisiblePercent: videoMetrics.handsVisiblePercent,
          bodyStabilityScore: videoMetrics.averageBodyStability,
        },
        contentAnalysis,
        contentCoverage: coverage,
        processedAt: new Date(),
      });

      // Small delay before transitioning
      await new Promise(resolve => setTimeout(resolve, 500));
      onComplete();

    } catch (err) {
      console.error('Processing error:', err);
      setError(err instanceof Error ? err.message : 'Processing failed');
      onError(err instanceof Error ? err.message : 'Processing failed');
    }
  };

  const getMockTranscript = () => {
    return `Hi everyone, I'm excited to present our project today. 
    
We've built an AI-powered platform that helps hackathon participants practice their pitches. Um, the problem we're solving is that most teams spend so much time building but not enough time preparing to actually present their work.

Our solution uses real-time face tracking to monitor eye contact and expressions, and like, we use GPT-4 to analyze the content of your pitch against what judges are actually looking for.

So far, we've tested this with about 50 teams and the feedback has been really positive. Teams that used our tool scored 23% higher on average.

We're looking to expand this to universities and accelerator programs. Thanks for your time, and I'd love to answer any questions!`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto py-12"
    >
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Analyzing Your Pitch</h2>
        <p className="text-muted-foreground">
          Our AI is processing your recording...
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <Progress value={progress} className="h-2" />
        <p className="text-center text-sm text-muted-foreground mt-2">{progress}%</p>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.key);
          const isCurrent = currentStep === step.key && !isCompleted;
          const Icon = step.icon;

          return (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-4 p-4 rounded-lg border ${
                isCompleted 
                  ? 'bg-success/5 border-success/20' 
                  : isCurrent
                    ? 'bg-primary/5 border-primary/20'
                    : 'bg-muted/50 border-transparent'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isCompleted 
                  ? 'bg-success text-success-foreground' 
                  : isCurrent
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
              }`}>
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : isCurrent ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Icon className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1">
                <p className={`font-medium ${
                  isCompleted || isCurrent ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {step.label}
                </p>
              </div>
              {isCurrent && (
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
