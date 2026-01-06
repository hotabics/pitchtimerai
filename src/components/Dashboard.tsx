import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Video, BarChart3, Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DashboardProps {
  data: {
    idea: string;
    duration: number;
    problem: string;
    pitch: string;
  };
}

const tabs = [
  { id: "script", label: "Script", icon: FileText },
  { id: "practice", label: "Practice", icon: Video },
  { id: "analysis", label: "Analysis", icon: BarChart3 },
];

const generateScript = (data: DashboardProps["data"]) => [
  {
    time: "0:00 - 0:30",
    title: "The Hook",
    content: `Imagine a world where ${data.problem.slice(0, 50)}... That's the reality for millions today.`,
  },
  {
    time: "0:30 - 1:00",
    title: "The Problem",
    content: data.problem,
  },
  {
    time: "1:00 - 1:30",
    title: "The Solution",
    content: data.pitch,
  },
  {
    time: "1:30 - 2:30",
    title: "How It Works",
    content: `Our platform leverages AI to transform ${data.idea} into a seamless experience. Users simply connect, customize, and launch.`,
  },
  {
    time: "2:30 - 3:00",
    title: "The Ask",
    content: "We're looking for partners who believe in democratizing innovation. Join us in making this vision a reality.",
  },
];

const analysisData = {
  score: 85,
  feedback: [
    { type: "positive", text: "Strong opening hook that captures attention" },
    { type: "positive", text: "Clear problem-solution narrative" },
    { type: "positive", text: "Good pacing throughout the pitch" },
    { type: "warning", text: "Consider adding specific metrics or traction" },
    { type: "warning", text: "Missing competitive differentiation" },
  ],
};

export const Dashboard = ({ data }: DashboardProps) => {
  const [activeTab, setActiveTab] = useState("script");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBlock, setCurrentBlock] = useState(0);

  const script = generateScript(data);

  return (
    <div className="min-h-screen bg-background pt-20 pb-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-foreground">Your Pitch is Ready</h1>
          <p className="text-muted-foreground mt-1">Review, practice, and perfect</p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 mb-6 p-1 bg-muted rounded-xl"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "script" && (
            <motion.div
              key="script"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {script.map((block, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "glass-card rounded-xl p-4 transition-all",
                    currentBlock === index && "ring-2 ring-primary"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                      {block.time}
                    </span>
                    <span className="text-sm font-semibold text-foreground">{block.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {block.content}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === "practice" && (
            <motion.div
              key="practice"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Teleprompter */}
              <div className="glass-card rounded-xl p-6 min-h-[300px] flex flex-col">
                <div className="flex-1 flex items-center justify-center">
                  <motion.p
                    key={currentBlock}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xl font-medium text-foreground text-center leading-relaxed"
                  >
                    {script[currentBlock]?.content}
                  </motion.p>
                </div>
                <div className="text-center text-sm text-muted-foreground mt-4">
                  {script[currentBlock]?.time} — {script[currentBlock]?.title}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentBlock(0)}
                >
                  <RotateCcw className="w-5 h-5" />
                </Button>
                <Button
                  variant="default"
                  size="lg"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-8"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  {isPlaying ? "Pause" : "Start"}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentBlock(Math.min(currentBlock + 1, script.length - 1))}
                >
                  →
                </Button>
              </div>

              {/* Progress */}
              <div className="flex gap-1">
                {script.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex-1 h-1 rounded-full transition-all",
                      index <= currentBlock ? "bg-primary" : "bg-muted"
                    )}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "analysis" && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Score */}
              <div className="glass-card rounded-xl p-6 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-success/10 mb-4"
                >
                  <span className="text-4xl font-bold text-success">{analysisData.score}</span>
                </motion.div>
                <p className="text-lg font-semibold text-foreground">Great Pitch!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your pitch scores above average for hackathon presentations
                </p>
              </div>

              {/* Feedback */}
              <div className="space-y-3">
                {analysisData.feedback.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg",
                      item.type === "positive" ? "bg-success/10" : "bg-warning/10"
                    )}
                  >
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                        item.type === "positive" ? "bg-success" : "bg-warning"
                      )}
                    />
                    <p className="text-sm text-foreground">{item.text}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
