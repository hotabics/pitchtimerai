// AI Coach Recording View - Real-time MediaPipe face mesh + live transcription

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Camera,
  Eye,
  Globe,
  Mic,
  Smile,
  Square,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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

// Available languages for speech recognition
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
  // Get script and transcription settings from store
  const { 
    scriptBlocks, 
    transcriptionSettings, 
    setTranscriptionSettings,
    addFrameData, 
    clearFrameData 
  } = useAICoachStore();

  const hasScript = scriptBlocks.length > 0;

  // Initialization stages
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [mediaPipeReady, setMediaPipeReady] = useState(false);
  const [mediaPipeFailed, setMediaPipeFailed] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentMetrics, setCurrentMetrics] = useState<FaceMetrics | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loadingMessage, setLoadingMessage] = useState("Requesting camera access...");

  // Live transcription
  const [liveTranscript, setLiveTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const liveTranscriptRef = useRef<HTMLDivElement>(null);
  const speechRecognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Debug overlay
  const [micLevel, setMicLevel] = useState(0); // 0-100
  const [faceDetected, setFaceDetected] = useState(false);

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

  // Mic analyser
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micDataRef = useRef<Uint8Array | null>(null);

  const teleprompterRef = useRef<HTMLDivElement>(null);

  const attachVideoEl = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;

    if (!el) return;

    // Ensure visible + correctly layered
    el.style.opacity = "1";

    // Re-attach stream when the video element mounts/remounts
    if (streamRef.current) {
      el.srcObject = streamRef.current;
      const maybePlay = () => {
        el.play().catch(() => {
          // autoplay can fail in some browsers; user gesture exists anyway (Start Recording)
        });
      };

      if (el.readyState >= 2) {
        maybePlay();
      } else {
        el.onloadedmetadata = maybePlay;
      }
    }
  }, []);

  // 1) Initialize camera + mic FIRST
  useEffect(() => {
    let mounted = true;

    const initializeCamera = async () => {
      try {
        setLoadingMessage("Requesting camera access...");

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
          audio: true,
        });

        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        // Attach stream to the current video element (and future remounts are handled by attachVideoEl)
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadeddata = () => {
            if (!mounted) return;
            setIsCameraReady(true);
            setLoadingMessage("Camera ready! Loading face tracking...");
          };

          // Some browsers never fire onloadeddata reliably; add a fallback
          videoRef.current.onplaying = () => {
            if (!mounted) return;
            setIsCameraReady(true);
            setLoadingMessage("Camera ready! Loading face tracking...");
          };
        }

        // Set up mic level analyser
        try {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          const source = audioContextRef.current.createMediaStreamSource(stream);
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 512;
          source.connect(analyserRef.current);
          micDataRef.current = new Uint8Array(analyserRef.current.fftSize);
        } catch (e) {
          // If AudioContext fails (iOS quirks), we just won't show mic level.
          console.warn("Mic analyser init failed", e);
        }
      } catch (err) {
        console.error("Camera initialization error:", err);
        if (mounted) {
          setInitError(
            err instanceof Error
              ? `Camera access denied: ${err.message}`
              : "Failed to access camera. Please grant permission."
          );
        }
      }
    };

    initializeCamera();

    return () => {
      mounted = false;
    };
  }, []);

  // 2) Initialize MediaPipe AFTER camera is ready
  useEffect(() => {
    if (!isCameraReady) return;

    let mounted = true;

    const initializeMediaPipe = async () => {
      try {
        setLoadingMessage("Loading AI face tracking...");
        await initializeFaceLandmarker();

        if (mounted) {
          setMediaPipeReady(true);
          setLoadingMessage("Starting recording...");
        }
      } catch (err) {
        console.error("MediaPipe initialization failed:", err);
        if (mounted) {
          setMediaPipeFailed(true);
          setMediaPipeReady(true); // Continue without face mesh
        }
      }
    };

    initializeMediaPipe();

    return () => {
      mounted = false;
    };
  }, [isCameraReady]);

  // 3) Start recording once ready
  useEffect(() => {
    if (!isCameraReady || !mediaPipeReady || isRecording) return;

    const stream = streamRef.current;
    if (!stream) return;

    try {
      const videoRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
          ? "video/webm;codecs=vp9"
          : "video/webm",
      });

      videoRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) videoChunksRef.current.push(e.data);
      };

      const audioStream = new MediaStream(stream.getAudioTracks());
      const audioRecorder = new MediaRecorder(audioStream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4",
      });

      audioRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

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

  // Teleprompter auto-scroll
  useEffect(() => {
    if (!isRecording || !hasScript || !teleprompterRef.current) return;

    const id = window.setInterval(() => {
      if (teleprompterRef.current) teleprompterRef.current.scrollTop += 1;
    }, 100);

    return () => window.clearInterval(id);
  }, [hasScript, isRecording]);

  // Live transcription with Web Speech API (only when no script AND transcription is enabled)
  useEffect(() => {
    if (!isRecording || hasScript || !transcriptionSettings.enabled) return;

    const Ctor = getSpeechRecognitionCtor();

    if (!Ctor) {
      setSpeechSupported(false);
      return;
    }

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

      // Append final chunks; show interim as a tail
      if (finalText.trim()) {
        setLiveTranscript((prev) => (prev + " " + finalText).trim());
      }

      if (interimText.trim()) {
        setLiveTranscript((prev) => {
          // Keep prev, but add interim separated by a special marker
          // (We avoid storing interim permanently.)
          const base = prev.replace(/\s*\[interim\][\s\S]*$/m, "").trim();
          return `${base} [interim] ${interimText}`.trim();
        });
      } else {
        setLiveTranscript((prev) => prev.replace(/\s*\[interim\][\s\S]*$/m, "").trim());
      }
    };

    recognition.onerror = () => {
      // Keep recording; just stop listening UI
      setIsListening(false);
    };

    speechRecognitionRef.current = recognition as any;

    try {
      recognition.start();
    } catch {
      // Some browsers throw if start called twice
    }

    return () => {
      try {
        recognition.stop();
      } catch {
        // ignore
      }
      speechRecognitionRef.current = null;
    };
  }, [hasScript, isRecording, transcriptionSettings.enabled, transcriptionSettings.language]);

  // Keep transcript scrolled to bottom
  useEffect(() => {
    if (!liveTranscriptRef.current) return;
    liveTranscriptRef.current.scrollTop = liveTranscriptRef.current.scrollHeight;
  }, [liveTranscript]);

  const startFaceMeshLoop = useCallback(() => {
    const tick = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Mic level
      if (analyserRef.current && micDataRef.current) {
        analyserRef.current.getByteTimeDomainData(micDataRef.current as any);
        // RMS on 0-255 centered around 128
        let sumSquares = 0;
        for (let i = 0; i < micDataRef.current.length; i++) {
          const v = (micDataRef.current[i] - 128) / 128;
          sumSquares += v * v;
        }
        const rms = Math.sqrt(sumSquares / micDataRef.current.length);
        setMicLevel(Math.round(Math.min(100, rms * 180)));
      }

      if (!video || !canvas || video.readyState < 2) {
        animationFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      const now = performance.now();

      // ~15fps
      if (now - lastFrameTimeRef.current < 66) {
        animationFrameRef.current = requestAnimationFrame(tick);
        return;
      }
      lastFrameTimeRef.current = now;

      // Match canvas to video resolution
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        animationFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      // CRITICAL: clear before drawing markers (transparent)
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      try {
        const metrics = drawFaceMesh(ctx, video, now);
        setFaceDetected(!!metrics);

        if (metrics) {
          setCurrentMetrics(metrics);

          const frame: FrameData = {
            timestamp: now - startTimeRef.current,
            eyeContact: metrics.isLookingAtCamera,
            smiling: metrics.isSmiling,
            headDeviation: metrics.headPoseDeviation,
          };

          frameDataRef.current.push(frame);
          addFrameData(frame);

          const nextWarnings: string[] = [];
          if (!metrics.isLookingAtCamera && metrics.headPoseDeviation > 20) nextWarnings.push("Look at the camera");
          if (metrics.eyeContactScore < 50) nextWarnings.push("Maintain eye contact");
          setWarnings(nextWarnings);
        }
      } catch (e) {
        console.error("Face mesh error:", e);
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);
  }, [addFrameData]);

  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (speechRecognitionRef.current) {
      try {
        (speechRecognitionRef.current as any).stop?.();
      } catch {
        // ignore
      }
      speechRecognitionRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    micDataRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const handleStop = () => {
    const recorder = mediaRecorderRef.current;
    const audioRecorder = (recorder as any)?.audioRecorder as MediaRecorder | undefined;

    if (!recorder || !audioRecorder) return;

    recorder.stop();
    audioRecorder.stop();

    setTimeout(() => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const videoBlob = new Blob(videoChunksRef.current, { type: "video/webm" });
      const finalDuration = Math.floor((performance.now() - startTimeRef.current) / 1000);

      cleanup();
      onStop(audioBlob, videoBlob, finalDuration, frameDataRef.current);
    }, 500);
  };

  const handleCancel = () => {
    cleanup();
    onCancel();
  };

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
          <Button variant="outline" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={handleStop} disabled={!isRecording}>
            <Square className="w-4 h-4 mr-2 fill-current" />
            Stop Recording
          </Button>
        </div>
      </div>

      {/* Split layout */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* LEFT: Teleprompter or Live transcription */}
        <section className="rounded-xl border border-border overflow-hidden bg-card">
          {hasScript ? (
            <>
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Teleprompter</span>
                <span className="text-xs text-muted-foreground">Auto-scroll</span>
              </div>
              <div ref={teleprompterRef} className="p-5 h-[420px] overflow-y-auto scroll-smooth">
                {scriptBlocks.map((b, idx) => (
                  <div key={idx} className="mb-6">
                    <div className="text-xs text-primary font-medium mb-2">{b.title}</div>
                    <p className="text-xl leading-relaxed text-foreground font-medium">{b.content}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-border space-y-3">
                {/* Transcription toggle + status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="transcription-toggle"
                        checked={transcriptionSettings.enabled}
                        onCheckedChange={(checked) => 
                          setTranscriptionSettings({ ...transcriptionSettings, enabled: checked })
                        }
                        disabled={isRecording}
                      />
                      <Label htmlFor="transcription-toggle" className="text-sm font-medium cursor-pointer">
                        Live Transcription
                      </Label>
                    </div>
                    {transcriptionSettings.enabled && (
                      <span className="text-xs text-muted-foreground">
                        {speechSupported 
                          ? (isListening ? "Listening..." : "Starting...") 
                          : "Not supported"}
                      </span>
                    )}
                  </div>
                  {transcriptionSettings.enabled && speechSupported && (
                    <div className={`h-2 w-2 rounded-full ${isListening ? "bg-destructive animate-pulse" : "bg-muted"}`} />
                  )}
                </div>

                {/* Language selector */}
                {transcriptionSettings.enabled && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <Select
                      value={transcriptionSettings.language}
                      onValueChange={(value) => 
                        setTranscriptionSettings({ ...transcriptionSettings, language: value })
                      }
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
                    {isRecording && (
                      <span className="text-xs text-muted-foreground">(locked during recording)</span>
                    )}
                  </div>
                )}
              </div>

              <div className="p-4">
                {transcriptionSettings.enabled ? (
                  <div
                    ref={liveTranscriptRef}
                    className="h-[380px] overflow-y-auto rounded-lg bg-foreground text-background p-4 text-base leading-relaxed"
                  >
                    {speechSupported ? (
                      <>
                        <p className="whitespace-pre-wrap">{liveTranscriptDisplay.base || "\n\nSay something to see subtitles here."}</p>
                        {liveTranscriptDisplay.interim ? (
                          <p className="whitespace-pre-wrap opacity-70">{liveTranscriptDisplay.interim}</p>
                        ) : null}
                      </>
                    ) : (
                      <p className="opacity-80">
                        Your browser doesn't support SpeechRecognition. (Try Chrome / Edge on desktop.)
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="h-[380px] flex items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
                    <div className="text-center space-y-2">
                      <Mic className="w-8 h-8 mx-auto opacity-50" />
                      <p className="text-sm">Live transcription is disabled</p>
                      <p className="text-xs">Enable it above to see your speech in real-time</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        {/* RIGHT: Video + overlays */}
        <section className="space-y-3">
          <div className="relative aspect-video rounded-xl overflow-hidden bg-muted" style={{ minHeight: "400px" }}>
            {/* Layer 1: Video */}
            <video
              ref={attachVideoEl}
              autoPlay
              playsInline
              muted
              className="absolute top-0 left-0 w-full h-full object-cover"
              style={{
                zIndex: 10,
                transform: "scaleX(-1)",
                opacity: 1,
              }}
            />

            {/* Layer 2: Face mesh canvas */}
            {!mediaPipeFailed && (
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none"
                style={{
                  zIndex: 20,
                  backgroundColor: "transparent",
                  transform: "scaleX(-1)",
                }}
              />
            )}

            {/* Loading overlay until camera is ready */}
            {!isCameraReady && (
              <div
                className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm"
                style={{ zIndex: 30 }}
              >
                <div className="text-center space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <Camera className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" />
                  </div>
                  <p className="text-muted-foreground">Loading Camera...</p>
                </div>
              </div>
            )}

            {/* Status overlay while MediaPipe loads */}
            {isCameraReady && !mediaPipeReady && (
              <div
                className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm"
                style={{ zIndex: 30 }}
              >
                <p className="text-muted-foreground">{loadingMessage}</p>
              </div>
            )}

            {/* Debug info overlay (temporary) */}
            <div
              className="absolute top-3 left-3 rounded-lg bg-foreground/70 text-background text-xs px-3 py-2 backdrop-blur-sm"
              style={{ zIndex: 40 }}
            >
              <div>Cam Status: {isCameraReady ? "Active" : "Inactive"}</div>
              <div>Face Detected: {mediaPipeFailed ? "N/A" : faceDetected ? "Yes" : "No"}</div>
              <div>Mic Level: {micLevel}</div>
            </div>

            {/* MediaPipe disabled notice */}
            {mediaPipeFailed && (
              <div
                className="absolute top-4 right-4 px-3 py-1.5 rounded-lg bg-warning/80 text-warning-foreground text-xs font-medium"
                style={{ zIndex: 30 }}
              >
                Face tracking unavailable
              </div>
            )}

            {/* Real-time warnings */}
            {warnings.length > 0 && !mediaPipeFailed && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2" style={{ zIndex: 30 }}>
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
            <div className="absolute bottom-4 left-4 right-4 flex justify-between" style={{ zIndex: 30 }}>
              <div className="flex items-center gap-4">
                {!mediaPipeFailed && (
                  <>
                    <div
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-sm ${
                        currentMetrics?.isLookingAtCamera ? "bg-success/20 text-success" : "bg-foreground/60 text-background"
                      }`}
                    >
                      <Eye className="w-4 h-4" />
                      <span className="text-sm font-medium">{currentMetrics?.eyeContactScore?.toFixed(0) || 0}%</span>
                    </div>

                    <div
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-sm ${
                        currentMetrics?.isSmiling ? "bg-primary/20 text-primary" : "bg-foreground/60 text-background"
                      }`}
                    >
                      <Smile className="w-4 h-4" />
                      <span className="text-sm font-medium">{currentMetrics?.isSmiling ? "Smiling" : "Neutral"}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-foreground/60 backdrop-blur-sm text-background">
                <Mic className="w-4 h-4 text-destructive animate-pulse" />
                <span className="text-sm font-medium">Recording audio…</span>
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Deliver your pitch naturally. {!mediaPipeFailed && "The AI is tracking your eye contact and expressions."}
          </p>
        </section>
      </div>
    </motion.div>
  );
};
