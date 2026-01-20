import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Lightbulb, ChevronRight, DollarSign, Clock, 
  TrendingDown, Users, HelpCircle, X, Briefcase,
  AlertTriangle, MessageSquare
} from "lucide-react";

interface RecoveryLine {
  id: string;
  category: string;
  icon: React.ElementType;
  iconColor: string;
  question: string;
  wrongApproach: string;
  strategicPivot: string;
  keyPrinciple: string;
}

const recoveryLines: RecoveryLine[] = [
  {
    id: "salary",
    category: "Salary Negotiation",
    icon: DollarSign,
    iconColor: "text-interview-mustard",
    question: "What are your salary expectations?",
    wrongApproach: "I was making €50,000 and I expect at least €60,000.",
    strategicPivot: "I'm focused on finding the right opportunity. I'm confident we can agree on fair compensation once we both see I'm the right fit. What's the range budgeted for this role?",
    keyPrinciple: "Deflect with value focus, then ask them first"
  },
  {
    id: "career-gap",
    category: "Career Gap",
    icon: Clock,
    iconColor: "text-interview-blood",
    question: "I see there's a gap in your employment history. What happened?",
    wrongApproach: "I was unemployed and couldn't find work for 8 months.",
    strategicPivot: "That period was intentional – I took time to upskill in [X] and reassess my career direction. I completed [certification/project] and emerged more focused on roles exactly like this one.",
    keyPrinciple: "Reframe as strategic choice, show what you gained"
  },
  {
    id: "fired",
    category: "Termination",
    icon: TrendingDown,
    iconColor: "text-interview-blood",
    question: "Why did you leave your last position?",
    wrongApproach: "I was let go because of downsizing / my manager didn't like me.",
    strategicPivot: "The company restructured and my role was eliminated. It gave me clarity on what I want next – a company where I can [specific contribution aligned to this role].",
    keyPrinciple: "Brief explanation, pivot to forward-looking goals"
  },
  {
    id: "weakness",
    category: "Weaknesses",
    icon: AlertTriangle,
    iconColor: "text-interview-mustard",
    question: "What's your biggest weakness?",
    wrongApproach: "I'm a perfectionist / I work too hard.",
    strategicPivot: "Earlier in my career, I sometimes hesitated to delegate because I wanted control over quality. I've learned that empowering others actually improves outcomes, and now I actively coach team members.",
    keyPrinciple: "Real weakness + specific growth + current solution"
  },
  {
    id: "overqualified",
    category: "Overqualification",
    icon: Briefcase,
    iconColor: "text-interview-muted",
    question: "You seem overqualified for this role. Why do you want it?",
    wrongApproach: "I just need a job right now.",
    strategicPivot: "I see this as a strategic move. My experience means I can contribute immediately, but I'm genuinely excited about [specific aspect of role/company]. I'm looking for the right environment, not just the biggest title.",
    keyPrinciple: "Show deliberate choice, express genuine enthusiasm"
  },
  {
    id: "job-hopping",
    category: "Job Hopping",
    icon: Users,
    iconColor: "text-interview-muted",
    question: "You've changed jobs frequently. How do I know you'll stay?",
    wrongApproach: "Those companies weren't good fits.",
    strategicPivot: "Each move was strategic – I gained [X] at Company A, [Y] at Company B. Now I'm looking for a place to apply all of that and grow long-term. What I see here is [specific growth opportunity].",
    keyPrinciple: "Show progression logic, express commitment intent"
  },
  {
    id: "no-experience",
    category: "Missing Experience",
    icon: HelpCircle,
    iconColor: "text-interview-mustard",
    question: "You don't have experience in [X]. How will you handle it?",
    wrongApproach: "I'm a quick learner, I'll figure it out.",
    strategicPivot: "While I haven't done [X] directly, I've done [related Y] which required the same core skills. When I faced [similar challenge], I [specific action and result]. I'm confident I can transfer that approach.",
    keyPrinciple: "Bridge with transferable skills, give concrete example"
  },
  {
    id: "conflict",
    category: "Conflict",
    icon: MessageSquare,
    iconColor: "text-interview-blood",
    question: "Tell me about a conflict with a colleague.",
    wrongApproach: "My colleague was difficult and didn't listen.",
    strategicPivot: "We disagreed on approach for [project]. Instead of escalating, I suggested we each present our case to the team. We ended up combining ideas, and the result was better than either original proposal.",
    keyPrinciple: "Show collaboration, focus on resolution and outcome"
  }
];

interface RecoveryLinesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RecoveryLinesDrawer = ({ isOpen, onClose }: RecoveryLinesDrawerProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-interview-card border-l border-interview-border z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-interview-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-interview-mustard/20 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-interview-mustard" />
                </div>
                <div>
                  <h2 className="font-semibold text-interview-text">Recovery Lines</h2>
                  <p className="text-xs text-interview-muted">Strategic pivots for tough questions</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-interview-muted hover:text-interview-text"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {recoveryLines.map((line) => (
                  <motion.div
                    key={line.id}
                    layout
                    className="rounded-lg border border-interview-border bg-interview-bg overflow-hidden"
                  >
                    {/* Header */}
                    <button
                      onClick={() => setExpandedId(expandedId === line.id ? null : line.id)}
                      className="w-full p-3 flex items-center gap-3 text-left hover:bg-interview-card/50 transition-colors"
                    >
                      <div className={`w-8 h-8 rounded-lg bg-interview-card flex items-center justify-center shrink-0`}>
                        <line.icon className={`w-4 h-4 ${line.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Badge variant="outline" className="text-xs border-interview-border text-interview-muted mb-1">
                          {line.category}
                        </Badge>
                        <p className="text-sm text-interview-text font-medium truncate">
                          "{line.question}"
                        </p>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-interview-muted transition-transform ${
                        expandedId === line.id ? "rotate-90" : ""
                      }`} />
                    </button>

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {expandedId === line.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-interview-border"
                        >
                          <div className="p-3 space-y-3">
                            {/* Wrong Approach */}
                            <div className="p-2 rounded bg-interview-blood/10 border border-interview-blood/20">
                              <p className="text-xs text-interview-blood font-medium mb-1">❌ Avoid saying:</p>
                              <p className="text-sm text-interview-text italic">"{line.wrongApproach}"</p>
                            </div>

                            {/* Strategic Pivot */}
                            <div className="p-2 rounded bg-interview-mustard/10 border border-interview-mustard/20">
                              <p className="text-xs text-interview-mustard font-medium mb-1">✓ Strategic pivot:</p>
                              <p className="text-sm text-interview-text">"{line.strategicPivot}"</p>
                            </div>

                            {/* Key Principle */}
                            <div className="flex items-start gap-2 text-xs text-interview-muted">
                              <Lightbulb className="w-3 h-3 mt-0.5 shrink-0" />
                              <span>{line.keyPrinciple}</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="p-4 border-t border-interview-border">
              <p className="text-xs text-interview-muted text-center">
                💡 <span className="text-interview-mustard">Strategic Honesty:</span> Never lie – reframe your truth powerfully
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
