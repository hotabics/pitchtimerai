import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Briefcase, FileText, ArrowRight, Target, 
  Volume2, Zap, Award, Users
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SimulatorLoginBanner } from "@/components/shared/SimulatorLoginBanner";
import { InterviewLeaderboard } from "@/components/profile/InterviewLeaderboard";

const InterviewSimulator = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Target,
      title: "CV-Job Synergy Analysis",
      description: "AI identifies matches and gaps between your experience and job requirements"
    },
    {
      icon: Volume2,
      title: "Voice-First Simulation",
      description: "Practice with voice responses and real-time waveform feedback"
    },
    {
      icon: Zap,
      title: "Strategic Reframing",
      description: "Learn to present your real experience in the most compelling way"
    },
    {
      icon: Award,
      title: "Hireability Score",
      description: "Get a realistic assessment of your interview performance"
    }
  ];

  return (
    <div className="min-h-screen bg-interview-bg pt-20 pb-12">
      {/* Login Banner for anonymous users */}
      <div className="max-w-5xl mx-auto px-4 pt-4">
        <SimulatorLoginBanner context="interview" />
      </div>
      
      {/* Hero Section - Neo-Noir Style */}
      <div className="relative overflow-hidden">
        {/* Cinematic gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-interview-mustard/5 via-transparent to-interview-blood/5" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-interview-mustard/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-interview-blood/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-5xl mx-auto px-4 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Badge 
              variant="outline" 
              className="border-interview-mustard/50 text-interview-mustard bg-interview-mustard/10 mb-4"
            >
              <Briefcase className="w-3 h-3 mr-1" />
              Interview Simulator
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold text-interview-text mb-4">
              The First Round
            </h1>
            <p className="text-lg md:text-xl text-interview-muted max-w-2xl mx-auto">
              Master the art of <span className="text-interview-mustard">strategic honesty</span>. 
              Practice job interviews with AI that knows your CV and the job requirements.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mt-8"
          >
            <Button
              size="lg"
              onClick={() => navigate("/interview-simulator/setup")}
              className="gap-2 bg-interview-mustard hover:bg-interview-mustard/90 text-interview-bg font-semibold text-lg px-8"
            >
              Start Interview Prep
              <ArrowRight className="w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* How It Works */}
      <div className="max-w-5xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-interview-text mb-4">
            How It Works
          </h2>
          <p className="text-interview-muted">Three phases to interview mastery</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Phase 1 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-interview-card border-interview-border h-full">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full bg-interview-mustard/20 flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-interview-mustard" />
                </div>
                <Badge className="bg-interview-mustard/20 text-interview-mustard border-0 mb-3">
                  Phase 1
                </Badge>
                <h3 className="text-xl font-bold text-interview-text mb-2">
                  The Intel Briefing
                </h3>
                <p className="text-interview-muted text-sm">
                  Paste the job URL or description. Upload your CV. 
                  AI analyzes the synergy between your experience and requirements.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Phase 2 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-interview-card border-interview-blood/30 h-full relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-interview-blood/5 to-transparent" />
              <CardContent className="pt-6 relative">
                <div className="w-12 h-12 rounded-full bg-interview-blood/20 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-interview-blood" />
                </div>
                <Badge className="bg-interview-blood/20 text-interview-blood border-0 mb-3">
                  Phase 2
                </Badge>
                <h3 className="text-xl font-bold text-interview-text mb-2">
                  The Hot Seat
                </h3>
                <p className="text-interview-muted text-sm">
                  Face the AI Interviewer. Answer 5-7 strategic questions 
                  designed to probe your fit for the role.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Phase 3 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="bg-interview-card border-interview-border h-full">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                  <Award className="w-6 h-6 text-green-500" />
                </div>
                <Badge className="bg-green-500/20 text-green-500 border-0 mb-3">
                  Phase 3
                </Badge>
                <h3 className="text-xl font-bold text-interview-text mb-2">
                  The Strategic Verdict
                </h3>
                <p className="text-interview-muted text-sm">
                  Get your Hireability Score and learn exactly how to 
                  reframe your answers for maximum impact.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + i * 0.1 }}
            >
              <Card className="bg-interview-card/50 border-interview-border hover:border-interview-mustard/30 transition-colors">
                <CardContent className="pt-6 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-interview-mustard/10 flex items-center justify-center shrink-0">
                    <feature.icon className="w-5 h-5 text-interview-mustard" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-interview-text mb-1">{feature.title}</h3>
                    <p className="text-sm text-interview-muted">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Leaderboard Section */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <InterviewLeaderboard />
        </motion.div>
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="text-center py-12"
      >
        <Button
          size="lg"
          onClick={() => navigate("/interview-simulator/setup")}
          className="gap-2 bg-interview-blood hover:bg-interview-blood/90 text-white font-semibold"
        >
          <Briefcase className="w-5 h-5" />
          Begin Your Preparation
        </Button>
      </motion.div>
    </div>
  );
};

export default InterviewSimulator;
