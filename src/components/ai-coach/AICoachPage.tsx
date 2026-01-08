// Main AI Coach Page Component

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AICoachSetup } from './AICoachSetup';
import { AICoachRecording } from './AICoachRecording';
import { AICoachProcessing } from './AICoachProcessing';
import { AICoachResults } from './AICoachResults';
import { FramingCheck } from './FramingCheck';
import { useAICoachStore } from '@/stores/aiCoachStore';
import type { FrameData } from '@/services/mediapipe';

const FRAMING_SKIP_KEY = 'ai-coach-framing-skipped';

export interface AICoachPageProps {
  onBack?: () => void;
  onEditScript?: () => void;
  embedded?: boolean; // When true, hides header and uses simpler layout
}

export const AICoachPage = ({ onBack, onEditScript, embedded = false }: AICoachPageProps) => {
  const navigate = useNavigate();
  const [view, setView] = useState<'setup' | 'framing' | 'recording' | 'processing' | 'results'>('setup');
  const [recordingData, setRecordingData] = useState<{
    audioBlob: Blob;
    videoBlob: Blob;
    duration: number;
    frameData: FrameData[];
  } | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const { reset } = useAICoachStore();

  // Start camera when entering framing check
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: true 
      });
      setCameraStream(stream);
      return stream;
    } catch (error) {
      console.error('Failed to start camera:', error);
      return null;
    }
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const handleSetupReady = async () => {
    // Check if user has previously skipped framing check
    const hasSkippedBefore = localStorage.getItem(FRAMING_SKIP_KEY) === 'true';
    
    if (hasSkippedBefore) {
      // Returning user - go directly to recording
      setView('recording');
    } else {
      // New user - show framing check
      await startCamera();
      setView('framing');
    }
  };

  const handleFramingProceed = () => {
    setView('recording');
  };

  const handleFramingSkip = () => {
    // Remember the skip preference
    localStorage.setItem(FRAMING_SKIP_KEY, 'true');
    setView('recording');
  };

  const handleRecordingStop = (audioBlob: Blob, videoBlob: Blob, duration: number, frameData: FrameData[]) => {
    setRecordingData({ audioBlob, videoBlob, duration, frameData });
    setView('processing');
  };

  const handleRecordingCancel = () => {
    setView('setup');
  };

  const handleProcessingComplete = () => {
    setView('results');
  };

  const handleProcessingError = (error: string) => {
    console.error('Processing error:', error);
    setView('setup');
  };

  const handleReRecord = () => {
    reset();
    setRecordingData(null);
    setView('setup');
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/');
    }
  };

  const handleEditScript = () => {
    if (onEditScript) {
      onEditScript();
    } else {
      handleBack();
    }
  };

  // Embedded mode: just render the content without header/wrapper
  if (embedded) {
    return (
      <div className="space-y-6">
        <AnimatePresence mode="wait">
          {view === 'setup' && (
            <motion.div key="setup" exit={{ opacity: 0, x: -20 }}>
              <AICoachSetup onReady={handleSetupReady} />
            </motion.div>
          )}

          {view === 'framing' && (
            <motion.div key="framing" exit={{ opacity: 0 }}>
              <FramingCheck
                stream={cameraStream}
                onProceed={handleFramingProceed}
                onSkip={handleFramingSkip}
              />
            </motion.div>
          )}

          {view === 'recording' && (
            <motion.div key="recording" exit={{ opacity: 0 }}>
              <AICoachRecording 
                onStop={handleRecordingStop}
                onCancel={handleRecordingCancel}
                initialStream={cameraStream}
              />
            </motion.div>
          )}

          {view === 'processing' && recordingData && (
            <motion.div key="processing" exit={{ opacity: 0 }}>
              <AICoachProcessing
                audioBlob={recordingData.audioBlob}
                videoBlob={recordingData.videoBlob}
                duration={recordingData.duration}
                frameData={recordingData.frameData}
                onComplete={handleProcessingComplete}
                onError={handleProcessingError}
              />
            </motion.div>
          )}

          {view === 'results' && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <AICoachResults
                onReRecord={handleReRecord}
                onEditScript={handleEditScript}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-bold text-lg">AI Coach</h1>
            <p className="text-sm text-muted-foreground">Real-time pitch analysis</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {view === 'setup' && (
            <motion.div key="setup" exit={{ opacity: 0, x: -20 }}>
              <AICoachSetup onReady={handleSetupReady} />
            </motion.div>
          )}

          {view === 'framing' && (
            <motion.div key="framing" exit={{ opacity: 0 }}>
              <FramingCheck
                stream={cameraStream}
                onProceed={handleFramingProceed}
                onSkip={handleFramingSkip}
              />
            </motion.div>
          )}

          {view === 'recording' && (
            <motion.div key="recording" exit={{ opacity: 0 }}>
              <AICoachRecording 
                onStop={handleRecordingStop}
                onCancel={handleRecordingCancel}
                initialStream={cameraStream}
              />
            </motion.div>
          )}

          {view === 'processing' && recordingData && (
            <motion.div key="processing" exit={{ opacity: 0 }}>
              <AICoachProcessing
                audioBlob={recordingData.audioBlob}
                videoBlob={recordingData.videoBlob}
                duration={recordingData.duration}
                frameData={recordingData.frameData}
                onComplete={handleProcessingComplete}
                onError={handleProcessingError}
              />
            </motion.div>
          )}

          {view === 'results' && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <AICoachResults
                onReRecord={handleReRecord}
                onEditScript={handleEditScript}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
