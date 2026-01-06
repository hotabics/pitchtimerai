import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mic, MicOff, Square, Brain, Sparkles, CheckCircle2, 
  AlertCircle, TrendingUp, Clock, MessageSquare, Zap,
  Volume2, Target, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SpeechBlock {
  timeStart: string;
  timeEnd: string;
  title: string;
  content: string;
  isDemo?: boolean;
  visualCue?: string;
}

interface SpeechCoachProps {
  speechBlocks: SpeechBlock[];
  onBack: () => void;
}

interface AnalysisResult {
  score: number;
  wpm: number;
  fillers: number;
  fillerBreakdown: { ums: number; likes: number; basically: number };
  transcription_html: string;
  feedback: string[];
  tone: "energetic" | "confident" | "monotone" | "nervous";
  missedSections: string[];
}

type CoachState = "idle" | "recording" | "processing" | "results";

const processingMessages = [
  "Uploading audio...",
  "Transcribing speech (Whisper AI)...",
  "Analyzing tonality...",
  "Detecting filler words...",
  "Checking content coverage...",
  "Generating feedback...",
];

// Mock analysis service
const mockAnalysisService = async (): Promise<AnalysisResult> => {
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  return {
    score: 88,
    wpm: 142,
    fillers: 6,
    fillerBreakdown: { ums: 4, likes: 1, basically: 1 },
    transcription_html: `We are building <span class="text-success font-bold">PitchDeck AI</span>, a revolutionary platform that helps students and entrepreneurs <span class="text-destructive font-medium">um</span> create winning pitches in minutes. 

<span class="text-destructive font-medium">Basically</span>, it works by analyzing your idea and generating <span class="text-success font-bold">AI-powered</span> scripts tailored to your <span class="text-success font-bold">audience</span>.

The problem is that most people <span class="text-destructive font-medium">uh</span> struggle with public speaking and spend hours preparing. Our solution uses <span class="text-success font-bold">machine learning</span> to <span class="text-destructive font-medium">um</span> accelerate this process.

We've already helped <span class="text-success font-bold">500+ users</span> and saved them an average of <span class="text-success font-bold">3 hours</span> per pitch. <span class="text-destructive font-medium">Like</span>, that's huge for busy founders.`,
    feedback: [
      "Great energy throughout!",
      "Watch out for 'um' usage",
      "You spoke 10% faster than target",
      "Excellent use of key metrics",
    ],
    tone: "energetic",
    missedSections: ["Monetization Strategy"],
  };
};

const getToneEmoji = (tone: AnalysisResult["tone"]) => {
  switch (tone) {
    case "energetic": return "🔥";
    case "confident": return "💪";
    case "monotone": return "😐";
    case "nervous": return "😬";
    default: return "🎤";
  }
};

const getToneLabel = (tone: AnalysisResult["tone"]) => {
  switch (tone) {
    case "energetic": return "Energetic";
    case "confident": return "Confident";
    case "monotone": return "Monotone";
    case "nervous": return "Nervous";
    default: return "Neutral";
  }
};

const getWpmFeedback = (wpm: number) => {
  if (wpm < 120) return "Slightly Slow";
  if (wpm <= 150) return "Perfect Pace";
  if (wpm <= 170) return "Slightly Fast";
  return "Too Fast";
};

