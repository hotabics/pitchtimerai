// 48h Pass Countdown Timer Component

import { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useUserStore } from '@/stores/userStore';
import { toast } from '@/hooks/use-toast';

export const PassCountdown = () => {
  const { userPlan, planExpiresAt } = useUserStore();
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);
  const [warningShown, setWarningShown] = useState(false);

  useEffect(() => {
    if (userPlan !== 'pass_48h' || !planExpiresAt) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const expiry = new Date(planExpiresAt);
      const diff = expiry.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Expired');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      // Check if expiring soon (< 2 hours)
      const expiringSoon = hours < 2;
      setIsExpiringSoon(expiringSoon);

      // Show warning toast once when < 2 hours remaining
      if (expiringSoon && !warningShown) {
        setWarningShown(true);
        toast({
          title: '⏰ Your subscription expires soon!',
          description: `Your 48h Pass expires in ${hours}h ${minutes}m. Upgrade to Pro for unlimited access.`,
          duration: 8000,
        });
      }

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [userPlan, planExpiresAt, warningShown]);

  if (userPlan !== 'pass_48h' || !planExpiresAt) return null;

  return (
    <Badge 
      variant="outline" 
      className={`gap-1 text-[10px] font-mono ${
        isExpiringSoon 
          ? 'border-destructive/50 bg-destructive/10 text-destructive animate-pulse' 
          : 'border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400'
      }`}
    >
      {isExpiringSoon ? (
        <AlertTriangle className="w-3 h-3" />
      ) : (
        <Clock className="w-3 h-3" />
      )}
      {timeLeft}
    </Badge>
  );
};
