import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, Trophy, Flame, Mic, Video, Plus, Target, TrendingUp, LogOut, Download, Sparkles, FileText, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { useUserStore } from "@/stores/userStore";
import { Leaderboard } from "@/components/profile/Leaderboard";
import { GoalSetting } from "@/components/profile/GoalSetting";
import { PitchChallenges } from "@/components/profile/PitchChallenges";
import { SocialShare } from "@/components/profile/SocialShare";
import { ProgressCharts } from "@/components/profile/ProgressCharts";
import { RecordingCard } from "@/components/profile/RecordingCard";
import { MiniPlayerModal } from "@/components/profile/MiniPlayerModal";
import { PerformanceStats } from "@/components/profile/PerformanceStats";
import { RecordingFilters, FilterState } from "@/components/profile/RecordingFilters";
import { MyContentSection } from "@/components/profile/MyContentSection";
import { StreakCalendar } from "@/components/profile/StreakCalendar";
import { WeeklyAchievements } from "@/components/profile/WeeklyAchievements";
import { InterviewHistory } from "@/components/profile/InterviewHistory";
import { generateSessionPDF, generateSummaryPDF } from "@/services/pdfExport";

interface PracticeSession {
  id: string;
  idea: string;
  track: string;
  score: number;
  wpm: number;
  filler_count: number;
  created_at: string;
  entry_mode: string;
  tone: string | null;
  transcription?: string | null;
  feedback?: string[] | null;
  missed_sections?: string[] | null;
  video_url?: string | null;
  thumbnail_url?: string | null;
}

interface SkillData {
  subject: string;
  value: number;
  fullMark: number;
}

interface UserStats {
  totalPitches: number;
  bestScore: number;
  currentStreak: number;
  longestStreak: number;
  avgEyeContact: number;
  avgFillerScore: number;
  avgPacingScore: number;
  avgStructureScore: number;
  weeklyPitches: number;
  weeklyMinutes: number;
}

