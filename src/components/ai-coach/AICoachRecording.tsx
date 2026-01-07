// AI Coach Recording View - Professional Teleprompter + Face Mesh + HUD

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Camera,
  Eye,
  EyeOff,
  Globe,
  Mic,
  Pause,
  Play,
  Smile,
  Square,
  Volume2,
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
import { useAICoachStore } from "@/stores/aiCoachStore";
import type { FrameData } from "@/services/mediapipe";
import { drawFaceMesh, initializeFaceLandmarker, type FaceMetrics } from "@/services/mediapipe";
import { trackEvent } from "@/utils/analytics";

interface AICoachRecordingProps {
  onStop: (audioBlob: Blob, videoBlob: Blob, duration: number, frameData: FrameData[]) => void;
  onCancel: () => void;
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

export const AICoachRecording = ({ onStop, onCancel }: AICoachRecordingProps) => {
  const { 
    scriptBlocks, 
    transcriptionSettings, 
    setTranscriptionSettings,
    addFrameData, 
    clearFrameData 
  } = useAICoachStore();

  const hasScript = scriptBlocks.length > 0;

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
  const [scrollSpeed, setScrollSpeed] = useState(1); // 0.5 to 2

  // HUD metrics (updated less frequently to prevent flicker)
  const [hudMetrics, setHudMetrics] = useState<{
    eyeContact: boolean;
    eyeScore: number;
    smiling: boolean;
    micLevel: number;
  }>({ eyeContact: false, eyeScore: 0, smiling: false, micLevel: 0 });

  // Live transcription
  const [liveTranscript, setLiveTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const liveTranscriptRef = useRef<HTMLDivElement>(null);
  const speechRecognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Refs for high-frequency updates
  const metricsRef = useRef<FaceMetrics | null>(null);
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

  // 1) Initialize camera + mic
  useEffect(() => {
    let mounted = true;

    const initializeCamera = async () => {
      try {
        setLoadingMessage("Requesting camera access...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          audio: true,
        });

        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
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

  // Duration timer
  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => {
      setDuration(Math.floor((performance.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  // Teleprompter auto-scroll with speed control
  useEffect(() => {
    if (!isRecording || !hasScript || teleprompterPaused || !teleprompterRef.current) {
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
      }
    }, baseInterval);

    return () => {
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    };
  }, [hasScript, isRecording, teleprompterPaused, scrollSpeed]);

  // Live transcription
  useEffect(() => {
    if (!isRecording || hasScript || !transcriptionSettings.enabled) return;

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
  }, [hasScript, isRecording, transcriptionSettings.enabled, transcriptionSettings.language]);

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

  // Keyboard shortcuts: Space = toggle teleprompter, Escape = cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === "Space" && hasScript) {
        e.preventDefault();
        setTeleprompterPaused((prev) => !prev);
      } else if (e.code === "Escape") {
        e.preventDefault();
        handleCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasScript, handleCancel]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isRecording ? "bg-destructive animate-pulse" : "bg-muted"}`} />
          <span className="font-semibold">{isRecording ? "Recording" : "Preparing"}</span>
          <span className="text-2xl font-mono font-bold">{formatTime(duration)}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCancel}>Cancel</Button>
          <Button variant="destructive" size="sm" onClick={handleStop} disabled={!isRecording}>
            <Square className="w-4 h-4 mr-2 fill-current" />
            Stop
          </Button>
        </div>
      </div>

      {/* Main Recording Container - Layered Architecture */}
      <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ aspectRatio: "16/9" }}>
        
        {/* Layer 0: Video */}
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

          {/* HUD: Top-Left - Audio Level */}
          <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-black/60 backdrop-blur-sm pointer-events-auto">
            <Volume2 className="w-4 h-4 text-cyan-400" />
            <div className="w-16 h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-400 to-green-400"
                animate={{ width: `${hudMetrics.micLevel}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </div>

          {/* HUD: Top-Right - Eye Contact Status */}
          <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-black/60 backdrop-blur-sm pointer-events-auto">
            {hudMetrics.eyeContact ? (
              <>
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <Eye className="w-4 h-4 text-green-400" />
                <span className="text-xs font-medium text-green-400">Locked On</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <EyeOff className="w-4 h-4 text-red-400" />
                <span className="text-xs font-medium text-red-400">Looking Away</span>
              </>
            )}
          </div>

          {/* HUD: Bottom-Center - System Status */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-full bg-black/60 backdrop-blur-sm pointer-events-auto">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs text-cyan-400 font-medium">AI Tracking Active</span>
            </div>
            <div className="w-px h-4 bg-white/20" />
            <div className="flex items-center gap-2">
              <Smile className={`w-4 h-4 ${hudMetrics.smiling ? "text-yellow-400" : "text-white/50"}`} />
              <span className={`text-xs ${hudMetrics.smiling ? "text-yellow-400" : "text-white/50"}`}>
                {hudMetrics.smiling ? "Smiling" : "Neutral"}
              </span>
            </div>
            <div className="w-px h-4 bg-white/20" />
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-red-400 animate-pulse" />
              <span className="text-xs text-red-400">REC</span>
            </div>
          </div>

          {/* MediaPipe failed notice */}
          {mediaPipeFailed && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-yellow-500/80 text-black text-xs font-medium pointer-events-auto">
              Face tracking unavailable
            </div>
          )}
        </div>

        {/* Layer 25: Teleprompter Overlay (only when script exists) */}
        {hasScript && isRecording && (
          <div
            className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl pointer-events-auto"
            style={{ zIndex: 25 }}
          >
            <div className="relative rounded-xl bg-black/70 backdrop-blur-md border border-white/10 overflow-hidden">
              {/* Teleprompter Controls */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
                <span className="text-xs text-cyan-400 font-medium uppercase tracking-wider">Teleprompter</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/50">Speed</span>
                    <Slider
                      value={[scrollSpeed]}
                      onValueChange={([v]) => setScrollSpeed(v)}
                      min={0.5}
                      max={3}
                      step={0.5}
                      className="w-20"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-white/70 hover:text-white"
                    onClick={() => setTeleprompterPaused(!teleprompterPaused)}
                  >
                    {teleprompterPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Reading Zone Indicator */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-12 bg-cyan-400/10 border-y border-cyan-400/30 pointer-events-none z-10" />

              {/* Script Content */}
              <div
                ref={teleprompterRef}
                className="p-6 h-[180px] overflow-y-auto scroll-smooth"
                style={{ scrollbarWidth: "none" }}
              >
                <div className="space-y-6 py-16">
                  {scriptBlocks.map((block, idx) => (
                    <div key={idx}>
                      <p className="text-xs text-cyan-400/80 mb-1 uppercase tracking-wide">{block.title}</p>
                      <p className="text-2xl leading-relaxed text-white font-medium">{block.content}</p>
                    </div>
                  ))}
                </div>
              </div>
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

      {/* Tip */}
      <p className="text-center text-sm text-muted-foreground">
        Deliver your pitch naturally. {!mediaPipeFailed && "AI is tracking your eye contact and expressions."}
      </p>
    </motion.div>
  );
};
