import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Phone, PhoneOff, Mic, MicOff, MessageSquare, Send,
  User, Bot, Lightbulb, AlertTriangle, Clock, Volume2
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Turn {
  id: string;
  role: "user" | "client";
  content: string;
  timestamp: Date;
  coachTips?: string[];
  coachNextAction?: { type: string; suggested_line: string };
  coachRedFlags?: string[];
}

interface SimulationConfig {
  industry: string;
  product_description: string;
  client_role: string;
  client_personality: string;
  objection_level: string;
  call_goal: string;
  custom_goal?: string;
}

const SalesSimulatorLive = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  
  const [config, setConfig] = useState<SimulationConfig | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  // Coach panel state
  const [coachTips, setCoachTips] = useState<string[]>([]);
  const [nextAction, setNextAction] = useState<{ type: string; suggested_line: string } | null>(null);
  const [redFlags, setRedFlags] = useState<string[]>([]);
  const [currentStage, setCurrentStage] = useState("opening");
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const turnNumberRef = useRef(0);

  // Load simulation config
  useEffect(() => {
    const loadSimulation = async () => {
      if (!sessionId) return;
      
      const { data, error } = await supabase
        .from("sales_simulations")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (error || !data) {
        toast.error("Simulation not found");
        navigate("/sales-simulator");
        return;
      }

      setConfig({
        industry: data.industry,
        product_description: data.product_description,
        client_role: data.client_role,
        client_personality: data.client_personality,
        objection_level: data.objection_level,
        call_goal: data.call_goal,
        custom_goal: data.custom_goal || undefined,
      });
    };

    loadSimulation();
  }, [sessionId, navigate]);

  // Timer effect
  useEffect(() => {
    if (callActive) {
      timerRef.current = setInterval(() => {
        setCallTimer((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [callActive]);

  // Scroll to bottom when new messages arrive
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

  const startCall = async () => {
    setCallActive(true);
    setCallTimer(0);
    
    // Update simulation status
    await supabase
      .from("sales_simulations")
      .update({ 
        status: "in_progress",
        started_at: new Date().toISOString()
      })
      .eq("id", sessionId);

    // Get initial client greeting
    await getClientResponse("", true);
  };

  const endCall = async () => {
    setCallActive(false);
    
    // Update simulation with end time
    await supabase
      .from("sales_simulations")
      .update({ 
        status: "completed",
        ended_at: new Date().toISOString(),
        duration_seconds: callTimer
      })
      .eq("id", sessionId);

    // Navigate to summary
    navigate(`/sales-simulator/summary/${sessionId}`);
  };

  const getClientResponse = async (userMessage: string, isOpening = false) => {
    if (!config || !sessionId) return;

    setIsProcessing(true);

    try {
      // Get client AI response
      const clientResponse = await supabase.functions.invoke("sales-client-turn", {
        body: {
          simulation_id: sessionId,
          user_message: userMessage,
          is_opening: isOpening,
          context: {
            ...config,
            conversation: turns.map(t => ({ role: t.role, text: t.content })),
            current_stage: currentStage,
          }
        }
      });

      if (clientResponse.error) throw clientResponse.error;

      const clientData = clientResponse.data;
      
      // Add client turn
      const clientTurn: Turn = {
        id: crypto.randomUUID(),
        role: "client",
        content: clientData.client_reply,
        timestamp: new Date(),
      };
      
      setTurns(prev => [...prev, clientTurn]);
      turnNumberRef.current += 1;

      // Save turn to database
      await supabase.from("sales_simulation_turns").insert({
        simulation_id: sessionId,
        turn_number: turnNumberRef.current,
        role: "client",
        content: clientData.client_reply,
        intent: clientData.intent,
        state_update: clientData.state_update,
        objection: clientData.objection,
      });

      // Update stage if changed
      if (clientData.state_update?.stage) {
        setCurrentStage(clientData.state_update.stage);
      }

      // Get coach suggestions for next user turn
      await getCoachSuggestions(userMessage, clientData.client_reply);

    } catch (error) {
      console.error("Client AI error:", error);
      toast.error("Failed to get response. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const getCoachSuggestions = async (userMessage: string, clientMessage: string) => {
    if (!config || !sessionId) return;

    try {
      const coachResponse = await supabase.functions.invoke("sales-coach-turn", {
        body: {
          simulation_id: sessionId,
          context: {
            ...config,
            conversation: [...turns, { role: "client", content: clientMessage }].map(t => ({ 
              role: t.role, 
              text: t.content 
            })),
            current_stage: currentStage,
            last_user_message: userMessage,
            last_client_message: clientMessage,
          }
        }
      });

      if (coachResponse.error) throw coachResponse.error;

      const coachData = coachResponse.data;
      
      setCoachTips(coachData.live_tips || []);
      setNextAction(coachData.next_best_action || null);
      setRedFlags(coachData.red_flags || []);
      
      if (coachData.stage_recommendation) {
        setCurrentStage(coachData.stage_recommendation);
      }

    } catch (error) {
      console.error("Coach AI error:", error);
    }
  };

  const sendMessage = async () => {
    if (!userInput.trim() || isProcessing || !callActive) return;

    const message = userInput.trim();
    setUserInput("");

    // Add user turn
    const userTurn: Turn = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
      timestamp: new Date(),
      coachTips: [...coachTips],
      coachNextAction: nextAction || undefined,
      coachRedFlags: [...redFlags],
    };
    
    setTurns(prev => [...prev, userTurn]);
    turnNumberRef.current += 1;

    // Save turn to database
    await supabase.from("sales_simulation_turns").insert({
      simulation_id: sessionId,
      turn_number: turnNumberRef.current,
      role: "user",
      content: message,
      coach_tips: coachTips,
      coach_next_action: nextAction,
      coach_red_flags: redFlags,
      coach_stage_recommendation: currentStage,
      is_question: message.includes("?"),
      word_count: message.split(/\s+/).length,
    });

    // Clear coach suggestions
    setCoachTips([]);
    setNextAction(null);
    setRedFlags([]);

    // Get client response
    await getClientResponse(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getRoleName = () => {
    if (!config) return "Client";
    const roles: Record<string, string> = {
      ceo: "CEO",
      founder: "Founder",
      marketing_manager: "Marketing Manager",
      procurement: "Procurement Manager",
      custom: "Client",
    };
    return roles[config.client_role] || "Client";
  };

  if (!config) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading simulation...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Top Bar */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant={callActive ? "default" : "secondary"} className="gap-2">
              <Clock className="w-3 h-3" />
              {formatTime(callTimer)}
            </Badge>
            <Badge variant="outline" className="capitalize">
              Stage: {currentStage}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {!callActive ? (
              <Button onClick={startCall} className="gap-2 bg-green-600 hover:bg-green-700">
                <Phone className="w-4 h-4" />
                Start Call
              </Button>
            ) : (
              <Button onClick={endCall} variant="destructive" className="gap-2">
                <PhoneOff className="w-4 h-4" />
                End Call
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - 3 Column Layout */}
      <div className="pt-16 h-[calc(100vh-8rem)] flex">
        {/* Left Column - AI Client */}
        <div className="w-1/4 border-r border-border p-4 flex flex-col">
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-2">
              <User className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold">{getRoleName()}</h3>
            <p className="text-sm text-muted-foreground capitalize">
              {config.client_personality} • {config.objection_level} objections
            </p>
          </div>
          
          <div className="flex-1 overflow-auto space-y-2">
            {turns.filter(t => t.role === "client").map((turn) => (
              <div key={turn.id} className="bg-muted/50 rounded-lg p-3 text-sm">
                {turn.content}
              </div>
            ))}
          </div>
        </div>

        {/* Center Column - Chat */}
        <div className="flex-1 flex flex-col">
          {/* Chat Messages */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-auto p-4 space-y-4"
          >
            {!callActive && turns.length === 0 && (
              <div className="text-center text-muted-foreground py-12">
                <Phone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Click "Start Call" to begin the simulation</p>
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
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      turn.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1 text-xs opacity-70">
                      {turn.role === "user" ? (
                        <MessageSquare className="w-3 h-3" />
                      ) : (
                        <User className="w-3 h-3" />
                      )}
                      {turn.role === "user" ? "You" : getRoleName()}
                    </div>
                    <p className="text-sm">{turn.content}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-border p-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsVoiceMode(!isVoiceMode)}
                disabled={!callActive}
              >
                {isVoiceMode ? <Mic className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
              </Button>
              
              <Textarea
                placeholder={callActive ? "Type your response..." : "Start the call first"}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={!callActive || isProcessing}
                className="min-h-[40px] max-h-[120px] resize-none"
                rows={1}
              />
              
              <Button
                onClick={sendMessage}
                disabled={!callActive || isProcessing || !userInput.trim()}
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column - AI Coach */}
        <div className="w-1/4 border-l border-border p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">AI Sales Coach</h3>
          </div>

          <div className="flex-1 overflow-auto space-y-4">
            {/* Red Flags */}
            {redFlags.length > 0 && (
              <Card className="p-3 border-destructive/50 bg-destructive/5">
                <div className="flex items-center gap-2 mb-2 text-destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">Watch Out</span>
                </div>
                <ul className="space-y-1">
                  {redFlags.map((flag, i) => (
                    <li key={i} className="text-sm text-destructive/90">{flag}</li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Live Tips */}
            {coachTips.length > 0 && (
              <Card className="p-3 border-primary/50 bg-primary/5">
                <div className="flex items-center gap-2 mb-2 text-primary">
                  <Lightbulb className="w-4 h-4" />
                  <span className="text-sm font-medium">Tips</span>
                </div>
                <ul className="space-y-2">
                  {coachTips.map((tip, i) => (
                    <li key={i} className="text-sm">{tip}</li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Next Action */}
            {nextAction && (
              <Card className="p-3 border-green-500/50 bg-green-500/5">
                <div className="flex items-center gap-2 mb-2 text-green-600">
                  <Volume2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Try Saying</span>
                </div>
                <p className="text-sm italic">"{nextAction.suggested_line}"</p>
                <Badge variant="outline" className="mt-2 text-xs capitalize">
                  {nextAction.type}
                </Badge>
              </Card>
            )}

            {/* Empty state */}
            {!callActive && coachTips.length === 0 && redFlags.length === 0 && !nextAction && (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Coach tips will appear here during the call</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesSimulatorLive;
