// Phase 2: The Simulation Interface
// AI questioning with typewriter effect, voice input, and recovery lines

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, HelpCircle, ArrowLeft, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type JurorType, JURORS } from './JurorSelection';
import { type VerdictData } from './InterrogationVerdict';
import { RecoveryLinesDrawer } from './RecoveryLinesDrawer';
import { AudioWaveform } from './AudioWaveform';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface InterrogationSimulationProps {
  juror: JurorType;
  dossierData?: {
    projectName?: string;
    problem?: string;
    solution?: string;
    audience?: string;
  };
  onComplete: (data: VerdictData) => void;
  onBack: () => void;
}

interface GeneratedQuestion {
  question: string;
  category: string;
  intensity: 'low' | 'medium' | 'high';
}

// Voice IDs for each juror type (using ElevenLabs voices)
const JUROR_VOICES: Record<JurorType, string> = {
  mentor: 'EXAVITQu4vr4xnSDxMaL', // Sarah - warm, supportive
  reviewer: 'onwK4e9ZLuTAKqWW03F9', // Daniel - authoritative
  shark: 'cjVigY5qzO86Huf0OWal', // Eric - sharp, aggressive
};

const RECOVERY_LINES = [
  { name: 'The Time Buyer', phrase: "That's a great question. Let me think about how to best explain this..." },
  { name: 'The Pivot', phrase: "To put it another way, what I really mean is..." },
  { name: 'The Bridge', phrase: "Before I answer that directly, let me provide some context..." },
  { name: 'The Honesty Card', phrase: "I'll be honest, that's an area we're still exploring, but here's what we know..." },
  { name: 'The Data Drop', phrase: "The data shows something interesting here..." },
];

