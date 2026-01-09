// AI Coach Recording View - Immersive Studio Mode with Teleprompter + Face Mesh + Body Language HUD

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Camera,
  Eye,
  EyeOff,
  Globe,
  Hand,
  Mic,
  Pause,
  PersonStanding,
  Play,
  Smile,
  Square,
  Volume2,
  Move,
  FileText,
  ListChecks,
  Maximize,
  Minimize,
  X,
  Type,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAICoachStore, generateBulletPointsFromScript } from "@/stores/aiCoachStore";
import type { FrameData, CombinedMetrics } from "@/services/mediapipe";
import { drawFaceMesh, initializeFaceLandmarker } from "@/services/mediapipe";
import { trackEvent } from "@/utils/analytics";
import { CueCardStack } from "./CueCardStack";
import { cn } from "@/lib/utils";

interface AICoachRecordingProps {
  onStop: (audioBlob: Blob, videoBlob: Blob, duration: number, frameData: FrameData[]) => void;
  onCancel: () => void;
  initialStream?: MediaStream | null;
}

type SpeechRecognitionCtor = new () => any;
type SpeechRecognitionInstance = any;

const getSpeechRecognitionCtor = (): SpeechRecognitionCtor | null => {
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
};

const LANGUAGES = [
  { code: "en-US", label: "English (US)" },
  { code: "en-GB", label: "English (UK)" },
  { code: "lv-LV", label: "Latvian" },
  { code: "de-DE", label: "German" },
  { code: "fr-FR", label: "French" },
  { code: "es-ES", label: "Spanish" },
  { code: "it-IT", label: "Italian" },
  { code: "pt-BR", label: "Portuguese (BR)" },
  { code: "ru-RU", label: "Russian" },
  { code: "zh-CN", label: "Chinese (Simplified)" },
  { code: "ja-JP", label: "Japanese" },
  { code: "ko-KR", label: "Korean" },
];

