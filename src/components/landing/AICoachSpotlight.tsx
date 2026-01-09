import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Eye, 
  Smile, 
  Volume2, 
  Timer, 
  Target, 
  TrendingUp, 
  Play, 
  Pause,
  Sparkles,
  Sprout,
  PersonStanding,
  Hand,
  Activity,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const metricsData = [
  { label: "Eye Contact", baseValue: 87, icon: Eye, color: "text-emerald-400", bg: "bg-emerald-500/20", unit: "%" },
  { label: "Posture", baseValue: 92, icon: PersonStanding, color: "text-yellow-400", bg: "bg-yellow-500/20", unit: "%" },
  { label: "Speaking Pace", baseValue: 142, icon: Volume2, color: "text-cyan-400", bg: "bg-cyan-500/20", unit: " WPM" },
  { label: "Hands Visible", baseValue: 85, icon: Hand, color: "text-orange-400", bg: "bg-orange-500/20", unit: "%" },
];

const demoTranscript = [
  { time: 0, text: "Hey everyone, I'm excited to show you..." },
  { time: 2, text: "...our AI-powered pitch coach that helps you..." },
  { time: 4, text: "...practice and perfect your delivery in real-time." },
  { time: 6, text: "The computer vision tracks your eye contact..." },
  { time: 8, text: "...while full body analysis monitors your posture." },
];

const featureCards = [
  {
    icon: Activity,
    iconBg: "bg-gradient-to-br from-red-500/20 to-green-500/20",
    iconColor: "text-emerald-400",
    title: "The Smart Timeline",
    subtitle: "Precision Feedback",
    description: "Instantly jump to your mistakes. Click a red marker on the timeline to see exactly where you stumbled or lost eye contact.",
    accent: "border-emerald-500/30",
  },
  {
    icon: PersonStanding,
    iconBg: "bg-gradient-to-br from-yellow-500/20 to-orange-500/20",
    iconColor: "text-yellow-400",
    title: "Full Body Language",
    subtitle: "Beyond the Face",
    description: "Stop swaying and open up your posture. We track your shoulders, hands, and stability to build your executive presence.",
    accent: "border-yellow-500/30",
  },
  {
    icon: Sparkles,
    iconBg: "bg-gradient-to-br from-emerald-500/20 to-cyan-500/20",
    iconColor: "text-cyan-400",
    title: "Glows & Grows",
    subtitle: "Constructive Coaching",
    description: "We don't just criticize. We highlight your 'Power Moments' so you know what to keep doing.",
    accent: "border-cyan-500/30",
  },
];

