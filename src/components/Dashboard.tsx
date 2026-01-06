import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Video, BarChart3, Play, Pause, RotateCcw, Monitor, MousePointer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DemoInfo {
  hasDemo: boolean;
  demoType?: string;
  demoUrl?: string;
  demoDescription?: string;
}

interface DashboardProps {
  data: {
    idea: string;
    duration: number;
    problem: string;
    pitch: string;
    demo?: DemoInfo;
  };
}

const tabs = [
  { id: "script", label: "Script", icon: FileText },
  { id: "practice", label: "Practice", icon: Video },
  { id: "analysis", label: "Analysis", icon: BarChart3 },
];

const getDemoActions = (demo?: DemoInfo) => {
  if (!demo?.hasDemo) return [];
  
  const actions = [];
  
  if (demo.demoType === "website") {
    actions.push(
      { action: "Open browser to demo URL", timing: "Before slide 'How It Works'" },
      { action: "Show landing page and key features", timing: "During explanation" },
      { action: "Demonstrate user flow", timing: "Highlight the core value" },
    );
  } else if (demo.demoType === "mobile") {
    actions.push(
      { action: "Ensure device is mirrored to screen", timing: "Before demo section" },
      { action: "Open app and show home screen", timing: "During 'How It Works'" },
      { action: "Walk through main user journey", timing: "Keep interactions slow and visible" },
    );
  } else if (demo.demoType === "slides") {
    actions.push(
      { action: "Queue up video/slides in presenter mode", timing: "Before pitch starts" },
      { action: "Play pre-recorded demo", timing: "During 'How It Works' section" },
      { action: "Pause on key moments for emphasis", timing: "Sync with narration" },
    );
  }
  
  if (demo.demoDescription) {
    actions.push({ action: demo.demoDescription, timing: "Custom demo focus" });
  }
  
  return actions;
};

const generateScript = (data: DashboardProps["data"]) => {
  const hasDemo = data.demo?.hasDemo;
  
  const blocks = [
    {
      time: "0:00 - 0:30",
      title: "The Hook",
      content: `Imagine a world where ${data.problem.slice(0, 50)}... That's the reality for millions today.`,
      isDemo: false,
    },
    {
      time: "0:30 - 1:00",
      title: "The Problem",
      content: data.problem,
      isDemo: false,
    },
    {
      time: "1:00 - 1:30",
      title: "The Solution",
      content: data.pitch,
      isDemo: false,
    },
  ];
  
  if (hasDemo) {
    blocks.push({
      time: "1:30 - 2:30",
      title: "🖥️ Live Demo",
      content: `Let me show you how this works in action. [DEMO: ${data.demo?.demoDescription || "Show core functionality"}]`,
      isDemo: true,
    });
    blocks.push({
      time: "2:30 - 3:00",
      title: "The Ask",
      content: "As you just saw, our solution works. We're looking for partners who believe in this vision. Join us in making it a reality.",
      isDemo: false,
    });
  } else {
    blocks.push({
      time: "1:30 - 2:30",
      title: "How It Works",
      content: `Our platform leverages AI to transform ${data.idea} into a seamless experience. Users simply connect, customize, and launch.`,
      isDemo: false,
    });
    blocks.push({
      time: "2:30 - 3:00",
      title: "The Ask",
      content: "We're looking for partners who believe in democratizing innovation. Join us in making this vision a reality.",
      isDemo: false,
    });
  }
  
  return blocks;
};

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
                    currentBlock === index && "ring-2 ring-primary",
                    block.isDemo && "border-2 border-time-low bg-time-low/5"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn(
                      "text-xs font-medium px-2 py-1 rounded",
                      block.isDemo ? "bg-time-low/20 text-time-low" : "bg-primary/10 text-primary"
                    )}>
                      {block.time}
                    </span>
                    <span className="text-sm font-semibold text-foreground">{block.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {block.content}
                  </p>
                  {block.isDemo && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-time-low">
                      <Monitor className="w-3 h-3" />
                      <span>Demo segment - practice transitions!</span>
                    </div>
                  )}
                </motion.div>
              ))}
              
              {/* Demo Actions Section */}
              {data.demo?.hasDemo && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 p-4 rounded-xl bg-gradient-to-r from-time-low/10 to-primary/10 border border-time-low/30"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <MousePointer className="w-4 h-4 text-time-low" />
                    <h3 className="font-semibold text-foreground">Recommended Demo Actions</h3>
                  </div>
                  <div className="space-y-2">
                    {getDemoActions(data.demo).map((action, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                        className="flex items-start gap-3 p-2 rounded-lg bg-background/50"
                      >
                        <div className="w-5 h-5 rounded-full bg-time-low/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-time-low">{index + 1}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{action.action}</p>
                          <p className="text-xs text-muted-foreground">{action.timing}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
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
