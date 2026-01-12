/**
 * Survey Analytics Dashboard
 * 
 * Shows NPS trends, friction point breakdowns, and completion rates over time.
 * Uses data from localStorage (survey submissions).
 */

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Users, 
  BarChart3,
  PieChart,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';
import { getSurveyHistory, getSessionStats } from '@/hooks/useSurvey';
import { PULSE_SURVEY_V1, EXPERIENCE_SURVEY_V1 } from '@/data/surveyDefinitions';

// Mock analytics data (in production, this would come from PostHog or a database)
interface SurveyAnalytics {
  totalResponses: number;
  pulseResponses: number;
  experienceResponses: number;
  completionRate: number;
  avgNPS: number;
  npsPromoters: number;
  npsPassives: number;
  npsDetractors: number;
  frictionPoints: { label: string; count: number; percentage: number }[];
  goalBreakdown: { label: string; count: number; percentage: number }[];
  dailyResponses: { date: string; pulse: number; experience: number }[];
  npsOverTime: { date: string; nps: number }[];
  topImprovements: { label: string; count: number }[];
}

// Generate mock data based on localStorage history
const generateMockAnalytics = (): SurveyAnalytics => {
  const history = getSurveyHistory();
  const sessionStats = getSessionStats();
  
  // Base numbers from real history
  const pulseCompleted = history['pitchperfect_pulse_v1'] ? 1 : 0;
  const experienceCompleted = history['pitchperfect_experience_v1'] ? 1 : 0;
  
  // Generate realistic demo data
  const totalDemoResponses = 127;
  const pulseDemoResponses = 89;
  const experienceDemoResponses = 38;
  
  return {
    totalResponses: totalDemoResponses + pulseCompleted + experienceCompleted,
    pulseResponses: pulseDemoResponses + pulseCompleted,
    experienceResponses: experienceDemoResponses + experienceCompleted,
    completionRate: 73.2,
    avgNPS: 42,
    npsPromoters: 48,
    npsPassives: 31,
    npsDetractors: 21,
    frictionPoints: [
      { label: "AI feedback felt too generic", count: 34, percentage: 26.8 },
      { label: "Timer / pacing wasn't helpful", count: 28, percentage: 22.0 },
      { label: "Didn't know where to start", count: 23, percentage: 18.1 },
      { label: "UI was confusing", count: 19, percentage: 15.0 },
      { label: "Technical issues", count: 15, percentage: 11.8 },
      { label: "Other", count: 8, percentage: 6.3 },
    ],
    goalBreakdown: [
      { label: "Investor pitch", count: 42, percentage: 33.1 },
      { label: "Sales / demo pitch", count: 31, percentage: 24.4 },
      { label: "School / hackathon pitch", count: 28, percentage: 22.0 },
      { label: "Job interview", count: 18, percentage: 14.2 },
      { label: "Other", count: 8, percentage: 6.3 },
    ],
    dailyResponses: [
      { date: "Jan 6", pulse: 8, experience: 3 },
      { date: "Jan 7", pulse: 12, experience: 5 },
      { date: "Jan 8", pulse: 15, experience: 4 },
      { date: "Jan 9", pulse: 11, experience: 6 },
      { date: "Jan 10", pulse: 18, experience: 8 },
      { date: "Jan 11", pulse: 14, experience: 7 },
      { date: "Jan 12", pulse: 11 + pulseCompleted, experience: 5 + experienceCompleted },
    ],
    npsOverTime: [
      { date: "Jan 6", nps: 38 },
      { date: "Jan 7", nps: 41 },
      { date: "Jan 8", nps: 39 },
      { date: "Jan 9", nps: 44 },
      { date: "Jan 10", nps: 42 },
      { date: "Jan 11", nps: 45 },
      { date: "Jan 12", nps: 42 },
    ],
    topImprovements: [
      { label: "AI examples (rewritten sentences)", count: 47 },
      { label: "Clearer onboarding", count: 41 },
      { label: "Voice metrics (pauses / speed)", count: 38 },
      { label: "Progress dashboard", count: 35 },
      { label: "Pitch templates", count: 29 },
    ],
  };
};

// Color palette
const COLORS = {
  primary: 'hsl(var(--primary))',
  promoter: '#22c55e',
  passive: '#eab308',
  detractor: '#ef4444',
  chart: ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#6366f1'],
};

