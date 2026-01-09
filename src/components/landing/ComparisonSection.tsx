import { motion } from "framer-motion";
import { Check, Minus, Globe, Video, Layout, BarChart3 } from "lucide-react";

const comparisonData = [
  {
    category: "Context",
    icon: Globe,
    generic: "Generic prompts",
    pitchDeck: "Auto-Scrapes your Website",
  },
  {
    category: "Coaching",
    icon: Video,
    generic: "Text only",
    pitchDeck: "Real-time Face & Voice Analysis",
  },
  {
    category: "Structure",
    icon: Layout,
    generic: "Blocks of text",
    pitchDeck: "Timed Stage Choreography",
  },
  {
    category: "Feedback",
    icon: BarChart3,
    generic: "Subjective opinions",
    pitchDeck: "Data-driven Metrics (WPM, Eye Contact)",
  },
];

export const ComparisonSection = () => {
  return (
    <section id="features" className="py-20 px-4 scroll-mt-16">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
            Why not just ChatGPT?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Generic AI gives you text. We give you a complete pitch coaching platform.
          </p>
        </motion.div>

        {/* Comparison Grid */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {/* Generic AI Column */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="glass-premium rounded-2xl p-6 border border-muted-foreground/20 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-muted/20 to-transparent pointer-events-none" />
            
            <div className="relative">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <Minus className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Generic AI</h3>
                  <p className="text-xs text-muted-foreground">ChatGPT, Claude, etc.</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {comparisonData.map((item, index) => (
                  <motion.div
                    key={item.category}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <item.icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">{item.category}</p>
                      <p className="text-sm text-foreground/70">{item.generic}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* PitchDeck AI Column */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="glass-premium rounded-2xl p-6 border-2 border-primary/30 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-emerald-500/5 pointer-events-none" />
            
            {/* Recommended badge */}
            <div className="absolute -top-px -right-px">
              <div className="bg-gradient-to-r from-primary to-emerald-500 text-white text-xs font-medium px-3 py-1 rounded-bl-xl rounded-tr-xl">
                Recommended
              </div>
            </div>
            
            <div className="relative">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-primary/20">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Check className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">PitchPerfect</h3>
                  <p className="text-xs text-primary">All-in-One Platform</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {comparisonData.map((item, index) => (
                  <motion.div
                    key={item.category}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">{item.category}</p>
                      <p className="text-sm text-foreground font-medium">{item.pitchDeck}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};