export const InterrogationSimulation = ({ 
  juror, 
  dossierData, 
  onComplete, 
  onBack 
}: InterrogationSimulationProps) => {
  const jurorConfig = JURORS.find(j => j.id === juror)!;
  const [phase, setPhase] = useState<'loading' | 'opening' | 'thinking' | 'questioning' | 'responding' | 'waiting'>('loading');
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [jurorOpening, setJurorOpening] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showRecoveryLines, setShowRecoveryLines] = useState(false);
  const [silenceTimer, setSilenceTimer] = useState<NodeJS.Timeout | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [responses, setResponses] = useState<string[]>([]);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentQuestion = questions[currentQuestionIndex]?.question || '';
  const totalQuestions = questions.length;

  // Fetch AI-generated questions on mount
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('generate-interrogation-questions', {
          body: {
            juror_type: juror,
            dossier_data: dossierData,
          },
        });

        if (error) throw error;

        if (data?.questions?.length > 0) {
          setQuestions(data.questions);
          setJurorOpening(data.jurorOpening || '');
          setPhase('opening');
        } else {
          throw new Error('No questions generated');
        }
      } catch (error) {
        console.error('Failed to generate questions:', error);
        toast.error('Failed to generate questions. Using fallback.');
        
        // Fallback questions
        setQuestions([
          { question: "Tell me about the core problem you're solving.", category: 'Problem', intensity: 'low' },
          { question: "What makes your solution unique?", category: 'Solution', intensity: 'low' },
          { question: "How do you plan to acquire your first 100 users?", category: 'Market', intensity: 'medium' },
          { question: "What's your biggest technical risk right now?", category: 'Risk', intensity: 'medium' },
          { question: "If a well-funded competitor copies this tomorrow, what's your moat?", category: 'Risk', intensity: 'high' },
        ]);
        setJurorOpening("Let's see what you've got.");
        setPhase('opening');
      }
    };

    fetchQuestions();
  }, [juror, dossierData]);

  // Play TTS for text
  const playTTS = useCallback(async (text: string) => {
    if (isMuted) return;
    
    try {
      setIsPlayingAudio(true);
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            text, 
            voiceId: JUROR_VOICES[juror] 
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => {
        setIsPlayingAudio(false);
        URL.revokeObjectURL(audioUrl);
      };
      audioRef.current.onerror = () => {
        setIsPlayingAudio(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      await audioRef.current.play();
    } catch (error) {
      console.error('TTS error:', error);
      setIsPlayingAudio(false);
    }
  }, [juror, isMuted]);

  // Opening phase - play juror greeting
  useEffect(() => {
    if (phase === 'opening' && jurorOpening) {
      playTTS(jurorOpening);
      
      // Typewriter for opening
      let index = 0;
      setDisplayedText('');
      
      const typeInterval = setInterval(() => {
        if (index < jurorOpening.length) {
          setDisplayedText(jurorOpening.slice(0, index + 1));
          index++;
        } else {
          clearInterval(typeInterval);
          // Wait a bit then start first question
          setTimeout(() => {
            setPhase('thinking');
          }, 1500);
        }
      }, 30);

      return () => clearInterval(typeInterval);
    }
  }, [phase, jurorOpening, playTTS]);

  // Typewriter effect for questions
  useEffect(() => {
    if (phase !== 'questioning' || !currentQuestion) return;
    
    let index = 0;
    setDisplayedText('');
    
    const typeInterval = setInterval(() => {
      if (index < currentQuestion.length) {
        setDisplayedText(currentQuestion.slice(0, index + 1));
        index++;
      } else {
        clearInterval(typeInterval);
        setPhase('waiting');
      }
    }, 40);

    return () => clearInterval(typeInterval);
  }, [phase, currentQuestion]);

  // Thinking animation before questions
  useEffect(() => {
    if (phase === 'thinking') {
      const delay = currentQuestionIndex === 0 ? 1500 : 2000 + Math.random() * 1000;
      const timer = setTimeout(() => {
        setPhase('questioning');
        // Play TTS for question
        if (currentQuestion) {
          playTTS(currentQuestion);
        }
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [phase, currentQuestionIndex, currentQuestion, playTTS]);

  // Silence detection - show recovery lines after 5 seconds
  useEffect(() => {
    if (phase === 'waiting' && !isRecording) {
      const timer = setTimeout(() => {
        setShowRecoveryLines(true);
      }, 5000);
      setSilenceTimer(timer);
      return () => clearTimeout(timer);
    }
  }, [phase, isRecording]);

  // Recording duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(d => d + 1);
      }, 1000);
    } else {
      setRecordingDuration(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Set up audio analysis for waveform
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.start();
      
      setIsRecording(true);
      setPhase('responding');
      setShowRecoveryLines(false);
      
      if (silenceTimer) clearTimeout(silenceTimer);
      
      // Animate audio level
      const updateLevel = () => {
        if (analyserRef.current && streamRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          setAudioLevel(avg / 255);
          if (isRecording) {
            requestAnimationFrame(updateLevel);
          }
        }
      };
      requestAnimationFrame(updateLevel);
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Failed to access microphone');
    }
  }, [silenceTimer, isRecording]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && streamRef.current) {
      mediaRecorderRef.current.stop();
      streamRef.current.getTracks().forEach(track => track.stop());
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      
      setIsRecording(false);
      setAudioLevel(0);
      
      // Save mock response
      setResponses(prev => [...prev, `Response to question ${currentQuestionIndex + 1}`]);
      
      // Move to next question or complete
      if (currentQuestionIndex < totalQuestions - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setPhase('thinking');
        setDisplayedText('');
      } else {
        // Calculate verdict based on questions answered
        const avgIntensityScore = questions.reduce((acc, q) => {
          const intensityValue = q.intensity === 'high' ? 30 : q.intensity === 'medium' ? 20 : 10;
          return acc + intensityValue;
        }, 0) / questions.length;

        const baseScore = 60 + Math.random() * 25;
        
        const verdictData: VerdictData = {
          choreography: { 
            score: Math.round(65 + Math.random() * 20), 
            details: { 
              delivery: Math.round(70 + Math.random() * 20), 
              pace: Math.round(65 + Math.random() * 20), 
              fillerWords: Math.round(60 + Math.random() * 25) 
            }
          },
          ammunition: { 
            score: Math.round(70 + Math.random() * 20), 
            details: { 
              logicalFlow: Math.round(75 + Math.random() * 15), 
              evidence: Math.round(65 + Math.random() * 20), 
              dataUsage: Math.round(70 + Math.random() * 20) 
            }
          },
          coldBloodedness: { 
            score: Math.round(60 + Math.random() * 25), 
            details: { 
              confidence: Math.round(65 + Math.random() * 25), 
              stressLevel: Math.round(55 + Math.random() * 30), 
              eyeContact: Math.round(60 + Math.random() * 25) 
            }
          },
          overallScore: Math.round(baseScore),
          status: baseScore >= 85 ? 'The Mastermind' : baseScore >= 70 ? 'Battle Ready' : baseScore >= 55 ? 'Survivor' : 'Needs Training',
          tips: [
            { title: 'The Pause Effect', description: 'Like a Tarantino scene: let silence build tension. Pause 2 seconds before key points.' },
            { title: 'Kill Your Darlings', description: 'Cut 30% of your content. Less is more when facing sharks.' },
            { title: 'Mirror Their Energy', description: `Match the ${jurorConfig.name}'s intensity. Aggression meets confidence, not retreat.` },
          ],
        };
        onComplete(verdictData);
      }
    }
  }, [currentQuestionIndex, totalQuestions, onComplete, questions, jurorConfig.name]);

  const handleRecoveryLineSelect = useCallback((phrase: string) => {
    setShowRecoveryLines(false);
    // Could trigger TTS here for the recovery line
    toast.success('Recovery line copied - use it to continue!');
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      if (!prev && audioRef.current) {
        audioRef.current.pause();
        setIsPlayingAudio(false);
      }
      return !prev;
    });
  }, []);

  // Loading state
  if (phase === 'loading') {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[400px] space-y-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-12 h-12 text-[#FFD700]" />
        </motion.div>
        <p className="text-gray-400">Preparing your interrogation...</p>
        <p className="text-sm text-gray-600">The {jurorConfig.name} is reviewing your dossier</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Progress Bar */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Exit
        </Button>
        <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#FFD700]"
            initial={{ width: 0 }}
            animate={{ width: `${((currentQuestionIndex + (phase === 'opening' ? 0 : 1)) / (totalQuestions || 1)) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <span className="text-sm text-gray-500">
          {phase === 'opening' ? '0' : currentQuestionIndex + 1}/{totalQuestions}
        </span>
      </div>

      {/* Main Spotlight Area */}
      <div className="relative min-h-[400px] flex flex-col items-center justify-center">
        {/* Spotlight Effect */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-30 blur-3xl"
          style={{ 
            background: `radial-gradient(circle, ${jurorConfig.accentColor}40 0%, transparent 70%)`,
          }}
        />

        {/* Juror Avatar */}
        <motion.div
          animate={{
            scale: phase === 'thinking' ? [1, 1.05, 1] : 1,
          }}
          transition={{
            duration: 2,
            repeat: phase === 'thinking' ? Infinity : 0,
          }}
          className="relative mb-8"
        >
          <div 
            className="w-32 h-32 rounded-full flex items-center justify-center border-4"
            style={{ 
              backgroundColor: `${jurorConfig.accentColor}20`,
              borderColor: jurorConfig.accentColor,
              boxShadow: `0 0 60px ${jurorConfig.accentColor}40`,
            }}
          >
            <div style={{ color: jurorConfig.accentColor }} className="scale-150">
              {jurorConfig.icon}
            </div>
          </div>
          
          {/* Audio Playing Indicator */}
          {isPlayingAudio && (
            <motion.div
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-0.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-[#FFD700] rounded-full"
                  animate={{ height: [8, 16, 8] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                />
              ))}
            </motion.div>
          )}
          
          {/* Sound Toggle */}
          <button
            onClick={toggleMute}
            className="absolute -bottom-2 -right-2 p-2 rounded-full bg-gray-800 border border-gray-700 hover:bg-gray-700"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-gray-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#FFD700]" />
            )}
          </button>
        </motion.div>

        {/* Juror Name */}
        <p className="text-sm text-gray-500 uppercase tracking-wider mb-4">
          {jurorConfig.title}
        </p>

        {/* Question/Opening Display */}
        <div className="w-full max-w-2xl text-center min-h-[120px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            {phase === 'thinking' && (
              <motion.div
                key="thinking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-gray-500"
              >
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  Juror is thinking
                </motion.span>
                {[0.2, 0.4, 0.6].map((delay, i) => (
                  <motion.span
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay }}
                  >
                    .
                  </motion.span>
                ))}
              </motion.div>
            )}

            {(phase === 'opening' || phase === 'questioning' || phase === 'waiting' || phase === 'responding') && (
              <motion.p
                key="text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xl md:text-2xl text-white font-medium leading-relaxed"
              >
                "{displayedText}
                {(phase === 'questioning' || phase === 'opening') && (
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="inline-block w-0.5 h-6 bg-[#FFD700] ml-1 align-middle"
                  />
                )}
                "
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Question Category Badge */}
        {phase !== 'opening' && questions[currentQuestionIndex] && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4"
          >
            <span 
              className={`px-3 py-1 text-xs rounded-full uppercase tracking-wider ${
                questions[currentQuestionIndex].intensity === 'high' 
                  ? 'bg-[#8B0000]/30 text-red-400 border border-[#8B0000]/50'
                  : questions[currentQuestionIndex].intensity === 'medium'
                    ? 'bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30'
                    : 'bg-gray-800 text-gray-400 border border-gray-700'
              }`}
            >
              {questions[currentQuestionIndex].category} • {questions[currentQuestionIndex].intensity}
            </span>
          </motion.div>
        )}
      </div>

      {/* Recording Controls */}
      {phase !== 'opening' && (
        <div className="flex flex-col items-center gap-6">
          {/* Audio Waveform */}
          {isRecording && (
            <AudioWaveform level={audioLevel} color={jurorConfig.accentColor} />
          )}

          {/* Recording Duration */}
          {isRecording && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-gray-400 font-mono"
            >
              {Math.floor(recordingDuration / 60).toString().padStart(2, '0')}:
              {(recordingDuration % 60).toString().padStart(2, '0')}
            </motion.div>
          )}

          {/* Record Button */}
          <motion.button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={phase === 'thinking' || phase === 'questioning'}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
              isRecording 
                ? 'bg-[#8B0000]' 
                : phase === 'waiting'
                  ? 'bg-[#FFD700]'
                  : 'bg-gray-700'
            } ${phase === 'thinking' || phase === 'questioning' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            style={{
              boxShadow: isRecording 
                ? '0 0 40px rgba(139,0,0,0.5), 0 0 80px rgba(139,0,0,0.3)'
                : phase === 'waiting'
                  ? '0 0 40px rgba(255,215,0,0.3), 0 0 80px rgba(255,215,0,0.15)'
                  : 'none',
            }}
          >
            {/* Pulsing Ring */}
            {isRecording && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-[#8B0000]"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                }}
              />
            )}
            
            {isRecording ? (
              <MicOff className="w-10 h-10 text-white" />
            ) : (
              <Mic className={`w-10 h-10 ${phase === 'waiting' ? 'text-gray-900' : 'text-white'}`} />
            )}
          </motion.button>

          <p className="text-sm text-gray-500">
            {isRecording ? 'Click to stop recording' : 
             phase === 'waiting' ? 'Press to respond' : 
             'Wait for the question...'}
          </p>

          {/* Help Button */}
          {phase === 'waiting' && !isRecording && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRecoveryLines(true)}
              className="text-gray-500 hover:text-[#FFD700]"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              Need a recovery line?
            </Button>
          )}
        </div>
      )}

      {/* Recovery Lines Drawer */}
      <RecoveryLinesDrawer
        open={showRecoveryLines}
        onOpenChange={setShowRecoveryLines}
        lines={RECOVERY_LINES}
        onSelect={handleRecoveryLineSelect}
      />
    </div>
  );
};