export const AICoachSpotlight = () => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [metrics, setMetrics] = useState(metricsData.map(m => ({ ...m, value: m.baseValue })));
  
  // Simulate live metrics updates
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentTime(prev => (prev + 0.5) % 10);
      setMetrics(prev => prev.map(m => ({
        ...m,
        value: m.label === "Speaking Pace" 
          ? Math.min(180, Math.max(120, m.baseValue + Math.floor(Math.random() * 20 - 10)))
          : Math.min(100, Math.max(70, m.baseValue + Math.floor(Math.random() * 10 - 5)))
      })));
    }, 500);
    
    return () => clearInterval(interval);
  }, [isPlaying]);

  const currentTranscript = demoTranscript.filter(t => t.time <= currentTime);

  return (
    <section 
      id="ai-coach" 
      className="py-24 px-4 bg-slate-900 relative overflow-hidden scroll-mt-16"
    >
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[300px] bg-primary/5 rounded-full blur-3xl" />
      
      <div className="max-w-6xl mx-auto relative">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-6">
            <Target className="w-4 h-4" />
            AI Coach 2.0 — Full Body Analysis
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4">
            The <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">"Iron Man"</span> HUD for Presenters
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Real-time Computer Vision running directly in your browser. 
            Track face, body, and voice — all at once.
          </p>
        </motion.div>

        {/* Main HUD Visual - The "Iron Man" Mock-up */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="relative max-w-5xl mx-auto mb-20"
        >
          {/* Laptop Frame */}
          <div className="bg-slate-800 rounded-t-2xl p-2 border border-slate-700">
            <div className="flex items-center gap-2 px-2 pb-2">
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-green-500/70" />
              <div className="flex-1 mx-4">
                <div className="bg-slate-700 rounded-md px-3 py-1 text-xs text-slate-400 text-center">
                  pitchperfect.ai/coach
                </div>
              </div>
            </div>
            
            {/* Screen Content */}
            <div className="bg-slate-950 rounded-lg overflow-hidden border border-slate-700/50 aspect-video relative">
              {/* Recording indicator */}
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                <motion.div 
                  className="w-3 h-3 rounded-full bg-red-500"
                  animate={isPlaying ? { opacity: [1, 0.3, 1] } : { opacity: 0.3 }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <span className="text-xs font-semibold text-white bg-black/50 px-2 py-1 rounded backdrop-blur-sm">
                  {isPlaying ? "● REC 02:34" : "PAUSED"}
                </span>
              </div>
              
              {/* Play/Pause control */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPlaying(!isPlaying)}
                className="absolute top-4 right-4 z-20 h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>

              {/* Main visualization area */}
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Body + Face Mesh SVG */}
                <svg className="w-64 h-80" viewBox="0 0 200 260">
                  {/* Body skeleton - Yellow lines */}
                  <g className="body-skeleton">
                    {/* Torso */}
                    <motion.line 
                      x1="100" y1="90" x2="100" y2="160" 
                      stroke="#FACC15" strokeWidth="3" strokeLinecap="round"
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    {/* Shoulders */}
                    <motion.line 
                      x1="60" y1="100" x2="140" y2="100" 
                      stroke="#FACC15" strokeWidth="3" strokeLinecap="round"
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
                    />
                    {/* Left arm */}
                    <motion.path 
                      d="M 60 100 L 40 130 L 30 165" 
                      fill="none" stroke="#FB923C" strokeWidth="3" strokeLinecap="round"
                      animate={{ opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    {/* Right arm */}
                    <motion.path 
                      d="M 140 100 L 160 130 L 170 165" 
                      fill="none" stroke="#FB923C" strokeWidth="3" strokeLinecap="round"
                      animate={{ opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                    />
                    {/* Hips */}
                    <motion.line 
                      x1="75" y1="160" x2="125" y2="160" 
                      stroke="#FACC15" strokeWidth="3" strokeLinecap="round"
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
                    />
                    
                    {/* Joint dots */}
                    {[[60, 100], [140, 100], [40, 130], [160, 130], [30, 165], [170, 165], [75, 160], [125, 160]].map(([x, y], i) => (
                      <motion.circle
                        key={`joint-${i}`}
                        cx={x}
                        cy={y}
                        r="5"
                        fill="#FACC15"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                      />
                    ))}
                  </g>
                  
                  {/* Face mesh - Cyan lines */}
                  <g className="face-mesh">
                    {/* Head outline */}
                    <motion.ellipse
                      cx="100"
                      cy="50"
                      rx="35"
                      ry="42"
                      fill="none"
                      stroke="#22D3EE"
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                      animate={{ strokeDashoffset: [0, -20] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />
                    
                    {/* Eyes */}
                    <motion.ellipse 
                      cx="85" cy="45" rx="8" ry="5" 
                      fill="none" stroke="#22D3EE" strokeWidth="2"
                      animate={{ scale: [1, 1.05, 1] }} 
                      transition={{ duration: 2, repeat: Infinity }} 
                    />
                    <motion.ellipse 
                      cx="115" cy="45" rx="8" ry="5" 
                      fill="none" stroke="#22D3EE" strokeWidth="2"
                      animate={{ scale: [1, 1.05, 1] }} 
                      transition={{ duration: 2, repeat: Infinity, delay: 0.1 }} 
                    />
                    
                    {/* Eye pupils - tracking */}
                    <motion.circle 
                      cx="85" cy="45" r="2.5" fill="#22D3EE" 
                      animate={{ cx: [85, 87, 85, 83, 85] }}
                      transition={{ duration: 4, repeat: Infinity }}
                    />
                    <motion.circle 
                      cx="115" cy="45" r="2.5" fill="#22D3EE"
                      animate={{ cx: [115, 117, 115, 113, 115] }}
                      transition={{ duration: 4, repeat: Infinity }}
                    />
                    
                    {/* Nose */}
                    <path d="M 100 50 L 100 62" stroke="#22D3EE" strokeWidth="1" opacity="0.6" />
                    
                    {/* Mouth - animated smile */}
                    <motion.path 
                      d="M 88 72 Q 100 82 112 72" 
                      fill="none" 
                      stroke="#22D3EE" 
                      strokeWidth="2"
                      strokeLinecap="round"
                      animate={{ 
                        d: ["M 88 72 Q 100 82 112 72", "M 88 74 Q 100 78 112 74", "M 88 72 Q 100 82 112 72"] 
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                    
                    {/* Face mesh dots */}
                    {[
                      [70, 35], [85, 30], [100, 28], [115, 30], [130, 35],
                      [68, 50], [132, 50],
                      [75, 65], [125, 65],
                      [85, 78], [115, 78],
                    ].map(([x, y], i) => (
                      <motion.circle
                        key={`face-${i}`}
                        cx={x}
                        cy={y}
                        r="2"
                        fill="#22D3EE"
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                      />
                    ))}
                  </g>
                </svg>
              </div>

              {/* HUD Overlays - Corners */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 mt-10">
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 backdrop-blur-md"
                >
                  <span className="text-emerald-400 text-sm font-bold">
                    👁️ Eye Contact: {metrics[0].value}%
                  </span>
                </motion.div>
              </div>
              
              <div className="absolute bottom-20 left-4">
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="px-3 py-2 rounded-lg bg-yellow-500/20 border border-yellow-500/40 backdrop-blur-md"
                >
                  <span className="text-yellow-400 text-xs font-bold">
                    🧍 Posture: A
                  </span>
                </motion.div>
              </div>
              
              <div className="absolute bottom-20 right-4">
                <motion.div 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="px-3 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/40 backdrop-blur-md"
                >
                  <span className="text-cyan-400 text-xs font-bold">
                    🎙️ WPM: {metrics[2].value}
                  </span>
                </motion.div>
              </div>
              
              <div className="absolute top-16 right-4">
                <motion.div 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="px-3 py-2 rounded-lg bg-orange-500/20 border border-orange-500/40 backdrop-blur-md"
                >
                  <span className="text-orange-400 text-xs font-bold">
                    ✋ Hands: Visible
                  </span>
                </motion.div>
              </div>

              {/* Teleprompter overlay */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-black/60 backdrop-blur-md rounded-lg p-3 border border-white/10">
                  <AnimatePresence mode="popLayout">
                    {currentTranscript.slice(-2).map((item, i) => (
                      <motion.div
                        key={item.time}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: i === currentTranscript.slice(-2).length - 1 ? 1 : 0.4, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-sm text-white/90 font-medium"
                      >
                        {item.text}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
          
          {/* Laptop base */}
          <div className="bg-slate-700 h-4 rounded-b-lg mx-8 border-x border-b border-slate-600" />
          <div className="bg-slate-600 h-2 rounded-b-xl mx-16" />
          
          {/* Caption */}
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="text-center text-slate-500 text-sm mt-6 italic"
          >
            Real-time Computer Vision running directly in your browser.
          </motion.p>
        </motion.div>

        {/* Feature Grid - Bento Box */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {featureCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * index }}
              className={`group relative p-6 rounded-2xl bg-slate-800/50 border ${card.accent} hover:bg-slate-800/80 transition-all duration-300`}
            >
              {/* Icon */}
              <div className={`w-14 h-14 rounded-xl ${card.iconBg} flex items-center justify-center mb-4 border border-white/5`}>
                <card.icon className={`w-7 h-7 ${card.iconColor}`} />
              </div>
              
              {/* Content */}
              <h3 className="text-lg font-bold text-white mb-1">{card.title}</h3>
              <p className={`text-sm font-medium ${card.iconColor} mb-3`}>{card.subtitle}</p>
              <p className="text-slate-400 text-sm leading-relaxed">{card.description}</p>
              
              {/* Hover glow */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Link to="/ai-coach">
            <Button 
              size="lg" 
              variant="outline"
              className="group border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400 px-8 py-6 text-lg"
            >
              <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              Try the AI Coach
              <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <p className="text-slate-500 text-sm mt-3">No login required</p>
        </motion.div>
      </div>
    </section>
  );
};
