import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Award, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  pitchCount: number;
  avatar?: string;
}

export const Leaderboard = () => {
  const [weeklyLeaders, setWeeklyLeaders] = useState<LeaderboardEntry[]>([]);
  const [monthlyLeaders, setMonthlyLeaders] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboards();
  }, []);

  const fetchLeaderboards = async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Fetch weekly sessions
      const { data: weeklySessions } = await supabase
        .from("practice_sessions")
        .select("idea, score, created_at")
        .gte("created_at", weekAgo.toISOString())
        .order("score", { ascending: false });

      // Fetch monthly sessions
      const { data: monthlySessions } = await supabase
        .from("practice_sessions")
        .select("idea, score, created_at")
        .gte("created_at", monthAgo.toISOString())
        .order("score", { ascending: false });

      // Aggregate by project name (idea) as pseudo-user for demo
      const aggregateByUser = (sessions: any[]) => {
        const userMap = new Map<string, { totalScore: number; count: number }>();
        
        sessions?.forEach((session) => {
          const key = session.idea.substring(0, 20); // Use first 20 chars as user identifier
          const existing = userMap.get(key) || { totalScore: 0, count: 0 };
          userMap.set(key, {
            totalScore: existing.totalScore + (session.score || 0),
            count: existing.count + 1,
          });
        });

        return Array.from(userMap.entries())
          .map(([name, data]) => ({
            name,
            score: Math.round(data.totalScore / data.count),
            pitchCount: data.count,
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 10)
          .map((entry, index) => ({
            ...entry,
            rank: index + 1,
          }));
      };

      setWeeklyLeaders(aggregateByUser(weeklySessions || []));
      setMonthlyLeaders(aggregateByUser(monthlySessions || []));
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-medium text-muted-foreground">{rank}</span>;
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return "bg-yellow-500/10 border-yellow-500/30";
    if (rank === 2) return "bg-gray-400/10 border-gray-400/30";
    if (rank === 3) return "bg-amber-600/10 border-amber-600/30";
    return "bg-muted/50 border-border";
  };

  const LeaderboardList = ({ entries }: { entries: LeaderboardEntry[] }) => (
    <div className="space-y-2">
      {isLoading ? (
        Array(5).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))
      ) : entries.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No data yet. Be the first!</p>
        </div>
      ) : (
        entries.map((entry, index) => (
          <motion.div
            key={entry.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex items-center gap-3 p-3 rounded-lg border ${getRankBg(entry.rank)}`}
          >
            <div className="flex-shrink-0">
              {getRankIcon(entry.rank)}
            </div>
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {entry.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{entry.name}</p>
              <p className="text-xs text-muted-foreground">{entry.pitchCount} pitches</p>
            </div>
            <Badge variant="secondary" className="font-semibold">
              {(entry.score / 10).toFixed(1)}
            </Badge>
          </motion.div>
        ))
      )}
    </div>
  );

  return (
    <Card className="bg-card shadow-sm h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Leaderboard
        </CardTitle>
        <CardDescription>Top performers by average score</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="weekly" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="weekly">This Week</TabsTrigger>
            <TabsTrigger value="monthly">This Month</TabsTrigger>
          </TabsList>
          <TabsContent value="weekly">
            <LeaderboardList entries={weeklyLeaders} />
          </TabsContent>
          <TabsContent value="monthly">
            <LeaderboardList entries={monthlyLeaders} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
