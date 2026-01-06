import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, Video, BarChart3, Play, Pause, RotateCcw, Monitor, 
  Smartphone, Presentation, RefreshCw, Download, Clock, Minus, 
  Smile, Zap, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { TrackType, trackConfigs } from "@/lib/tracks";

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

export const Dashboard = ({ data, onBack }: DashboardProps) => {
  const [activeTab, setActiveTab] = useState("script");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBlock, setCurrentBlock] = useState(0);
  const [speechBlocks, setSpeechBlocks] = useState<SpeechBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [meta, setMeta] = useState<{ targetWordCount: number; actualWordCount: number } | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const trackConfig = trackConfigs[data.track];

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
          hasDemo: false, // For now, no demo support
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
    toast({
      title: "Speech Updated!",
      description: "Your new speech is ready",
    });
  };

  const handleExportPDF = () => {
    // Create print-friendly content
    const content = speechBlocks.map(block => 
      `[${block.timeStart} - ${block.timeEnd}] ${block.title}\n\n${block.content}\n\n`
    ).join('---\n\n');

    const blob = new Blob([`Speech: ${data.idea}\n\n${content}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `speech-${data.idea.slice(0, 20).replace(/\s+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Exported!",
      description: "Your speech has been downloaded",
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
              onClick={() => setActiveTab(tab.id)}
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
              ref={printRef}
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
                  Export to TXT
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
              {/* Teleprompter */}
              <div className="glass-card rounded-xl p-6 min-h-[300px] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                    {speechBlocks[currentBlock]?.timeStart} - {speechBlocks[currentBlock]?.timeEnd}
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {speechBlocks[currentBlock]?.title}
                  </span>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <motion.p
                    key={currentBlock}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xl font-medium text-foreground text-center leading-relaxed"
                  >
                    {speechBlocks[currentBlock]?.content}
                  </motion.p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentBlock(0)}
                >
                  <RotateCcw className="w-5 h-5" />
                </Button>
                <Button
                  variant="default"
                  size="lg"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-8"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  {isPlaying ? "Pause" : "Start"}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentBlock(Math.min(currentBlock + 1, speechBlocks.length - 1))}
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>

              {/* Progress */}
              <div className="flex gap-1">
                {speechBlocks.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentBlock(index)}
                    className={cn(
                      "flex-1 h-2 rounded-full transition-all cursor-pointer hover:opacity-80",
                      index <= currentBlock ? "bg-primary" : "bg-muted"
                    )}
                  />
                ))}
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
