// AI Coach Recording View - Real-time MediaPipe face mesh

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Square, Mic, Eye, Smile, Timer, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAICoachStore } from '@/stores/aiCoachStore';
import type { FrameData } from '@/services/mediapipe';
import { initializeFaceLandmarker, drawFaceMesh, disposeFaceLandmarker, type FaceMetrics } from '@/services/mediapipe';

interface AICoachRecordingProps {
  onStop: (audioBlob: Blob, videoBlob: Blob, duration: number, frameData: FrameData[]) => void;
  onCancel: () => void;
}

export const AICoachRecording = ({ onStop, onCancel }: AICoachRecordingProps) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentMetrics, setCurrentMetrics] = useState<FaceMetrics | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoChunksRef = useRef<Blob[]>([]);
  const frameDataRef = useRef<FrameData[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  
  const { addFrameData, clearFrameData } = useAICoachStore();

  // Initialize MediaPipe and start recording
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        // Initialize MediaPipe
        await initializeFaceLandmarker();
        
        // Get media stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: true,
        });
        
        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Set up MediaRecorder for video+audio
        const videoRecorder = new MediaRecorder(stream, {
          mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
            ? 'video/webm;codecs=vp9'
            : 'video/webm'
        });
        
        videoRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            videoChunksRef.current.push(e.data);
          }
        };
        
        // Set up audio-only recorder for Whisper
        const audioStream = new MediaStream(stream.getAudioTracks());
        const audioRecorder = new MediaRecorder(audioStream, {
          mimeType: MediaRecorder.isTypeSupported('audio/webm')
            ? 'audio/webm'
            : 'audio/mp4'
        });
        
        audioRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };
        
        mediaRecorderRef.current = videoRecorder;
        (mediaRecorderRef.current as any).audioRecorder = audioRecorder;
        
        // Start recording
        videoRecorder.start(1000);
        audioRecorder.start(1000);
        startTimeRef.current = performance.now();
        clearFrameData();
        frameDataRef.current = [];
        
        setIsInitialized(true);
        
        // Start face mesh loop
        startFaceMeshLoop();
        
      } catch (err) {
        console.error('Initialization error:', err);
        if (mounted) {
          setInitError(err instanceof Error ? err.message : 'Failed to initialize');
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
      cleanup();
    };
  }, []);

  // Duration timer
  useEffect(() => {
    if (!isInitialized) return;
    
    const interval = setInterval(() => {
      setDuration(Math.floor((performance.now() - startTimeRef.current) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isInitialized]);

  const startFaceMeshLoop = useCallback(() => {
    const processFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (!video || !canvas || video.readyState < 2) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      const now = performance.now();
      
      // Process at ~15fps to reduce CPU load
      if (now - lastFrameTimeRef.current < 66) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }
      lastFrameTimeRef.current = now;

      // Set canvas size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      // Draw mirrored video
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      ctx.restore();

      // Draw face mesh and get metrics
      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-canvas.width, 0);
      const metrics = drawFaceMesh(ctx, video, now);
      ctx.restore();

      if (metrics) {
        setCurrentMetrics(metrics);
        
        // Store frame data
        const frameData: FrameData = {
          timestamp: now - startTimeRef.current,
          eyeContact: metrics.isLookingAtCamera,
          smiling: metrics.isSmiling,
          headDeviation: metrics.headPoseDeviation,
        };
        frameDataRef.current.push(frameData);
        addFrameData(frameData);
        
        // Update warnings
        const newWarnings: string[] = [];
        if (!metrics.isLookingAtCamera && metrics.headPoseDeviation > 20) {
          newWarnings.push('Look at the camera');
        }
        if (metrics.eyeContactScore < 50) {
          newWarnings.push('Maintain eye contact');
        }
        setWarnings(newWarnings);
      }

      animationFrameRef.current = requestAnimationFrame(processFrame);
    };

    animationFrameRef.current = requestAnimationFrame(processFrame);
  }, [addFrameData]);

  const cleanup = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const handleStop = () => {
    const recorder = mediaRecorderRef.current;
    const audioRecorder = (recorder as any)?.audioRecorder as MediaRecorder | undefined;
    
    if (recorder && audioRecorder) {
      recorder.stop();
      audioRecorder.stop();
      
      // Wait for data to be collected
      setTimeout(() => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' });
        const finalDuration = Math.floor((performance.now() - startTimeRef.current) / 1000);
        
        cleanup();
        onStop(audioBlob, videoBlob, finalDuration, frameDataRef.current);
      }, 500);
    }
  };

  const handleCancel = () => {
    cleanup();
    onCancel();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (initError) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="font-semibold">Initialization Failed</h3>
          <p className="text-sm text-muted-foreground">{initError}</p>
          <Button onClick={onCancel}>Go Back</Button>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Initializing AI Coach...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Recording header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
          <span className="font-semibold">Recording</span>
          <span className="text-2xl font-mono font-bold">{formatTime(duration)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={handleStop}>
            <Square className="w-4 h-4 mr-2 fill-current" />
            Stop Recording
          </Button>
        </div>
      </div>

      {/* Video with face mesh overlay */}
      <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover opacity-0"
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Real-time warnings */}
        {warnings.length > 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 py-2 rounded-full bg-warning/90 text-warning-foreground text-sm font-medium"
            >
              {warnings[0]}
            </motion.div>
          </div>
        )}

        {/* Live metrics overlay */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between">
          <div className="flex items-center gap-4">
            {/* Eye contact indicator */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-sm ${
              currentMetrics?.isLookingAtCamera 
                ? 'bg-success/20 text-success' 
                : 'bg-muted/50 text-muted-foreground'
            }`}>
              <Eye className="w-4 h-4" />
              <span className="text-sm font-medium">
                {currentMetrics?.eyeContactScore?.toFixed(0) || 0}%
              </span>
            </div>

            {/* Smile indicator */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-sm ${
              currentMetrics?.isSmiling 
                ? 'bg-primary/20 text-primary' 
                : 'bg-muted/50 text-muted-foreground'
            }`}>
              <Smile className="w-4 h-4" />
              <span className="text-sm font-medium">
                {currentMetrics?.isSmiling ? 'Smiling' : 'Neutral'}
              </span>
            </div>
          </div>

          {/* Audio level indicator */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 backdrop-blur-sm">
            <Mic className="w-4 h-4 text-destructive animate-pulse" />
            <span className="text-sm font-medium">Recording audio...</span>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="text-center text-sm text-muted-foreground">
        <p>Deliver your pitch naturally. The AI is tracking your eye contact and expressions.</p>
      </div>
    </motion.div>
  );
};
