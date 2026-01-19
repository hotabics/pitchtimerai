import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Phone, RotateCcw, Plus, Save, ArrowLeft,
  Trophy, Target, MessageSquare, AlertTriangle,
  Clock, TrendingUp, TrendingDown, Minus,
  CheckCircle2, XCircle, Lightbulb
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SimulationSummary {
  id: string;
  industry: string;
  product_description: string;
  client_role: string;
  client_personality: string;
  objection_level: string;
  call_goal: string;
  duration_seconds: number;
  talk_ratio: number;
  question_count: number;
  objections_raised: number;
  objections_handled: number;
  opening_score: number | null;
  discovery_score: number | null;
  value_score: number | null;
  objection_score: number | null;
  close_score: number | null;
  overall_score: number | null;
  penalties: Record<string, number>;
  highlights: string[];
  improvements: string[];
  timeline_events: Array<{ time: string; event: string; type: string }>;
  conversion_likelihood: string | null;
}

interface Turn {
  id: string;
  role: string;
  content: string;
  turn_number: number;
  coach_tips: string[];
  coach_red_flags: string[];
}

const SalesSimulatorSummary = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  
  const [summary, setSummary] = useState<SimulationSummary | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScoring, setIsScoring] = useState(false);

  useEffect(() => {
    loadSummary();
  }, [sessionId]);

  const loadSummary = async () => {
    if (!sessionId) return;

    try {
      // Load simulation data
      const { data: simData, error: simError } = await supabase
        .from("sales_simulations")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (simError) throw simError;

      // Load turns
      const { data: turnsData, error: turnsError } = await supabase
        .from("sales_simulation_turns")
        .select("*")
        .eq("simulation_id", sessionId)
        .order("turn_number", { ascending: true });

      if (turnsError) throw turnsError;

      setSummary({
        ...simData,
        penalties: (simData.penalties as Record<string, number>) || {},
        highlights: (simData.highlights as string[]) || [],
        improvements: (simData.improvements as string[]) || [],
        timeline_events: (simData.timeline_events as Array<{ time: string; event: string; type: string }>) || [],
      });

      setTurns((turnsData || []).map(t => ({
        id: t.id,
        role: t.role,
        content: t.content,
        turn_number: t.turn_number,
        coach_tips: (t.coach_tips as string[]) || [],
        coach_red_flags: (t.coach_red_flags as string[]) || [],
      })));

      // If no score yet, generate it
      if (!simData.overall_score) {
        await generateScore();
      }
    } catch (error) {
      console.error("Failed to load summary:", error);
      toast.error("Failed to load summary");
    } finally {
      setIsLoading(false);
    }
  };

  const generateScore = async () => {
    if (!sessionId) return;
    
    setIsScoring(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("score-sales-call", {
        body: { simulation_id: sessionId }
      });

      if (error) throw error;

      // Reload summary with new scores
      await loadSummary();
      toast.success("Analysis complete!");
    } catch (error) {
      console.error("Scoring failed:", error);
      toast.error("Failed to analyze call");
    } finally {
      setIsScoring(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-muted-foreground";
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getConversionBadge = (likelihood: string | null) => {
    if (!likelihood) return null;
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      high: "default",
      medium: "secondary",
      low: "destructive",
    };
    return <Badge variant={variants[likelihood] || "secondary"} className="capitalize">{likelihood}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading analysis...</div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Simulation not found</p>
          <Button onClick={() => navigate("/sales-simulator")}>Back to Simulator</Button>
        </div>
      </div>
    );
  }

  const scoreCategories = [
    { name: "Opening", score: summary.opening_score, max: 20 },
    { name: "Discovery", score: summary.discovery_score, max: 20 },
    { name: "Value Proposition", score: summary.value_score, max: 20 },
    { name: "Objection Handling", score: summary.objection_score, max: 20 },
    { name: "Close / Next Step", score: summary.close_score, max: 20 },
  ];

  return (
    <div className="min-h-screen bg-background pt-20 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate("/sales-simulator")}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Simulator
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Call Analysis</h1>
              <p className="text-muted-foreground">
                {summary.industry} • {summary.call_goal.replace("_", " ")}
              </p>
            </div>
            
            <div className="text-right">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                {formatDuration(summary.duration_seconds || 0)}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Overall Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-center flex-1">
                  <div className={`text-6xl font-bold ${getScoreColor(summary.overall_score)}`}>
                    {summary.overall_score ?? (isScoring ? "..." : "—")}
                  </div>
                  <p className="text-muted-foreground mt-2">Overall Score</p>
                </div>
                
                <Separator orientation="vertical" className="h-24" />
                
                <div className="flex-1 flex flex-col items-center">
                  <p className="text-sm text-muted-foreground mb-2">Conversion Likelihood</p>
                  {getConversionBadge(summary.conversion_likelihood)}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Score Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Score Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {scoreCategories.map((category) => (
                <div key={category.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{category.name}</span>
                    <span className={getScoreColor(category.score)}>
                      {category.score ?? "—"} / {category.max}
                    </span>
                  </div>
                  <Progress 
                    value={category.score ? (category.score / category.max) * 100 : 0} 
                    className="h-2"
                  />
                </div>
              ))}

              {/* Penalties */}
              {Object.keys(summary.penalties).length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium text-destructive mb-2">Penalties</p>
                  <div className="space-y-1">
                    {Object.entries(summary.penalties).map(([key, value]) => (
                      value !== 0 && (
                        <div key={key} className="flex justify-between text-sm text-destructive/80">
                          <span className="capitalize">{key.replace(/_/g, " ")}</span>
                          <span>{value}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Key Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">
                    {Math.round((summary.talk_ratio || 0.5) * 100)}%
                  </div>
                  <p className="text-sm text-muted-foreground">Talk Ratio</p>
                  {(summary.talk_ratio || 0.5) > 0.6 && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      <TrendingDown className="w-3 h-3 mr-1" />
                      Listen more
                    </Badge>
                  )}
                </div>
                
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">{summary.question_count || 0}</div>
                  <p className="text-sm text-muted-foreground">Questions Asked</p>
                </div>
                
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">
                    {summary.objections_handled}/{summary.objections_raised}
                  </div>
                  <p className="text-sm text-muted-foreground">Objections Handled</p>
                </div>
                
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">{turns.length}</div>
                  <p className="text-sm text-muted-foreground">Conversation Turns</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Highlights & Improvements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                  Highlights
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summary.highlights.length > 0 ? (
                  <ul className="space-y-2">
                    {summary.highlights.map((highlight, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Analysis pending...</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-600">
                  <Lightbulb className="w-5 h-5" />
                  Areas to Improve
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summary.improvements.length > 0 ? (
                  <ul className="space-y-2">
                    {summary.improvements.map((improvement, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        {improvement}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Analysis pending...</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Timeline */}
        {summary.timeline_events.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Call Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {summary.timeline_events.map((event, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Badge variant="outline" className="shrink-0">{event.time}</Badge>
                      <div className={`text-sm ${
                        event.type === "positive" ? "text-green-600" :
                        event.type === "negative" ? "text-red-600" :
                        "text-muted-foreground"
                      }`}>
                        {event.event}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            variant="outline"
            onClick={() => navigate(`/sales-simulator/setup`)}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Retry Same Scenario
          </Button>
          
          <Button
            onClick={() => navigate("/sales-simulator/setup")}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Start New Call
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default SalesSimulatorSummary;
