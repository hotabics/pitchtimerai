// Banner prompting anonymous users to login to save their work
import { motion } from 'framer-motion';
import { LogIn, Save, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/stores/userStore';

interface LoginPromptBannerProps {
  context?: 'pitch' | 'coach';
}

export const LoginPromptBanner = ({ context = 'pitch' }: LoginPromptBannerProps) => {
  const { isLoggedIn, openAuthModal } = useUserStore();
  const [isDismissed, setIsDismissed] = useState(false);

  if (isLoggedIn || isDismissed) return null;

  const contextText = context === 'coach' 
    ? 'your AI Coach analysis results'
    : 'your pitch scripts';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-lg p-3 mb-4"
    >
      <button
        onClick={() => setIsDismissed(true)}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
      
      <div className="flex items-center gap-3 pr-6">
        <div className="p-2 bg-primary/10 rounded-full">
          <Save className="w-4 h-4 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            Save {contextText}
          </p>
          <p className="text-xs text-muted-foreground">
            Sign in to keep your work and access it anytime
          </p>
        </div>
        
        <Button
          variant="default"
          size="sm"
          onClick={() => openAuthModal('save')}
          className="shrink-0"
        >
          <LogIn className="w-4 h-4 mr-1.5" />
          Sign In
        </Button>
      </div>
    </motion.div>
  );
};
