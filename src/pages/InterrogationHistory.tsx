// Interrogation History Page - Past sessions with trends and improvement tracking

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Gavel, TrendingUp, TrendingDown, Minus, Calendar, Download, 
  ChevronDown, ChevronUp, Shield, Zap, Brain, ArrowLeft, 
  Target, BarChart3, History
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar
} from "recharts";
import { toast } from "sonner";
import { useUserStore } from "@/stores/userStore";
import { generateInterrogationPDF } from "@/services/interrogationPdfExport";
import { JURORS, JurorType } from "@/components/ai-coach/interrogation/JurorSelection";
import { ResponseRecord, VerdictData } from "@/components/ai-coach/interrogation/InterrogationVerdict";
import { InterrogationLeaderboard } from "@/components/profile/InterrogationLeaderboard";

interface InterrogationSession {
  id: string;
  juror_type: JurorType;
  overall_score: number;
  choreography_score: number;
  ammunition_score: number;
  cold_bloodedness_score: number;
  status: string;
  created_at: string;
  dossier_data: {
    projectName?: string;
    problemStatement?: string;
    solutionOverview?: string;
    targetAudience?: string;
  } | null;
  questions: any[];
  responses: ResponseRecord[];
  verdict_data: VerdictData;
}

const InterrogationHistory = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useUserStore();
  const [sessions, setSessions] = useState<InterrogationSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("interrogation_sessions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setSessions((data as unknown as InterrogationSession[]) || []);
    } catch (err) {
      console.error("Failed to fetch interrogation sessions:", err);
      toast.error("Failed to load session history");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        avgScore: 0,
        bestScore: 0,
        trend: 'neutral' as 'up' | 'down' | 'neutral',
        avgChoreography: 0,
        avgAmmunition: 0,
        avgColdBloodedness: 0,
        improvement: 0,
      };
    }

    const totalSessions = sessions.length;
    const avgScore = Math.round(sessions.reduce((sum, s) => sum + s.overall_score, 0) / sessions.length);
    const bestScore = Math.max(...sessions.map(s => s.overall_score));
    
    // Calculate category averages
    const avgChoreography = Math.round(sessions.reduce((sum, s) => sum + s.choreography_score, 0) / sessions.length);
    const avgAmmunition = Math.round(sessions.reduce((sum, s) => sum + s.ammunition_score, 0) / sessions.length);
    const avgColdBloodedness = Math.round(sessions.reduce((sum, s) => sum + s.cold_bloodedness_score, 0) / sessions.length);

    // Calculate trend (compare last 3 vs previous 3)
    let trend: 'up' | 'down' | 'neutral' = 'neutral';
    let improvement = 0;
    if (sessions.length >= 4) {
      const recent = sessions.slice(0, 3);
      const previous = sessions.slice(3, 6);
      const recentAvg = recent.reduce((sum, s) => sum + s.overall_score, 0) / recent.length;
      const previousAvg = previous.reduce((sum, s) => sum + s.overall_score, 0) / Math.min(previous.length, 3);
      improvement = Math.round(recentAvg - previousAvg);
      trend = improvement > 2 ? 'up' : improvement < -2 ? 'down' : 'neutral';
    }

    return {
      totalSessions,
      avgScore,
      bestScore,
      trend,
      avgChoreography,
      avgAmmunition,
      avgColdBloodedness,
      improvement,
    };
  }, [sessions]);

  // Chart data
  const chartData = useMemo(() => {
    return sessions
      .slice(0, 20)
      .reverse()
      .map((session, index) => ({
        name: `#${index + 1}`,
        date: new Date(session.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: session.overall_score,
        choreography: session.choreography_score,
        ammunition: session.ammunition_score,
        coldBloodedness: session.cold_bloodedness_score,
      }));
  }, [sessions]);

  // Category breakdown chart
  const categoryData = [
    { name: 'Choreography', value: stats.avgChoreography, fill: '#10B981' },
    { name: 'Ammunition', value: stats.avgAmmunition, fill: '#F59E0B' },
    { name: 'Cold-Blood', value: stats.avgColdBloodedness, fill: '#8B5CF6' },
  ];

  const handleExportPDF = (session: InterrogationSession) => {
    generateInterrogationPDF({
      id: session.id,
      juror_type: session.juror_type,
      overall_score: session.overall_score,
      choreography_score: session.choreography_score,
      ammunition_score: session.ammunition_score,
      cold_bloodedness_score: session.cold_bloodedness_score,
      status: session.status,
      created_at: session.created_at,
      dossier_data: session.dossier_data,
      responses: session.responses,
      verdict_data: session.verdict_data,
    });
    toast.success('PDF report downloaded!');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-500/10 border-green-500/30";
    if (score >= 60) return "bg-yellow-500/10 border-yellow-500/30";
    return "bg-red-500/10 border-red-500/30";
  };

  const TrendIcon = stats.trend === 'up' ? TrendingUp : stats.trend === 'down' ? TrendingDown : Minus;
  const trendColor = stats.trend === 'up' ? 'text-green-500' : stats.trend === 'down' ? 'text-red-500' : 'text-muted-foreground';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/profile')} className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Button>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Gavel className="h-8 w-8 text-yellow-500" />
              Interrogation History
            </h1>
            <p className="text-muted-foreground">Track your progress and improvement over time</p>
          </div>
          <Button onClick={() => navigate('/ai-coach')} variant="outline">
            <Gavel className="h-4 w-4 mr-2" />
            New Interrogation
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" />
                  Total Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-primary">{stats.totalSessions}</div>
                <p className="text-xs text-muted-foreground mt-1">Interrogations completed</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  Average Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-4xl font-bold ${getScoreColor(stats.avgScore)}`}>
                  {stats.avgScore}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">Across all sessions</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-500" />
                  Best Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-green-500">{stats.bestScore}%</div>
                <p className="text-xs text-muted-foreground mt-1">Personal record</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Card className="bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendIcon className={`h-4 w-4 ${trendColor}`} />
                  Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-4xl font-bold ${trendColor}`}>
                  {stats.improvement > 0 ? '+' : ''}{stats.improvement}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">vs previous sessions</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          {/* Score Trend Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card className="bg-card h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Score Progression
                </CardTitle>
                <CardDescription>Your improvement over time</CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.length > 1 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }} 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="score" 
                          stroke="hsl(var(--primary))" 
                          fill="url(#scoreGradient)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Complete more sessions to see trends
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Category Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Card className="bg-card h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-yellow-500" />
                  Category Averages
                </CardTitle>
                <CardDescription>Your strengths breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.totalSessions > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }} 
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No data yet
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Session History List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Session History
                </CardTitle>
                <CardDescription>All your past interrogation sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {Array(5).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-12">
                    <Gavel className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No sessions yet</h3>
                    <p className="text-muted-foreground mb-4">Start your first interrogation to track progress</p>
                    <Button onClick={() => navigate('/ai-coach')}>
                      <Gavel className="h-4 w-4 mr-2" />
                      Start Interrogation
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sessions.map((session) => {
                      const jurorConfig = JURORS.find(j => j.id === session.juror_type);
                      const isExpanded = expandedSession === session.id;
                      
                      return (
                        <motion.div
                          key={session.id}
                          layout
                          className={`rounded-lg border ${getScoreBg(session.overall_score)} overflow-hidden`}
                        >
                          <button
                            onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                            className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/10 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className={`text-2xl font-bold ${getScoreColor(session.overall_score)}`}>
                                {session.overall_score}%
                              </div>
                              <div>
                                <p className="font-medium">
                                  {session.dossier_data?.projectName || 'Interrogation Session'}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Badge variant="outline" className="text-xs">
                                    {jurorConfig?.title || session.juror_type}
                                  </Badge>
                                  <span>•</span>
                                  <span>{new Date(session.created_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant={session.status === 'The Mastermind' ? 'default' : 'secondary'}>
                                {session.status}
                              </Badge>
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </div>
                          </button>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: 'auto' }}
                                exit={{ height: 0 }}
                                className="overflow-hidden border-t border-border/50"
                              >
                                <div className="p-4 space-y-4">
                                  {/* Category Scores */}
                                  <div className="grid grid-cols-3 gap-4">
                                    <div className="flex items-center gap-2">
                                      <Shield className="h-4 w-4 text-green-500" />
                                      <div>
                                        <p className="text-xs text-muted-foreground">Choreography</p>
                                        <p className={`font-semibold ${getScoreColor(session.choreography_score)}`}>
                                          {session.choreography_score}%
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Zap className="h-4 w-4 text-yellow-500" />
                                      <div>
                                        <p className="text-xs text-muted-foreground">Ammunition</p>
                                        <p className={`font-semibold ${getScoreColor(session.ammunition_score)}`}>
                                          {session.ammunition_score}%
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Brain className="h-4 w-4 text-purple-500" />
                                      <div>
                                        <p className="text-xs text-muted-foreground">Cold-Blood</p>
                                        <p className={`font-semibold ${getScoreColor(session.cold_bloodedness_score)}`}>
                                          {session.cold_bloodedness_score}%
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Q&A Preview */}
                                  {session.responses && session.responses.length > 0 && (
                                    <div className="text-sm">
                                      <p className="text-muted-foreground mb-2">
                                        {session.responses.length} questions answered
                                      </p>
                                    </div>
                                  )}

                                  {/* Actions */}
                                  <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => handleExportPDF(session)}>
                                      <Download className="h-3 w-3 mr-2" />
                                      Export PDF
                                    </Button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Leaderboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <InterrogationLeaderboard />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default InterrogationHistory;
