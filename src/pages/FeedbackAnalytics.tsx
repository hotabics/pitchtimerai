// Feedback Analytics Dashboard - RLHF Data Visualization

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend 
} from 'recharts';
import { 
  ThumbsUp, ThumbsDown, Flag, MessageSquare, 
  TrendingUp, Calendar, ArrowLeft, RefreshCw 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchFeedbackAnalytics, FeedbackLogRecord } from '@/services/feedbackService';
import { useNavigate } from 'react-router-dom';

const COLORS = {
  positive: 'hsl(142, 76%, 36%)',
  negative: 'hsl(0, 84%, 60%)',
  neutral: 'hsl(221, 83%, 53%)',
  warning: 'hsl(38, 92%, 50%)',
};

const reasonLabels: Record<string, string> = {
  'too_long': 'Too Long',
  'too_generic': 'Too Generic',
  'wrong_tone': 'Wrong Tone',
  'inaccurate_info': 'Inaccurate Info',
};

export default function FeedbackAnalytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<{
    totalFeedback: number;
    thumbsUpCount: number;
    thumbsDownCount: number;
    reasonBreakdown: Record<string, number>;
    metricFlags: Record<string, number>;
    verdictHelpful: number;
    verdictNotHelpful: number;
    recentFeedback: FeedbackLogRecord[];
    dailyTrend: { date: string; positive: number; negative: number }[];
  } | null>(null);

  const loadAnalytics = async () => {
    setLoading(true);
    const data = await fetchFeedbackAnalytics();
    setAnalytics(data);
    setLoading(false);
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const thumbsRatio = analytics 
    ? [
        { name: 'Positive', value: analytics.thumbsUpCount, color: COLORS.positive },
        { name: 'Negative', value: analytics.thumbsDownCount, color: COLORS.negative },
      ]
    : [];

  const reasonData = analytics 
    ? Object.entries(analytics.reasonBreakdown).map(([key, value]) => ({
        name: reasonLabels[key] || key,
        value,
      }))
    : [];

  const metricFlagData = analytics
    ? Object.entries(analytics.metricFlags).map(([key, value]) => ({
        name: key,
        value,
      }))
    : [];

  const verdictData = analytics
    ? [
        { name: 'Helpful', value: analytics.verdictHelpful, color: COLORS.positive },
        { name: 'Not Helpful', value: analytics.verdictNotHelpful, color: COLORS.negative },
      ]
    : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Feedback Analytics</h1>
              <p className="text-muted-foreground">RLHF data visualization dashboard</p>
            </div>
          </div>
          <Button variant="outline" onClick={loadAnalytics} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{analytics?.totalFeedback || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Feedback</p>
                </div>
                <MessageSquare className="w-8 h-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-success">{analytics?.thumbsUpCount || 0}</p>
                  <p className="text-sm text-muted-foreground">Thumbs Up</p>
                </div>
                <ThumbsUp className="w-8 h-8 text-success/30" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-destructive">{analytics?.thumbsDownCount || 0}</p>
                  <p className="text-sm text-muted-foreground">Thumbs Down</p>
                </div>
                <ThumbsDown className="w-8 h-8 text-destructive/30" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-warning">
                    {Object.values(analytics?.metricFlags || {}).reduce((a, b) => a + b, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Metric Flags</p>
                </div>
                <Flag className="w-8 h-8 text-warning/30" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Thumbs Up/Down Ratio */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Script Feedback Ratio
              </CardTitle>
              <CardDescription>Positive vs negative script feedback</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={thumbsRatio}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {thumbsRatio.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Common Complaints */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ThumbsDown className="w-5 h-5" />
                Common Complaints
              </CardTitle>
              <CardDescription>Why users disliked scripts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {reasonData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reasonData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={100} />
                      <RechartsTooltip />
                      <Bar dataKey="value" fill={COLORS.negative} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No negative feedback yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Metric Accuracy Flags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flag className="w-5 h-5" />
                Metric Accuracy Flags
              </CardTitle>
              <CardDescription>Metrics users flagged as inaccurate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {metricFlagData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metricFlagData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <Bar dataKey="value" fill={COLORS.warning} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No metrics flagged yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Verdict Helpfulness */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Jury Verdict Helpfulness
              </CardTitle>
              <CardDescription>Was the AI coach feedback helpful?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={verdictData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {verdictData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              7-Day Feedback Trend
            </CardTitle>
            <CardDescription>Daily positive vs negative feedback</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics?.dailyTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'short' })}
                  />
                  <YAxis />
                  <RechartsTooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="positive" 
                    stroke={COLORS.positive} 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Positive"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="negative" 
                    stroke={COLORS.negative} 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Negative"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Feedback */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Feedback</CardTitle>
            <CardDescription>Latest 10 feedback entries</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics?.recentFeedback && analytics.recentFeedback.length > 0 ? (
              <div className="space-y-3">
                {analytics.recentFeedback.map((log) => (
                  <div 
                    key={log.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={
                          log.feedback_type.includes('up') || log.feedback_type.includes('helpful') 
                            ? 'default' 
                            : 'destructive'
                        }
                        className="text-xs"
                      >
                        {log.feedback_type.replace(/_/g, ' ')}
                      </Badge>
                      {log.reason && (
                        <span className="text-sm text-muted-foreground">
                          Reason: {reasonLabels[log.reason] || log.reason}
                        </span>
                      )}
                      {log.metric_name && (
                        <span className="text-sm text-muted-foreground">
                          Metric: {log.metric_name}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No feedback recorded yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
