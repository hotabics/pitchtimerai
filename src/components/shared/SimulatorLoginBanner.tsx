// Banner prompting anonymous users to login before starting simulations
import { motion } from 'framer-motion';
import { LogIn, Shield, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/stores/userStore';

interface SimulatorLoginBannerProps {
  context: 'interview' | 'sales';
}

export const SimulatorLoginBanner = ({ context }: SimulatorLoginBannerProps) => {
  const { isLoggedIn, openAuthModal } = useUserStore();
  const [isDismissed, setIsDismissed] = useState(false);

  if (isLoggedIn || isDismissed) return null;

  const contextText = context === 'interview' 
    ? 'interview simulation results'
    : 'sales simulation results';

  const benefitText = context === 'interview'
    ? 'Track your hireability score progress over time'
    : 'Track your sales performance and improvement';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-lg p-4 mb-6"
    >
      <button
        onClick={() => setIsDismissed(true)}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
      
      <div className="flex items-start gap-4 pr-6">
        <div className="p-2.5 bg-primary/10 rounded-full shrink-0">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground mb-1">
            Save your {contextText}
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            {benefitText}
          </p>
          
          <Button
            variant="default"
            size="sm"
            onClick={() => openAuthModal('save')}
            className="gap-2"
          >
            <LogIn className="w-4 h-4" />
            Sign In to Save Progress
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
