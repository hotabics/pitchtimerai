// Mobile Recording Page - Portrait-optimized for phone camera recording

import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Loader2, Camera, StopCircle, RotateCcw, Monitor, AlertCircle, SwitchCamera, Mic, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { uploadRecording } from '@/services/videoStorage';
import { MAX_RECORDING_DURATION } from '@/components/ai-coach/AICoachRecording';

type RecordingState = 'connecting' | 'ready' | 'countdown' | 'recording' | 'paused' | 'uploading' | 'success' | 'error';
type FacingMode = 'user' | 'environment';

const MAX_RECORDING_SECONDS = MAX_RECORDING_DURATION; // 3 minutes (from AI Coach)
const WARNING_THRESHOLD_SECONDS = 30; // Show warning when 30 seconds remaining

// Haptic feedback helper
const triggerHaptic = (pattern: 'start' | 'stop' | 'warning' | 'pause' | 'resume') => {
  if (!navigator.vibrate) return;
  
  switch (pattern) {
    case 'start':
      navigator.vibrate([100, 50, 100]); // Double pulse
      break;
    case 'stop':
      navigator.vibrate(200); // Long pulse
      break;
    case 'warning':
      navigator.vibrate([50, 30, 50, 30, 50]); // Triple short pulse
      break;
    case 'pause':
      navigator.vibrate(100); // Single short pulse
      break;
    case 'resume':
      navigator.vibrate([50, 50, 100]); // Short-short-long
      break;
  }
};

