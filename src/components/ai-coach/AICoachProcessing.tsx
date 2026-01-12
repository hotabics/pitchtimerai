// AI Coach Processing View - API chain execution with video storage

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, Brain, BarChart3, Check, Loader2, Upload } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useAICoachStore } from '@/stores/aiCoachStore';
import type { FrameData } from '@/services/mediapipe';
import { transcribeWithElevenLabs } from '@/services/transcription';
import { analyzePitchWithAI, getMockAnalysis } from '@/services/pitchAnalysis';
import {
  detectContentCoverage,
  detectBulletPointCoverage,
  countFillerWords,
  calculateWPM,
  type GPTAnalysisResponse,
} from '@/services/openai';
import { aggregateMetrics } from '@/services/mediapipe';
import { uploadRecording, generateThumbnail } from '@/services/videoStorage';
import { trackEvent } from '@/utils/analytics';
import { toast } from 'sonner';
import { formatFileSize } from '@/services/videoCompression';
import { LiveTranscriptionDisplay } from './LiveTranscriptionDisplay';

// Helper to format bytes
const formatBytes = (bytes: number): string => formatFileSize(bytes);

interface AICoachProcessingProps {
  audioBlob: Blob;
  videoBlob: Blob;
  duration: number;
  frameData: FrameData[];
  onComplete: () => void;
  onError: (error: string) => void;
}

type ProcessingStep = 'transcribing' | 'analyzing' | 'aggregating' | 'saving';

const steps: { key: ProcessingStep; label: string; icon: React.ElementType }[] = [
  { key: 'transcribing', label: 'Transcribing audio with Whisper', icon: Mic },
  { key: 'analyzing', label: 'Analyzing content with GPT-4', icon: Brain },
  { key: 'aggregating', label: 'Processing video metrics', icon: BarChart3 },
  { key: 'saving', label: 'Saving recording to cloud', icon: Upload },
];

