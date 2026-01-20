// Demo-Enabled Protected Route - allows one free demo for anonymous users

import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from '@/stores/userStore';
import { useSimulatorDemo } from '@/hooks/useSimulatorDemo';
import { DemoModePrompt } from '@/components/shared/DemoModePrompt';
import { Loader2 } from 'lucide-react';

interface DemoEnabledRouteProps {
  children: React.ReactNode;
  simulatorType: 'interview' | 'sales';
}

export function DemoEnabledRoute({ children, simulatorType }: DemoEnabledRouteProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, user } = useUserStore();
  const { canUseDemo, markDemoUsed } = useSimulatorDemo();
  const [isChecking, setIsChecking] = useState(true);
  const [demoAllowed, setDemoAllowed] = useState(false);

  useEffect(() => {
    // Small delay to allow auth state to initialize
    const timer = setTimeout(() => {
      if (isLoggedIn && user) {
        // Logged in user - allow access
        setDemoAllowed(true);
      } else if (canUseDemo(simulatorType)) {
        // Anonymous user with demo available
        setDemoAllowed(true);
        // Mark demo as used when they access the page
        markDemoUsed(simulatorType);
      } else {
        // Anonymous user with no demo remaining
        setDemoAllowed(false);
      }
      setIsChecking(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [isLoggedIn, user, canUseDemo, markDemoUsed, simulatorType]);

  // Show loading while checking auth state
  if (isChecking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Anonymous user with no demo remaining - show upgrade prompt
  if (!isLoggedIn && !demoAllowed) {
    return (
      <div className="min-h-screen pt-20">
        <DemoModePrompt simulatorType={simulatorType} canUseDemo={false} />
      </div>
    );
  }

  return <>{children}</>;
}
