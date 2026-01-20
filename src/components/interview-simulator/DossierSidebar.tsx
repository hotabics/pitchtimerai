import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, Shield, AlertTriangle, Lightbulb, 
  Target, CheckCircle2
} from "lucide-react";

interface KeyEvidence {
  evidence: string;
  when_to_mention: string;
  impact_statement?: string;
}

interface MatchStrength {
  requirement: string;
  cv_evidence: string;
  strength_level: "strong" | "moderate" | "partial";
}

interface MatchGap {
  requirement: string;
  gap_severity: "critical" | "moderate" | "minor";
  reframe_strategy: string;
  transferable_experience?: string;
}

interface DossierSidebarProps {
  jobTitle: string;
  companyName?: string;
  keyEvidence: KeyEvidence[];
  matchStrengths: MatchStrength[];
  matchGaps: MatchGap[];
  currentQuestion?: string;
}

export const DossierSidebar = ({
  jobTitle,
  companyName,
  keyEvidence,
  matchStrengths,
  matchGaps,
  currentQuestion
}: DossierSidebarProps) => {
  // Find relevant evidence based on current question
  const relevantEvidence = keyEvidence.filter(e => {
    if (!currentQuestion) return true;
    const q = currentQuestion.toLowerCase();
    const mention = e.when_to_mention.toLowerCase();
    return mention.split(" ").some(word => q.includes(word));
  });

  return (
    <div className="h-full flex flex-col bg-interview-card border-l border-interview-border">
      {/* Header */}
      <div className="p-4 border-b border-interview-border">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-4 h-4 text-interview-mustard" />
          <span className="text-sm font-medium text-interview-text">Dossier</span>
        </div>
        <div>
          <p className="text-lg font-bold text-interview-text">{jobTitle}</p>
          {companyName && (
            <p className="text-sm text-interview-muted">{companyName}</p>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Key Evidence to Mention */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-interview-mustard" />
              <span className="text-sm font-medium text-interview-mustard">Key Evidence</span>
              <Badge variant="outline" className="ml-auto text-xs border-interview-border">
                {relevantEvidence.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {(relevantEvidence.length > 0 ? relevantEvidence : keyEvidence.slice(0, 3)).map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-2 rounded bg-interview-bg border border-interview-border"
                >
                  <p className="text-sm text-interview-text font-medium mb-1">
                    {item.evidence}
                  </p>
                  <p className="text-xs text-interview-muted flex items-center gap-1">
                    <Lightbulb className="w-3 h-3" />
                    {item.when_to_mention}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Your Strengths */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-green-500">Your Strengths</span>
            </div>
            <div className="space-y-2">
              {matchStrengths.slice(0, 4).map((strength, i) => (
                <div
                  key={i}
                  className="p-2 rounded bg-green-500/5 border border-green-500/20"
                >
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-interview-text">{strength.requirement}</p>
                      <p className="text-xs text-interview-muted mt-1">→ {strength.cv_evidence}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Watch for Gaps */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-interview-blood" />
              <span className="text-sm font-medium text-interview-blood">Gaps to Reframe</span>
            </div>
            <div className="space-y-2">
              {matchGaps.slice(0, 3).map((gap, i) => (
                <div
                  key={i}
                  className="p-2 rounded bg-interview-blood/5 border border-interview-blood/20"
                >
                  <p className="text-xs text-interview-text font-medium mb-1">{gap.requirement}</p>
                  <p className="text-xs text-interview-mustard">
                    💡 {gap.reframe_strategy}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