// Upload sub-stages for detailed progress
type UploadStage = 'compressing' | 'uploading' | 'thumbnail' | 'complete';

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
  const [uploadStage, setUploadStage] = useState<UploadStage | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [compressionStats, setCompressionStats] = useState<{ original: number; compressed: number } | null>(null);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isTranscriptionComplete, setIsTranscriptionComplete] = useState(false);

  const { setResults, setError, promptMode, bulletPoints } = useAICoachStore();

  useEffect(() => {
    processRecording();
  }, []);

  const processRecording = async () => {
    let transcript = '';
    let contentAnalysis: GPTAnalysisResponse | null = null;

    // Track AI coach session start
    trackEvent('ai_coach_processing_started', { 
      duration_seconds: duration,
      using_real_api: true,
    });

    try {
      // Step 1: Transcribe audio using ElevenLabs (via edge function)
      setCurrentStep('transcribing');
      setProgress(10);

      try {
        console.log('Transcribing audio with ElevenLabs...');
        const result = await transcribeWithElevenLabs(audioBlob);
        transcript = result.text;
        setLiveTranscript(transcript);
        setIsTranscriptionComplete(true);
        console.log('Transcription complete:', transcript.substring(0, 100) + '...');
      } catch (err) {
        console.error('ElevenLabs transcription error:', err);
        // Fallback to mock if edge function fails
        toast.warning('Using demo transcription - check ElevenLabs API key');
        await new Promise(resolve => setTimeout(resolve, 1500));
        transcript = getMockTranscript();
        setLiveTranscript(transcript);
        setIsTranscriptionComplete(true);
      }

      setCompletedSteps(prev => [...prev, 'transcribing']);
      setProgress(40);

      // Step 2: Analyze with GPT-4 (via edge function)
      setCurrentStep('analyzing');

      try {
        console.log('Analyzing pitch content with GPT-4...');
        contentAnalysis = await analyzePitchWithAI(transcript) as GPTAnalysisResponse;
        console.log('Analysis complete, score:', contentAnalysis.score);
      } catch (err) {
        console.error('GPT analysis error:', err);
        toast.warning('Using demo analysis - check OpenAI API key');
        await new Promise(resolve => setTimeout(resolve, 2000));
        contentAnalysis = getMockAnalysis() as GPTAnalysisResponse;
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
      
      // Calculate bullet point coverage if in cue cards mode
      const bulletPointsCoverage = promptMode === 'cueCards' && bulletPoints.length > 0
        ? detectBulletPointCoverage(bulletPoints, transcript)
        : undefined;

      setCompletedSteps(prev => [...prev, 'aggregating']);
      setProgress(85);

      // Step 4: Save recording to cloud storage
      setCurrentStep('saving');
      setUploadStage('compressing');
      setUploadProgress(0);
      
      let videoUrl: string | null = null;
      let thumbnailUrl: string | null = null;
      
      try {
        const uploadResult = await uploadRecording(videoBlob, undefined, (step, pct) => {
          // Map upload stages to our UI states
          if (step.includes('Compressing')) {
            setUploadStage('compressing');
            setUploadProgress(pct);
          } else if (step.includes('Uploading video')) {
            setUploadStage('uploading');
            setUploadProgress(pct);
          } else if (step.includes('thumbnail')) {
            setUploadStage('thumbnail');
            setUploadProgress(pct);
          } else if (step.includes('Complete')) {
            setUploadStage('complete');
            setUploadProgress(100);
          }
        });
        
        if (uploadResult.originalSize && uploadResult.compressedSize) {
          setCompressionStats({
            original: uploadResult.originalSize,
            compressed: uploadResult.compressedSize,
          });
        }
        
        if (uploadResult.error) {
          console.warn('Video upload failed:', uploadResult.error);
          toast.warning('Recording saved locally only - cloud upload failed');
        } else {
          videoUrl = uploadResult.videoUrl;
          thumbnailUrl = uploadResult.thumbnailUrl;
          toast.success('Recording saved to cloud!');
        }
      } catch (uploadErr) {
        console.warn('Video upload error:', uploadErr);
        // Non-blocking - continue without cloud save
      }
      
      setUploadStage(null);

      setCompletedSteps(prev => [...prev, 'saving']);
      setProgress(100);

      // Store results with video URLs
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
        promptMode,
        bulletPointsCoverage,
        videoUrl,
        thumbnailUrl,
      });

      // Track AI coach session complete
      trackEvent('ai_coach_session_completed', {
        duration_seconds: duration,
        wpm,
        filler_count: fillerData.total,
        eye_contact_percent: videoMetrics.averageEyeContact,
        score: contentAnalysis?.score,
        using_real_api: true,
        video_saved: !!videoUrl,
      });

      // Small delay before transitioning
      await new Promise(resolve => setTimeout(resolve, 500));
      onComplete();

    } catch (err) {
      console.error('Processing error:', err);
      trackEvent('ai_coach_session_error', { error: err instanceof Error ? err.message : 'Unknown error' });
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
      <div className="mb-6">
        <Progress value={progress} className="h-2" />
        <p className="text-center text-sm text-muted-foreground mt-2">{progress}%</p>
      </div>

      {/* Live Transcription Display - show during transcribing step */}
      {(currentStep === 'transcribing' || liveTranscript) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-6"
        >
          <LiveTranscriptionDisplay
            transcript={liveTranscript}
            isComplete={isTranscriptionComplete}
          />
        </motion.div>
      )}

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
                {/* Upload sub-progress for saving step */}
                {step.key === 'saving' && isCurrent && uploadStage && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {uploadStage === 'compressing' && '📦 Compressing video...'}
                        {uploadStage === 'uploading' && '☁️ Uploading to cloud...'}
                        {uploadStage === 'thumbnail' && '🖼️ Generating thumbnail...'}
                        {uploadStage === 'complete' && '✅ Upload complete!'}
                      </span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-1.5" />
                    {compressionStats && uploadStage !== 'compressing' && (
                      <p className="text-xs text-muted-foreground">
                        Compressed: {formatBytes(compressionStats.original)} → {formatBytes(compressionStats.compressed)}
                        <span className="text-success ml-1">
                          ({Math.round((1 - compressionStats.compressed / compressionStats.original) * 100)}% smaller)
                        </span>
                      </p>
                    )}
                  </div>
                )}
              </div>
              {isCurrent && !uploadStage && (
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
