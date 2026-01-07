import { motion } from "framer-motion";
import { Eye, Smile, Volume2, Timer, Target, TrendingUp } from "lucide-react";

const metrics = [
  { label: "Eye Contact", value: "87%", icon: Eye, color: "text-emerald-400", bg: "bg-emerald-500/20" },
  { label: "Smile Score", value: "72%", icon: Smile, color: "text-amber-400", bg: "bg-amber-500/20" },
  { label: "Speaking Pace", value: "142 WPM", icon: Volume2, color: "text-cyan-400", bg: "bg-cyan-500/20" },
  { label: "Filler Words", value: "3", icon: Timer, color: "text-rose-400", bg: "bg-rose-500/20" },
];

export const AICoachSpotlight = () => {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-transparent via-muted/20 to-transparent">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-medium mb-4">
            <Target className="w-3.5 h-3.5" />
            Real-time AI Analysis
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
            The "Iron Man" HUD for Presenters
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Computer Vision meets Public Speaking. Get instant feedback on eye contact, 
            smile probability, and speaking pace — all in real-time.
          </p>
        </motion.div>

        {/* HUD Visual */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="relative max-w-4xl mx-auto"
        >
          {/* Main HUD Container */}
          <div className="glass-premium rounded-3xl p-6 md:p-8 border border-cyan-500/20 relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-primary/5 pointer-events-none" />
            
            <div className="relative grid md:grid-cols-5 gap-6">
              {/* Face Mesh Visualization - Takes 3 cols */}
              <div className="md:col-span-3 aspect-video bg-muted/30 rounded-2xl overflow-hidden relative flex items-center justify-center">
                {/* Recording indicator */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-medium text-muted-foreground">LIVE ANALYSIS</span>
                </div>
                
                {/* Face mesh SVG */}
                <svg className="w-40 h-52" viewBox="0 0 100 130">
                  {/* Head outline */}
                  <motion.ellipse
                    cx="50"
                    cy="60"
                    rx="38"
                    ry="48"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="1"
                    strokeDasharray="3 2"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  
                  {/* Eyes */}
                  <motion.ellipse 
                    cx="35" cy="50" rx="10" ry="6" 
                    fill="none" 
                    stroke="rgb(52, 211, 153)" 
                    strokeWidth="1.5"
                    animate={{ scale: [1, 1.1, 1] }} 
                    transition={{ duration: 2, repeat: Infinity }} 
                  />
                  <motion.ellipse 
                    cx="65" cy="50" rx="10" ry="6" 
                    fill="none" 
                    stroke="rgb(52, 211, 153)" 
                    strokeWidth="1.5"
                    animate={{ scale: [1, 1.1, 1] }} 
                    transition={{ duration: 2, repeat: Infinity, delay: 0.1 }} 
                  />
                  
                  {/* Eye pupils */}
                  <motion.circle cx="35" cy="50" r="3" fill="rgb(52, 211, 153)" 
                    animate={{ cx: [35, 37, 35] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  <motion.circle cx="65" cy="50" r="3" fill="rgb(52, 211, 153)"
                    animate={{ cx: [65, 67, 65] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  
                  {/* Nose */}
                  <path d="M 50 55 L 50 72" stroke="hsl(var(--muted-foreground))" strokeWidth="1" />
                  
                  {/* Mouth - animated smile */}
                  <motion.path 
                    d="M 35 88 Q 50 100 65 88" 
                    fill="none" 
                    stroke="rgb(251, 191, 36)" 
                    strokeWidth="2"
                    strokeLinecap="round"
                    animate={{ 
                      d: ["M 35 88 Q 50 100 65 88", "M 35 90 Q 50 95 65 90", "M 35 88 Q 50 100 65 88"] 
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  
                  {/* Face mesh dots */}
                  {[
                    [20, 40], [30, 32], [40, 28], [50, 25], [60, 28], [70, 32], [80, 40],
                    [18, 55], [82, 55], [20, 70], [80, 70],
                    [30, 82], [50, 105], [70, 82],
                    [25, 95], [75, 95]
                  ].map(([x, y], i) => (
                    <motion.circle
                      key={i}
                      cx={x}
                      cy={y}
                      r="2"
                      fill="hsl(var(--primary) / 0.6)"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.08 }}
                    />
                  ))}
                  
                  {/* Connecting lines */}
                  <motion.line x1="20" y1="40" x2="30" y2="32" stroke="hsl(var(--primary) / 0.3)" strokeWidth="0.5" />
                  <motion.line x1="30" y1="32" x2="40" y2="28" stroke="hsl(var(--primary) / 0.3)" strokeWidth="0.5" />
                  <motion.line x1="40" y1="28" x2="50" y2="25" stroke="hsl(var(--primary) / 0.3)" strokeWidth="0.5" />
                  <motion.line x1="50" y1="25" x2="60" y2="28" stroke="hsl(var(--primary) / 0.3)" strokeWidth="0.5" />
                  <motion.line x1="60" y1="28" x2="70" y2="32" stroke="hsl(var(--primary) / 0.3)" strokeWidth="0.5" />
                  <motion.line x1="70" y1="32" x2="80" y2="40" stroke="hsl(var(--primary) / 0.3)" strokeWidth="0.5" />
                </svg>
                
                {/* Bottom metrics overlay */}
                <div className="absolute bottom-4 left-4 right-4 flex justify-between">
                  <div className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium backdrop-blur-sm">
                    Eye Contact: 87%
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-medium backdrop-blur-sm">
                    😊 Engaged
                  </div>
                </div>
              </div>
              
              {/* Metrics Panel - Takes 2 cols */}
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-medium text-foreground">Live Metrics</span>
                </div>
                
                {metrics.map((metric, index) => (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50"
                  >
                    <div className={`w-10 h-10 rounded-lg ${metric.bg} flex items-center justify-center`}>
                      <metric.icon className={`w-5 h-5 ${metric.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">{metric.label}</p>
                      <p className={`text-lg font-bold ${metric.color}`}>{metric.value}</p>
                    </div>
                  </motion.div>
                ))}
                
                {/* Overall score */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.7 }}
                  className="mt-4 p-4 rounded-xl bg-gradient-to-br from-primary/20 to-emerald-500/10 border border-primary/20"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Overall Score</span>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-bold text-primary">8.5</span>
                      <span className="text-xs text-muted-foreground">/10</span>
                    </div>
                  </div>
                  <p className="text-xs text-emerald-400 mt-1">Above average for hackathon demos!</p>
                </motion.div>
              </div>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute -top-4 -left-4 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
        </motion.div>
      </div>
    </section>
  );
};