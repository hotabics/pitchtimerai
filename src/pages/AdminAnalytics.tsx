import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, BarChart3, Calendar, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface AnalyticsData {
  topSuggestions: Array<{ type: string; text: string; count: number }>;
  byType: Record<string, number>;
  byDay: Record<string, number>;
  totalSelections: number;
}

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

const formatTypeName = (type: string) => {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const AdminAnalytics = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: result, error: fetchError } = await supabase.functions.invoke("get-analytics");
      
      if (fetchError) throw fetchError;
      setData(result);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
      setError("Failed to load analytics data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const sortedDays = data?.byDay
    ? Object.entries(data.byDay).sort(([a], [b]) => a.localeCompare(b))
    : [];

  const maxDayCount = sortedDays.length > 0
    ? Math.max(...sortedDays.map(([, count]) => count))
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">AI Suggestion Analytics</h1>
              <p className="text-muted-foreground">Track which suggestions resonate with users</p>
            </div>
          </div>
          <Button onClick={fetchAnalytics} disabled={isLoading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
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
            {/* Summary Cards */}
            <div className="grid gap-6 md:grid-cols-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
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
                transition={{ delay: 0.2 }}
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
                transition={{ delay: 0.3 }}
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
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Last 7 Days Activity</CardTitle>
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
              transition={{ delay: 0.5 }}
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
              transition={{ delay: 0.6 }}
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
