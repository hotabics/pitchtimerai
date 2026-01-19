import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceControlsProps {
  isRecording: boolean;
  isTranscribing: boolean;
  isSpeaking: boolean;
  voiceEnabled: boolean;
  disabled?: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onToggleVoice: () => void;
  onStopSpeaking: () => void;
}

export const VoiceControls = ({
  isRecording,
  isTranscribing,
  isSpeaking,
  voiceEnabled,
  disabled,
  onStartRecording,
  onStopRecording,
  onToggleVoice,
  onStopSpeaking,
}: VoiceControlsProps) => {
  const [recordingDuration, setRecordingDuration] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      setRecordingDuration(0);
      interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatDuration = (seconds: number) => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2">
      {/* Voice Mode Toggle */}
      <Button
        variant="outline"
        size="icon"
        onClick={onToggleVoice}
        className={cn(
          'relative',
          voiceEnabled && 'border-primary text-primary'
        )}
        title={voiceEnabled ? 'Disable voice mode' : 'Enable voice mode'}
      >
        {voiceEnabled ? (
          <Volume2 className="w-4 h-4" />
        ) : (
          <VolumeX className="w-4 h-4" />
        )}
      </Button>

      {/* Recording Button */}
      <AnimatePresence mode="wait">
        {isTranscribing ? (
          <motion.div
            key="transcribing"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <Button
              variant="outline"
              size="icon"
              disabled
              className="relative"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
            </Button>
          </motion.div>
        ) : isRecording ? (
          <motion.div
            key="recording"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="flex items-center gap-2"
          >
            <Button
              variant="destructive"
              size="icon"
              onClick={onStopRecording}
              className="relative"
            >
              <motion.div
                className="absolute inset-0 rounded-md bg-destructive/30"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              />
              <MicOff className="w-4 h-4 relative z-10" />
            </Button>
            <Badge variant="destructive" className="font-mono">
              {formatDuration(recordingDuration)}
            </Badge>
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <Button
              variant={voiceEnabled ? 'default' : 'outline'}
              size="icon"
              onClick={onStartRecording}
              disabled={disabled || !voiceEnabled}
              className="relative"
              title={voiceEnabled ? 'Start recording' : 'Enable voice mode first'}
            >
              <Mic className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speaking Indicator */}
      <AnimatePresence>
        {isSpeaking && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={onStopSpeaking}
              className="gap-2 text-primary"
            >
              <motion.div
                className="flex gap-0.5"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
              >
                <span className="w-1 h-3 bg-primary rounded-full" />
                <span className="w-1 h-4 bg-primary rounded-full" />
                <span className="w-1 h-2 bg-primary rounded-full" />
                <span className="w-1 h-4 bg-primary rounded-full" />
                <span className="w-1 h-3 bg-primary rounded-full" />
              </motion.div>
              <span className="text-xs">Speaking...</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
