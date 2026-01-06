import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, Video, BarChart3, Play, Pause, RotateCcw, Monitor, 
  Smartphone, Presentation, RefreshCw, Download, Clock, Minus, 
  Smile, Zap, ChevronRight, Timer, SkipForward, Volume2, VolumeX,
  Gauge
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { TrackType, trackConfigs } from "@/lib/tracks";
import jsPDF from "jspdf";

interface SpeechBlock {
  timeStart: string;
  timeEnd: string;
  title: string;
  content: string;
  isDemo?: boolean;
  visualCue?: string;
}

interface DashboardProps {
  data: {
    idea: string;
    duration: number;
    track: TrackType;
    trackData: Record<string, unknown>;
    audienceLabel?: string;
  };
  onBack?: () => void;
}

const SPEAKING_RATE = 130; // words per minute

const tabs = [
  { id: "script", label: "Speech", icon: FileText },
  { id: "practice", label: "Practice", icon: Video },
  { id: "analysis", label: "Analysis", icon: BarChart3 },
];

const regenerateOptions = [
  { id: "shorter", label: "Make it shorter", icon: Minus },
  { id: "funnier", label: "Make it funnier", icon: Smile },
  { id: "tech", label: "Focus more on Tech", icon: Zap },
];

const getVisualIcon = (visualCue?: string, isDemo?: boolean) => {
  if (!visualCue && !isDemo) return null;
  if (visualCue?.toLowerCase().includes("phone") || visualCue?.toLowerCase().includes("mobile")) {
    return Smartphone;
  }
  if (visualCue?.toLowerCase().includes("slide")) {
    return Presentation;
  }
  return Monitor;
};

// Calculate reading time in milliseconds based on word count and speed
const calculateBlockDuration = (content: string, speedMultiplier: number = 1): number => {
  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
  const minutes = wordCount / SPEAKING_RATE;
  const baseMs = Math.max(minutes * 60 * 1000, 3000); // Minimum 3 seconds
  return baseMs / speedMultiplier; // Faster speed = shorter duration
};

