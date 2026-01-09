import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, TrendingUp, BarChart3, Calendar, ArrowLeft, Mic, Clock, Target, ThumbsUp, ThumbsDown, Zap, Users, MessageSquare, Download, FileText, Mail, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface ContentStats {
  totalSessions: number;
  avgScore: number;
  avgWpm: number;
  avgFillers: number;
  avgDuration: number;
  byTrack: Record<string, number>;
  byEntryMode: Record<string, number>;
  byTone: Record<string, number>;
  sessionsByDay: Record<string, number>;
  scoreDistribution: {
    excellent: number;
    good: number;
    needsWork: number;
  };
}

interface FeedbackStats {
  total: number;
  byType: Record<string, number>;
}

interface ComparisonData {
  sessions: number | null;
  avgScore: number | null;
  avgWpm: number | null;
  suggestions: number | null;
  feedback: number | null;
  previousPeriod: {
    sessions: number;
    avgScore: number;
    suggestions: number;
    feedback: number;
  };
}

interface AnalyticsData {
  topSuggestions: Array<{ type: string; text: string; count: number }>;
  byType: Record<string, number>;
  byDay: Record<string, number>;
  totalSelections: number;
  contentStats?: ContentStats;
  feedbackStats?: FeedbackStats;
  dateRange?: number;
  comparison?: ComparisonData | null;
}

type DateRangeOption = "7" | "30" | "0";

const typeColors: Record<string, string> = {
  hackathon_hook: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  hackathon_problem: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  hackathon_solution: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  hackathon_demo: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  hackathon_cta: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  investor_traction: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  investor_market: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  grandma_analogy: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  peers_why_care: "bg-teal-500/20 text-teal-300 border-teal-500/30",
};

const trackColors: Record<string, string> = {
  "hackathon-no-demo": "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "hackathon": "bg-red-500/20 text-red-300 border-red-500/30",
  "investor": "bg-green-500/20 text-green-300 border-green-500/30",
  "peers": "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "grandma": "bg-pink-500/20 text-pink-300 border-pink-500/30",
  "academic": "bg-purple-500/20 text-purple-300 border-purple-500/30",
};

