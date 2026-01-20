// Interview Simulator Leaderboard - Top hireability scores across users

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Award, Briefcase, TrendingUp, Users } from "lucide-react";
import { motion } from "framer-motion";

interface LeaderboardEntry {
  rank: number;
  displayName: string;
  initials: string;
  hireabilityScore: number;
  jobTitle: string;
  companyName?: string;
  interviewCount: number;
}

export const InterviewLeaderboard = () => {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalInterviews, setTotalInterviews] = useState(0);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      // Fetch completed interview simulations with hireability scores
      const { data: simulations, error } = await supabase
        .from("interview_simulations")
        .select("user_id, hireability_score, job_title, company_name, created_at")
        .not("hireability_score", "is", null)
        .order("hireability_score", { ascending: false });

      if (error) throw error;

      setTotalInterviews(simulations?.length || 0);

      // Aggregate by user - get best score per user
      const userBests = new Map<string, {
        bestScore: number;
        jobTitle: string;
        companyName?: string;
        count: number;
      }>();

      simulations?.forEach((sim) => {
        if (!sim.user_id) return;
        
        const existing = userBests.get(sim.user_id);
        if (!existing || sim.hireability_score > existing.bestScore) {
          userBests.set(sim.user_id, {
            bestScore: sim.hireability_score,
            jobTitle: sim.job_title,
            companyName: sim.company_name || undefined,
            count: (existing?.count || 0) + 1,
          });
        } else {
          userBests.set(sim.user_id, {
            ...existing,
            count: existing.count + 1,
          });
        }
      });

      // Fetch user profiles for display names (privacy-safe)
      const userIds = Array.from(userBests.keys());
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, email")
        .in("id", userIds);

      // Create leaderboard entries
      const entries: LeaderboardEntry[] = Array.from(userBests.entries())
        .map(([userId, data]) => {
          const profile = profiles?.find(p => p.id === userId);
          const displayName = profile?.name || (profile?.email ? profile.email.split('@')[0] : 'Anonymous');
          const initials = displayName.substring(0, 2).toUpperCase();
          
          return {
            displayName: displayName.length > 12 ? displayName.substring(0, 12) + '...' : displayName,
            initials,
            hireabilityScore: data.bestScore,
            jobTitle: data.jobTitle,
            companyName: data.companyName,
            interviewCount: data.count,
            rank: 0,
          };
        })
        .sort((a, b) => b.hireabilityScore - a.hireabilityScore)
        .slice(0, 10)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

      setLeaders(entries);
    } catch (err) {
      console.error("Failed to fetch interview leaderboard:", err);
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <Card className="bg-interview-card border-interview-border shadow-sm h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-interview-text">
          <TrendingUp className="h-5 w-5 text-interview-mustard" />
          Interview Leaderboard
        </CardTitle>
        <CardDescription className="text-interview-muted">
          Top hireability scores • {totalInterviews} total interviews
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full bg-interview-border/50" />
            ))
          ) : leaders.length === 0 ? (
            <div className="text-center py-8 text-interview-muted">
              <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No interviews completed yet. Be the first!</p>
            </div>
          ) : (
            leaders.map((entry, index) => (
              <motion.div
                key={`${entry.displayName}-${entry.rank}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-3 p-3 rounded-lg border ${getRankBg(entry.rank)}`}
              >
                <div className="flex-shrink-0">
                  {getRankIcon(entry.rank)}
                </div>
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-interview-mustard/20 text-interview-mustard text-sm">
                    {entry.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate text-interview-text">{entry.displayName}</p>
                  <div className="flex items-center gap-2 text-xs text-interview-muted">
                    <Briefcase className="h-3 w-3" />
                    <span className="truncate">{entry.jobTitle}</span>
                    {entry.companyName && (
                      <span className="hidden sm:inline">@ {entry.companyName}</span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <Badge variant="secondary" className={`font-semibold ${getScoreColor(entry.hireabilityScore)}`}>
                    {entry.hireabilityScore}%
                  </Badge>
                  <div className="flex items-center justify-end gap-1 text-xs text-interview-muted mt-0.5">
                    <Users className="h-3 w-3" />
                    {entry.interviewCount}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
