import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mic, MicOff, Square, Brain, Sparkles, CheckCircle2, 
  AlertCircle, TrendingUp, Clock, MessageSquare, Zap,
  Volume2, Target, ArrowLeft, History, Loader2, HelpCircle,
  ChevronDown, ChevronUp, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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
  idea: string;
  track: string;
  duration: number;
}

interface CoachFeedback {
  headline: string;
  what_i_noticed: string;
  why_it_matters: string;
  evidence: { timestamp: number; quote: string };
  one_change_to_try: string;
  encouragement: string;
}

interface ImprovementSummary {
  issue_key: string;
  before: string;
  after: string;
  improved: boolean;
  before_timestamp: number | null;
  after_timestamp: number | null;
}

interface JuryQuestion {
  category: 'Problem' | 'Innovation' | 'Technical Feasibility' | 'Business Model' | 'Risk';
  question: string;
  why_they_ask: string;
}

interface JuryQuestionsResult {
  summary: string;
  questions: JuryQuestion[];
}

interface AnalysisResult {
  score: number;
  wpm: number;
  fillers: number;
  fillerBreakdown: { ums: number; likes: number; basically: number };
  transcription: string;
  transcription_html: string;
  feedback: string[];
  tone: "energetic" | "confident" | "monotone" | "nervous";
  missedSections: string[];
  primaryIssue?: PrimaryIssue | null;
  events?: DetectedEvents | null;
  recordingDuration?: number;
  coachFeedback?: CoachFeedback | null;
  improvementSummary?: ImprovementSummary | null;
  juryQuestions?: JuryQuestionsResult | null;
}

interface DetectedEvent {
  type: string;
  timestamp: number;
  quote: string;
  confidence: number;
  status: 'found' | 'missing' | 'late';
}

interface DetectedEvents {
  problem: DetectedEvent;
  innovation: DetectedEvent;
  technical: DetectedEvent;
  business_model: DetectedEvent;
  solution: DetectedEvent;
}

interface PrimaryIssue {
  key: string;
  title: string;
  evidence_timestamp: number | null;
  evidence_quote: string | null;
  next_action: string;
  severity: number;
}

interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
}

interface PracticeSession {
  id: string;
  created_at: string;
  score: number;
  wpm: number;
  filler_count: number;
  tone: string;
  recording_duration_seconds: number;
  primary_issue_key?: string | null;
}

type CoachState = "idle" | "recording" | "processing" | "results" | "history";

const processingMessages = [
  "Uploading audio...",
  "Transcribing speech (ElevenLabs Scribe)...",
  "Analyzing tonality...",
  "Detecting filler words...",
  "Checking content coverage...",
  "Generating feedback...",
];

// Analyze transcription for filler words and key terms
const analyzeTranscription = (
  transcription: string, 
  originalScript: string
): { 
  html: string; 
  fillers: { ums: number; likes: number; basically: number };
  score: number;
  missedSections: string[];
} => {
  const fillerPatterns = {
    ums: /\b(um|uh|er|ah)\b/gi,
    likes: /\b(like)\b/gi,
    basically: /\b(basically|so|you know|i mean)\b/gi,
  };
  
  // Count fillers
  const ums = (transcription.match(fillerPatterns.ums) || []).length;
  const likes = (transcription.match(fillerPatterns.likes) || []).length;
  const basically = (transcription.match(fillerPatterns.basically) || []).length;
  
  // Extract key terms from original script
  const keyTerms = originalScript
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 5)
    .filter((word, index, arr) => arr.indexOf(word) === index)
    .slice(0, 20);
  
  // Check which key terms were mentioned
  const transcriptionLower = transcription.toLowerCase();
  const mentionedTerms = keyTerms.filter(term => transcriptionLower.includes(term));
  const score = Math.min(100, Math.round((mentionedTerms.length / Math.max(keyTerms.length, 1)) * 100) + 40);
  
  // Build HTML with highlighting
  let html = transcription;
  
  // Highlight key terms in green
  mentionedTerms.forEach(term => {
    const regex = new RegExp(`\\b(${term})\\b`, 'gi');
    html = html.replace(regex, '<span class="text-success font-bold">$1</span>');
  });
  
  // Highlight filler words in red
  Object.values(fillerPatterns).forEach(pattern => {
    html = html.replace(pattern, '<span class="text-destructive font-medium">$&</span>');
  });
  
  // Determine missed sections (simplified)
  const missedSections: string[] = [];
  const sections = ["Introduction", "Problem", "Solution", "Demo", "Closing"];
  const sectionKeywords: Record<string, string[]> = {
    "Introduction": ["hello", "hi", "welcome", "today"],
    "Problem": ["problem", "issue", "challenge", "struggle"],
    "Solution": ["solution", "solve", "fix", "approach"],
    "Demo": ["demo", "show", "works", "see"],
    "Closing": ["thank", "questions", "contact", "summary"],
  };
  
  sections.forEach(section => {
    const keywords = sectionKeywords[section] || [];
    const found = keywords.some(kw => transcriptionLower.includes(kw));
    if (!found) {
      missedSections.push(section);
    }
  });
  
  return { 
    html, 
    fillers: { ums, likes, basically },
    score: Math.max(0, score - (ums + likes + basically) * 2),
    missedSections: missedSections.slice(0, 2),
  };
};

