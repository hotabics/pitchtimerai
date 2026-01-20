import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, ArrowRight, RotateCcw, Trophy, 
  Target, TrendingUp, MessageSquare, Lightbulb,
  CheckCircle2, XCircle, Clock, Briefcase,
  ChevronDown, ChevronUp, Download
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateInterviewPDF } from "@/services/interviewPdfExport";
interface SimulationSummary {
  id: string;
  job_title: string;
  company_name?: string;
  duration_seconds: number;
  hireability_score: number | null;
  category_scores: {
    first_impression?: number;
    technical_competence?: number;
    cultural_fit?: number;
    communication?: number;
    gap_handling?: number;
  } | null;
  strategic_reframes: Array<{
    question_topic: string;
    what_they_said: string;
    strategic_reframe: string;
    cv_evidence_to_use?: string;
  }>;
  verdict_summary: string | null;
  conversion_likelihood: "high" | "medium" | "low" | null;
}

interface Turn {
  id: string;
  role: string;
  content: string;
  turn_number: number;
}

const InterviewSimulatorSummary = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  
  const [summary, setSummary] = useState<SimulationSummary | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScoring, setIsScoring] = useState(false);
  const [expandedReframe, setExpandedReframe] = useState<number | null>(null);

  useEffect(() => {
    loadSummary();
  }, [sessionId]);

  const loadSummary = async () => {
    if (!sessionId) return;

    try {
      const { data: simData, error: simError } = await supabase
        .from("interview_simulations")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (simError) throw simError;

      const { data: turnsData, error: turnsError } = await supabase
        .from("interview_simulation_turns")
        .select("*")
        .eq("simulation_id", sessionId)
        .order("turn_number", { ascending: true });

      if (turnsError) throw turnsError;

      setSummary({
        id: simData.id,
        job_title: simData.job_title,
        company_name: simData.company_name,
        duration_seconds: simData.duration_seconds || 0,
        hireability_score: simData.hireability_score,
        category_scores: simData.category_scores as any,
        strategic_reframes: (simData.strategic_reframes as any[]) || [],
        verdict_summary: simData.verdict_summary,
        conversion_likelihood: simData.conversion_likelihood as any,
      });

      setTurns((turnsData || []).map(t => ({
        id: t.id,
        role: t.role,
        content: t.content,
        turn_number: t.turn_number,
      })));

      if (!simData.hireability_score) {
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
      const { data, error } = await supabase.functions.invoke("score-interview", {
        body: { simulation_id: sessionId }
      });

      if (error) throw error;
      
      await loadSummary();
      toast.success("Analysis complete!");
    } catch (error) {
      console.error("Scoring failed:", error);
      toast.error("Failed to analyze interview");
    } finally {
      setIsScoring(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getScoreColor = (score: number | null | undefined) => {
    if (score === null || score === undefined) return "text-interview-muted";
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-interview-mustard";
    return "text-interview-blood";
  };

  const getScoreBg = (score: number | null | undefined) => {
    if (score === null || score === undefined) return "bg-interview-muted/20";
    if (score >= 80) return "bg-green-500/20";
    if (score >= 60) return "bg-interview-mustard/20";
    return "bg-interview-blood/20";
  };

  const getLikelihoodBadge = (likelihood: string | null) => {
    if (!likelihood) return null;
    const config: Record<string, { bg: string; text: string; label: string }> = {
      high: { bg: "bg-green-500/20", text: "text-green-500", label: "Strong Candidate" },
      medium: { bg: "bg-interview-mustard/20", text: "text-interview-mustard", label: "Needs Improvement" },
      low: { bg: "bg-interview-blood/20", text: "text-interview-blood", label: "Unlikely to Advance" },
    };
    const c = config[likelihood] || config.medium;
    return <Badge className={`${c.bg} ${c.text} border-0`}>{c.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-interview-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-interview-mustard/30 border-t-interview-mustard rounded-full animate-spin mx-auto mb-4" />
          <p className="text-interview-muted">Analyzing your interview...</p>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen bg-interview-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-interview-muted mb-4">Interview not found</p>
          <Button onClick={() => navigate("/interview-simulator")}>Back to Simulator</Button>
        </div>
      </div>
    );
  }

  const categoryScores = [
    { name: "First Impression", score: summary.category_scores?.first_impression, max: 20 },
    { name: "Technical Competence", score: summary.category_scores?.technical_competence, max: 20 },
    { name: "Cultural Fit", score: summary.category_scores?.cultural_fit, max: 20 },
    { name: "Communication", score: summary.category_scores?.communication, max: 20 },
    { name: "Gap Handling", score: summary.category_scores?.gap_handling, max: 20 },
  ];

  return (
    <div className="min-h-screen bg-interview-bg pt-20 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate("/interview-simulator")}
            className="mb-4 gap-2 text-interview-muted hover:text-interview-text"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Simulator
          </Button>
          
          <Badge className="bg-interview-mustard/20 text-interview-mustard border-0 mb-3">
            Phase 3: The Strategic Verdict
          </Badge>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-interview-text mb-2">{summary.job_title}</h1>
              {summary.company_name && (
                <p className="text-interview-muted flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  {summary.company_name}
                </p>
              )}
            </div>
            <div className="text-right text-interview-muted flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {formatDuration(summary.duration_seconds)}
            </div>
          </div>
        </motion.div>

        {/* Hireability Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-interview-card border-interview-border mb-6 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-interview-mustard/5 to-transparent pointer-events-none" />
            <CardContent className="pt-6 relative">
              <div className="flex items-center justify-between">
                <div className="text-center flex-1">
                  <div className={`text-7xl font-bold ${getScoreColor(summary.hireability_score)}`}>
                    {summary.hireability_score ?? (isScoring ? "..." : "—")}
                  </div>
                  <p className="text-interview-muted mt-2">Hireability Score</p>
                </div>
                
                <Separator orientation="vertical" className="h-24 bg-interview-border" />
                
                <div className="flex-1 flex flex-col items-center">
                  <p className="text-sm text-interview-muted mb-2">Conversion Likelihood</p>
                  {getLikelihoodBadge(summary.conversion_likelihood)}
                </div>
              </div>

              {summary.verdict_summary && (
                <div className="mt-6 p-4 rounded-lg bg-interview-bg border border-interview-border">
                  <p className="text-interview-text italic">"{summary.verdict_summary}"</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-interview-card border-interview-border mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-interview-text">
                <Target className="w-5 h-5 text-interview-mustard" />
                Score Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {categoryScores.map((category) => (
                <div key={category.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-interview-text">{category.name}</span>
                    <span className={getScoreColor(category.score)}>
                      {category.score ?? "—"} / {category.max}
                    </span>
                  </div>
                  <div className="h-2 bg-interview-bg rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: category.score ? `${(category.score / category.max) * 100}%` : "0%" }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className={`h-full rounded-full ${getScoreBg(category.score)}`}
                      style={{ backgroundColor: category.score ? undefined : "transparent" }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Strategic Reframes - "What to Say" Map */}
        {summary.strategic_reframes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-interview-card border-interview-border mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-interview-text">
                  <MessageSquare className="w-5 h-5 text-interview-mustard" />
                  What You Said vs. Strategic Reframe
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {summary.strategic_reframes.map((reframe, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-interview-border overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedReframe(expandedReframe === i ? null : i)}
                      className="w-full p-4 flex items-center justify-between bg-interview-bg hover:bg-interview-card/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-interview-blood/20 flex items-center justify-center">
                          <span className="text-sm font-bold text-interview-blood">{i + 1}</span>
                        </div>
                        <span className="text-interview-text font-medium">{reframe.question_topic}</span>
                      </div>
                      {expandedReframe === i ? (
                        <ChevronUp className="w-5 h-5 text-interview-muted" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-interview-muted" />
                      )}
                    </button>

                    {expandedReframe === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        className="border-t border-interview-border"
                      >
                        <div className="p-4 space-y-4">
                          {/* What they said */}
                          <div className="p-3 rounded bg-interview-blood/10 border border-interview-blood/20">
                            <div className="flex items-center gap-2 mb-2">
                              <XCircle className="w-4 h-4 text-interview-blood" />
                              <span className="text-sm font-medium text-interview-blood">What you said:</span>
                            </div>
                            <p className="text-interview-text italic">"{reframe.what_they_said}"</p>
                          </div>

                          {/* Strategic reframe */}
                          <div className="p-3 rounded bg-interview-mustard/10 border border-interview-mustard/20">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle2 className="w-4 h-4 text-interview-mustard" />
                              <span className="text-sm font-medium text-interview-mustard">Strategic reframe:</span>
                            </div>
                            <p className="text-interview-text">"{reframe.strategic_reframe}"</p>
                          </div>

                          {/* CV Evidence */}
                          {reframe.cv_evidence_to_use && (
                            <div className="flex items-start gap-2 text-sm text-interview-muted">
                              <Lightbulb className="w-4 h-4 mt-0.5 shrink-0 text-interview-mustard" />
                              <span>Use from your CV: {reframe.cv_evidence_to_use}</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            variant="outline"
            onClick={() => {
              generateInterviewPDF({
                job_title: summary.job_title,
                company_name: summary.company_name,
                duration_seconds: summary.duration_seconds,
                hireability_score: summary.hireability_score,
                category_scores: summary.category_scores,
                strategic_reframes: summary.strategic_reframes,
                verdict_summary: summary.verdict_summary,
                conversion_likelihood: summary.conversion_likelihood,
                turns: turns,
              });
              toast.success("PDF downloaded!");
            }}
            className="gap-2 border-interview-border text-interview-muted hover:text-interview-text"
          >
            <Download className="w-4 h-4" />
            Download Transcript
          </Button>
          
          <Button
            variant="outline"
            onClick={() => navigate("/interview-simulator/setup")}
            className="gap-2 border-interview-border text-interview-muted hover:text-interview-text"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </Button>
          
          <Button
            onClick={() => navigate("/interview-simulator")}
            className="gap-2 bg-interview-mustard hover:bg-interview-mustard/90 text-interview-bg"
          >
            <Trophy className="w-4 h-4" />
            New Interview
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default InterviewSimulatorSummary;