const Profile = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, userPlan, logout } = useUserStore();
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecording, setSelectedRecording] = useState<PracticeSession | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    track: null,
    minScore: 0,
    maxScore: 100,
    sortBy: 'date-desc',
  });

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/auth?returnTo=/profile');
    }
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchSessions();
    }
  }, [isLoggedIn]);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("practice_sessions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setSessions(data || []);
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
      toast.error("Failed to load session history");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate user stats
  const stats: UserStats = useMemo(() => {
    if (sessions.length === 0) {
      return {
        totalPitches: 0,
        bestScore: 0,
        currentStreak: 0,
        longestStreak: 0,
        avgEyeContact: 0,
        avgFillerScore: 0,
        avgPacingScore: 0,
        avgStructureScore: 0,
        weeklyPitches: 0,
        weeklyMinutes: 0,
      };
    }

    const totalPitches = sessions.length;
    const bestScore = Math.max(...sessions.map(s => s.score || 0));
    
    // Calculate streak (simplified - consecutive days)
    const sortedDates = [...new Set(sessions.map(s => 
      new Date(s.created_at).toISOString().split('T')[0]
    ))].sort().reverse();
    
    let currentStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    for (let i = 0; i < sortedDates.length; i++) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      if (sortedDates[i] === expectedDate.toISOString().split('T')[0]) {
        currentStreak++;
      } else if (i === 0 && sortedDates[i] !== today) {
        // Allow starting from yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (sortedDates[i] === yesterday.toISOString().split('T')[0]) {
          currentStreak = 1;
        } else break;
      } else break;
    }

    // Calculate longest streak
    const sortedDatesAsc = [...sortedDates].sort();
    let longestStreak = 0;
    let tempStreak = 1;
    for (let i = 1; i < sortedDatesAsc.length; i++) {
      const prevDate = new Date(sortedDatesAsc[i - 1]);
      const currDate = new Date(sortedDatesAsc[i]);
      const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

    // Calculate weekly stats
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);
    
    const thisWeekSessions = sessions.filter(s => new Date(s.created_at) >= startOfWeek);
    const weeklyPitches = thisWeekSessions.length;
    // Estimate minutes based on WPM and average transcript length (~150 words per minute for 1 min)
    const weeklyMinutes = Math.round(thisWeekSessions.reduce((sum, s) => {
      // Rough estimate: assume 2-3 min average per session
      return sum + 2.5;
    }, 0));

    // Calculate skill averages from last 5 sessions
    const recentSessions = sessions.slice(0, 5);
    const avgScore = recentSessions.reduce((sum, s) => sum + (s.score || 0), 0) / recentSessions.length;
    const avgWpm = recentSessions.reduce((sum, s) => sum + (s.wpm || 0), 0) / recentSessions.length;
    const avgFillers = recentSessions.reduce((sum, s) => sum + (s.filler_count || 0), 0) / recentSessions.length;

    // Normalize scores for radar chart (0-100)
    const avgEyeContact = Math.min(100, avgScore * 1.2); // Estimate from overall score
    const avgFillerScore = Math.max(0, 100 - avgFillers * 10); // Fewer fillers = higher score
    const avgPacingScore = avgWpm >= 120 && avgWpm <= 160 ? 100 : Math.max(0, 100 - Math.abs(140 - avgWpm) * 2);
    const avgStructureScore = Math.min(100, avgScore * 1.1);

    return {
      totalPitches,
      bestScore,
      currentStreak,
      longestStreak,
      avgEyeContact,
      avgFillerScore,
      avgPacingScore,
      avgStructureScore,
      weeklyPitches,
      weeklyMinutes,
    };
  }, [sessions]);

  // Radar chart data
  const skillData: SkillData[] = [
    { subject: 'Confidence', value: stats.avgEyeContact, fullMark: 100 },
    { subject: 'Clarity', value: stats.avgFillerScore, fullMark: 100 },
    { subject: 'Pacing', value: stats.avgPacingScore, fullMark: 100 },
    { subject: 'Structure', value: stats.avgStructureScore, fullMark: 100 },
  ];

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this session?")) return;
    
    try {
      const { error } = await supabase
        .from("practice_sessions")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      setSessions(prev => prev.filter(s => s.id !== id));
      toast.success("Session deleted");
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete session");
    }
  };

  const handlePlayRecording = (session: PracticeSession) => {
    setSelectedRecording(session);
    setIsPlayerOpen(true);
  };

  const handleAuditRecording = (sessionId: string) => {
    // Navigate to AI Coach with this session pre-loaded
    navigate(`/ai-coach?session=${sessionId}`);
  };

  const handleExportPDF = (session: PracticeSession) => {
    generateSessionPDF({
      id: session.id,
      idea: session.idea,
      track: session.track,
      score: session.score,
      wpm: session.wpm,
      filler_count: session.filler_count,
      tone: session.tone,
      created_at: session.created_at,
      transcription: session.transcription,
      feedback: session.feedback,
      missed_sections: session.missed_sections,
    });
    toast.success('PDF report downloaded!');
  };

  const handleExportAllPDF = () => {
    generateSummaryPDF(sessions);
    toast.success('Summary report downloaded!');
  };

  // Get unique tracks for filter options
  const availableTracks = useMemo(() => {
    return [...new Set(sessions.map(s => s.track))];
  }, [sessions]);

  // Filter and sort sessions
  const filteredSessions = useMemo(() => {
    let result = [...sessions];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(s => 
        s.idea.toLowerCase().includes(searchLower) ||
        s.track.toLowerCase().includes(searchLower)
      );
    }

    // Track filter
    if (filters.track) {
      result = result.filter(s => s.track === filters.track);
    }

    // Score filter
    result = result.filter(s => 
      s.score >= filters.minScore && s.score <= filters.maxScore
    );

    // Sorting
    result.sort((a, b) => {
      switch (filters.sortBy) {
        case 'date-desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'date-asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'score-desc':
          return b.score - a.score;
        case 'score-asc':
          return a.score - b.score;
        case 'wpm-desc':
          return b.wpm - a.wpm;
        case 'wpm-asc':
          return a.wpm - b.wpm;
        default:
          return 0;
      }
    });

    return result;
  }, [sessions, filters]);

  // Calculate average WPM for goals
  const avgWpm = useMemo(() => {
    if (sessions.length === 0) return 0;
    const recentSessions = sessions.slice(0, 5);
    return Math.round(recentSessions.reduce((sum, s) => sum + (s.wpm || 0), 0) / recentSessions.length);
  }, [sessions]);

  // Calculate consecutive weeks with completed goals (simplified - weeks with at least one session)
  const calculateConsecutiveWeeks = () => {
    if (sessions.length === 0) return 0;
    
    const now = new Date();
    let consecutiveWeeks = 0;
    
    for (let weekOffset = 0; weekOffset < 12; weekOffset++) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() - (weekOffset * 7));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      
      const hasSessionThisWeek = sessions.some(s => {
        const sessionDate = new Date(s.created_at);
        return sessionDate >= weekStart && sessionDate < weekEnd;
      });
      
      if (hasSessionThisWeek) {
        consecutiveWeeks++;
      } else {
        break;
      }
    }
    
    return consecutiveWeeks;
  };

  // Calculate total weeks with completed goals
  const calculateTotalWeeksCompleted = () => {
    if (sessions.length === 0) return 0;
    
    const weekSet = new Set<string>();
    sessions.forEach(s => {
      const date = new Date(s.created_at);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      weekSet.add(weekStart.toISOString().split('T')[0]);
    });
    
    return weekSet.size;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
          <p className="text-muted-foreground">Track your progress and manage your pitches</p>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="h-auto py-4 px-4 flex items-center justify-between group hover:border-primary/50 hover:bg-primary/5"
              onClick={() => navigate('/')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Generate Pitch</div>
                  <div className="text-xs text-muted-foreground">Create a new pitch script</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 px-4 flex items-center justify-between group hover:border-primary/50 hover:bg-primary/5"
              onClick={() => navigate('/ai-coach')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                </div>
                <div className="text-left">
                  <div className="font-medium">AI Coach</div>
                  <div className="text-xs text-muted-foreground">Practice with feedback</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 px-4 flex items-center justify-between group hover:border-interview-mustard/50 hover:bg-interview-mustard/5"
              onClick={() => navigate('/interview-simulator')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-interview-mustard/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-interview-mustard" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Interview Sim</div>
                  <div className="text-xs text-muted-foreground">Practice job interviews</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-interview-mustard transition-colors" />
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 px-4 flex items-center justify-between group hover:border-primary/50 hover:bg-primary/5"
              onClick={() => navigate('/settings')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Settings className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Settings</div>
                  <div className="text-xs text-muted-foreground">Account preferences</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Button>
          </div>
        </motion.div>

        {/* Bento Grid Layout */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* User Identity Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="h-full bg-card shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user?.avatar || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl">
                      {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{user?.name || 'User'}</h3>
                    <p className="text-sm text-muted-foreground">{user?.email || ''}</p>
                    <Badge 
                      variant="outline" 
                      className={`mt-2 ${userPlan !== 'free' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-muted'}`}
                    >
                      {userPlan === 'pro' ? '✨ Pro Member' : userPlan === 'pass_48h' ? '⚡ 48h Pass' : 'Free Plan'}
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button variant="ghost" size="icon" title="Account Settings">
                      <Settings className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Sign Out" onClick={logout}>
                      <LogOut className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Skill Radar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="h-full bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Skill Radar
                </CardTitle>
                <CardDescription>Your speaking strengths based on last 5 sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.totalPitches === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center">
                    <div className="text-4xl mb-3 opacity-30">📊</div>
                    <p className="text-muted-foreground mb-3">Complete your first pitch to see stats</p>
                    <Button onClick={() => navigate('/')} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Pitch
                    </Button>
                  </div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillData}>
                        <PolarGrid stroke="hsl(var(--muted-foreground) / 0.2)" />
                        <PolarAngleAxis 
                          dataKey="subject" 
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        />
                        <PolarRadiusAxis 
                          angle={30} 
                          domain={[0, 100]} 
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                        />
                        <Radar
                          name="Skills"
                          dataKey="value"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.3}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
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
            <Card className="bg-card shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Mic className="h-4 w-4 text-primary" />
                  Total Pitches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-primary">{stats.totalPitches}</div>
                <p className="text-xs text-muted-foreground mt-1">Practice sessions completed</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Card className="bg-card shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Best Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">
                  {stats.bestScore > 0 ? (stats.bestScore / 10).toFixed(1) : '--'}
                  <span className="text-lg text-muted-foreground">/10</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Highest pitch score</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-card shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  Training Streak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold flex items-center gap-2">
                  {stats.currentStreak}
                  {stats.currentStreak > 0 && <span className="text-2xl">🔥</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Consecutive days</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Streak Calendar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="md:col-span-2 lg:col-span-3"
          >
            <StreakCalendar 
              sessions={sessions.map(s => ({ created_at: s.created_at, score: s.score }))}
              currentStreak={stats.currentStreak}
              longestStreak={stats.longestStreak}
            />
          </motion.div>

          {/* Leaderboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:row-span-2"
          >
            <Leaderboard />
          </motion.div>

          {/* Goal Setting */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="md:col-span-2"
          >
            <GoalSetting 
              currentScore={stats.bestScore} 
              currentWpm={avgWpm} 
              totalPitches={stats.totalPitches}
              weeklyPitches={stats.weeklyPitches}
              weeklyMinutes={stats.weeklyMinutes}
            />
          </motion.div>

          {/* Progress Charts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="md:col-span-2 lg:col-span-3"
          >
            <ProgressCharts sessions={sessions} />
          </motion.div>

          {/* Pitch Challenges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="md:col-span-2 lg:col-span-3"
          >
            <PitchChallenges />
          </motion.div>

          {/* Weekly Achievements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="md:col-span-2 lg:col-span-3"
          >
            <WeeklyAchievements 
              consecutiveWeeks={calculateConsecutiveWeeks()}
              totalWeeksCompleted={calculateTotalWeeksCompleted()}
              currentStreak={stats.currentStreak}
              longestStreak={stats.longestStreak}
            />
          </motion.div>

          {/* My Content Section - Saved Pitches & AI Coach Sessions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="md:col-span-2 lg:col-span-3"
          >
            <MyContentSection />
          </motion.div>

          {/* Interview History Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.72 }}
            className="md:col-span-2 lg:col-span-3"
          >
            <InterviewHistory />
          </motion.div>

          {/* Performance Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75 }}
            className="md:col-span-2 lg:col-span-3"
          >
            <PerformanceStats sessions={sessions} />
          </motion.div>

          {/* My Recordings - Video Library Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75 }}
            className="md:col-span-2 lg:col-span-3"
          >
            <Card className="bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Video className="h-5 w-5 text-primary" />
                    My Recordings
                  </span>
                  <div className="flex items-center gap-2">
                    {sessions.length > 0 && (
                      <Button variant="outline" size="sm" onClick={handleExportAllPDF}>
                        <Download className="h-4 w-4 mr-2" />
                        Export All
                      </Button>
                    )}
                    <Button onClick={() => navigate('/')} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      New Pitch
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>All your practice sessions and recordings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                {sessions.length > 0 && (
                  <RecordingFilters
                    filters={filters}
                    onFilterChange={setFilters}
                    availableTracks={availableTracks}
                    resultCount={filteredSessions.length}
                    totalCount={sessions.length}
                  />
                )}

                {isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="space-y-3">
                        <Skeleton className="aspect-video w-full rounded-lg" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="text-6xl mb-4">🎬</div>
                    <h3 className="text-lg font-medium mb-2">No recordings yet</h3>
                    <p className="text-muted-foreground mb-4">Start your speaking journey today!</p>
                    <Button onClick={() => navigate('/')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Pitch
                    </Button>
                  </div>
                ) : filteredSessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="text-4xl mb-4">🔍</div>
                    <h3 className="text-lg font-medium mb-2">No matching recordings</h3>
                    <p className="text-muted-foreground mb-4">Try adjusting your filters</p>
                    <Button variant="outline" onClick={() => setFilters({
                      search: '',
                      track: null,
                      minScore: 0,
                      maxScore: 100,
                      sortBy: 'date-desc',
                    })}>
                      Clear Filters
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredSessions.map((session) => (
                      <RecordingCard
                        key={session.id}
                        id={session.id}
                        title={session.idea}
                        date={session.created_at}
                        score={session.score}
                        track={session.track}
                        tone={session.tone}
                        wpm={session.wpm}
                        filler_count={session.filler_count}
                        videoUrl={session.video_url}
                        thumbnailUrl={session.thumbnail_url}
                        onPlay={() => handlePlayRecording(session)}
                        onAudit={() => handleAuditRecording(session.id)}
                        onDelete={() => handleDelete(session.id)}
                        onExportPDF={() => handleExportPDF(session)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Mini Player Modal */}
      <MiniPlayerModal
        isOpen={isPlayerOpen}
        onClose={() => {
          setIsPlayerOpen(false);
          setSelectedRecording(null);
        }}
        recording={selectedRecording ? {
          id: selectedRecording.id,
          title: selectedRecording.idea,
          score: selectedRecording.score,
          wpm: selectedRecording.wpm,
          filler_count: selectedRecording.filler_count,
          tone: selectedRecording.tone,
          track: selectedRecording.track,
          date: selectedRecording.created_at,
          videoUrl: selectedRecording.video_url,
          thumbnailUrl: selectedRecording.thumbnail_url,
        } : null}
      />
    </div>
  );
};

export default Profile;