const SurveyAnalytics = () => {
  const [analytics, setAnalytics] = useState<SurveyAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const loadAnalytics = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setAnalytics(generateMockAnalytics());
      setIsLoading(false);
    }, 500);
  };
  
  useEffect(() => {
    loadAnalytics();
  }, []);
  
  if (isLoading || !analytics) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }
  
  const npsData = [
    { name: 'Promoters', value: analytics.npsPromoters, color: COLORS.promoter },
    { name: 'Passives', value: analytics.npsPassives, color: COLORS.passive },
    { name: 'Detractors', value: analytics.npsDetractors, color: COLORS.detractor },
  ];
  
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Survey Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Track user feedback, NPS trends, and friction points
            </p>
          </div>
          <Button variant="outline" onClick={loadAnalytics} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Responses
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalResponses}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics.pulseResponses} pulse, {analytics.experienceResponses} experience
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completion Rate
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.completionRate}%</div>
              <Progress value={analytics.completionRate} className="mt-2 h-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average NPS
              </CardTitle>
              {analytics.avgNPS >= 50 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : analytics.avgNPS >= 0 ? (
                <TrendingUp className="h-4 w-4 text-yellow-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-2xl font-bold",
                analytics.avgNPS >= 50 ? "text-green-500" :
                analytics.avgNPS >= 0 ? "text-yellow-500" : "text-red-500"
              )}>
                {analytics.avgNPS > 0 ? '+' : ''}{analytics.avgNPS}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Industry benchmark: +30
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Top Friction Point
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold truncate">
                {analytics.frictionPoints[0]?.label.split(' ').slice(0, 3).join(' ')}...
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics.frictionPoints[0]?.percentage}% of responses
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Tabs for detailed views */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="nps">NPS Analysis</TabsTrigger>
            <TabsTrigger value="friction">Friction Points</TabsTrigger>
            <TabsTrigger value="improvements">Improvements</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Response Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Response Trend</CardTitle>
                  <CardDescription>Daily survey completions (last 7 days)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.dailyResponses}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))', 
                            border: '1px solid hsl(var(--border))' 
                          }} 
                        />
                        <Legend />
                        <Bar dataKey="pulse" name="Pulse" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="experience" name="Experience" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Goal Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">User Goals</CardTitle>
                  <CardDescription>What users came to do</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.goalBreakdown.map((goal, idx) => (
                      <div key={goal.label} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-foreground">{goal.label}</span>
                          <span className="text-muted-foreground">{goal.count} ({goal.percentage}%)</span>
                        </div>
                        <Progress 
                          value={goal.percentage} 
                          className="h-2"
                          style={{ 
                            ['--progress-background' as any]: COLORS.chart[idx % COLORS.chart.length] 
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* NPS Tab */}
          <TabsContent value="nps" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* NPS Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">NPS Distribution</CardTitle>
                  <CardDescription>Promoters vs Passives vs Detractors</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={npsData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {npsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 text-center">
                    <div className="text-4xl font-bold text-foreground">
                      {analytics.avgNPS > 0 ? '+' : ''}{analytics.avgNPS}
                    </div>
                    <p className="text-sm text-muted-foreground">Net Promoter Score</p>
                  </div>
                </CardContent>
              </Card>
              
              {/* NPS Over Time */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">NPS Trend</CardTitle>
                  <CardDescription>Score evolution over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics.npsOverTime}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis domain={[0, 100]} className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))', 
                            border: '1px solid hsl(var(--border))' 
                          }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="nps" 
                          stroke="#8b5cf6" 
                          strokeWidth={2}
                          dot={{ fill: '#8b5cf6' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Friction Points Tab */}
          <TabsContent value="friction" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Friction Points</CardTitle>
                <CardDescription>What frustrated users the most</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.frictionPoints.map((point, idx) => (
                    <motion.div 
                      key={point.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center gap-4"
                    >
                      <div className={cn(
                        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                        idx === 0 ? "bg-red-100 text-red-600 dark:bg-red-900/30" :
                        idx === 1 ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30" :
                        "bg-muted text-muted-foreground"
                      )}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-foreground truncate">{point.label}</span>
                          <span className="text-sm text-muted-foreground ml-2">{point.count}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className={cn(
                              "h-2 rounded-full transition-all",
                              idx === 0 ? "bg-red-500" :
                              idx === 1 ? "bg-orange-500" :
                              "bg-primary"
                            )}
                            style={{ width: `${point.percentage}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium text-muted-foreground w-12 text-right">
                        {point.percentage}%
                      </span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Improvements Tab */}
          <TabsContent value="improvements" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Requested Improvements</CardTitle>
                <CardDescription>What users want us to build next</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.topImprovements} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" className="text-xs" />
                      <YAxis 
                        dataKey="label" 
                        type="category" 
                        width={200} 
                        className="text-xs"
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))' 
                        }} 
                      />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Survey Questions Reference */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Surveys</CardTitle>
            <CardDescription>Currently deployed survey versions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">{PULSE_SURVEY_V1.id}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{PULSE_SURVEY_V1.description}</p>
                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-1 bg-muted rounded">{PULSE_SURVEY_V1.questions.length} questions</span>
                  <span className="px-2 py-1 bg-muted rounded">~{PULSE_SURVEY_V1.estimatedTime}</span>
                </div>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <PieChart className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">{EXPERIENCE_SURVEY_V1.id}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{EXPERIENCE_SURVEY_V1.description}</p>
                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-1 bg-muted rounded">{EXPERIENCE_SURVEY_V1.questions.length} questions</span>
                  <span className="px-2 py-1 bg-muted rounded">~{EXPERIENCE_SURVEY_V1.estimatedTime}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SurveyAnalytics;
