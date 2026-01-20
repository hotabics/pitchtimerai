// Demo Mode Prompt - Shows when anonymous user has used their free demo
import { motion } from "framer-motion";
import { Lock, LogIn, Sparkles, Gift, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUserStore } from "@/stores/userStore";
import { useNavigate } from "react-router-dom";

interface DemoModePromptProps {
  simulatorType: 'interview' | 'sales';
  canUseDemo: boolean;
}

export const DemoModePrompt = ({ simulatorType, canUseDemo }: DemoModePromptProps) => {
  const { openAuthModal } = useUserStore();
  const navigate = useNavigate();

  const simulatorName = simulatorType === 'interview' 
    ? 'Interview Simulator' 
    : 'Sales Simulator';

  if (canUseDemo) {
    // Show demo available banner
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <Card className="border-2 border-primary/30 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 bg-primary/20 rounded-full shrink-0">
              <Gift className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">
                🎁 Free Demo Session Available
              </p>
              <p className="text-sm text-muted-foreground">
                Try one {simulatorName} session free. Sign up to save results and unlock unlimited access.
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => openAuthModal('save')}
              className="shrink-0 gap-1.5"
            >
              <LogIn className="w-4 h-4" />
              Sign Up
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Demo used - show upgrade prompt
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <Card className="max-w-md w-full border-2 border-primary/30 shadow-2xl">
        <CardContent className="p-8 text-center space-y-6">
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse" />
            <div className="absolute inset-2 bg-primary/10 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Demo Complete! 🎉</h2>
            <p className="text-muted-foreground">
              You've used your free {simulatorName} session. Sign up to unlock unlimited practice and save your progress.
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              size="lg" 
              className="w-full gap-2"
              onClick={() => openAuthModal('save')}
            >
              <Sparkles className="w-5 h-5" />
              Create Free Account
              <ArrowRight className="w-4 h-4" />
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full"
              onClick={() => navigate('/')}
            >
              Maybe Later
            </Button>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Already have an account?{' '}
              <button 
                onClick={() => openAuthModal('save')}
                className="text-primary hover:underline"
              >
                Sign in
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
