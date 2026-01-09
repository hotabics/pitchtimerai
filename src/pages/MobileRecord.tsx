// Mobile Recording Page - Portrait-optimized for phone camera recording

import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Loader2, Camera, StopCircle, RotateCcw, Smartphone, Monitor, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { uploadRecording } from '@/services/videoStorage';

type RecordingState = 'connecting' | 'ready' | 'recording' | 'uploading' | 'success' | 'error';

const MobileRecord = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  
  const [state, setState] = useState<RecordingState>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploadProgress, setUploadProgress] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Initialize camera and connect to channel
  useEffect(() => {
    if (!sessionId) {
      setError('Invalid session');
      setState('error');
      return;
    }

    const init = async () => {
      try {
        // Request camera access with user-facing camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: true,
        });
        
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Connect to realtime channel
        const channel = supabase.channel(`room-${sessionId}`);
        channelRef.current = channel;
        
        await channel.subscribe((status) => {
          console.log('Mobile channel status:', status);
          if (status === 'SUBSCRIBED') {
            // Notify desktop that phone is connected
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
    };
  }, [sessionId]);

  // Start recording
  const handleStartRecording = useCallback(() => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    
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

    mediaRecorder.start(1000); // Collect data every second
    mediaRecorderRef.current = mediaRecorder;
    
    // Notify desktop
    channelRef.current?.send({
      type: 'broadcast',
      event: 'RECORDING_STARTED',
      payload: {},
    });

    // Start timer
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);

    setState('recording');
  }, []);

  // Stop recording
  const handleStopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    // Notify desktop
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

      // Notify desktop with video URL
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

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Retry connection
  const handleRetry = () => {
    setState('connecting');
    setError(null);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-between bg-background/80 backdrop-blur-sm border-b">
        <div className="flex items-center gap-2">
          <Monitor className="w-5 h-5 text-primary" />
          <span className="font-semibold">Connected to PC</span>
        </div>
        {state === 'recording' && (
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="w-3 h-3 rounded-full bg-red-500"
            />
            <span className="font-mono text-lg">{formatTime(recordingTime)}</span>
          </div>
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
            style={{ transform: 'scaleX(-1)' }} // Mirror for selfie view
          />

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
        {(state === 'ready' || state === 'recording') && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute bottom-0 left-0 right-0 p-8 flex justify-center"
          >
            {state === 'ready' ? (
              <Button
                size="lg"
                onClick={handleStartRecording}
                className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 shadow-xl"
              >
                <Camera className="w-8 h-8" />
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={handleStopRecording}
                className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 shadow-xl animate-pulse"
              >
                <StopCircle className="w-8 h-8" />
              </Button>
            )}
          </motion.div>
        )}

        {/* Recording indicator */}
        {state === 'recording' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-4 left-4 flex items-center gap-2 bg-red-500/90 text-white px-3 py-1.5 rounded-full"
          >
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="w-2 h-2 rounded-full bg-white"
            />
            <span className="text-sm font-medium">REC</span>
          </motion.div>
        )}
      </main>

      {/* Footer hint */}
      {state === 'ready' && (
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="p-4 text-center text-sm text-muted-foreground"
        >
          Tap the red button to start recording
        </motion.footer>
      )}
    </div>
  );
};

export default MobileRecord;
