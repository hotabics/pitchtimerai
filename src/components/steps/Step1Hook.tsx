import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, AlertCircle, Wand2, Mic, Video, Brain, Target } from "lucide-react";
import { TimeEater } from "@/components/landing/TimeEater";
import { BentoGrid } from "@/components/landing/BentoGrid";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export type EntryMode = "generate" | "custom_script";

interface Step1HookProps {
  onNext: (idea: string) => void;
  onPracticeOwn: () => void;
  onOpenAICoach?: () => void;
}

const sloganVariations = [
  { subject: "Hackathons", contrast: "code" },
  { subject: "Deals", contrast: "spreadsheets" },
  { subject: "Degrees", contrast: "research" },
  { subject: "Investments", contrast: "features" },
];

export const Step1Hook = ({ onNext, onPracticeOwn, onOpenAICoach }: Step1HookProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sloganVariations.length);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const { subject, contrast } = sloganVariations[currentIndex];

  return (
    <div className="min-h-screen hero-gradient overflow-x-hidden">
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative">
        {/* Floating badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-premium text-xs font-medium text-primary border border-primary/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Powered Pitch Optimization</span>
          </div>
        </motion.div>

        {/* Main headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center max-w-3xl mx-auto mb-10"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter text-foreground mb-4">
            <AnimatePresence mode="wait">
              <motion.span
                key={subject}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="inline-block italic underline decoration-foreground/30 underline-offset-4"
              >
                {subject}
              </motion.span>
            </AnimatePresence>{" "}
            are won with{" "}
            <span className="bg-gradient-to-r from-primary via-primary to-emerald-400 bg-clip-text text-transparent">
              stories
            </span>
            , not just{" "}
            <AnimatePresence mode="wait">
              <motion.span
                key={contrast}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="inline-block italic underline decoration-foreground/30 underline-offset-4"
              >
                {contrast}
              </motion.span>
            </AnimatePresence>
            .
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            See exactly how much prep time you'll save with our{" "}
            <span className="text-foreground font-medium">AI-powered pitch builder</span>.
          </p>
        </motion.div>

        {/* Entry Mode Selection or Time Eater */}
        <AnimatePresence mode="wait">
          {!showOptions ? (
            <motion.div
              key="time-eater"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <TimeEater onSubmit={onNext} />
              
              {/* Practice your own pitch link */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="text-center mt-8"
              >
                <button
                  onClick={() => setShowOptions(true)}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors underline underline-offset-4"
                >
                  Or practice your own pitch →
                </button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="options"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-2xl mx-auto"
            >
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Generate a pitch */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <button
                    onClick={() => setShowOptions(false)}
                    className="w-full h-full glass-premium rounded-2xl p-6 border border-primary/20 hover:border-primary/40 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Wand2 className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground">Generate a Pitch</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Start from scratch with AI guidance. We'll help you craft the perfect pitch.
                    </p>
                  </button>
                </motion.div>

                {/* Practice your own */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <button
                    onClick={onPracticeOwn}
                    className="w-full h-full glass-premium rounded-2xl p-6 border border-white/10 hover:border-primary/30 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                        <Mic className="w-5 h-5 text-foreground" />
                      </div>
                      <h3 className="font-semibold text-foreground">Practice My Own</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Paste your existing pitch and get AI coaching on delivery.
                    </p>
                  </button>
                </motion.div>
              </div>

              <button
                onClick={() => setShowOptions(false)}
                className="block mx-auto mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to generator
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showOptions ? 0 : 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex flex-col items-center gap-2 text-muted-foreground"
          >
            <span className="text-xs">Scroll to learn more</span>
            <div className="w-5 h-8 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-1">
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50"
              />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Real-time AI Analysis Section */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
              Real-time AI Analysis
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Don't guess how you sound. Let our AI analyze your micro-expressions, 
              speech pace, and content against real hackathon criteria.
            </p>
          </motion.div>

          {/* Split Card Visual */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="glass-bento rounded-2xl overflow-hidden"
          >
            <div className="grid md:grid-cols-2">
              {/* Webcam Side */}
              <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-border/30">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                  <span className="text-xs font-medium text-muted-foreground">LIVE ANALYSIS</span>
                </div>
                <div className="relative aspect-video bg-muted/50 rounded-xl overflow-hidden mb-4">
                  {/* Face mesh visualization */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-32 h-40" viewBox="0 0 100 130">
                      {/* Head outline */}
                      <motion.ellipse
                        cx="50"
                        cy="60"
                        rx="35"
                        ry="45"
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="1.5"
                        strokeDasharray="4 2"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      {/* Eyes */}
                      <motion.ellipse cx="35" cy="50" rx="8" ry="5" fill="none" stroke="hsl(var(--success))" strokeWidth="1" 
                        animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                      <motion.ellipse cx="65" cy="50" rx="8" ry="5" fill="none" stroke="hsl(var(--success))" strokeWidth="1"
                        animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.1 }} />
                      {/* Nose */}
                      <path d="M 50 55 L 50 70" stroke="hsl(var(--muted-foreground))" strokeWidth="1" />
                      {/* Mouth */}
                      <motion.path 
                        d="M 35 85 Q 50 95 65 85" 
                        fill="none" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth="1.5"
                        animate={{ d: ["M 35 85 Q 50 95 65 85", "M 35 88 Q 50 92 65 88", "M 35 85 Q 50 95 65 85"] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      />
                      {/* Face mesh dots */}
                      {[[20, 40], [30, 35], [40, 30], [50, 28], [60, 30], [70, 35], [80, 40], 
                        [25, 60], [75, 60], [30, 80], [50, 100], [70, 80]].map(([x, y], i) => (
                        <motion.circle
                          key={i}
                          cx={x}
                          cy={y}
                          r="1.5"
                          fill="hsl(var(--primary) / 0.5)"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0.3, 0.8, 0.3] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                        />
                      ))}
                    </svg>
                  </div>
                  {/* Metrics overlay */}
                  <div className="absolute bottom-3 left-3 right-3 flex justify-between">
                    <div className="px-2 py-1 rounded bg-success/20 text-success text-xs font-medium">
                      Eye Contact: 85%
                    </div>
                    <div className="px-2 py-1 rounded bg-primary/20 text-primary text-xs font-medium">
                      😊 Engaged
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  <Brain className="w-4 h-4 inline mr-1" />
                  MediaPipe tracks 468 facial landmarks in real-time
                </p>
              </div>

              {/* Scorecard Side */}
              <div className="p-6 md:p-8 bg-muted/30">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">JURY SCORECARD</span>
                </div>
                
                {/* Score display */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">8.5</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Strong Pitch</p>
                    <p className="text-xs text-muted-foreground">Above average for hackathon demos</p>
                  </div>
                </div>

                {/* Metrics */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Speaking Pace</span>
                    <span className="font-medium text-success">142 WPM ✓</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Filler Words</span>
                    <span className="font-medium text-warning">3 detected</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Content Coverage</span>
                    <span className="font-medium text-success">6/7 points</span>
                  </div>
                </div>

                {/* Feedback quote */}
                <div className="mt-6 p-3 rounded-lg bg-background/50 border border-border/50">
                  <p className="text-xs text-muted-foreground italic">
                    "Great problem articulation! Consider adding more specific traction metrics."
                  </p>
                  <p className="text-xs text-primary mt-1">— AI Jury Analysis</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          {onOpenAICoach && (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8"
            >
              <Button size="lg" onClick={onOpenAICoach} className="gap-2">
                <Video className="w-5 h-5" />
                Try AI Coach Now
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={onOpenAICoach}
                className="gap-2 border-primary/30 hover:border-primary/50 hover:bg-primary/5"
              >
                <Video className="w-5 h-5" />
                Open AI Coach (Webcam)
              </Button>
            </motion.div>
          )}
        </div>
      </section>

      {/* Bento Grid Section */}
      <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-transparent to-muted/30">
        <BentoGrid />
      </section>

      {/* Public Demo Disclaimer */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3 }}
          className="flex items-center gap-2 text-xs text-muted-foreground/80 bg-background/80 backdrop-blur-sm border border-border/50 rounded-full px-4 py-2 shadow-lg"
        >
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          <span>Public demo – all data is visible to everyone</span>
        </motion.div>
      </div>
    </div>
  );
};
