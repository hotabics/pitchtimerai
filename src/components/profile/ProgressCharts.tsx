import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, BarChart, Bar, Legend } from "recharts";
import { TrendingUp, Zap, MessageSquareOff, Activity } from "lucide-react";
import { format } from "date-fns";

interface PracticeSession {
  id: string;
  score: number;
  wpm: number;
  filler_count: number;
  created_at: string;
}

interface ProgressChartsProps {
  sessions: PracticeSession[];
}

export const ProgressCharts = ({ sessions }: ProgressChartsProps) => {
  const chartData = useMemo(() => {
    // Sort by date ascending for charts
    const sorted = [...sessions].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    return sorted.map((s, idx) => ({
      name: format(new Date(s.created_at), "MMM d"),
      date: s.created_at,
      score: s.score / 10, // Convert to 0-10 scale
      wpm: s.wpm,
      fillers: s.filler_count,
      session: idx + 1,
    }));
  }, [sessions]);

  // Calculate trends
  const trends = useMemo(() => {
    if (chartData.length < 2) return { score: 0, wpm: 0, fillers: 0 };
    
    const recent = chartData.slice(-5);
    const older = chartData.slice(0, Math.min(5, chartData.length - 5));
    
    if (older.length === 0) return { score: 0, wpm: 0, fillers: 0 };

    const recentAvg = (arr: typeof chartData, key: 'score' | 'wpm' | 'fillers') => 
      arr.reduce((sum, d) => sum + d[key], 0) / arr.length;

    return {
      score: recentAvg(recent, 'score') - recentAvg(older, 'score'),
      wpm: recentAvg(recent, 'wpm') - recentAvg(older, 'wpm'),
      fillers: recentAvg(older, 'fillers') - recentAvg(recent, 'fillers'), // Inverted - fewer is better
    };
  }, [chartData]);

  const getTrendColor = (value: number) => {
    if (value > 0) return "text-green-500";
    if (value < 0) return "text-red-500";
    return "text-muted-foreground";
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return "↑";
    if (value < 0) return "↓";
    return "→";
  };

  if (sessions.length < 2) {
    return (
      <Card className="bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Progress Analytics
          </CardTitle>
          <CardDescription>Complete more pitches to see your progress trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-6xl mb-4">📈</div>
            <p className="text-muted-foreground">Need at least 2 practice sessions to show trends</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Progress Analytics
        </CardTitle>
        <CardDescription>Track your improvement over time</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Trend Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Score</span>
            </div>
            <p className={`text-lg font-bold ${getTrendColor(trends.score)}`}>
              {getTrendIcon(trends.score)} {Math.abs(trends.score).toFixed(1)}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-center gap-1">
              <Zap className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">WPM</span>
            </div>
            <p className={`text-lg font-bold ${getTrendColor(trends.wpm)}`}>
              {getTrendIcon(trends.wpm)} {Math.abs(trends.wpm).toFixed(0)}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-center gap-1">
              <MessageSquareOff className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Fillers</span>
            </div>
            <p className={`text-lg font-bold ${getTrendColor(trends.fillers)}`}>
              {getTrendIcon(trends.fillers)} {Math.abs(trends.fillers).toFixed(1)}
            </p>
          </div>
        </div>

        <Tabs defaultValue="score" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="score">Score Trend</TabsTrigger>
            <TabsTrigger value="wpm">WPM Trend</TabsTrigger>
            <TabsTrigger value="fillers">Filler Words</TabsTrigger>
          </TabsList>

          <TabsContent value="score">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--muted-foreground) / 0.2)' }}
                  />
                  <YAxis 
                    domain={[0, 10]}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--muted-foreground) / 0.2)' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value.toFixed(1)}/10`, 'Score']}
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
          </TabsContent>

          <TabsContent value="wpm">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis 
                    domain={['auto', 'auto']}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value} WPM`, 'Words per Minute']}
                  />
                  {/* Optimal range band */}
                  <Line 
                    type="monotone" 
                    dataKey="wpm" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    dot={{ fill: '#f59e0b', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Optimal speaking pace: 120-160 WPM
            </p>
          </TabsContent>

          <TabsContent value="fillers">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value}`, 'Filler Words']}
                  />
                  <Bar 
                    dataKey="fillers" 
                    fill="#22c55e"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Lower is better - fewer "um", "like", "basically"
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