export const AICoachRecording = ({ onStop, onCancel, initialStream }: AICoachRecordingProps) => {
  const { 
    scriptBlocks, 
    bulletPoints,
    setBulletPoints,
    promptMode,
    setPromptMode,
    transcriptionSettings, 
    setTranscriptionSettings,
    addFrameData, 
    clearFrameData 
  } = useAICoachStore();

  const hasScript = scriptBlocks.length > 0;

  // Initialize bullet points from script if not already set
  useEffect(() => {
    if (hasScript && bulletPoints.length === 0) {
      const generatedPoints = generateBulletPointsFromScript(scriptBlocks);
      setBulletPoints(generatedPoints);
    }
  }, [hasScript, bulletPoints.length, scriptBlocks, setBulletPoints]);

  // Effective bullet points (from store or generated from script)
  const effectiveBulletPoints = bulletPoints.length > 0 
    ? bulletPoints 
    : hasScript 
      ? generateBulletPointsFromScript(scriptBlocks)
      : [];

  // Initialization
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [mediaPipeReady, setMediaPipeReady] = useState(false);
  const [mediaPipeFailed, setMediaPipeFailed] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("Initializing AI Vision...");

  // Teleprompter state
  const [teleprompterPaused, setTeleprompterPaused] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1); // 0.5 to 3
  const [fontSize, setFontSize] = useState(1.5); // rem multiplier
  const [teleprompterOpacity, setTeleprompterOpacity] = useState(0.8);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  
  // Studio Mode (Fullscreen)
  const [isFullscreen, setIsFullscreen] = useState(false);
  const studioContainerRef = useRef<HTMLDivElement>(null);

  // HUD metrics (updated less frequently to prevent flicker)
  const [hudMetrics, setHudMetrics] = useState<{
    eyeContact: boolean;
    eyeScore: number;
    smiling: boolean;
    micLevel: number;
    // Body language
    postureScore: number;
    postureIssue: string;
    handsStatus: 'visible' | 'hidden' | 'crossed';
    bodyStability: number;
  }>({ 
    eyeContact: false, 
    eyeScore: 0, 
    smiling: false, 
    micLevel: 0,
    postureScore: 100,
    postureIssue: 'good',
    handsStatus: 'hidden',
    bodyStability: 100,
  });

  // Live transcription
  const [liveTranscript, setLiveTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const liveTranscriptRef = useRef<HTMLDivElement>(null);
  const speechRecognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Refs for high-frequency updates
  const metricsRef = useRef<CombinedMetrics | null>(null);
  const micLevelRef = useRef(0);
  const lastHudUpdateRef = useRef(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoChunksRef = useRef<Blob[]>([]);

  const frameDataRef = useRef<FrameData[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micDataRef = useRef<Uint8Array | null>(null);

  const teleprompterRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<number | null>(null);

  // Video element attachment
  const attachVideoEl = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (!el) return;
    el.style.opacity = "1";
    if (streamRef.current) {
      el.srcObject = streamRef.current;
      const maybePlay = () => { el.play().catch(() => {}); };
      if (el.readyState >= 2) maybePlay();
      else el.onloadedmetadata = maybePlay;
    }
  }, []);

  // 1) Initialize camera + mic (use initialStream if provided)
  useEffect(() => {
    let mounted = true;

    const initializeCamera = async () => {
      try {
        setLoadingMessage("Requesting camera access...");
        
        // Use initial stream if provided, otherwise request a new one
        let stream: MediaStream;
        if (initialStream) {
          stream = initialStream;
        } else {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
            audio: true,
          });
        }

        if (!mounted) {
          // Only stop tracks if we created them (not from initialStream)
          if (!initialStream) {
            stream.getTracks().forEach((t) => t.stop());
          }
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadeddata = () => {
            if (mounted) {
              setIsCameraReady(true);
              setLoadingMessage("Loading AI face tracking...");
            }
          };
          videoRef.current.onplaying = () => {
            if (mounted) {
              setIsCameraReady(true);
              setLoadingMessage("Loading AI face tracking...");
            }
          };
        }

        // Mic analyser
        try {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          const source = audioContextRef.current.createMediaStreamSource(stream);
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 256;
          source.connect(analyserRef.current);
          micDataRef.current = new Uint8Array(analyserRef.current.fftSize);
        } catch (e) {
          console.warn("Mic analyser init failed", e);
        }
      } catch (err) {
        if (mounted) {
          setInitError(err instanceof Error ? `Camera access denied: ${err.message}` : "Failed to access camera.");
        }
      }
    };

    initializeCamera();
    return () => { mounted = false; };
  }, []);

  // 2) Initialize MediaPipe
  useEffect(() => {
    if (!isCameraReady) return;
    let mounted = true;

    const init = async () => {
      try {
        setLoadingMessage("Initializing AI Vision...");
        await initializeFaceLandmarker();
        if (mounted) {
          setMediaPipeReady(true);
          setLoadingMessage("Ready!");
        }
      } catch (err) {
        console.error("MediaPipe init failed:", err);
        if (mounted) {
          setMediaPipeFailed(true);
          setMediaPipeReady(true);
        }
      }
    };

    init();
    return () => { mounted = false; };
  }, [isCameraReady]);

  // 3) Start recording
  useEffect(() => {
    if (!isCameraReady || !mediaPipeReady || isRecording) return;
    const stream = streamRef.current;
    if (!stream) return;

    try {
      const videoRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm",
      });
      videoRecorder.ondataavailable = (e) => { if (e.data.size > 0) videoChunksRef.current.push(e.data); };

      const audioStream = new MediaStream(stream.getAudioTracks());
      const audioRecorder = new MediaRecorder(audioStream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4",
      });
      audioRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };

      mediaRecorderRef.current = videoRecorder;
      (mediaRecorderRef.current as any).audioRecorder = audioRecorder;

      audioChunksRef.current = [];
      videoChunksRef.current = [];
      clearFrameData();
      frameDataRef.current = [];

      videoRecorder.start(1000);
      audioRecorder.start(1000);

      startTimeRef.current = performance.now();
      setIsRecording(true);

      if (!mediaPipeFailed) startFaceMeshLoop();
    } catch (err) {
      console.error("Recording setup error:", err);
      setInitError("Failed to start recording");
    }
  }, [clearFrameData, isCameraReady, isRecording, mediaPipeFailed, mediaPipeReady]);

  // Duration timer (fallback when no audio sync)
  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => {
      setDuration(Math.floor((performance.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  // Manual scroll for teleprompter (speed-controlled interval)
  useEffect(() => {
    if (!isRecording || !hasScript || teleprompterPaused || !teleprompterRef.current || promptMode !== 'teleprompter') {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
      return;
    }

    const baseInterval = 50; // ms
    const pixelsPerTick = scrollSpeed;

    scrollIntervalRef.current = window.setInterval(() => {
      if (teleprompterRef.current) {
        teleprompterRef.current.scrollTop += pixelsPerTick;
        
        // Update current block based on scroll position
        const scrollTop = teleprompterRef.current.scrollTop;
        const scrollHeight = teleprompterRef.current.scrollHeight - teleprompterRef.current.clientHeight;
        const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
        const newBlockIndex = Math.min(
          Math.floor(progress * scriptBlocks.length),
          scriptBlocks.length - 1
        );
        if (newBlockIndex !== currentBlockIndex && newBlockIndex >= 0) {
          setCurrentBlockIndex(newBlockIndex);
        }
      }
    }, baseInterval);

    return () => {
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    };
  }, [hasScript, isRecording, teleprompterPaused, scrollSpeed, promptMode, scriptBlocks.length, currentBlockIndex]);

  // Live transcription (also enabled for cue card mode's AI Voice advance)
  const shouldEnableTranscription = !hasScript || (hasScript && promptMode === 'cueCards');
  
  useEffect(() => {
    if (!isRecording || !shouldEnableTranscription || !transcriptionSettings.enabled) return;

    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) { setSpeechSupported(false); return; }

    setSpeechSupported(true);
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = transcriptionSettings.language;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const text = res[0]?.transcript ?? "";
        if (res.isFinal) finalText += text;
        else interimText += text;
      }
      if (finalText.trim()) setLiveTranscript((prev) => (prev + " " + finalText).trim());
      if (interimText.trim()) {
        setLiveTranscript((prev) => {
          const base = prev.replace(/\s*\[interim\][\s\S]*$/m, "").trim();
          return `${base} [interim] ${interimText}`.trim();
        });
      } else {
        setLiveTranscript((prev) => prev.replace(/\s*\[interim\][\s\S]*$/m, "").trim());
      }
    };

    recognition.onerror = () => setIsListening(false);
    speechRecognitionRef.current = recognition;

    try { recognition.start(); } catch {}
    return () => { try { recognition.stop(); } catch {} speechRecognitionRef.current = null; };
  }, [shouldEnableTranscription, isRecording, transcriptionSettings.enabled, transcriptionSettings.language]);

  // Scroll transcript to bottom
  useEffect(() => {
    if (liveTranscriptRef.current) liveTranscriptRef.current.scrollTop = liveTranscriptRef.current.scrollHeight;
  }, [liveTranscript]);

  // Face mesh loop
  const startFaceMeshLoop = useCallback(() => {
    const tick = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Mic level
      if (analyserRef.current && micDataRef.current) {
        analyserRef.current.getByteTimeDomainData(micDataRef.current as Uint8Array<ArrayBuffer>);
        let sumSquares = 0;
        for (let i = 0; i < micDataRef.current.length; i++) {
          const v = (micDataRef.current[i] - 128) / 128;
          sumSquares += v * v;
        }
        micLevelRef.current = Math.round(Math.min(100, Math.sqrt(sumSquares / micDataRef.current.length) * 200));
      }

      if (!video || !canvas || video.readyState < 2) {
        animationFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      const now = performance.now();

      // ~20fps for face mesh
      if (now - lastFrameTimeRef.current < 50) {
        animationFrameRef.current = requestAnimationFrame(tick);
        return;
      }
      lastFrameTimeRef.current = now;

      // Match canvas size
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        animationFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      // Clear canvas (transparent)
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      try {
        const metrics = drawFaceMesh(ctx, video, now);
        metricsRef.current = metrics;

        if (metrics) {
          const frame: FrameData = {
            timestamp: now - startTimeRef.current,
            eyeContact: metrics.isLookingAtCamera,
            smiling: metrics.isSmiling,
            headDeviation: metrics.headPoseDeviation,
            postureScore: metrics.body?.postureScore,
            handsVisible: metrics.body?.handsStatus === 'visible',
            bodyStability: metrics.body?.bodyStability,
            noseX: metrics.body ? undefined : undefined, // Will be set by pose
          };
          frameDataRef.current.push(frame);
          addFrameData(frame);
        }

        // Update HUD every 300ms
        if (now - lastHudUpdateRef.current > 300) {
          lastHudUpdateRef.current = now;
          setHudMetrics({
            eyeContact: metricsRef.current?.isLookingAtCamera ?? false,
            eyeScore: metricsRef.current?.eyeContactScore ?? 0,
            smiling: metricsRef.current?.isSmiling ?? false,
            micLevel: micLevelRef.current,
            postureScore: metricsRef.current?.body?.postureScore ?? 100,
            postureIssue: metricsRef.current?.body?.postureIssue ?? 'good',
            handsStatus: metricsRef.current?.body?.handsStatus ?? 'hidden',
            bodyStability: metricsRef.current?.body?.bodyStability ?? 100,
          });
        }
      } catch (e) {
        console.error("Face mesh error:", e);
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);
  }, [addFrameData]);

  const cleanup = useCallback(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    if (speechRecognitionRef.current) try { speechRecognitionRef.current.stop?.(); } catch {}
    if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    animationFrameRef.current = null;
    scrollIntervalRef.current = null;
    speechRecognitionRef.current = null;
    audioContextRef.current = null;
    analyserRef.current = null;
    streamRef.current = null;
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const handleStop = () => {
    const recorder = mediaRecorderRef.current;
    const audioRecorder = (recorder as any)?.audioRecorder as MediaRecorder | undefined;
    if (!recorder || !audioRecorder) return;

    recorder.stop();
    audioRecorder.stop();
    
    const finalDuration = Math.floor((performance.now() - startTimeRef.current) / 1000);
    trackEvent('Recording: Completed', { duration: finalDuration });
    trackEvent('Analysis: Triggered');

    setTimeout(() => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const videoBlob = new Blob(videoChunksRef.current, { type: "video/webm" });
      cleanup();
      onStop(audioBlob, videoBlob, finalDuration, frameDataRef.current);
    }, 500);
  };

  const handleCancel = useCallback(() => { cleanup(); onCancel(); }, [cleanup, onCancel]);

  // Toggle pause handler for teleprompter
  const handleTogglePause = useCallback(() => {
    setTeleprompterPaused(prev => !prev);
  }, []);

  // Keyboard shortcuts: Space = toggle pause, Escape = cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === "Space" && hasScript) {
        e.preventDefault();
        handleTogglePause();
      } else if (e.code === "Escape") {
        e.preventDefault();
        handleCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasScript, handleCancel, handleTogglePause]);

  // Format time helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!studioContainerRef.current) return;
    
    if (!document.fullscreenElement) {
      studioContainerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(console.error);
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(console.error);
    }
  }, []);

  // Listen for fullscreen changes (e.g., Escape key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const liveTranscriptDisplay = useMemo(() => {
    const parts = liveTranscript.split(/\s*\[interim\]\s*/);
    return { base: parts[0] ?? "", interim: parts[1] ?? "" };
  }, [liveTranscript]);

  // Error state
  if (initError) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="font-semibold">Initialization Failed</h3>
          <p className="text-sm text-muted-foreground max-w-md">{initError}</p>
          <Button onClick={onCancel}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      ref={studioContainerRef}
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className={cn(
        "relative",
        isFullscreen ? "fixed inset-0 z-50 bg-black" : "space-y-4"
      )}
    >
      {/* Main Recording Container - Fullscreen-Optimized */}
      <div className={cn(
        "relative overflow-hidden bg-black",
        isFullscreen ? "w-full h-full" : "w-full rounded-xl",
        !isFullscreen && "aspect-video"
      )}>
        
        {/* Layer 0: Video - Maximum Coverage */}
        <video
          ref={attachVideoEl}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ zIndex: 0, transform: "scaleX(-1)" }}
        />

        {/* Layer 10: Face Mesh Canvas */}
        {!mediaPipeFailed && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 10, backgroundColor: "transparent", transform: "scaleX(-1)" }}
          />
        )}

        {/* Layer 20: UI Overlays */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 20 }}>
          
          {/* Loading Overlay */}
          <AnimatePresence>
            {(!isCameraReady || !mediaPipeReady) && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto"
              >
                <div className="text-center space-y-4">
                  <div className="relative">
                    <div className="w-20 h-20 mx-auto border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                    <Camera className="w-8 h-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cyan-400" />
                  </div>
                  <p className="text-cyan-400 font-medium">{loadingMessage}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* HUD: Top-Left - Timer + Status */}
          <div className="absolute top-4 left-4 flex items-center gap-3 pointer-events-auto">
            {/* Recording Status */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/60 backdrop-blur-sm">
              <div className={`w-3 h-3 rounded-full ${isRecording ? (teleprompterPaused ? "bg-amber-400" : "bg-destructive animate-pulse") : "bg-muted"}`} />
              <span className="text-sm font-medium text-white">
                {isRecording ? (teleprompterPaused ? "Paused" : "REC") : "Ready"}
              </span>
              <span className="text-lg font-mono font-bold text-white">
                {formatTime(duration)}
              </span>
            </div>
            
            {/* Mic Level */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/60 backdrop-blur-sm">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <div className="w-12 h-2 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-400 to-green-400"
                  animate={{ width: `${hudMetrics.micLevel}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </div>
          </div>

          {/* HUD: Top-Right - Controls */}
          <div className="absolute top-4 right-4 flex items-center gap-2 pointer-events-auto">
            {/* Eye Contact Status */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/60 backdrop-blur-sm">
              {hudMetrics.eyeContact ? (
                <>
                  <Eye className="w-4 h-4 text-green-400" />
                  <span className="text-xs font-medium text-green-400">Eye Contact</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4 text-red-400" />
                  <span className="text-xs font-medium text-red-400">Look at Camera</span>
                </>
              )}
            </div>
            
            {/* Fullscreen Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 bg-black/60 backdrop-blur-sm text-white hover:bg-black/80"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </Button>
            
            {/* Cancel Button (Small X) */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 bg-black/60 backdrop-blur-sm text-white/70 hover:text-red-400 hover:bg-black/80"
              onClick={handleCancel}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* HUD: Bottom-Left - Body Language */}
          <div className="absolute bottom-24 left-4 flex flex-col gap-2 pointer-events-auto">
            {/* Posture */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm ${hudMetrics.postureScore >= 80 ? '' : 'border border-amber-500/50'}`}>
              <PersonStanding className={`w-4 h-4 ${hudMetrics.postureScore >= 80 ? 'text-green-400' : 'text-amber-400'}`} />
              <span className={`text-xs font-medium ${hudMetrics.postureScore >= 80 ? 'text-green-400' : 'text-amber-400'}`}>
                {hudMetrics.postureIssue === 'good' ? 'Good Posture' : hudMetrics.postureIssue === 'shoulders_shrugged' ? 'Relax Shoulders' : hudMetrics.postureIssue === 'slouching' ? 'Stand Straight' : 'Stop Leaning'}
              </span>
            </div>
            {/* Hands */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm`}>
              <Hand className={`w-4 h-4 ${hudMetrics.handsStatus === 'visible' ? 'text-green-400' : hudMetrics.handsStatus === 'crossed' ? 'text-amber-400' : 'text-red-400'}`} />
              <span className={`text-xs font-medium ${hudMetrics.handsStatus === 'visible' ? 'text-green-400' : hudMetrics.handsStatus === 'crossed' ? 'text-amber-400' : 'text-red-400'}`}>
                {hudMetrics.handsStatus === 'visible' ? 'Hands Visible' : hudMetrics.handsStatus === 'crossed' ? 'Arms Crossed' : 'Show Hands'}
              </span>
            </div>
            {/* Stability Warning */}
            {hudMetrics.bodyStability < 70 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-red-500/50 animate-pulse">
                <Move className="w-4 h-4 text-red-400" />
                <span className="text-xs font-medium text-red-400">Stop Swaying!</span>
              </div>
            )}
          </div>

          {/* MediaPipe failed notice */}
          {mediaPipeFailed && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-yellow-500/80 text-black text-xs font-medium pointer-events-auto">
              Face tracking unavailable
            </div>
          )}
        </div>

        {/* Layer 25: Prompt Overlay (Teleprompter or Cue Cards) - Adjustable opacity */}
        {hasScript && isRecording && (
          <div
            className="absolute bottom-28 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl pointer-events-auto"
            style={{ zIndex: 25, opacity: teleprompterOpacity }}
          >
            <div className="relative rounded-xl bg-black/70 backdrop-blur-md border border-white/10 overflow-hidden">
              {/* Mode Toggle + Controls Header */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
                {/* Mode Toggle */}
                <div className="flex items-center gap-1 p-0.5 bg-white/10 rounded-lg">
                  <button
                    onClick={() => setPromptMode('teleprompter')}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                      promptMode === 'teleprompter'
                        ? "bg-cyan-500/30 text-cyan-400"
                        : "text-white/50 hover:text-white/80"
                    )}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Teleprompter
                  </button>
                  <button
                    onClick={() => setPromptMode('cueCards')}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                      promptMode === 'cueCards'
                        ? "bg-cyan-500/30 text-cyan-400"
                        : "text-white/50 hover:text-white/80"
                    )}
                  >
                    <ListChecks className="w-3.5 h-3.5" />
                    Cue Cards
                  </button>
                </div>

                {/* Teleprompter-specific controls: Font Size + Speed + Pause */}
                {promptMode === 'teleprompter' && (
                  <div className="flex items-center gap-4">
                    {/* Font Size */}
                    <div className="flex items-center gap-2">
                      <Type className="w-3.5 h-3.5 text-white/50" />
                      <Slider
                        value={[fontSize]}
                        onValueChange={([v]) => setFontSize(v)}
                        min={1}
                        max={2.5}
                        step={0.25}
                        className="w-16"
                      />
                    </div>
                    {/* Speed */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/50">Speed</span>
                      <Slider
                        value={[scrollSpeed]}
                        onValueChange={([v]) => setScrollSpeed(v)}
                        min={0.5}
                        max={3}
                        step={0.5}
                        className="w-16"
                      />
                    </div>
                    {/* Play/Pause */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-white/70 hover:text-white"
                      onClick={handleTogglePause}
                    >
                      {teleprompterPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    </Button>
                    {/* Opacity */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/50">Opacity</span>
                      <Slider
                        value={[teleprompterOpacity]}
                        onValueChange={([v]) => setTeleprompterOpacity(v)}
                        min={0.3}
                        max={1}
                        step={0.1}
                        className="w-14"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Teleprompter Mode */}
              {promptMode === 'teleprompter' && (
                <>
                  {/* Reading Zone Indicator */}
                  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-12 bg-cyan-400/10 border-y border-cyan-400/30 pointer-events-none z-10" />

                  {/* Block Progress Indicator */}
                  <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2 py-1 rounded bg-black/50 backdrop-blur-sm">
                    {scriptBlocks.map((_, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all duration-300",
                          idx === currentBlockIndex
                            ? "bg-cyan-400 scale-125"
                            : idx < currentBlockIndex
                              ? "bg-green-400"
                              : "bg-white/30"
                        )}
                      />
                    ))}
                  </div>

                  {/* Script Content */}
                  <div
                    ref={teleprompterRef}
                    className="p-6 h-[180px] overflow-y-auto scroll-smooth"
                    style={{ scrollbarWidth: "none" }}
                  >
                    <div className="space-y-6 py-16">
                      {scriptBlocks.map((block, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0.5 }}
                          animate={{
                            opacity: idx === currentBlockIndex ? 1 : 0.5,
                            scale: idx === currentBlockIndex ? 1 : 0.98,
                          }}
                          transition={{ duration: 0.3 }}
                          className={cn(
                            "transition-all duration-300",
                            idx === currentBlockIndex && "relative"
                          )}
                        >
                          {/* Current block highlight bar */}
                          {idx === currentBlockIndex && (
                            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 to-green-400 rounded-full" />
                          )}
                          <p className={cn(
                            "text-xs mb-1 uppercase tracking-wide transition-colors",
                            idx === currentBlockIndex ? "text-cyan-400" : "text-cyan-400/50"
                          )}>
                            {block.title}
                          </p>
                          <p 
                            className={cn(
                              "leading-relaxed font-medium transition-colors",
                              idx === currentBlockIndex ? "text-white" : "text-white/60"
                            )}
                            style={{ fontSize: `${fontSize}rem` }}
                          >
                            {block.content}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Cue Cards Mode */}
              {promptMode === 'cueCards' && effectiveBulletPoints.length > 0 && (
                <div className="p-4">
                  <CueCardStack
                    bulletPoints={effectiveBulletPoints}
                    currentTranscript={liveTranscript}
                    isRecording={isRecording}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Layer 30: Floating Bottom Control Bar - Camera App Style */}
        {isRecording && (
          <div 
            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center gap-8 pointer-events-auto"
            style={{ zIndex: 30 }}
          >
            {/* Expression Indicator */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-sm">
              <Smile className={`w-5 h-5 ${hudMetrics.smiling ? "text-yellow-400" : "text-white/50"}`} />
              <span className={`text-sm ${hudMetrics.smiling ? "text-yellow-400" : "text-white/50"}`}>
                {hudMetrics.smiling ? "Great!" : "Smile"}
              </span>
            </div>

            {/* MAIN STOP BUTTON - Large, Centered, Prominent */}
            <button
              onClick={handleStop}
              disabled={!isRecording}
              className="relative w-20 h-20 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-2xl ring-4 ring-white/30"
            >
              <div className="w-8 h-8 rounded-sm bg-destructive" />
              {/* Pulsing ring animation */}
              <div className="absolute inset-0 rounded-full border-4 border-destructive/50 animate-ping" style={{ animationDuration: '2s' }} />
            </button>

            {/* AI Tracking Status */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-sm text-cyan-400">AI Active</span>
            </div>
          </div>
        )}
      </div>

      {/* Live Transcription Section (when no script) */}
      {!hasScript && (
        <section className="rounded-xl border border-border overflow-hidden bg-card">
          <div className="px-4 py-3 border-b border-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    id="transcription-toggle"
                    checked={transcriptionSettings.enabled}
                    onCheckedChange={(checked) => setTranscriptionSettings({ ...transcriptionSettings, enabled: checked })}
                    disabled={isRecording}
                  />
                  <Label htmlFor="transcription-toggle" className="text-sm font-medium cursor-pointer">
                    Live Transcription
                  </Label>
                </div>
                {transcriptionSettings.enabled && (
                  <span className="text-xs text-muted-foreground">
                    {speechSupported ? (isListening ? "Listening..." : "Starting...") : "Not supported"}
                  </span>
                )}
              </div>
              {transcriptionSettings.enabled && speechSupported && (
                <div className={`h-2 w-2 rounded-full ${isListening ? "bg-destructive animate-pulse" : "bg-muted"}`} />
              )}
            </div>

            {transcriptionSettings.enabled && (
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <Select
                  value={transcriptionSettings.language}
                  onValueChange={(value) => setTranscriptionSettings({ ...transcriptionSettings, language: value })}
                  disabled={isRecording}
                >
                  <SelectTrigger className="h-8 w-[180px] text-xs">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code} className="text-xs">
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="p-4">
            {transcriptionSettings.enabled ? (
              <div
                ref={liveTranscriptRef}
                className="h-[120px] overflow-y-auto rounded-lg bg-foreground text-background p-4 text-base leading-relaxed"
              >
                {speechSupported ? (
                  <>
                    <p className="whitespace-pre-wrap">{liveTranscriptDisplay.base || "Say something to see subtitles here..."}</p>
                    {liveTranscriptDisplay.interim && (
                      <p className="whitespace-pre-wrap opacity-70">{liveTranscriptDisplay.interim}</p>
                    )}
                  </>
                ) : (
                  <p className="opacity-80">Your browser does not support SpeechRecognition. Try Chrome or Edge.</p>
                )}
              </div>
            ) : (
              <div className="h-[120px] flex items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
                <div className="text-center space-y-2">
                  <Mic className="w-8 h-8 mx-auto opacity-50" />
                  <p className="text-sm">Live transcription disabled</p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Tip - Only shown when not fullscreen */}
      {!isFullscreen && (
        <p className="text-center text-sm text-muted-foreground">
          Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">Space</kbd> to pause • <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">Esc</kbd> to cancel
        </p>
      )}
    </motion.div>
  );
};
