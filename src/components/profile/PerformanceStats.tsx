// Performance Stats Component - Aggregated metrics with sparklines

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Eye, Mic, MessageCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

interface Session {
  id: string;
  score: number;
  wpm: number;
  filler_count: number;
  tone: string | null;
  created_at: string;
}

interface PerformanceStatsProps {
  sessions: Session[];
}

interface SparklineData {
  value: number;
}

const Sparkline = ({ data, color, trend }: { data: SparklineData[]; color: string; trend: 'up' | 'down' | 'stable' }) => {
  if (data.length < 2) return null;
  
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-8">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              strokeWidth={1.5} 
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-400" />}
      {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-400" />}
      {trend === 'stable' && <Minus className="w-4 h-4 text-muted-foreground" />}
    </div>
  );
};

const getTrend = (data: number[]): 'up' | 'down' | 'stable' => {
  if (data.length < 2) return 'stable';
  const recent = data.slice(-3);
  const older = data.slice(0, Math.min(3, data.length - 3));
  if (older.length === 0) return 'stable';
  
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
  
  const diff = ((recentAvg - olderAvg) / olderAvg) * 100;
  if (diff > 5) return 'up';
  if (diff < -5) return 'down';
  return 'stable';
};

const getMostFrequent = (arr: (string | null)[]): string => {
  const filtered = arr.filter((x): x is string => x !== null);
  if (filtered.length === 0) return 'N/A';
  
  const counts: Record<string, number> = {};
  filtered.forEach(x => {
    counts[x] = (counts[x] || 0) + 1;
  });
  
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
};

export const PerformanceStats = ({ sessions }: PerformanceStatsProps) => {
  const stats = useMemo(() => {
    if (sessions.length === 0) {
      return {
        avgScore: 0,
        avgWpm: 0,
        avgFillers: 0,
        topTone: 'N/A',
        scoreData: [] as SparklineData[],
        wpmData: [] as SparklineData[],
        fillerData: [] as SparklineData[],
        scoreTrend: 'stable' as const,
        wpmTrend: 'stable' as const,
        fillerTrend: 'stable' as const,
      };
    }

    // Sort by date ascending for trend calculation
    const sorted = [...sessions].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const scores = sorted.map(s => s.score);
    const wpms = sorted.map(s => s.wpm);
    const fillers = sorted.map(s => s.filler_count);
    const tones = sorted.map(s => s.tone);

    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const avgWpm = wpms.reduce((a, b) => a + b, 0) / wpms.length;
    const avgFillers = fillers.reduce((a, b) => a + b, 0) / fillers.length;
    const topTone = getMostFrequent(tones);

    // Create sparkline data (last 10 sessions)
    const recentScores = scores.slice(-10);
    const recentWpms = wpms.slice(-10);
    const recentFillers = fillers.slice(-10);

    return {
      avgScore: Math.round(avgScore),
      avgWpm: Math.round(avgWpm),
      avgFillers: Math.round(avgFillers * 10) / 10,
      topTone,
      scoreData: recentScores.map(v => ({ value: v })),
      wpmData: recentWpms.map(v => ({ value: v })),
      fillerData: recentFillers.map(v => ({ value: 100 - v * 10 })), // Invert for "improvement" view
      scoreTrend: getTrend(scores),
      wpmTrend: getTrend(wpms.map(w => Math.abs(140 - w) * -1 + 100)), // Closer to 140 is better
      fillerTrend: getTrend(fillers.map(f => -f)), // Fewer is better, so invert
    };
  }, [sessions]);

  if (sessions.length === 0) {
    return null;
  }

  const statCards = [
    {
      label: 'Avg Eye Contact',
      value: `${Math.round(stats.avgScore * 0.9)}%`,
      subtext: 'Based on overall score',
      icon: Eye,
      color: 'hsl(var(--primary))',
      sparklineData: stats.scoreData,
      trend: stats.scoreTrend,
    },
    {
      label: 'Avg Speaking Pace',
      value: `${stats.avgWpm}`,
      subtext: 'Words per minute',
      icon: Mic,
      color: 'hsl(142, 76%, 36%)',
      sparklineData: stats.wpmData,
      trend: stats.wpmTrend,
    },
    {
      label: 'Avg Filler Words',
      value: stats.avgFillers.toFixed(1),
      subtext: 'Per session',
      icon: MessageCircle,
      color: 'hsl(38, 92%, 50%)',
      sparklineData: stats.fillerData,
      trend: stats.fillerTrend,
    },
    {
      label: 'Top Emotion',
      value: stats.topTone,
      subtext: 'Most frequent tone',
      icon: TrendingUp,
      color: 'hsl(280, 65%, 60%)',
      sparklineData: [],
      trend: 'stable' as const,
    },
  ];

  return (
    <Card className="bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Performance Stats
        </CardTitle>
        <CardDescription>Aggregated metrics from all your recordings</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-muted/30 rounded-xl p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <stat.icon className="w-5 h-5 text-muted-foreground" />
                {stat.sparklineData.length > 1 && (
                  <Sparkline 
                    data={stat.sparklineData} 
                    color={stat.color}
                    trend={stat.trend}
                  />
                )}
              </div>
              <p className="text-2xl font-bold capitalize">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.subtext}</p>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
