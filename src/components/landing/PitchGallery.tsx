import { motion } from "framer-motion";
import { TrendingUp, Sparkles, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PitchStats {
  totalSelections: number;
  topSuggestions: { type: string; text: string; count: number }[];
  byType: Record<string, number>;
}

export const PitchGallery = () => {
  const [stats, setStats] = useState<PitchStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-analytics");
        if (error) throw error;
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch pitch stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse flex items-center gap-2 text-muted-foreground">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm">Loading pitch insights...</span>
        </div>
      </div>
    );
  }

  if (!stats || stats.totalSelections === 0) {
    return null;
  }

  const topPitches = stats.topSuggestions.slice(0, 5);
  const trackLabels: Record<string, string> = {
    "pain-suggestions": "Problem",
    "fix-suggestions": "Solution",
    "peers-hook-suggestions": "Hook",
    "investor-opportunity-suggestions": "Opportunity",
    "grandma-connection-suggestions": "Connection",
    "academic-topic-suggestions": "Research",
    "progress-suggestions": "Progress",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="w-full max-w-2xl mx-auto mt-12"
    >
      <div className="glass-card rounded-2xl p-6 border border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">Popular Pitch Elements</h3>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{stats.totalSelections} AI suggestions used</span>
          </div>
        </div>

        <div className="space-y-3">
          {topPitches.map((pitch, index) => (
            <motion.div
              key={`${pitch.type}-${index}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground line-clamp-2">{pitch.text}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {trackLabels[pitch.type] || pitch.type.split("-")[0]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {pitch.count} {pitch.count === 1 ? "use" : "uses"}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};