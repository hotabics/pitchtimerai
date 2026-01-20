import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Phone, PhoneOff, Send, Mic, MicOff,
  Lightbulb, Clock, Volume2, VolumeX, User
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSalesVoice } from "@/hooks/useSalesVoice";
import { InterviewerWaveform } from "@/components/interview-simulator/InterviewerWaveform";
import { DossierSidebar } from "@/components/interview-simulator/DossierSidebar";
import { RecoveryLinesDrawer } from "@/components/interview-simulator/RecoveryLinesDrawer";

interface Turn {
  id: string;
  role: "user" | "interviewer";
  content: string;
  timestamp: Date;
  assessment?: {
    strategic_score?: number;
    missed_opportunities?: string[];
    suggested_reframe?: string;
  };
}

interface SimulationConfig {
  id: string;
  job_title: string;
  company_name?: string;
  job_description: string;
  cv_content: string;
  match_strengths: any[];
  match_gaps: any[];
  key_evidence: any[];
}

const InterviewSimulatorLive = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  
  const [config, setConfig] = useState<SimulationConfig | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [interviewActive, setInterviewActive] = useState(false);
  const [interviewTimer, setInterviewTimer] = useState(0);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(0);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const turnNumberRef = useRef(0);

  // Voice hook
  const handleVoiceTranscript = useCallback((text: string) => {
    setUserInput(text);
  }, []);

  const {
    isSpeaking,
    speakText,
    stopSpeaking,
    isRecording,
    isTranscribing,
    startRecording,
    stopRecording,
    voiceEnabled,
    setVoiceEnabled,
  } = useSalesVoice({
    onTranscript: handleVoiceTranscript,
    autoSpeak: true,
  });

  // Load simulation config
  useEffect(() => {
    const loadSimulation = async () => {
      if (!sessionId) return;
      
      const { data, error } = await supabase
        .from("interview_simulations")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (error || !data) {
        toast.error("Simulation not found");
        navigate("/interview-simulator");
        return;
      }

      setConfig({
        id: data.id,
        job_title: data.job_title,
        company_name: data.company_name || undefined,
        job_description: data.job_description,
        cv_content: data.cv_content,
        match_strengths: (data.match_strengths as any[]) || [],
        match_gaps: (data.match_gaps as any[]) || [],
        key_evidence: (data.key_evidence as any[]) || [],
      });
    };

    loadSimulation();
  }, [sessionId, navigate]);

  // Timer
  useEffect(() => {
    if (interviewActive) {
      timerRef.current = setInterval(() => {
        setInterviewTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [interviewActive]);

  // Scroll to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [turns]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startInterview = async () => {
    setInterviewActive(true);
    setInterviewTimer(0);
    
    await supabase
      .from("interview_simulations")
      .update({ status: "in_progress", started_at: new Date().toISOString() })
      .eq("id", sessionId);

    await getInterviewerQuestion("", true);
  };

  const endInterview = async () => {
    setInterviewActive(false);
    stopSpeaking();
    
    await supabase
      .from("interview_simulations")
      .update({ 
        status: "completed",
        ended_at: new Date().toISOString(),
        duration_seconds: interviewTimer
      })
      .eq("id", sessionId);

    navigate(`/interview-simulator/summary/${sessionId}`);
  };

  const getInterviewerQuestion = async (userResponse: string, isOpening = false) => {
    if (!config) return;

    setIsProcessing(true);
    setCurrentQuestionNumber(prev => prev + 1);

    try {
      const { data, error } = await supabase.functions.invoke("interview-question-turn", {
        body: {
          simulation_id: sessionId,
          user_response: userResponse,
          is_opening: isOpening,
          context: {
            job_title: config.job_title,
            company_name: config.company_name,
            job_description: config.job_description,
            cv_content: config.cv_content,
            match_gaps: config.match_gaps,
            key_evidence: config.key_evidence,
            conversation_history: turns.map(t => ({ role: t.role, content: t.content })),
            current_question_number: currentQuestionNumber + 1
          }
        }
      });

      if (error) throw error;

      const interviewerTurn: Turn = {
        id: crypto.randomUUID(),
        role: "interviewer",
        content: data.interviewer_message,
        timestamp: new Date(),
      };
      
      setTurns(prev => [...prev, interviewerTurn]);
      turnNumberRef.current += 1;

      // Speak the question
      if (voiceEnabled) {
        speakText(data.interviewer_message, "JBFqnCBsd6RMkjVDRZzb"); // Professional voice
      }

      // Save turn
      await supabase.from("interview_simulation_turns").insert({
        simulation_id: sessionId,
        turn_number: turnNumberRef.current,
        role: "interviewer",
        content: data.interviewer_message,
        intent: data.question_type,
      });

      // Check if final
      if (data.is_final_question) {
        setTimeout(() => {
          toast.info("This is the final question. Wrap up your interview.");
        }, 2000);
      }

    } catch (error) {
      console.error("Interviewer error:", error);
      toast.error("Failed to get interviewer response");
    } finally {
      setIsProcessing(false);
    }
  };

  const sendMessage = async () => {
    if (!userInput.trim() || isProcessing || !interviewActive) return;

    const message = userInput.trim();
    setUserInput("");

    const userTurn: Turn = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };
    
    setTurns(prev => [...prev, userTurn]);
    turnNumberRef.current += 1;

    await supabase.from("interview_simulation_turns").insert({
      simulation_id: sessionId,
      turn_number: turnNumberRef.current,
      role: "user",
      content: message,
    });

    await getInterviewerQuestion(message);
  };

  const handleRecordToggle = async () => {
    if (isRecording) {
      const text = await stopRecording();
      if (text) {
        setUserInput(text);
      }
    } else {
      await startRecording();
    }
  };

  if (!config) {
    return (
      <div className="min-h-screen bg-interview-bg flex items-center justify-center">
        <div className="animate-pulse text-interview-muted">Loading interview...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-interview-bg flex flex-col">
      {/* Top Bar */}
      <div className="h-16 border-b border-interview-border bg-interview-card flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Badge className="bg-interview-blood/20 text-interview-blood border-0 gap-1">
            <Clock className="w-3 h-3" />
            {formatTime(interviewTimer)}
          </Badge>
          <Badge variant="outline" className="border-interview-border text-interview-muted">
            Question {currentQuestionNumber} / 5-7
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsRecoveryOpen(true)}
            className="text-interview-mustard hover:bg-interview-mustard/10"
          >
            <Lightbulb className="w-5 h-5" />
          </Button>
          
          {!interviewActive ? (
            <Button onClick={startInterview} className="gap-2 bg-green-600 hover:bg-green-700">
              <Phone className="w-4 h-4" />
              Start Interview
            </Button>
          ) : (
            <Button onClick={endInterview} variant="destructive" className="gap-2">
              <PhoneOff className="w-4 h-4" />
              End Interview
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Interviewer Waveform Area */}
          <div className="h-32 border-b border-interview-border flex items-center justify-center bg-interview-bg relative">
            <div className="absolute inset-0 bg-gradient-to-b from-interview-cold/5 to-transparent" />
            <div className="text-center relative">
              <InterviewerWaveform isSpeaking={isSpeaking} intensity="medium" />
              <p className="text-sm text-interview-muted mt-2">
                {isSpeaking ? (
                  <span className="flex items-center gap-1 justify-center">
                    <Volume2 className="w-3 h-3" />
                    The Interviewer is speaking...
                  </span>
                ) : isProcessing ? (
                  "Preparing question..."
                ) : (
                  "The Interviewer"
                )}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-auto p-4 space-y-4"
          >
            {!interviewActive && turns.length === 0 && (
              <div className="text-center text-interview-muted py-12">
                <Phone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Click "Start Interview" to begin</p>
              </div>
            )}

            <AnimatePresence>
              {turns.map((turn) => (
                <motion.div
                  key={turn.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${turn.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[70%] rounded-lg p-4 ${
                    turn.role === "user"
                      ? "bg-interview-mustard/20 border border-interview-mustard/30"
                      : "bg-interview-card border border-interview-border"
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {turn.role === "interviewer" ? (
                        <Badge variant="outline" className="text-xs border-interview-cold text-interview-cold">
                          Interviewer
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs border-interview-mustard text-interview-mustard">
                          You
                        </Badge>
                      )}
                    </div>
                    <p className="text-interview-text">{turn.content}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isProcessing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-interview-card border border-interview-border rounded-lg p-4">
                  <div className="flex gap-1">
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 bg-interview-cold rounded-full"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-interview-border bg-interview-card">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Textarea
                  placeholder={interviewActive ? "Type your response..." : "Start the interview first"}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  disabled={!interviewActive || isProcessing}
                  className="min-h-[80px] bg-interview-bg border-interview-border text-interview-text resize-none"
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className={`border-interview-border ${voiceEnabled ? "text-interview-mustard" : "text-interview-muted"}`}
                >
                  {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </Button>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRecordToggle}
                  disabled={!interviewActive || isTranscribing}
                  className={`border-interview-border ${isRecording ? "bg-interview-blood text-white" : "text-interview-muted"}`}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>

                <Button
                  onClick={sendMessage}
                  disabled={!userInput.trim() || isProcessing || !interviewActive}
                  className="bg-interview-mustard hover:bg-interview-mustard/90 text-interview-bg"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {isTranscribing && (
              <p className="text-xs text-interview-muted mt-2">Transcribing...</p>
            )}
          </div>
        </div>

        {/* Dossier Sidebar */}
        <div className="w-80 hidden lg:block">
          <DossierSidebar
            jobTitle={config.job_title}
            companyName={config.company_name}
            keyEvidence={config.key_evidence}
            matchStrengths={config.match_strengths}
            matchGaps={config.match_gaps}
            currentQuestion={turns.filter(t => t.role === "interviewer").slice(-1)[0]?.content}
          />
        </div>
      </div>

      {/* Recovery Lines Drawer */}
      <RecoveryLinesDrawer 
        isOpen={isRecoveryOpen} 
        onClose={() => setIsRecoveryOpen(false)} 
      />
    </div>
  );
};

export default InterviewSimulatorLive;
