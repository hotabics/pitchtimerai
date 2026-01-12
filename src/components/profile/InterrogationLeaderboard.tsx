// Interrogation Leaderboard - Rankings by juror type

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Award, Gavel, Target, Briefcase, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";
import { JurorType, JURORS } from "@/components/ai-coach/interrogation/JurorSelection";

interface LeaderboardEntry {
  rank: number;
  projectName: string;
  score: number;
  sessionsCount: number;
  jurorType: JurorType;
}

const JUROR_ICONS: Record<JurorType, React.ElementType> = {
  'mentor': GraduationCap,
  'reviewer': Briefcase,
  'shark': Target,
};

export const InterrogationLeaderboard = () => {
  const [allTimeLeaders, setAllTimeLeaders] = useState<LeaderboardEntry[]>([]);
  const [byJurorLeaders, setByJurorLeaders] = useState<Record<JurorType, LeaderboardEntry[]>>({
    'mentor': [],
    'reviewer': [],
    'shark': [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeJuror, setActiveJuror] = useState<JurorType | 'all'>('all');

  useEffect(() => {
    fetchLeaderboards();
  }, []);

  const fetchLeaderboards = async () => {
    setIsLoading(true);
    try {
      // Fetch all interrogation sessions
      const { data: sessions, error } = await supabase
        .from("interrogation_sessions")
        .select("*")
        .order("overall_score", { ascending: false });

      if (error) throw error;

      // Aggregate by project name for all-time
      const projectMap = new Map<string, { totalScore: number; count: number; bestScore: number; jurorType: JurorType }>();
      
      sessions?.forEach((session: any) => {
        const projectName = session.dossier_data?.projectName || 'Unknown Project';
        const existing = projectMap.get(projectName);
        
        if (existing) {
          projectMap.set(projectName, {
            totalScore: existing.totalScore + session.overall_score,
            count: existing.count + 1,
            bestScore: Math.max(existing.bestScore, session.overall_score),
            jurorType: session.juror_type,
          });
        } else {
          projectMap.set(projectName, {
            totalScore: session.overall_score,
            count: 1,
            bestScore: session.overall_score,
            jurorType: session.juror_type,
          });
        }
      });

      // Create all-time leaderboard (by best score)
      const allTime = Array.from(projectMap.entries())
        .map(([name, data]) => ({
          projectName: name,
          score: data.bestScore,
          sessionsCount: data.count,
          jurorType: data.jurorType,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

      setAllTimeLeaders(allTime);

      // Aggregate by juror type
      const jurorMaps: Record<JurorType, Map<string, { score: number; count: number }>> = {
        'mentor': new Map(),
        'reviewer': new Map(),
        'shark': new Map(),
      };

      sessions?.forEach((session: any) => {
        const jurorType = session.juror_type as JurorType;
        const projectName = session.dossier_data?.projectName || 'Unknown Project';
        const map = jurorMaps[jurorType];
        
        if (map) {
          const existing = map.get(projectName);
          if (existing) {
            map.set(projectName, {
              score: Math.max(existing.score, session.overall_score),
              count: existing.count + 1,
            });
          } else {
            map.set(projectName, {
              score: session.overall_score,
              count: 1,
            });
          }
        }
      });

      // Convert to leaderboard entries
      const byJuror: Record<JurorType, LeaderboardEntry[]> = {
        'mentor': [],
        'reviewer': [],
        'shark': [],
      };

      (Object.keys(jurorMaps) as JurorType[]).forEach((jurorType) => {
        byJuror[jurorType] = Array.from(jurorMaps[jurorType].entries())
          .map(([name, data]) => ({
            projectName: name,
            score: data.score,
            sessionsCount: data.count,
            jurorType,
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 5)
          .map((entry, index) => ({ ...entry, rank: index + 1 }));
      });

      setByJurorLeaders(byJuror);
    } catch (err) {
      console.error("Failed to fetch interrogation leaderboard:", err);
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

  const LeaderboardList = ({ entries }: { entries: LeaderboardEntry[] }) => (
    <div className="space-y-2">
      {isLoading ? (
        Array(5).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))
      ) : entries.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Gavel className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No interrogations yet. Be the first!</p>
        </div>
      ) : (
        entries.map((entry, index) => {
          const JurorIcon = JUROR_ICONS[entry.jurorType] || Target;
          return (
            <motion.div
              key={`${entry.projectName}-${entry.jurorType}`}
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
                  {entry.projectName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{entry.projectName}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <JurorIcon className="h-3 w-3" />
                  <span>{entry.sessionsCount} sessions</span>
                </div>
              </div>
              <Badge variant="secondary" className={`font-semibold ${getScoreColor(entry.score)}`}>
                {entry.score}%
              </Badge>
            </motion.div>
          );
        })
      )}
    </div>
  );

  return (
    <Card className="bg-card shadow-sm h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gavel className="h-5 w-5 text-yellow-500" />
          Interrogation Leaderboard
        </CardTitle>
        <CardDescription>Top performers in the interrogation room</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full" onValueChange={(v) => setActiveJuror(v as JurorType | 'all')}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="all">All Time</TabsTrigger>
            {JURORS.map((juror) => (
              <TabsTrigger key={juror.id} value={juror.id} className="text-xs px-2">
                {juror.title.split(' ')[0]}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="all">
            <LeaderboardList entries={allTimeLeaders} />
          </TabsContent>
          {JURORS.map((juror) => (
            <TabsContent key={juror.id} value={juror.id}>
              <LeaderboardList entries={byJurorLeaders[juror.id]} />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};
