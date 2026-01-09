import { motion } from "framer-motion";
import { FileText, Presentation, AudioWaveform, Check, X, Sparkles } from "lucide-react";

const bentoCards = [
  {
    id: "structure",
    title: "Structure vs. Wall of Text",
    description: "Don't guess the prompts. We bake in hackathon judging criteria automatically.",
    icon: FileText,
    visual: "comparison",
  },
  {
    id: "choreography",
    title: "Choreography vs. Static Script",
    description: "We sync your spoken words with stage cues and live demos. ChatGPT doesn't know when you need to click 'Login'.",
    icon: Presentation,
    visual: "sync",
  },
  {
    id: "feedback",
    title: "Feedback Loop",
    description: "Real-time audio analysis. We listen to your pace and tone. A text chatbot can't hear you panic.",
    icon: AudioWaveform,
    visual: "waveform",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
    },
  },
};

export const BentoGrid = () => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight mb-2">
          Why not just ChatGPT?
        </h2>
        <p className="text-muted-foreground text-sm">
          Generic AI gives you text. We give you a winning strategy.
        </p>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {bentoCards.map((card) => (
          <motion.div
            key={card.id}
            variants={item}
            className="glass-bento rounded-2xl p-6 flex flex-col group cursor-default"
          >
            {/* Visual */}
            <div className="mb-4 h-24 flex items-center justify-center">
              {card.visual === "comparison" && <ComparisonVisual />}
              {card.visual === "sync" && <SyncVisual />}
              {card.visual === "waveform" && <WaveformVisual />}
            </div>

            {/* Content */}
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <card.icon className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground leading-tight">
                {card.title}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {card.description}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

const ComparisonVisual = () => (
  <div className="flex items-center gap-4 w-full">
    {/* ChatGPT - messy text */}
    <div className="flex-1 p-3 rounded-lg bg-muted/50 border border-border/50">
      <div className="flex items-center gap-1.5 mb-2">
        <X className="w-3 h-3 text-time-high" />
        <span className="text-[10px] text-muted-foreground">Generic AI</span>
      </div>
      <div className="space-y-1">
        <div className="h-1.5 bg-muted-foreground/20 rounded w-full" />
        <div className="h-1.5 bg-muted-foreground/20 rounded w-4/5" />
        <div className="h-1.5 bg-muted-foreground/20 rounded w-full" />
        <div className="h-1.5 bg-muted-foreground/20 rounded w-3/5" />
      </div>
    </div>
    
    {/* PitchPerfect - structured */}
    <div className="flex-1 p-3 rounded-lg bg-primary/5 border border-primary/20">
      <div className="flex items-center gap-1.5 mb-2">
        <Check className="w-3 h-3 text-time-low" />
        <span className="text-[10px] text-primary">PitchPerfect</span>
      </div>
      <div className="space-y-1">
        <div className="flex gap-1">
          <div className="h-1.5 bg-primary/40 rounded w-1/4" />
          <div className="h-1.5 bg-time-low/40 rounded w-1/6" />
        </div>
        <div className="h-1.5 bg-primary/30 rounded w-3/4" />
        <div className="flex gap-1">
          <div className="h-1.5 bg-primary/40 rounded w-1/3" />
          <div className="h-1.5 bg-time-low/40 rounded w-1/6" />
        </div>
      </div>
    </div>
  </div>
);

const SyncVisual = () => (
  <div className="relative w-full h-full flex items-center justify-center">
    {/* Person icon */}
    <motion.div 
      className="absolute left-4 p-2 rounded-full bg-primary/10 border border-primary/20"
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <div className="w-6 h-6 rounded-full bg-primary/30 flex items-center justify-center">
        <div className="w-3 h-3 rounded-full bg-primary" />
      </div>
    </motion.div>
    
    {/* Sync lines */}
    <svg className="absolute w-16 h-8" viewBox="0 0 60 30">
      <motion.path
        d="M 5 15 Q 30 5 55 15"
        stroke="hsl(var(--primary))"
        strokeWidth="1.5"
        fill="none"
        strokeDasharray="4 4"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
    </svg>
    
    {/* Screen icon */}
    <motion.div 
      className="absolute right-4 p-2 rounded-lg bg-time-low/10 border border-time-low/20"
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
    >
      <div className="w-8 h-6 rounded bg-time-low/30 flex items-center justify-center">
        <Sparkles className="w-3 h-3 text-time-low" />
      </div>
    </motion.div>
  </div>
);

const WaveformVisual = () => (
  <div className="w-full flex items-center justify-center gap-1">
    {[0.4, 0.7, 1, 0.6, 0.9, 0.5, 0.8, 0.3, 0.6, 0.9, 0.4].map((height, i) => (
      <motion.div
        key={i}
        className="w-1.5 rounded-full bg-time-low"
        style={{ height: `${height * 40}px` }}
        animate={{
          height: [`${height * 40}px`, `${height * 20}px`, `${height * 40}px`],
        }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          delay: i * 0.1,
          ease: "easeInOut",
        }}
      />
    ))}
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1 }}
      className="ml-2 p-1 rounded-full bg-time-low"
    >
      <Check className="w-3 h-3 text-success-foreground" />
    </motion.div>
  </div>
);