export const SpeechCoach = ({ speechBlocks, onBack }: SpeechCoachProps) => {
  const [state, setState] = useState<CoachState>("idle");
  const [currentBlock, setCurrentBlock] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [processingStep, setProcessingStep] = useState(0);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [waveformBars, setWaveformBars] = useState<number[]>(Array(40).fill(0.1));
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const waveformRef = useRef<NodeJS.Timeout | null>(null);
  const teleprompterRef = useRef<HTMLDivElement>(null);

  // Simulate waveform animation during recording
  useEffect(() => {
    if (state === "recording") {
      waveformRef.current = setInterval(() => {
        setWaveformBars(prev => prev.map(() => 0.1 + Math.random() * 0.9));
      }, 100);
    } else {
      if (waveformRef.current) clearInterval(waveformRef.current);
      setWaveformBars(Array(40).fill(0.1));
    }
    return () => {
      if (waveformRef.current) clearInterval(waveformRef.current);
    };
  }, [state]);

  // Recording timer
  useEffect(() => {
    if (state === "recording") {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state]);

  // Auto-scroll teleprompter
  useEffect(() => {
    if (state === "recording" && teleprompterRef.current) {
      const scrollInterval = setInterval(() => {
        if (teleprompterRef.current) {
          teleprompterRef.current.scrollTop += 1;
        }
      }, 100);
      return () => clearInterval(scrollInterval);
    }
  }, [state]);

  // Processing message cycle
  useEffect(() => {
    if (state === "processing") {
      const messageInterval = setInterval(() => {
        setProcessingStep(prev => (prev + 1) % processingMessages.length);
      }, 500);
      return () => clearInterval(messageInterval);
    }
  }, [state]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = useCallback(() => {
    setState("recording");
    setRecordingTime(0);
    setCurrentBlock(0);
  }, []);

  const handleStopRecording = useCallback(async () => {
    setState("processing");
    setProcessingStep(0);
    
    try {
      const result = await mockAnalysisService();
      setAnalysis(result);
      setState("results");
    } catch (error) {
      console.error("Analysis failed:", error);
      setState("idle");
    }
  }, []);

  const handleReset = useCallback(() => {
    setState("idle");
    setAnalysis(null);
    setRecordingTime(0);
    setProcessingStep(0);
    setCurrentBlock(0);
  }, []);

  // Render Recording View
  const renderRecorder = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Waveform Visualization */}
      <div className="glass-card rounded-xl p-6 bg-background/80">
        <div className="flex items-center justify-center gap-0.5 h-24">
          {waveformBars.map((height, index) => (
            <motion.div
              key={index}
              className="w-1.5 rounded-full bg-primary"
              animate={{ height: `${height * 100}%` }}
              transition={{ duration: 0.1 }}
            />
          ))}
        </div>
        <div className="flex items-center justify-center gap-4 mt-4">
          <div className="flex items-center gap-2 text-destructive">
            <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
            <span className="font-mono text-lg font-bold">{formatTime(recordingTime)}</span>
          </div>
        </div>
      </div>

      {/* Teleprompter */}
      <div className="glass-card rounded-xl overflow-hidden bg-background/95">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Teleprompter</span>
          <span className="text-xs text-muted-foreground">
            Block {currentBlock + 1} of {speechBlocks.length}
          </span>
        </div>
        <div 
          ref={teleprompterRef}
          className="p-6 h-64 overflow-y-auto scroll-smooth"
        >
          {speechBlocks.map((block, index) => (
            <div 
              key={index}
              className={cn(
                "mb-6 transition-opacity duration-300",
                index < currentBlock ? "opacity-30" : 
                index === currentBlock ? "opacity-100" : "opacity-50"
              )}
            >
              <div className="text-xs text-primary font-medium mb-2">
                {block.title}
              </div>
              <p className={cn(
                "text-lg leading-relaxed",
                index === currentBlock ? "text-foreground font-medium" : "text-muted-foreground"
              )}>
                {block.content}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Stop Button */}
      <div className="flex justify-center">
        <Button
          size="lg"
          variant="destructive"
          onClick={handleStopRecording}
          className="gap-2 px-8"
        >
          <Square className="w-5 h-5" />
          Stop & Analyze
        </Button>
      </div>
    </motion.div>
  );

  // Render Processing State
  const renderProcessing = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center"
    >
      <div className="text-center space-y-8 max-w-md mx-auto p-8">
        {/* Animated Brain Icon */}
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10"
        >
          <Brain className="w-12 h-12 text-primary" />
        </motion.div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={(processingStep / processingMessages.length) * 100} className="h-2" />
        </div>

        {/* Dynamic Status Message */}
        <AnimatePresence mode="wait">
          <motion.p
            key={processingStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-lg font-medium text-foreground"
          >
            {processingMessages[processingStep]}
          </motion.p>
        </AnimatePresence>

        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span className="text-sm">AI Magic in progress...</span>
        </div>
      </div>
    </motion.div>
  );

  // Render Analysis Results
  const renderResults = () => {
    if (!analysis) return null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Analysis Complete!</h2>
            <p className="text-muted-foreground">Here's how you did</p>
          </div>
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <Mic className="w-4 h-4" />
            Record Again
          </Button>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card A: Accuracy & Clarity */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="w-5 h-5 text-primary" />
                Accuracy & Clarity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-4">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="hsl(var(--muted))"
                      strokeWidth="8"
                    />
                    <motion.circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="8"
                      strokeLinecap="round"
                      initial={{ strokeDasharray: "0 352" }}
                      animate={{ strokeDasharray: `${(analysis.score / 100) * 352} 352` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-foreground">{analysis.score}%</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-center text-muted-foreground">Script Match Score</p>
              {analysis.missedSections.length > 0 && (
                <p className="text-xs text-center text-warning mt-2">
                  Missed: {analysis.missedSections.join(", ")}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Card B: Filler Words Counter */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="w-5 h-5 text-destructive" />
                Filler Words
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="text-5xl font-bold text-destructive"
                >
                  {analysis.fillers}
                </motion.span>
                <p className="text-sm text-muted-foreground mt-2">Filler words detected</p>
              </div>
              <div className="flex justify-center gap-4 text-sm">
                <span className="text-muted-foreground">
                  <span className="font-medium text-foreground">Ums:</span> {analysis.fillerBreakdown.ums}
                </span>
                <span className="text-muted-foreground">
                  <span className="font-medium text-foreground">Likes:</span> {analysis.fillerBreakdown.likes}
                </span>
                <span className="text-muted-foreground">
                  <span className="font-medium text-foreground">Basically:</span> {analysis.fillerBreakdown.basically}
                </span>
              </div>
              <p className="text-xs text-center text-muted-foreground mt-4 italic">
                💡 Tip: Try to pause silently instead of saying "um"
              </p>
            </CardContent>
          </Card>

          {/* Card C: Transcription Diff View */}
          <Card className="glass-card md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="w-5 h-5 text-success" />
                Transcription Analysis
                <span className="text-xs font-normal text-muted-foreground ml-2">
                  (Green = Key terms, Red = Stumbles)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="p-4 rounded-lg bg-muted/30 text-foreground leading-relaxed text-sm whitespace-pre-line"
                dangerouslySetInnerHTML={{ __html: analysis.transcription_html }}
              />
            </CardContent>
          </Card>

          {/* Card D: Pacing & Tone */}
          <Card className="glass-card md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="w-5 h-5 text-primary" />
                Pacing & Tone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Speaking Speed</span>
                  </div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-3xl font-bold text-foreground"
                  >
                    {analysis.wpm} WPM
                  </motion.div>
                  <span className={cn(
                    "text-sm",
                    analysis.wpm <= 150 ? "text-success" : "text-warning"
                  )}>
                    ({getWpmFeedback(analysis.wpm)})
                  </span>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Volume2 className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Tone</span>
                  </div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.3 }}
                    className="text-4xl"
                  >
                    {getToneEmoji(analysis.tone)}
                  </motion.div>
                  <span className="text-sm font-medium text-foreground">
                    {getToneLabel(analysis.tone)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feedback Summary */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="w-5 h-5 text-warning" />
              Quick Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.feedback.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-center gap-2 text-sm"
                >
                  <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-foreground">{item}</span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // Render Idle State (Start Screen)
  const renderIdle = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="text-center space-y-8 py-12"
    >
      <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10">
        <Mic className="w-12 h-12 text-primary" />
      </div>
      
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">AI Speech Coach</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Record yourself delivering the speech. Our AI will analyze your delivery, 
          detect filler words, and provide personalized feedback.
        </p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <Button size="lg" onClick={handleStartRecording} className="gap-2 px-8">
          <Mic className="w-5 h-5" />
          Start Recording
        </Button>
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Practice
        </Button>
      </div>

      <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4" />
          <span>Whisper AI Transcription</span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span>NLP Analysis</span>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {state === "idle" && renderIdle()}
        {state === "recording" && renderRecorder()}
        {state === "processing" && renderProcessing()}
        {state === "results" && renderResults()}
      </AnimatePresence>
    </div>
  );
};