// Create segments from transcription for hackathon evaluation
// ElevenLabs may return word timestamps, or we can create artificial segments based on text
const createSegmentsFromTranscription = (
  transcriptionResult: { text?: string; words?: Array<{ text: string; start: number; end: number }> },
  totalDuration: number
): TranscriptionSegment[] => {
  // If we have word-level timestamps, group them into sentence segments
  if (transcriptionResult.words && transcriptionResult.words.length > 0) {
    const segments: TranscriptionSegment[] = [];
    let currentSegment: { start: number; end: number; words: string[] } | null = null;
    
    for (const word of transcriptionResult.words) {
      if (!currentSegment) {
        currentSegment = { start: word.start, end: word.end, words: [word.text] };
      } else {
        currentSegment.words.push(word.text);
        currentSegment.end = word.end;
        
        // Split on sentence-ending punctuation
        if (word.text.match(/[.!?]$/)) {
          segments.push({
            start: currentSegment.start,
            end: currentSegment.end,
            text: currentSegment.words.join(' '),
          });
          currentSegment = null;
        }
      }
    }
    
    // Add any remaining words
    if (currentSegment && currentSegment.words.length > 0) {
      segments.push({
        start: currentSegment.start,
        end: currentSegment.end,
        text: currentSegment.words.join(' '),
      });
    }
    
    return segments;
  }
  
  // Fallback: create artificial segments based on sentences and estimated timing
  const text = transcriptionResult.text || '';
  const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim());
  const totalWords = text.split(/\s+/).length;
  let currentTime = 0;
  
  return sentences.map(sentence => {
    const wordsInSentence = sentence.split(/\s+/).length;
    const duration = (wordsInSentence / totalWords) * totalDuration;
    const segment = {
      start: currentTime,
      end: currentTime + duration,
      text: sentence,
    };
    currentTime += duration;
    return segment;
  });
};

