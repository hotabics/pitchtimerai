import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Phone, History, Sparkles, Target, Brain, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SalesSimulator = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Brain,
      title: "AI Potential Client",
      description: "Practice with realistic AI personas that respond dynamically"
    },
    {
      icon: Sparkles,
      title: "Real-time Coaching",
      description: "Get live suggestions while you're on the call"
    },
    {
      icon: BarChart3,
      title: "Detailed Analysis",
      description: "Comprehensive post-call performance breakdown"
    },
    {
      icon: Target,
      title: "Skill Development",
      description: "Track your progress and improve over time"
    }
  ];

  return (
    <div className="min-h-screen bg-background pt-20 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Phone className="w-4 h-4" />
            Sales Training
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            AI Sales Cold Call
            <span className="text-primary block mt-2">Simulator</span>
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Practice real cold calls with an AI buyer and get live coaching feedback.
            Master your sales pitch in a safe, realistic environment.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate("/sales-simulator/setup")}
              className="gap-2"
            >
              <Phone className="w-5 h-5" />
              Start New Sales Call
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate("/profile")}
              className="gap-2"
            >
              <History className="w-5 h-5" />
              View Past Simulations
            </Button>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Stats / Social Proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-muted/50 rounded-xl p-6 text-center"
        >
          <p className="text-muted-foreground">
            "This feels like a real cold call — but safer, smarter, and actually helpful."
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default SalesSimulator;
