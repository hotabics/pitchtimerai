import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, Trophy, Zap, Brain, Flame, Eye, Mic, Edit, FileText, Trash2, Plus, Target, Clock, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Leaderboard } from "@/components/profile/Leaderboard";
import { GoalSetting } from "@/components/profile/GoalSetting";

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
  avgEyeContact: number;
  avgFillerScore: number;
  avgPacingScore: number;
  avgStructureScore: number;
}

// Achievement definitions
const achievements = [
  { id: 'first_pitch', name: 'First Pitch', icon: '🏆', description: 'Complete your first pitch', unlockCondition: (stats: UserStats) => stats.totalPitches >= 1 },
  { id: 'speed_demon', name: 'Speed Demon', icon: '⚡', description: 'Pitch under 1 minute', unlockCondition: () => false }, // Would need duration data
  { id: 'no_notes', name: 'No Notes', icon: '🧠', description: 'Use Bullet Mode', unlockCondition: () => false },
  { id: 'perfect_10', name: 'Perfect 10', icon: '💯', description: 'Score 10/10 on a pitch', unlockCondition: (stats: UserStats) => stats.bestScore >= 100 },
  { id: 'streak_master', name: 'Streak Master', icon: '🔥', description: '7-day practice streak', unlockCondition: (stats: UserStats) => stats.currentStreak >= 7 },
  { id: 'prolific', name: 'Prolific', icon: '📚', description: 'Complete 10 pitches', unlockCondition: (stats: UserStats) => stats.totalPitches >= 10 },
];

const formatTypeName = (type: string) => {
  return type
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const Profile = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail] = useState("demo@pitchpal.app"); // Mock user for demo
  const [userName] = useState("Demo User");
  const [isPro] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

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
        avgEyeContact: 0,
        avgFillerScore: 0,
        avgPacingScore: 0,
        avgStructureScore: 0,
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
      avgEyeContact,
      avgFillerScore,
      avgPacingScore,
      avgStructureScore,
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500/20 text-green-400 border-green-500/30";
    if (score >= 50) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    return "bg-red-500/20 text-red-400 border-red-500/30";
  };

  // Calculate average WPM for goals
  const avgWpm = useMemo(() => {
    if (sessions.length === 0) return 0;
    const recentSessions = sessions.slice(0, 5);
    return Math.round(recentSessions.reduce((sum, s) => sum + (s.wpm || 0), 0) / recentSessions.length);
  }, [sessions]);

  return (
    <div className="min-h-screen bg-background">
      <Header showNavigation onLogoClick={() => navigate("/")} />
      <div className="container mx-auto px-4 pt-24 pb-8 max-w-7xl">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
          <p className="text-muted-foreground">Track your progress and manage your pitches</p>
        </div>

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
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl">
                      {userName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{userName}</h3>
                    <p className="text-sm text-muted-foreground">{userEmail}</p>
                    <Badge 
                      variant="outline" 
                      className={`mt-2 ${isPro ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-muted'}`}
                    >
                      {isPro ? '✨ Pro Member' : 'Free Plan'}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon" title="Account Settings">
                    <Settings className="h-5 w-5" />
                  </Button>
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

          {/* Leaderboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="lg:row-span-2"
          >
            <Leaderboard />
          </motion.div>

          {/* Goal Setting */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="md:col-span-2"
          >
            <GoalSetting 
              currentScore={stats.bestScore} 
              currentWpm={avgWpm} 
              totalPitches={stats.totalPitches} 
            />
          </motion.div>

          {/* Achievements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="md:col-span-2 lg:col-span-3"
          >
            <Card className="bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  Achievements
                </CardTitle>
                <CardDescription>Unlock badges by improving your skills</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  {achievements.map((achievement) => {
                    const isUnlocked = achievement.unlockCondition(stats);
                    return (
                      <div
                        key={achievement.id}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${
                          isUnlocked 
                            ? 'bg-primary/5 border-primary/20' 
                            : 'bg-muted/50 border-muted opacity-50 grayscale'
                        }`}
                        title={achievement.description}
                      >
                        <span className="text-2xl">{achievement.icon}</span>
                        <div>
                          <p className="font-medium text-sm">{achievement.name}</p>
                          <p className="text-xs text-muted-foreground">{achievement.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Project History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="md:col-span-2 lg:col-span-3"
          >
            <Card className="bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Your Pitch Library
                  </span>
                  <Button onClick={() => navigate('/')} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Pitch
                  </Button>
                </CardTitle>
                <CardDescription>All your practice sessions and recordings</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="text-6xl mb-4">📝</div>
                    <h3 className="text-lg font-medium mb-2">No pitches yet</h3>
                    <p className="text-muted-foreground mb-4">Start your speaking journey today!</p>
                    <Button onClick={() => navigate('/')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Pitch
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Project Name</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Track</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sessions.map((session) => (
                          <TableRow key={session.id}>
                            <TableCell className="font-medium max-w-[200px] truncate">
                              {session.idea}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(session.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {formatTypeName(session.track)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getScoreColor(session.score)}>
                                {(session.score / 10).toFixed(1)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="View Report"
                                  onClick={() => toast.info("View report coming soon")}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Delete"
                                  onClick={() => handleDelete(session.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