// Determine tone based on WPM and filler count
const determineTone = (wpm: number, fillerCount: number): AnalysisResult["tone"] => {
  if (wpm > 160 && fillerCount < 3) return "energetic";
  if (wpm >= 130 && wpm <= 160 && fillerCount < 5) return "confident";
  if (fillerCount > 8) return "nervous";
  return "monotone";
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

export const SpeechCoach = ({ speechBlocks, onBack, idea, track, duration }: SpeechCoachProps) => {
  const [state, setState] = useState<CoachState>("idle");
  const [currentBlock, setCurrentBlock] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [processingStep, setProcessingStep] = useState(0);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [waveformBars, setWaveformBars] = useState<number[]>(Array(40).fill(0.1));
  const [pastSessions, setPastSessions] = useState<PracticeSession[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [baselineSessionId, setBaselineSessionId] = useState<string | null>(null);
  const [isLoadingJuryQuestions, setIsLoadingJuryQuestions] = useState(false);
  const [expandedQuestionIndex, setExpandedQuestionIndex] = useState<number | null>(null);
  
  // Audio recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const teleprompterRef = useRef<HTMLDivElement>(null);

  // Get original script text
  const originalScript = speechBlocks.map(b => b.content).join(" ");
  const sessionGroupId = `${idea.slice(0, 50)}-${track}`;

  // Fetch past sessions
  const fetchHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('practice_sessions')
        .select('id, created_at, score, wpm, filler_count, tone, recording_duration_seconds, primary_issue_key')
        .eq('session_group_id', sessionGroupId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setPastSessions(data || []);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [sessionGroupId]);

  // Save session to database and return session ID
  const saveSession = useCallback(async (analysisResult: AnalysisResult, recordingSeconds: number): Promise<string | null> => {
    try {
      const { data, error } = await supabase.from('practice_sessions').insert({
        idea,
        track,
        duration_minutes: duration,
        recording_duration_seconds: recordingSeconds,
        score: analysisResult.score,
        wpm: analysisResult.wpm,
        filler_count: analysisResult.fillers,
        filler_breakdown: analysisResult.fillerBreakdown,
        tone: analysisResult.tone,
        missed_sections: analysisResult.missedSections,
        transcription: analysisResult.transcription,
        transcription_html: analysisResult.transcription_html,
        feedback: analysisResult.feedback,
        original_script: originalScript,
        session_group_id: sessionGroupId,
      }).select('id').single();

      if (error) throw error;
      toast({ title: "Session saved!", description: "Your practice session has been recorded." });
      return data?.id || null;
    } catch (err) {
      console.error('Failed to save session:', err);
      return null;
    }
  }, [idea, track, duration, originalScript, sessionGroupId]);

  // Evaluate hackathon jury pitch
  const evaluateHackathonPitch = useCallback(async (
    sessionId: string, 
    segments: TranscriptionSegment[], 
    durationSecs: number,
    baselineId: string | null
  ): Promise<{ primaryIssue: PrimaryIssue | null; events: DetectedEvents | null; coachFeedback: CoachFeedback | null; improvementSummary: ImprovementSummary | null }> => {
    try {
      console.log('Evaluating hackathon jury pitch for session:', sessionId, 'baseline:', baselineId);
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/evaluate-hackathon-jury-pitch`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            session_id: sessionId,
            track,
            segments,
            duration_seconds: durationSecs,
            baseline_session_id: baselineId,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Evaluation failed');
      }

      const result = await response.json();
      console.log('Hackathon evaluation result:', result);
      return {
        primaryIssue: result.primary_issue as PrimaryIssue,
        events: result.events as DetectedEvents,
        coachFeedback: result.coach_feedback as CoachFeedback | null,
        improvementSummary: result.improvement_summary as ImprovementSummary | null,
      };
    } catch (err) {
      console.error('Failed to evaluate hackathon pitch:', err);
      return { primaryIssue: null, events: null, coachFeedback: null, improvementSummary: null };
    }
  }, [track]);

  // Generate hackathon jury questions
  const generateJuryQuestions = useCallback(async (
    sessionId: string,
    transcript: string,
    eventsJson: DetectedEvents | null,
    primaryIssueKey: string | null
  ): Promise<JuryQuestionsResult | null> => {
    if (track !== 'hackathon_jury') return null;
    
    try {
      console.log('Generating jury questions for session:', sessionId);
      setIsLoadingJuryQuestions(true);
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-hackathon-jury-questions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            session_id: sessionId,
            track,
            transcript,
            events_json: eventsJson,
            primary_issue_key: primaryIssueKey || 'none',
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate jury questions');
      }

      const result = await response.json();
      console.log('Jury questions result:', result);
      return result.jury_questions as JuryQuestionsResult;
    } catch (err) {
      console.error('Failed to generate jury questions:', err);
      toast({
        title: "Jury Questions",
        description: "Could not generate jury questions. You can try again later.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoadingJuryQuestions(false);
    }
  }, [track]);

  const updateWaveform = useCallback(() => {
    if (analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Sample 40 bars from frequency data
      const bars: number[] = [];
      const step = Math.floor(dataArray.length / 40);
      for (let i = 0; i < 40; i++) {
        const value = dataArray[i * step] / 255;
        bars.push(Math.max(0.1, value));
      }
      setWaveformBars(bars);
    }
    
    if (state === "recording") {
      animationFrameRef.current = requestAnimationFrame(updateWaveform);
    }
  }, [state]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

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

  const handleStartRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio context for visualization
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      
      // Set up media recorder
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.start(1000); // Collect data every second
      
      setState("recording");
      setRecordingTime(0);
      setCurrentBlock(0);
      
      // Start waveform animation
      animationFrameRef.current = requestAnimationFrame(updateWaveform);
      
    } catch (err) {
      console.error('Failed to start recording:', err);
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  }, [updateWaveform]);

  const handleStopRecording = useCallback(async () => {
    const recordingSeconds = recordingTime;
    
    // Stop recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    
    // Stop animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    setState("processing");
    setProcessingStep(0);
    setWaveformBars(Array(40).fill(0.1));
    
    try {
      // Wait a bit for all chunks to be collected
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      if (audioBlob.size < 1000) {
        throw new Error('Recording too short');
      }
      
      console.log('Audio blob size:', audioBlob.size);
      
      // Send to ElevenLabs STT
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-stt`,
        {
          method: 'POST',
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Transcription failed');
      }
      
      const transcriptionResult = await response.json();
      const transcription = transcriptionResult.text || '';
      
      // Calculate WPM
      const wordCount = transcription.split(/\s+/).filter((w: string) => w.length > 0).length;
      const wpm = Math.round((wordCount / recordingSeconds) * 60);
      
      // Analyze transcription
      const { html, fillers, score, missedSections } = analyzeTranscription(transcription, originalScript);
      const fillerCount = fillers.ums + fillers.likes + fillers.basically;
      const tone = determineTone(wpm, fillerCount);
      
      // Generate feedback
      const feedback: string[] = [];
      if (score >= 80) feedback.push("Great job covering the key points!");
      if (wpm >= 130 && wpm <= 150) feedback.push("Perfect speaking pace!");
      if (wpm > 160) feedback.push("You spoke 10% faster than target - try slowing down");
      if (wpm < 120) feedback.push("Consider speaking a bit faster to maintain energy");
      if (fillerCount > 5) feedback.push("Watch out for filler words - try pausing silently instead");
      if (fillerCount <= 2) feedback.push("Excellent - minimal filler words!");
      if (missedSections.length > 0) feedback.push(`Consider emphasizing: ${missedSections.join(', ')}`);
      
      const analysisResult: AnalysisResult = {
        score,
        wpm,
        fillers: fillerCount,
        fillerBreakdown: fillers,
        transcription,
        transcription_html: html,
        feedback,
        tone,
        missedSections,
        primaryIssue: null,
      };
      
      // Save to database first to get session ID
      const sessionId = await saveSession(analysisResult, recordingSeconds);
      
      // For hackathon tracks, run the jury evaluation
      if (sessionId && (track === 'hackathon_jury' || track === 'hackathon_no_demo')) {
        // Create segments from transcription result for evaluation
        // ElevenLabs returns words with timestamps, we'll create sentence-level segments
        const segments = createSegmentsFromTranscription(transcriptionResult, recordingSeconds);
        
        const evalResult = await evaluateHackathonPitch(sessionId, segments, recordingSeconds, baselineSessionId);
        if (evalResult.primaryIssue) {
          analysisResult.primaryIssue = evalResult.primaryIssue;
        }
        if (evalResult.events) {
          analysisResult.events = evalResult.events;
          analysisResult.recordingDuration = recordingSeconds;
        }
        if (evalResult.coachFeedback) {
          analysisResult.coachFeedback = evalResult.coachFeedback;
        }
        if (evalResult.improvementSummary) {
          analysisResult.improvementSummary = evalResult.improvementSummary;
        }
        
        // Generate jury questions for hackathon_jury track (runs async, updates state when ready)
        if (track === 'hackathon_jury') {
          generateJuryQuestions(
            sessionId,
            transcription,
            evalResult.events,
            evalResult.primaryIssue?.key || null
          ).then((juryQuestions) => {
            if (juryQuestions) {
              setAnalysis(prev => prev ? { ...prev, juryQuestions } : prev);
            }
          });
        }
      }
      
      setAnalysis(analysisResult);
      setState("results");
      
    } catch (error) {
      console.error("Analysis failed:", error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Could not analyze recording",
        variant: "destructive",
      });
      setState("idle");
    }
  }, [recordingTime, originalScript, saveSession, track, evaluateHackathonPitch]);

  const handleReset = useCallback(() => {
    setState("idle");
    setAnalysis(null);
    setRecordingTime(0);
    setProcessingStep(0);
    setCurrentBlock(0);
  }, []);

  const handleShowHistory = useCallback(() => {
    fetchHistory();
    setState("history");
  }, [fetchHistory]);

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

        <div className="space-y-2">
          <Progress value={(processingStep / processingMessages.length) * 100} className="h-2" />
        </div>

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

  // Render History View
  const renderHistory = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Practice History</h2>
          <p className="text-muted-foreground">Track your improvement over time</p>
        </div>
        <Button variant="outline" onClick={() => setState("idle")} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      {/* Public data disclaimer */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground/70 bg-muted/30 rounded-lg px-4 py-2">
        <AlertCircle className="w-3 h-3 flex-shrink-0" />
        <span>This is a public demo. All practice sessions shown here are visible to everyone.</span>
      </div>

      {isLoadingHistory ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : pastSessions.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <History className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No practice sessions yet</p>
            <p className="text-sm text-muted-foreground">Record your first session to start tracking progress!</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Progress Chart */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="w-5 h-5 text-primary" />
                Score Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between h-32 gap-2">
                {pastSessions.slice().reverse().map((session, index) => (
                  <div key={session.id} className="flex-1 flex flex-col items-center gap-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${session.score}%` }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                      className={cn(
                        "w-full rounded-t",
                        session.score >= 80 ? "bg-success" : 
                        session.score >= 60 ? "bg-warning" : "bg-destructive"
                      )}
                    />
                    <span className="text-xs text-muted-foreground">{session.score}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>Oldest</span>
                <span>Most Recent</span>
              </div>
            </CardContent>
          </Card>

          {/* Session List */}
          <div className="space-y-3">
            {pastSessions.map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={cn(
                  "glass-card transition-all",
                  baselineSessionId === session.id && "ring-2 ring-primary"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold",
                          session.score >= 80 ? "bg-success/10 text-success" : 
                          session.score >= 60 ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"
                        )}>
                          {session.score}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {new Date(session.created_at).toLocaleDateString()} at {new Date(session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>{session.wpm} WPM</span>
                            <span>•</span>
                            <span>{session.filler_count} fillers</span>
                            <span>•</span>
                            <span>{formatTime(session.recording_duration_seconds)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {(track === 'hackathon_jury' || track === 'hackathon_no_demo') && (
                          <Button
                            variant={baselineSessionId === session.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => setBaselineSessionId(
                              baselineSessionId === session.id ? null : session.id
                            )}
                            className="text-xs"
                          >
                            {baselineSessionId === session.id ? "✓ Baseline" : "Use as Baseline"}
                          </Button>
                        )}
                        <div className="text-2xl">
                          {getToneEmoji(session.tone as AnalysisResult["tone"])}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </>
      )}
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Analysis Complete!</h2>
            <p className="text-muted-foreground">Here's how you did</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleShowHistory} className="gap-2">
              <History className="w-4 h-4" />
              History
            </Button>
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <Mic className="w-4 h-4" />
              Record Again
            </Button>
          </div>
        </div>

        {/* Pitch Structure Timeline (Hackathon tracks only) */}
        {analysis.events && analysis.recordingDuration && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="w-5 h-5 text-primary" />
                  Pitch Structure Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Timeline bar */}
                  <div className="relative">
                    {/* Background track */}
                    <div className="h-8 bg-muted/30 rounded-full relative overflow-hidden">
                      {/* Time markers */}
                      <div className="absolute inset-0 flex justify-between px-2 items-center text-[10px] text-muted-foreground">
                        <span>0s</span>
                        <span>{Math.round(analysis.recordingDuration / 4)}s</span>
                        <span>{Math.round(analysis.recordingDuration / 2)}s</span>
                        <span>{Math.round((analysis.recordingDuration * 3) / 4)}s</span>
                        <span>{Math.round(analysis.recordingDuration)}s</span>
                      </div>
                    </div>
                    
                    {/* Event markers */}
                    <div className="absolute inset-0 h-8">
                      {Object.entries(analysis.events).map(([key, event]) => {
                        if (event.status === 'missing' || event.timestamp < 0) return null;
                        
                        const position = (event.timestamp / analysis.recordingDuration!) * 100;
                        const colors: Record<string, string> = {
                          problem: 'bg-destructive',
                          solution: 'bg-primary',
                          innovation: 'bg-success',
                          technical: 'bg-warning',
                          business_model: 'bg-accent',
                        };
                        
                        return (
                          <motion.div
                            key={key}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.3 + Object.keys(analysis.events!).indexOf(key) * 0.1 }}
                            className="absolute top-1/2 -translate-y-1/2"
                            style={{ left: `${Math.min(Math.max(position, 2), 98)}%` }}
                          >
                            <div 
                              className={cn(
                                "w-4 h-4 rounded-full border-2 border-background shadow-md cursor-pointer",
                                colors[key] || 'bg-muted'
                              )}
                              title={`${key}: ${Math.round(event.timestamp)}s`}
                            />
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Legend */}
                  <div className="flex flex-wrap gap-3 justify-center text-xs">
                    {Object.entries(analysis.events).map(([key, event]) => {
                      const labels: Record<string, string> = {
                        problem: 'Problem',
                        solution: 'Solution',
                        innovation: 'Innovation',
                        technical: 'Technical',
                        business_model: 'Business',
                      };
                      const colors: Record<string, string> = {
                        problem: 'bg-destructive',
                        solution: 'bg-primary',
                        innovation: 'bg-success',
                        technical: 'bg-warning',
                        business_model: 'bg-accent',
                      };
                      
                      const isMissing = event.status === 'missing' || event.timestamp < 0;
                      
                      return (
                        <div 
                          key={key} 
                          className={cn(
                            "flex items-center gap-1.5",
                            isMissing && "opacity-40"
                          )}
                        >
                          <div className={cn(
                            "w-2.5 h-2.5 rounded-full",
                            colors[key] || 'bg-muted'
                          )} />
                          <span className="text-muted-foreground">
                            {labels[key] || key}
                            {!isMissing && ` (${Math.round(event.timestamp)}s)`}
                            {isMissing && ' ✗'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Improvement Summary (when comparing to baseline) */}
        {analysis.improvementSummary && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className={cn(
              "glass-card border-2",
              analysis.improvementSummary.improved 
                ? "border-success/50 bg-success/5" 
                : "border-warning/50 bg-warning/5"
            )}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  {analysis.improvementSummary.improved ? (
                    <div className="flex items-center gap-2 bg-success/20 text-success px-3 py-1 rounded-full text-sm font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      Improved!
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-warning/20 text-warning px-3 py-1 rounded-full text-sm font-semibold">
                      <TrendingUp className="w-4 h-4" />
                      Keep Practicing
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Before</p>
                    <p className="text-foreground">{analysis.improvementSummary.before}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">After</p>
                    <p className="text-foreground">{analysis.improvementSummary.after}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

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

        {/* Hackathon Jury: Coach Feedback Card */}
        {analysis.coachFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass-card border-2 border-primary/50 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="w-5 h-5 text-primary" />
                  Coach Feedback
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  {analysis.coachFeedback.headline}
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      What I noticed
                    </p>
                    <p className="text-sm text-foreground">
                      {analysis.coachFeedback.what_i_noticed}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      Why it matters
                    </p>
                    <p className="text-sm text-foreground">
                      {analysis.coachFeedback.why_it_matters}
                    </p>
                  </div>
                  
                  {analysis.coachFeedback.evidence?.quote && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {analysis.coachFeedback.evidence.timestamp !== null 
                            ? `at ${Math.round(analysis.coachFeedback.evidence.timestamp)}s`
                            : 'Evidence'}
                        </span>
                      </div>
                      <p className="text-sm text-foreground italic">
                        "{analysis.coachFeedback.evidence.quote}"
                      </p>
                    </div>
                  )}
                  
                  <div className="bg-success/10 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Zap className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-success uppercase tracking-wide mb-1">
                          One change to try
                        </p>
                        <p className="text-sm text-foreground">
                          {analysis.coachFeedback.one_change_to_try}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-3">
                    {analysis.coachFeedback.encouragement}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Fallback: Basic Next Improvement Card (when coach feedback not available) */}
        {!analysis.coachFeedback && analysis.primaryIssue && analysis.primaryIssue.key !== 'none' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass-card border-2 border-primary/50 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="w-5 h-5 text-primary" />
                  Next Improvement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {analysis.primaryIssue.title}
                  </h3>
                  {analysis.primaryIssue.evidence_quote && (
                    <div className="bg-muted/50 rounded-lg p-3 mb-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {analysis.primaryIssue.evidence_timestamp !== null 
                            ? `at ${Math.round(analysis.primaryIssue.evidence_timestamp)}s`
                            : 'Evidence'}
                        </span>
                      </div>
                      <p className="text-sm text-foreground italic">
                        "{analysis.primaryIssue.evidence_quote}"
                      </p>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      {analysis.primaryIssue.next_action}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Hackathon Jury Questions (hackathon_jury track only) */}
        {track === 'hackathon_jury' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="glass-card border-2 border-accent/50 bg-accent/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <HelpCircle className="w-5 h-5 text-accent" />
                  Hackathon Jury Questions
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Questions you're likely to be asked after this pitch.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingJuryQuestions ? (
                  <div className="flex items-center justify-center py-8 gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-accent" />
                    <span className="text-sm text-muted-foreground">Generating jury questions...</span>
                  </div>
                ) : analysis.juryQuestions ? (
                  <>
                    {analysis.juryQuestions.summary && (
                      <p className="text-sm text-muted-foreground italic border-l-2 border-accent/30 pl-3 mb-4">
                        {analysis.juryQuestions.summary}
                      </p>
                    )}
                    <div className="space-y-3">
                      {analysis.juryQuestions.questions.map((q, index) => {
                        const categoryColors: Record<string, string> = {
                          'Problem': 'bg-destructive/10 text-destructive',
                          'Innovation': 'bg-success/10 text-success',
                          'Technical Feasibility': 'bg-warning/10 text-warning',
                          'Business Model': 'bg-primary/10 text-primary',
                          'Risk': 'bg-muted text-muted-foreground',
                        };
                        const isExpanded = expandedQuestionIndex === index;
                        
                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.05 * index }}
                            className="bg-background/50 rounded-lg border border-border overflow-hidden"
                          >
                            <div className="p-3">
                              <div className="flex items-start gap-3">
                                <span className={cn(
                                  "text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap",
                                  categoryColors[q.category] || 'bg-muted text-muted-foreground'
                                )}>
                                  {q.category}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground">
                                    {q.question}
                                  </p>
                                </div>
                                <button
                                  onClick={() => setExpandedQuestionIndex(isExpanded ? null : index)}
                                  className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="border-t border-border"
                                >
                                  <div className="p-3 bg-muted/30">
                                    <p className="text-xs text-muted-foreground">
                                      <span className="font-medium">Why they ask this:</span> {q.why_they_ask}
                                    </p>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })}
                    </div>
                    <div className="pt-4 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReset}
                        className="gap-2 w-full"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Re-record your pitch with these questions in mind
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 gap-3 text-center">
                    <HelpCircle className="w-8 h-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      Jury questions will appear here after analysis.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

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

  // Render Idle State
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleShowHistory} className="gap-2">
            <History className="w-4 h-4" />
            View History
          </Button>
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Practice
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4" />
          <span>ElevenLabs Scribe</span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span>NLP Analysis</span>
        </div>
      </div>

      {/* Public data disclaimer */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/70 bg-muted/30 rounded-lg px-4 py-2 max-w-md mx-auto">
        <AlertCircle className="w-3 h-3 flex-shrink-0" />
        <span>This is a public demo. Practice sessions are visible to everyone.</span>
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
        {state === "history" && renderHistory()}
      </AnimatePresence>
    </div>
  );
};