const formatTypeName = (type: string) => {
  return type
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const dateRangeLabels: Record<DateRangeOption, string> = {
  "7": "Last 7 days",
  "30": "Last 30 days",
  "0": "All time",
};

// Comparison change badge component
const ChangeBadge = ({ value, suffix = "%" }: { value: number | null | undefined; suffix?: string }) => {
  if (value === null || value === undefined) return null;
  const isPositive = value >= 0;
  return (
    <span className={`text-xs font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
      {isPositive ? '↑' : '↓'} {Math.abs(value)}{suffix}
    </span>
  );
};

const AdminAnalytics = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRangeOption>("7");
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState("");
  const [emailPeriod, setEmailPeriod] = useState<"weekly" | "monthly">("weekly");
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const fetchAnalytics = useCallback(async (range: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: result, error: fetchError } = await supabase.functions.invoke("get-analytics", {
        body: { dateRange: range }
      });
      
      if (fetchError) throw fetchError;
      setData(result);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
      setError("Failed to load analytics data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(parseInt(dateRange));
  }, [dateRange, fetchAnalytics]);

  const handleDateRangeChange = (value: DateRangeOption) => {
    setDateRange(value);
  };

  // Send email report
  const sendEmailReport = async () => {
    if (!emailRecipient.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setIsSendingEmail(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("send-analytics-report", {
        body: {
          recipients: emailRecipient.split(',').map(e => e.trim()).filter(Boolean),
          period: emailPeriod,
        }
      });

      if (error) throw error;
      
      toast.success(`Report sent to ${emailRecipient}`);
      setEmailDialogOpen(false);
      setEmailRecipient("");
    } catch (err) {
      console.error("Failed to send email:", err);
      toast.error("Failed to send email report");
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!data) return;
    
    const lines: string[] = [];
    const dateLabel = dateRangeLabels[dateRange];
    
    // Header
    lines.push(`Analytics Report - ${dateLabel}`);
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push('');
    
    // Content Generation Stats
    if (data.contentStats) {
      lines.push('CONTENT GENERATION STATS');
      lines.push(`Total Sessions,${data.contentStats.totalSessions}`);
      lines.push(`Average Score,${data.contentStats.avgScore}`);
      lines.push(`Average WPM,${data.contentStats.avgWpm}`);
      lines.push(`Average Fillers,${data.contentStats.avgFillers}`);
      lines.push(`Average Duration (s),${data.contentStats.avgDuration}`);
      lines.push('');
      
      lines.push('SCORE DISTRIBUTION');
      lines.push(`Excellent (80+),${data.contentStats.scoreDistribution.excellent}`);
      lines.push(`Good (60-79),${data.contentStats.scoreDistribution.good}`);
      lines.push(`Needs Work (<60),${data.contentStats.scoreDistribution.needsWork}`);
      lines.push('');
      
      lines.push('USAGE BY TRACK');
      Object.entries(data.contentStats.byTrack).forEach(([track, count]) => {
        lines.push(`${formatTypeName(track)},${count}`);
      });
      lines.push('');
      
      lines.push('SESSIONS BY DAY');
      Object.entries(data.contentStats.sessionsByDay).sort(([a], [b]) => a.localeCompare(b)).forEach(([day, count]) => {
        lines.push(`${day},${count}`);
      });
      lines.push('');
    }
    
    // Feedback Stats
    if (data.feedbackStats) {
      lines.push('FEEDBACK STATS');
      lines.push(`Total Feedback,${data.feedbackStats.total}`);
      Object.entries(data.feedbackStats.byType).forEach(([type, count]) => {
        lines.push(`${formatTypeName(type)},${count}`);
      });
      lines.push('');
    }
    
    // Suggestion Stats
    lines.push('AI SUGGESTION STATS');
    lines.push(`Total Selections,${data.totalSelections}`);
    lines.push('');
    
    lines.push('TOP SUGGESTIONS');
    lines.push('Rank,Type,Text,Count');
    data.topSuggestions.slice(0, 10).forEach((s, i) => {
      lines.push(`${i + 1},"${formatTypeName(s.type)}","${s.text.replace(/"/g, '""')}",${s.count}`);
    });
    
    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-report-${dateRange}d-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success('CSV exported successfully');
  };

  // Export to PDF
  const exportToPDF = () => {
    if (!data) return;
    
    const doc = new jsPDF();
    const dateLabel = dateRangeLabels[dateRange];
    let y = 20;
    const lineHeight = 7;
    const margin = 20;
    
    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Analytics Report', margin, y);
    y += lineHeight * 1.5;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Period: ${dateLabel}`, margin, y);
    y += lineHeight;
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
    y += lineHeight * 2;
    
    // Content Generation Stats
    if (data.contentStats) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Content Generation', margin, y);
      y += lineHeight * 1.2;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const stats = [
        `Total Sessions: ${data.contentStats.totalSessions}`,
        `Average Score: ${data.contentStats.avgScore}/100`,
        `Average WPM: ${data.contentStats.avgWpm}`,
        `Average Duration: ${data.contentStats.avgDuration}s`,
      ];
      stats.forEach(stat => {
        doc.text(stat, margin, y);
        y += lineHeight;
      });
      y += lineHeight;
      
      // Score distribution
      doc.setFont('helvetica', 'bold');
      doc.text('Score Distribution:', margin, y);
      y += lineHeight;
      doc.setFont('helvetica', 'normal');
      doc.text(`  Excellent (80+): ${data.contentStats.scoreDistribution.excellent}`, margin, y);
      y += lineHeight;
      doc.text(`  Good (60-79): ${data.contentStats.scoreDistribution.good}`, margin, y);
      y += lineHeight;
      doc.text(`  Needs Work (<60): ${data.contentStats.scoreDistribution.needsWork}`, margin, y);
      y += lineHeight * 1.5;
      
      // Track usage
      doc.setFont('helvetica', 'bold');
      doc.text('Usage by Track:', margin, y);
      y += lineHeight;
      doc.setFont('helvetica', 'normal');
      Object.entries(data.contentStats.byTrack)
        .sort(([, a], [, b]) => b - a)
        .forEach(([track, count]) => {
          doc.text(`  ${formatTypeName(track)}: ${count}`, margin, y);
          y += lineHeight;
        });
      y += lineHeight;
    }
    
    // Feedback
    if (data.feedbackStats && data.feedbackStats.total > 0) {
      const thumbsUpCount = (data.feedbackStats.byType['script_thumbs_up'] || 0) + (data.feedbackStats.byType['verdict_helpful'] || 0);
      const thumbsDownCount = (data.feedbackStats.byType['script_thumbs_down'] || 0) + (data.feedbackStats.byType['verdict_not_helpful'] || 0);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('User Feedback', margin, y);
      y += lineHeight * 1.2;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Positive: ${thumbsUpCount}  |  Negative: ${thumbsDownCount}`, margin, y);
      y += lineHeight * 2;
    }
    
    // AI Suggestions
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('AI Suggestions', margin, y);
    y += lineHeight * 1.2;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Selections: ${data.totalSelections}`, margin, y);
    y += lineHeight;
    doc.text(`Unique Suggestions: ${data.topSuggestions.length}`, margin, y);
    y += lineHeight * 1.5;
    
    // Top suggestions (limited to fit page)
    doc.setFont('helvetica', 'bold');
    doc.text('Top 5 Suggestions:', margin, y);
    y += lineHeight;
    doc.setFont('helvetica', 'normal');
    
    data.topSuggestions.slice(0, 5).forEach((s, i) => {
      if (y > 270) return; // Prevent overflow
      const text = `${i + 1}. ${s.text.slice(0, 70)}${s.text.length > 70 ? '...' : ''} (${s.count})`;
      doc.text(text, margin, y, { maxWidth: 170 });
      y += lineHeight * 1.5;
    });
    
    doc.save(`analytics-report-${dateRange}d-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF exported successfully');
  };

  const sortedDays = data?.byDay
    ? Object.entries(data.byDay).sort(([a], [b]) => a.localeCompare(b))
    : [];

  const maxDayCount = sortedDays.length > 0
    ? Math.max(...sortedDays.map(([, count]) => count))
    : 0;

  const sessionDays = data?.contentStats?.sessionsByDay
    ? Object.entries(data.contentStats.sessionsByDay).sort(([a], [b]) => a.localeCompare(b))
    : [];

  const maxSessionDayCount = sessionDays.length > 0
    ? Math.max(...sessionDays.map(([, count]) => count))
    : 0;

  // Calculate feedback ratios
  const feedbackStats = data?.feedbackStats;
  const thumbsUp = (feedbackStats?.byType?.['script_thumbs_up'] || 0) + (feedbackStats?.byType?.['verdict_helpful'] || 0);
  const thumbsDown = (feedbackStats?.byType?.['script_thumbs_down'] || 0) + (feedbackStats?.byType?.['verdict_not_helpful'] || 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
              <p className="text-muted-foreground">Track usage patterns and content generation</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            {/* Date Range Filter */}
            <Select value={dateRange} onValueChange={(v) => handleDateRangeChange(v as DateRangeOption)}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="0">All time</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Export Buttons */}
            <Button onClick={exportToCSV} disabled={isLoading || !data} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button onClick={exportToPDF} disabled={isLoading || !data} variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
            
            {/* Email Report */}
            <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={isLoading || !data}>
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send Analytics Report</DialogTitle>
                  <DialogDescription>
                    Send a formatted analytics report via email. Enter recipient email addresses separated by commas.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Recipients</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com, another@example.com"
                      value={emailRecipient}
                      onChange={(e) => setEmailRecipient(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Report Period</Label>
                    <Select value={emailPeriod} onValueChange={(v) => setEmailPeriod(v as "weekly" | "monthly")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly (Last 7 days)</SelectItem>
                        <SelectItem value="monthly">Monthly (Last 30 days)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={sendEmailReport} disabled={isSendingEmail}>
                    {isSendingEmail ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Send Report
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            {/* Refresh */}
            <Button onClick={() => fetchAnalytics(parseInt(dateRange))} disabled={isLoading} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {error && (
          <Card className="border-destructive bg-destructive/10 mb-6">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {isLoading && !data ? (
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Content Generation Stats Section */}
            {data.contentStats && (
              <>
                <div className="mb-2">
                  <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <Mic className="h-5 w-5 text-primary" />
                    Content Generation Stats
                  </h2>
                  <p className="text-sm text-muted-foreground">Track speech generation and practice patterns</p>
                </div>

                {/* Primary Content Stats */}
                <div className="grid gap-4 md:grid-cols-4">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                    <Card className="border-primary/20 bg-primary/5">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Speeches Generated</CardTitle>
                        <Zap className="h-4 w-4 text-primary" />
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-primary">{data.contentStats.totalSessions}</span>
                          {data.comparison && <ChangeBadge value={data.comparison.sessions} />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {data.comparison ? `vs ${data.comparison.previousPeriod.sessions} prev` : 'Total practice sessions'}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Score</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold">{data.contentStats.avgScore}</span>
                          {data.comparison && <ChangeBadge value={data.comparison.avgScore} />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {data.comparison ? `vs ${data.comparison.previousPeriod.avgScore} prev` : 'Out of 100'}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Avg. WPM</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold">{data.contentStats.avgWpm}</span>
                          {data.comparison && <ChangeBadge value={data.comparison.avgWpm} />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Words per minute</p>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Duration</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{data.contentStats.avgDuration}s</div>
                        <p className="text-xs text-muted-foreground mt-1">Recording length</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Score Distribution & Sessions by Day */}
                <div className="grid gap-6 md:grid-cols-2">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Score Distribution</CardTitle>
                        <CardDescription>How users are performing</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-24 text-sm text-muted-foreground">Excellent (80+)</div>
                            <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                              <div 
                                className="h-full bg-green-500 transition-all"
                                style={{ width: `${(data.contentStats.scoreDistribution.excellent / data.contentStats.totalSessions) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-8">{data.contentStats.scoreDistribution.excellent}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-24 text-sm text-muted-foreground">Good (60-79)</div>
                            <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                              <div 
                                className="h-full bg-yellow-500 transition-all"
                                style={{ width: `${(data.contentStats.scoreDistribution.good / data.contentStats.totalSessions) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-8">{data.contentStats.scoreDistribution.good}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-24 text-sm text-muted-foreground">Needs Work (&lt;60)</div>
                            <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                              <div 
                                className="h-full bg-red-500 transition-all"
                                style={{ width: `${(data.contentStats.scoreDistribution.needsWork / data.contentStats.totalSessions) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-8">{data.contentStats.scoreDistribution.needsWork}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {sessionDays.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Sessions (Last 7 Days)</CardTitle>
                          <CardDescription>Daily practice activity</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-end gap-2 h-24">
                            {sessionDays.map(([day, count]) => (
                              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                                <div
                                  className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary"
                                  style={{ height: `${(count / maxSessionDayCount) * 100}%`, minHeight: "4px" }}
                                />
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(day).toLocaleDateString("en", { weekday: "short" })}
                                </span>
                                <span className="text-xs font-medium">{count}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </div>

                {/* Usage by Track & Entry Mode */}
                <div className="grid gap-6 md:grid-cols-2">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Usage by Track
                        </CardTitle>
                        <CardDescription>Which audience types are most popular</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(data.contentStats.byTrack)
                            .sort(([, a], [, b]) => b - a)
                            .map(([track, count]) => (
                              <Badge
                                key={track}
                                variant="outline"
                                className={`px-3 py-1.5 text-sm ${trackColors[track] || "bg-muted"}`}
                              >
                                {formatTypeName(track)}: {count}
                              </Badge>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Entry Mode</CardTitle>
                        <CardDescription>How users are creating content</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(data.contentStats.byEntryMode)
                            .sort(([, a], [, b]) => b - a)
                            .map(([mode, count]) => (
                              <Badge
                                key={mode}
                                variant="outline"
                                className="px-3 py-1.5 text-sm"
                              >
                                {formatTypeName(mode)}: {count}
                              </Badge>
                            ))}
                        </div>
                        {Object.keys(data.contentStats.byTone).length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-xs text-muted-foreground mb-2">By Tone</p>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(data.contentStats.byTone)
                                .sort(([, a], [, b]) => b - a)
                                .map(([tone, count]) => (
                                  <Badge key={tone} variant="secondary" className="text-xs">
                                    {tone}: {count}
                                  </Badge>
                                ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </>
            )}

            {/* Feedback Stats */}
            {feedbackStats && feedbackStats.total > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4" />
                      User Feedback
                    </CardTitle>
                    <CardDescription>What users think of the generated content</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6 mb-4">
                      <div className="flex items-center gap-2">
                        <ThumbsUp className="h-5 w-5 text-green-500" />
                        <span className="text-2xl font-bold text-green-500">{thumbsUp}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ThumbsDown className="h-5 w-5 text-red-500" />
                        <span className="text-2xl font-bold text-red-500">{thumbsDown}</span>
                      </div>
                      {thumbsUp + thumbsDown > 0 && (
                        <div className="text-sm text-muted-foreground">
                          ({Math.round((thumbsUp / (thumbsUp + thumbsDown)) * 100)}% positive)
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(feedbackStats.byType)
                        .sort(([, a], [, b]) => b - a)
                        .map(([type, count]) => (
                          <Badge key={type} variant="outline" className="text-xs">
                            {formatTypeName(type)}: {count}
                          </Badge>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Divider */}
            <div className="border-t my-6" />

            <div className="mb-2">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                AI Suggestion Analytics
              </h2>
              <p className="text-sm text-muted-foreground">Track which AI suggestions resonate with users</p>
            </div>

            {/* Original Summary Cards */}
            <div className="grid gap-6 md:grid-cols-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Selections</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{data.totalSelections}</div>
                    <p className="text-xs text-muted-foreground mt-1">All time</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Unique Suggestions</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{data.topSuggestions.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">Different suggestions selected</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Track Types</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{Object.keys(data.byType).length}</div>
                    <p className="text-xs text-muted-foreground mt-1">Active suggestion categories</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Activity Chart */}
            {sortedDays.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Suggestion Selections (Last 7 Days)</CardTitle>
                    <CardDescription>Daily suggestion selections</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-2 h-32">
                      {sortedDays.map(([day, count]) => (
                        <div key={day} className="flex-1 flex flex-col items-center gap-1">
                          <div
                            className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary"
                            style={{ height: `${(count / maxDayCount) * 100}%`, minHeight: "4px" }}
                          />
                          <span className="text-xs text-muted-foreground">
                            {new Date(day).toLocaleDateString("en", { weekday: "short" })}
                          </span>
                          <span className="text-xs font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* By Type Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Selections by Type</CardTitle>
                  <CardDescription>Which suggestion categories are most popular</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(data.byType)
                      .sort(([, a], [, b]) => b - a)
                      .map(([type, count]) => (
                        <Badge
                          key={type}
                          variant="outline"
                          className={`px-3 py-1.5 text-sm ${typeColors[type] || "bg-muted"}`}
                        >
                          {formatTypeName(type)}: {count}
                        </Badge>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Top Suggestions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Top Suggestions</CardTitle>
                  <CardDescription>Most frequently selected AI suggestions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.topSuggestions.slice(0, 10).map((suggestion, index) => (
                      <div
                        key={`${suggestion.type}-${index}`}
                        className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm leading-relaxed">{suggestion.text}</p>
                          <Badge
                            variant="outline"
                            className={`mt-2 text-xs ${typeColors[suggestion.type] || "bg-muted"}`}
                          >
                            {formatTypeName(suggestion.type)}
                          </Badge>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-2xl font-bold">{suggestion.count}</span>
                          <p className="text-xs text-muted-foreground">selections</p>
                        </div>
                      </div>
                    ))}
                    
                    {data.topSuggestions.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        No suggestions have been selected yet. Start using the app to see analytics!
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AdminAnalytics;