const MobileRecord = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  
  const [state, setState] = useState<RecordingState>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploadProgress, setUploadProgress] = useState('');
  const [countdownValue, setCountdownValue] = useState(3);
  const [facingMode, setFacingMode] = useState<FacingMode>('user');
  const [audioLevel, setAudioLevel] = useState(0);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioAnimationRef = useRef<number | null>(null);

  // Start camera with specified facing mode
  const startCamera = useCallback(async (facing: FacingMode) => {
    try {
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Setup audio level monitoring
      setupAudioMonitoring(stream);

      return stream;
    } catch (err) {
      console.error('Failed to start camera:', err);
      throw err;
    }
  }, []);

  // Setup audio level monitoring
  const setupAudioMonitoring = useCallback((stream: MediaStream) => {
    // Clean up existing
    if (audioAnimationRef.current) {
      cancelAnimationFrame(audioAnimationRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);
    
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const updateLevel = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculate average level
      const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
      const normalizedLevel = Math.min(100, (average / 128) * 100);
      
      setAudioLevel(normalizedLevel);
      audioAnimationRef.current = requestAnimationFrame(updateLevel);
    };
    
    updateLevel();
  }, []);

  // Initialize camera and connect to channel
  useEffect(() => {
    if (!sessionId) {
      setError('Invalid session');
      setState('error');
      return;
    }

    const init = async () => {
      try {
        await startCamera(facingMode);

        // Connect to realtime channel
        const channel = supabase.channel(`room-${sessionId}`);
        channelRef.current = channel;
        
        await channel.subscribe((status) => {
          console.log('Mobile channel status:', status);
          if (status === 'SUBSCRIBED') {
            channel.send({
              type: 'broadcast',
              event: 'DEVICE_CONNECTED',
              payload: {},
            });
            setState('ready');
          }
        });
      } catch (err) {
        console.error('Failed to initialize:', err);
        setError('Could not access camera. Please allow camera permissions.');
        setState('error');
      }
    };

    init();

    // Cleanup
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (audioAnimationRef.current) {
        cancelAnimationFrame(audioAnimationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [sessionId]);

  // Toggle camera facing mode
  const handleToggleCamera = useCallback(async () => {
    if (state !== 'ready') return;
    
    const newFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacing);
    
    try {
      await startCamera(newFacing);
    } catch (err) {
      console.error('Failed to switch camera:', err);
      // Revert if failed
      setFacingMode(facingMode);
    }
  }, [facingMode, state, startCamera]);

  // Start countdown before recording
  const handleStartCountdown = useCallback(() => {
    setState('countdown');
    setCountdownValue(3);
    
    let count = 3;
    const countdownInterval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdownValue(count);
      } else {
        clearInterval(countdownInterval);
        startActualRecording();
      }
    }, 1000);
  }, []);

  // Start actual recording after countdown
  const startActualRecording = useCallback(() => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    setShowTimeWarning(false);
    
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm;codecs=vp9,opus',
    });
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const videoBlob = new Blob(chunksRef.current, { type: 'video/webm' });
      await handleUpload(videoBlob);
    };

    mediaRecorder.start(1000);
    mediaRecorderRef.current = mediaRecorder;
    
    channelRef.current?.send({
      type: 'broadcast',
      event: 'RECORDING_STARTED',
      payload: {},
    });

    // Haptic feedback on start
    triggerHaptic('start');

    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => {
        const newTime = prev + 1;
        
        // Check for warning threshold
        const remainingTime = MAX_RECORDING_SECONDS - newTime;
        if (remainingTime === WARNING_THRESHOLD_SECONDS) {
          setShowTimeWarning(true);
          triggerHaptic('warning');
        }
        
        // Auto-stop at max time
        if (newTime >= MAX_RECORDING_SECONDS) {
          handleStopRecording();
        }
        
        return newTime;
      });
    }, 1000);

    setState('recording');
  }, []);

  // Pause recording
  const handlePauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      triggerHaptic('pause');
      
      // Pause timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      setState('paused');
    }
  }, []);

  // Resume recording
  const handleResumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      triggerHaptic('resume');
      
      // Resume timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          
          const remainingTime = MAX_RECORDING_SECONDS - newTime;
          if (remainingTime === WARNING_THRESHOLD_SECONDS) {
            setShowTimeWarning(true);
            triggerHaptic('warning');
          }
          
          if (newTime >= MAX_RECORDING_SECONDS) {
            handleStopRecording();
          }
          
          return newTime;
        });
      }, 1000);
      
      setState('recording');
    }
  }, []);

  // Stop recording
  const handleStopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Haptic feedback on stop
    triggerHaptic('stop');
    setShowTimeWarning(false);

    if (mediaRecorderRef.current && (mediaRecorderRef.current.state === 'recording' || mediaRecorderRef.current.state === 'paused')) {
      mediaRecorderRef.current.stop();
    }

    channelRef.current?.send({
      type: 'broadcast',
      event: 'RECORDING_STOPPED',
      payload: {},
    });

    setState('uploading');
  }, []);

  // Upload video
  const handleUpload = async (videoBlob: Blob) => {
    try {
      setUploadProgress('Uploading video...');
      
      const result = await uploadRecording(videoBlob, `mobile-${sessionId}`, (step) => {
        setUploadProgress(step);
      });

      if (result.error || !result.videoUrl) {
        throw new Error(result.error || 'Upload failed');
      }

      await channelRef.current?.send({
        type: 'broadcast',
        event: 'UPLOAD_COMPLETE',
        payload: { videoUrl: result.videoUrl },
      });

      setState('success');
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Failed to upload video. Please try again.');
      setState('error');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRetry = () => {
    setState('connecting');
    setError(null);
    window.location.reload();
  };

  // Get audio level color
  const getAudioLevelColor = () => {
    if (audioLevel < 20) return 'bg-muted';
    if (audioLevel < 50) return 'bg-green-500';
    if (audioLevel < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Calculate time progress
  const timeProgress = (recordingTime / MAX_RECORDING_SECONDS) * 100;
  const remainingTime = MAX_RECORDING_SECONDS - recordingTime;
  const isNearLimit = remainingTime <= WARNING_THRESHOLD_SECONDS;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4 flex flex-col gap-2 bg-background/80 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-primary" />
            <span className="font-semibold">Connected to PC</span>
          </div>
          {(state === 'recording' || state === 'paused') && (
            <div className="flex items-center gap-2">
              {state === 'recording' ? (
                <motion.div
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-3 h-3 rounded-full bg-red-500"
                />
              ) : (
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
              )}
              <span className={`font-mono text-lg ${isNearLimit ? 'text-red-500 font-bold' : ''}`}>
                {formatTime(recordingTime)}
              </span>
              <span className="text-muted-foreground text-sm">
                / {formatTime(MAX_RECORDING_SECONDS)}
              </span>
              {state === 'paused' && (
                <span className="text-yellow-500 text-sm font-medium ml-2">PAUSED</span>
              )}
            </div>
          )}
        </div>
        
        {/* Recording Progress Bar */}
        {(state === 'recording' || state === 'paused') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="w-full"
          >
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={`h-full transition-colors ${isNearLimit ? 'bg-red-500' : state === 'paused' ? 'bg-yellow-500' : 'bg-primary'}`}
                animate={{ width: `${timeProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        {/* Camera Preview */}
        <div className="flex-1 relative bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
          />

          {/* Audio Level Indicator */}
          {(state === 'ready' || state === 'recording') && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute top-4 right-4 flex flex-col items-center gap-1"
            >
              <div className="bg-background/80 backdrop-blur-sm rounded-lg p-2 flex flex-col items-center gap-2">
                <Mic className="w-4 h-4 text-muted-foreground" />
                <div className="h-20 w-3 bg-muted rounded-full overflow-hidden flex flex-col-reverse">
                  <motion.div
                    className={`w-full transition-colors ${getAudioLevelColor()}`}
                    animate={{ height: `${audioLevel}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Camera Toggle Button */}
          {state === 'ready' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute top-4 left-4"
            >
              <Button
                variant="secondary"
                size="icon"
                onClick={handleToggleCamera}
                className="bg-background/80 backdrop-blur-sm"
              >
                <SwitchCamera className="w-5 h-5" />
              </Button>
            </motion.div>
          )}

          {/* Countdown Overlay */}
          <AnimatePresence>
            {state === 'countdown' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 flex items-center justify-center"
              >
                <motion.div
                  key={countdownValue}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-9xl font-bold text-white drop-shadow-2xl"
                >
                  {countdownValue}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Overlay States */}
          <AnimatePresence>
            {state === 'connecting' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-background/90 flex flex-col items-center justify-center gap-4"
              >
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-lg">Connecting to PC...</p>
              </motion.div>
            )}

            {state === 'uploading' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-background/90 flex flex-col items-center justify-center gap-4"
              >
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-lg">{uploadProgress}</p>
              </motion.div>
            )}

            {state === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 bg-background/95 flex flex-col items-center justify-center gap-6 p-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                >
                  <CheckCircle className="w-20 h-20 text-green-500" />
                </motion.div>
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold">Great job!</h2>
                  <p className="text-muted-foreground">
                    Check your PC for results
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Monitor className="w-4 h-4" />
                  <span>Analysis starting on desktop...</span>
                </div>
              </motion.div>
            )}

            {state === 'error' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-background/95 flex flex-col items-center justify-center gap-6 p-8"
              >
                <AlertCircle className="w-16 h-16 text-destructive" />
                <div className="text-center space-y-2">
                  <h2 className="text-xl font-bold">Something went wrong</h2>
                  <p className="text-muted-foreground text-sm">{error}</p>
                </div>
                <Button onClick={handleRetry} className="gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Try Again
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls */}
        {(state === 'ready' || state === 'recording' || state === 'paused') && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute bottom-0 left-0 right-0 p-8 flex justify-center items-center gap-6"
          >
            {state === 'ready' ? (
              <Button
                size="lg"
                onClick={handleStartCountdown}
                className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 shadow-xl"
              >
                <Camera className="w-8 h-8" />
              </Button>
            ) : (
              <>
                {/* Pause/Resume Button */}
                <Button
                  size="lg"
                  onClick={state === 'paused' ? handleResumeRecording : handlePauseRecording}
                  variant="secondary"
                  className="w-16 h-16 rounded-full shadow-lg"
                >
                  {state === 'paused' ? (
                    <Play className="w-6 h-6" />
                  ) : (
                    <Pause className="w-6 h-6" />
                  )}
                </Button>
                
                {/* Stop Button */}
                <Button
                  size="lg"
                  onClick={handleStopRecording}
                  className={`w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 shadow-xl ${state === 'recording' ? 'animate-pulse' : ''}`}
                >
                  <StopCircle className="w-8 h-8" />
                </Button>
              </>
            )}
          </motion.div>
        )}

        {/* Recording indicator */}
        {(state === 'recording' || state === 'paused') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`absolute top-4 left-4 flex items-center gap-2 ${state === 'paused' ? 'bg-yellow-500/90' : 'bg-red-500/90'} text-white px-3 py-1.5 rounded-full`}
          >
            {state === 'recording' ? (
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-2 h-2 rounded-full bg-white"
              />
            ) : (
              <Pause className="w-3 h-3" />
            )}
            <span className="text-sm font-medium">{state === 'paused' ? 'PAUSED' : 'REC'}</span>
          </motion.div>
        )}

        {/* Time Warning Overlay */}
        <AnimatePresence>
          {showTimeWarning && state === 'recording' && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">
                  {formatTime(remainingTime)} remaining
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer hint */}
      {state === 'ready' && (
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="p-4 text-center text-sm text-muted-foreground"
        >
          Tap the red button to start recording (3s countdown)
        </motion.footer>
      )}
    </div>
  );
};

export default MobileRecord;
