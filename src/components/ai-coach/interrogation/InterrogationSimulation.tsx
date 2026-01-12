// Phase 2: The Simulation Interface
// AI questioning with typewriter effect, voice input, and recovery lines

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, HelpCircle, ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type JurorType, JURORS } from './JurorSelection';
import { type VerdictData } from './InterrogationVerdict';
import { RecoveryLinesDrawer } from './RecoveryLinesDrawer';
import { AudioWaveform } from './AudioWaveform';

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

// Mock questions based on juror type
const MOCK_QUESTIONS: Record<JurorType, string[]> = {
  mentor: [
    "That's an interesting approach. Can you walk me through how you identified this problem in the first place?",
    "What was the most surprising thing you learned during your research phase?",
    "How might this solution evolve as user needs change over time?",
  ],
  reviewer: [
    "Your methodology section lacks rigor. What peer-reviewed sources support your approach?",
    "The control group in your testing appears inadequate. Justify your sample size.",
    "How does your solution address the confounding variables you mentioned?",
  ],
  shark: [
    "Cut to the chase — what's the TAM, SAM, and SOM? I need numbers.",
    "Your competitors launched 6 months ago. Why would anyone switch to you?",
    "What happens when Google copies this feature tomorrow? What's your moat?",
  ],
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
  const [phase, setPhase] = useState<'thinking' | 'questioning' | 'responding' | 'waiting'>('thinking');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showRecoveryLines, setShowRecoveryLines] = useState(false);
  const [silenceTimer, setSilenceTimer] = useState<NodeJS.Timeout | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [responses, setResponses] = useState<string[]>([]);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const questions = MOCK_QUESTIONS[juror];
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;

  // Typewriter effect
  useEffect(() => {
    if (phase !== 'questioning') return;
    
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

  // Initial "thinking" animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase('questioning');
    }, 2000 + Math.random() * 1000);
    
    return () => clearTimeout(timer);
  }, [currentQuestionIndex]);

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
      
      // Animate audio level
      const updateLevel = () => {
        if (analyserRef.current && isRecording) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          setAudioLevel(avg / 255);
          requestAnimationFrame(updateLevel);
        }
      };
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.start();
      
      setIsRecording(true);
      setPhase('responding');
      setShowRecoveryLines(false);
      
      if (silenceTimer) clearTimeout(silenceTimer);
      
      requestAnimationFrame(updateLevel);
    } catch (error) {
      console.error('Failed to start recording:', error);
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
        // Calculate verdict
        const verdictData: VerdictData = {
          choreography: { score: 72, details: { delivery: 78, pace: 70, fillerWords: 68 }},
          ammunition: { score: 81, details: { logicalFlow: 85, evidence: 77, dataUsage: 82 }},
          coldBloodedness: { score: 65, details: { confidence: 70, stressLevel: 58, eyeContact: 67 }},
          overallScore: 73,
          status: 'Survivor',
          tips: [
            { title: 'The Pause Effect', description: 'Like a Tarantino scene: let silence build tension. Pause 2 seconds before key points.' },
            { title: 'Kill Your Darlings', description: 'Cut 30% of your content. Less is more when facing sharks.' },
            { title: 'Mirror Their Energy', description: 'Match the juror\'s intensity. Aggression meets confidence, not retreat.' },
          ],
        };
        onComplete(verdictData);
      }
    }
  }, [currentQuestionIndex, totalQuestions, onComplete]);

  const handleRecoveryLineSelect = useCallback((phrase: string) => {
    setShowRecoveryLines(false);
    // Could trigger TTS here
    console.log('Recovery line selected:', phrase);
  }, []);

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
            animate={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <span className="text-sm text-gray-500">
          {currentQuestionIndex + 1}/{totalQuestions}
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
          
          {/* Sound Indicator */}
          <button
            onClick={() => setIsMuted(!isMuted)}
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

        {/* Question Display */}
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
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                >
                  .
                </motion.span>
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                >
                  .
                </motion.span>
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                >
                  .
                </motion.span>
              </motion.div>
            )}

            {(phase === 'questioning' || phase === 'waiting' || phase === 'responding') && (
              <motion.p
                key="question"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xl md:text-2xl text-white font-medium leading-relaxed"
              >
                "{displayedText}
                {phase === 'questioning' && (
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
      </div>

      {/* Recording Controls */}
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