// Format time in mm:ss
const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const Dashboard = ({ data, onBack }: DashboardProps) => {
  const [activeTab, setActiveTab] = useState("script");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBlock, setCurrentBlock] = useState(0);
  const [speechBlocks, setSpeechBlocks] = useState<SpeechBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [meta, setMeta] = useState<{ targetWordCount: number; actualWordCount: number } | null>(null);
  
  // Practice mode state
  const [blockProgress, setBlockProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [totalElapsedTime, setTotalElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const blockStartTimeRef = useRef<number>(0);
  
  // Speed control and audio state
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const audioCache = useRef<Map<number, string>>(new Map());

  const trackConfig = trackConfigs[data.track];

  // Calculate total speech duration (with speed)
  const totalDuration = speechBlocks.reduce((acc, block) => {
    return acc + calculateBlockDuration(block.content, speedMultiplier);
  }, 0);

  // Get current block duration (with speed)
  const currentBlockDuration = speechBlocks[currentBlock] 
    ? calculateBlockDuration(speechBlocks[currentBlock].content, speedMultiplier)
    : 0;

  // Fetch and play TTS audio for current block
  const playBlockAudio = useCallback(async (blockIndex: number) => {
    if (!audioEnabled || !speechBlocks[blockIndex]) return;
    
    // Check cache first
    const cachedUrl = audioCache.current.get(blockIndex);
    if (cachedUrl) {
      const audio = new Audio(cachedUrl);
      audio.playbackRate = speedMultiplier;
      setCurrentAudio(audio);
      await audio.play();
      return;
    }

    setIsLoadingAudio(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text: speechBlocks[blockIndex].content }),
        }
      );

      if (!response.ok) {
        throw new Error('TTS request failed');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Cache for reuse
      audioCache.current.set(blockIndex, audioUrl);
      
      const audio = new Audio(audioUrl);
      audio.playbackRate = speedMultiplier;
      setCurrentAudio(audio);
      
      audio.onended = () => {
        // Auto-advance if still playing
        if (isPlaying && blockIndex < speechBlocks.length - 1) {
          setCurrentBlock(blockIndex + 1);
        }
      };
      
      await audio.play();
    } catch (err) {
      console.error('TTS error:', err);
      toast({
        title: "Audio Error",
        description: "Failed to generate audio. Using timer mode.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAudio(false);
    }
  }, [audioEnabled, speechBlocks, speedMultiplier, isPlaying]);

  // Stop current audio
  const stopAudio = useCallback(() => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
    }
  }, [currentAudio]);

  // Update audio playback rate when speed changes
  useEffect(() => {
    if (currentAudio) {
      currentAudio.playbackRate = speedMultiplier;
    }
  }, [speedMultiplier, currentAudio]);

  // Play audio when block changes (if audio enabled)
  useEffect(() => {
    if (isPlaying && audioEnabled && activeTab === "practice") {
      stopAudio();
      playBlockAudio(currentBlock);
    }
  }, [currentBlock, isPlaying, audioEnabled, activeTab]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      // Revoke cached URLs
      audioCache.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  // Auto-advance logic for practice mode
  useEffect(() => {
    if (isPlaying && activeTab === "practice") {
      blockStartTimeRef.current = Date.now() - elapsedTime;
      
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = now - blockStartTimeRef.current;
        setElapsedTime(elapsed);
        
        const progress = Math.min((elapsed / currentBlockDuration) * 100, 100);
        setBlockProgress(progress);
        
        // Auto-advance to next block
        if (elapsed >= currentBlockDuration) {
          if (currentBlock < speechBlocks.length - 1) {
            setCurrentBlock(prev => prev + 1);
            setElapsedTime(0);
            setBlockProgress(0);
            blockStartTimeRef.current = now;
          } else {
            // End of speech
            setIsPlaying(false);
            toast({
              title: "Practice Complete!",
              description: `Total time: ${formatTime(totalElapsedTime + elapsed)}`,
            });
          }
        }
        
        // Update total elapsed time
        const previousBlocksTime = speechBlocks
          .slice(0, currentBlock)
          .reduce((acc, block) => acc + calculateBlockDuration(block.content, speedMultiplier), 0);
        setTotalElapsedTime(previousBlocksTime + elapsed);
      }, 100);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }, [isPlaying, activeTab, currentBlock, currentBlockDuration, speechBlocks, speedMultiplier, audioEnabled]);

  // Reset timer when block changes manually
  const handleBlockChange = useCallback((index: number) => {
    setCurrentBlock(index);
    setElapsedTime(0);
    setBlockProgress(0);
    blockStartTimeRef.current = Date.now();
    
    // Stop current audio
    stopAudio();
    
    // Update total elapsed time
    const previousBlocksTime = speechBlocks
      .slice(0, index)
      .reduce((acc, block) => acc + calculateBlockDuration(block.content, speedMultiplier), 0);
    setTotalElapsedTime(previousBlocksTime);
  }, [speechBlocks, speedMultiplier, stopAudio]);

  const handleRestart = useCallback(() => {
    setCurrentBlock(0);
    setElapsedTime(0);
    setBlockProgress(0);
    setTotalElapsedTime(0);
    setIsPlaying(false);
    blockStartTimeRef.current = Date.now();
    stopAudio();
  }, [stopAudio]);

  const handleSkipBlock = useCallback(() => {
    if (currentBlock < speechBlocks.length - 1) {
      handleBlockChange(currentBlock + 1);
    }
  }, [currentBlock, speechBlocks.length, handleBlockChange]);

  // Generate speech on mount
  useEffect(() => {
    generateSpeech();
  }, []);

  const generateSpeech = async (modifier?: string) => {
    setIsLoading(true);
    try {
      const inputs: Record<string, unknown> = {
        idea: data.idea,
        ...data.trackData,
      };

      if (modifier) {
        inputs.modifier = modifier;
      }

      const { data: result, error } = await supabase.functions.invoke('generate-speech', {
        body: {
          track: data.track,
          duration: data.duration,
          inputs,
          hasDemo: false,
        },
      });

      if (error) throw error;
      if (result.error) throw new Error(result.error);

      setSpeechBlocks(result.speech.blocks);
      setMeta(result.meta);
      setCurrentBlock(0);
    } catch (err) {
      console.error('Failed to generate speech:', err);
      toast({
        title: "Generation Failed",
        description: err instanceof Error ? err.message : "Failed to generate speech",
        variant: "destructive",
      });
      // Fallback to placeholder blocks
      setSpeechBlocks([
        {
          timeStart: "0:00",
          timeEnd: "0:30",
          title: "The Hook",
          content: `Imagine ${data.idea}... That's what we're building.`,
        },
        {
          timeStart: "0:30",
          timeEnd: "1:00",
          title: "The Problem",
          content: data.trackData.pain as string || data.trackData.opportunity as string || "The current solutions just don't cut it.",
        },
        {
          timeStart: "1:00",
          timeEnd: "2:00",
          title: "The Solution",
          content: data.trackData.fix as string || data.trackData.thing as string || "Our approach changes everything.",
        },
        {
          timeStart: "2:00",
          timeEnd: "3:00",
          title: "The Closing",
          content: "Thank you for your time. Any questions?",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async (option: string) => {
    setIsRegenerating(true);
    toast({
      title: "Regenerating...",
      description: `Making it ${option === 'shorter' ? 'more concise' : option === 'funnier' ? 'more engaging' : 'more technical'}`,
    });
    await generateSpeech(option);
    setIsRegenerating(false);
    handleRestart();
    toast({
      title: "Speech Updated!",
      description: "Your new speech is ready",
    });
  };

  const handleExportPDF = () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let yPosition = margin;

    // Title page
    pdf.setFontSize(24);
    pdf.setFont("helvetica", "bold");
    pdf.text("Speech Script", pageWidth / 2, yPosition + 20, { align: "center" });
    
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "normal");
    const ideaLines = pdf.splitTextToSize(data.idea, contentWidth);
    pdf.text(ideaLines, pageWidth / 2, yPosition + 35, { align: "center" });
    
    pdf.setFontSize(12);
    pdf.setTextColor(100);
    pdf.text(`${trackConfig?.name || "Presentation"} • ${data.duration} min`, pageWidth / 2, yPosition + 50, { align: "center" });
    if (data.audienceLabel) {
      pdf.text(`Audience: ${data.audienceLabel}`, pageWidth / 2, yPosition + 60, { align: "center" });
    }
    if (meta) {
      pdf.text(`Word Count: ${meta.actualWordCount} words`, pageWidth / 2, yPosition + 70, { align: "center" });
    }
    
    pdf.setTextColor(0);

    // Speech blocks
    speechBlocks.forEach((block, index) => {
      // Add new page for each major section
      pdf.addPage();
      yPosition = margin;

      // Section header with time
      pdf.setFillColor(240, 240, 240);
      pdf.roundedRect(margin, yPosition, contentWidth, 25, 3, 3, "F");
      
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(100);
      pdf.text(`[${block.timeStart} - ${block.timeEnd}]`, margin + 5, yPosition + 10);
      
      pdf.setFontSize(14);
      pdf.setTextColor(0);
      pdf.text(block.title, margin + 5, yPosition + 20);
      
      yPosition += 35;

      // Content
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "normal");
      const contentLines = pdf.splitTextToSize(block.content, contentWidth);
      
      contentLines.forEach((line: string) => {
        if (yPosition > pageHeight - margin - 20) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.text(line, margin, yPosition);
        yPosition += 8;
      });

      // Visual cue / slide placeholder
      if (block.visualCue || block.isDemo) {
        yPosition += 10;
        pdf.setFillColor(245, 245, 255);
        pdf.roundedRect(margin, yPosition, contentWidth, 40, 3, 3, "F");
        
        pdf.setFontSize(10);
        pdf.setTextColor(100);
        pdf.text("VISUAL CUE", margin + 5, yPosition + 12);
        
        pdf.setFontSize(12);
        pdf.setTextColor(60);
        const cueText = block.visualCue || (block.isDemo ? "Demo Section" : "Slide Placeholder");
        pdf.text(cueText, margin + 5, yPosition + 28);
        
        pdf.setTextColor(0);
        yPosition += 50;
      }

      // Page number
      pdf.setFontSize(10);
      pdf.setTextColor(150);
      pdf.text(`Section ${index + 1} of ${speechBlocks.length}`, pageWidth / 2, pageHeight - 10, { align: "center" });
      pdf.setTextColor(0);
    });

    // Save PDF
    const filename = `speech-${data.idea.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
    pdf.save(filename);

    toast({
      title: "PDF Exported!",
      description: "Your speech has been downloaded as PDF",
    });
  };

  const analysisData = {
    score: 85,
    feedback: [
      { type: "positive", text: "Strong opening hook that captures attention" },
      { type: "positive", text: "Clear problem-solution narrative" },
      { type: "positive", text: "Good pacing throughout the speech" },
      { type: "warning", text: "Consider adding specific metrics or traction" },
      { type: "warning", text: "Missing competitive differentiation" },
    ],
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-20 pb-8 px-4 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center space-y-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full"
          />
          <p className="text-lg font-medium text-foreground">Generating your speech...</p>
          <p className="text-sm text-muted-foreground">
            Target: {data.duration} min × 130 wpm = ~{data.duration * 130} words
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          {/* Project Info Badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className={cn(
              "px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r text-white",
              trackConfig?.color || "from-primary to-primary"
            )}>
              {trackConfig?.name || "Speech"}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {data.duration} min
            </span>
            {meta && (
              <span className="text-xs text-muted-foreground">
                • {meta.actualWordCount} words
              </span>
            )}
          </div>
          
          <h1 className="text-2xl font-bold text-foreground">Your Speech Is Ready!</h1>
          <p className="text-muted-foreground mt-1 text-lg font-medium">{data.idea}</p>
          {data.audienceLabel && (
            <p className="text-sm text-muted-foreground mt-1">
              For: {data.audienceLabel}
            </p>
          )}
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 mb-6 p-1 bg-muted rounded-xl"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id !== "practice") {
                  setIsPlaying(false);
                }
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "script" && (
            <motion.div
              key="script"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Script blocks with 3-column layout */}
              {speechBlocks.map((block, index) => {
                const VisualIcon = getVisualIcon(block.visualCue, block.isDemo);
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "glass-card rounded-xl p-4 transition-all grid gap-4",
                      block.isDemo ? "border-2 border-time-low bg-time-low/5" : "",
                      "grid-cols-[80px_1fr_60px] md:grid-cols-[100px_1fr_80px]"
                    )}
                  >
                    {/* Left Column: Time Block */}
                    <div className="flex flex-col items-center justify-start">
                      <span className={cn(
                        "text-xs font-bold px-2 py-1 rounded text-center",
                        block.isDemo ? "bg-time-low/20 text-time-low" : "bg-primary/10 text-primary"
                      )}>
                        {block.timeStart}
                      </span>
                      <div className="h-full w-px bg-border my-1" />
                      <span className="text-xs text-muted-foreground">
                        {block.timeEnd}
                      </span>
                    </div>

                    {/* Middle Column: Content */}
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                        {block.title}
                        {block.isDemo && (
                          <span className="text-xs px-2 py-0.5 bg-time-low/20 text-time-low rounded">
                            DEMO
                          </span>
                        )}
                      </h3>
                      <p className="text-base text-foreground leading-relaxed">
                        {block.content}
                      </p>
                    </div>

                    {/* Right Column: Visual Cues */}
                    <div className="flex flex-col items-center justify-center">
                      {VisualIcon && (
                        <div className="flex flex-col items-center gap-1">
                          <VisualIcon className="w-5 h-5 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground text-center">
                            {block.visualCue || "Demo"}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {/* Post-Generation Actions */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-8 space-y-4"
              >
                {/* Regenerate Options */}
                <div className="p-4 rounded-xl bg-muted/50 border border-border">
                  <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Regenerate with adjustments
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {regenerateOptions.map((option) => (
                      <Button
                        key={option.id}
                        variant="outline"
                        size="sm"
                        onClick={() => handleRegenerate(option.id)}
                        disabled={isRegenerating}
                        className="gap-2"
                      >
                        <option.icon className="w-4 h-4" />
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Export */}
                <Button
                  variant="secondary"
                  className="w-full gap-2"
                  onClick={handleExportPDF}
                >
                  <Download className="w-4 h-4" />
                  Export to PDF
                </Button>
              </motion.div>
            </motion.div>
          )}

          {activeTab === "practice" && (
            <motion.div
              key="practice"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Speed & Audio Controls */}
              <div className="flex flex-col gap-4 p-4 rounded-xl bg-muted/50 border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Gauge className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Speed: {speedMultiplier.toFixed(1)}x</span>
                  </div>
                  <Button
                    variant={audioEnabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setAudioEnabled(!audioEnabled);
                      if (audioEnabled) {
                        stopAudio();
                      }
                    }}
                    className="gap-2"
                    disabled={isLoadingAudio}
                  >
                    {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    {isLoadingAudio ? "Loading..." : audioEnabled ? "Audio On" : "Audio Off"}
                  </Button>
                </div>
                <Slider
                  value={[speedMultiplier]}
                  onValueChange={(value) => setSpeedMultiplier(value[0])}
                  min={0.5}
                  max={2}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0.5x (Slow)</span>
                  <span>1x</span>
                  <span>2x (Fast)</span>
                </div>
              </div>

              {/* Timer Display */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4" />
                  <span>Block: {formatTime(elapsedTime)} / {formatTime(currentBlockDuration)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Total: {formatTime(totalElapsedTime)} / {formatTime(totalDuration)}</span>
                </div>
              </div>

              {/* Teleprompter */}
              <div className="glass-card rounded-xl p-6 min-h-[300px] flex flex-col relative overflow-hidden">
                {/* Block progress bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
                  <motion.div 
                    className="h-full bg-primary"
                    style={{ width: `${blockProgress}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>

                <div className="flex items-center justify-between mb-4 mt-2">
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                    {speechBlocks[currentBlock]?.timeStart} - {speechBlocks[currentBlock]?.timeEnd}
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {speechBlocks[currentBlock]?.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {currentBlock + 1} / {speechBlocks.length}
                  </span>
                </div>
                
                <div className="flex-1 flex items-center justify-center">
                  <motion.p
                    key={currentBlock}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xl md:text-2xl font-medium text-foreground text-center leading-relaxed max-w-2xl"
                  >
                    {speechBlocks[currentBlock]?.content}
                  </motion.p>
                </div>

                {/* Visual cue indicator */}
                {(speechBlocks[currentBlock]?.visualCue || speechBlocks[currentBlock]?.isDemo) && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm text-time-low">
                    <Monitor className="w-4 h-4" />
                    <span>{speechBlocks[currentBlock]?.visualCue || "Demo Section"}</span>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRestart}
                  title="Restart"
                >
                  <RotateCcw className="w-5 h-5" />
                </Button>
                <Button
                  variant="default"
                  size="lg"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-8 gap-2"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  {isPlaying ? "Pause" : "Start"}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleSkipBlock}
                  disabled={currentBlock >= speechBlocks.length - 1}
                  title="Skip to next block"
                >
                  <SkipForward className="w-5 h-5" />
                </Button>
              </div>

              {/* Block Progress Indicators */}
              <div className="space-y-2">
                <div className="flex gap-1">
                  {speechBlocks.map((block, index) => (
                    <button
                      key={index}
                      onClick={() => handleBlockChange(index)}
                      className={cn(
                        "flex-1 h-2 rounded-full transition-all cursor-pointer hover:opacity-80 relative overflow-hidden",
                        index < currentBlock ? "bg-primary" : 
                        index === currentBlock ? "bg-primary/30" : "bg-muted"
                      )}
                    >
                      {index === currentBlock && (
                        <motion.div 
                          className="absolute inset-y-0 left-0 bg-primary rounded-full"
                          style={{ width: `${blockProgress}%` }}
                        />
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  {speechBlocks.map((block, index) => (
                    <span key={index} className={cn(
                      "text-center flex-1 truncate px-1",
                      index === currentBlock && "text-primary font-medium"
                    )}>
                      {block.title}
                    </span>
                  ))}
                </div>
              </div>

              {/* Overall Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Overall Progress</span>
                  <span>{Math.round((totalElapsedTime / totalDuration) * 100)}%</span>
                </div>
                <Progress value={(totalElapsedTime / totalDuration) * 100} className="h-2" />
              </div>
            </motion.div>
          )}

          {activeTab === "analysis" && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Score */}
              <div className="glass-card rounded-xl p-6 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-success/10 mb-4"
                >
                  <span className="text-4xl font-bold text-success">{analysisData.score}</span>
                </motion.div>
                <p className="text-lg font-semibold text-foreground">Great Speech!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your speech scores above average for {trackConfig?.name || "presentations"}
                </p>
              </div>

              {/* Feedback */}
              <div className="space-y-3">
                {analysisData.feedback.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg",
                      item.type === "positive" ? "bg-success/10" : "bg-warning/10"
                    )}
                  >
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                        item.type === "positive" ? "bg-success" : "bg-warning"
                      )}
                    />
                    <p className="text-sm text-foreground">{item.text}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
