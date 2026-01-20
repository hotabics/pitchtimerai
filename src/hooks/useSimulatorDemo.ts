// Demo Mode Hook - Tracks free simulator sessions for anonymous users

import { useState, useEffect, useCallback } from "react";

const DEMO_STORAGE_KEY = "pitch_simulator_demo";

interface DemoState {
  interviewUsed: boolean;
  salesUsed: boolean;
  lastReset: string;
}

const DEFAULT_STATE: DemoState = {
  interviewUsed: false,
  salesUsed: false,
  lastReset: new Date().toISOString().split('T')[0],
};

export const useSimulatorDemo = () => {
  const [demoState, setDemoState] = useState<DemoState>(DEFAULT_STATE);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(DEMO_STORAGE_KEY);
      if (stored) {
        const parsed: DemoState = JSON.parse(stored);
        
        // Reset daily - give users a fresh demo every day
        const today = new Date().toISOString().split('T')[0];
        if (parsed.lastReset !== today) {
          const resetState: DemoState = {
            interviewUsed: false,
            salesUsed: false,
            lastReset: today,
          };
          localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(resetState));
          setDemoState(resetState);
        } else {
          setDemoState(parsed);
        }
      }
    } catch (error) {
      console.error("Failed to load demo state:", error);
    }
  }, []);

  // Check if user can use demo for a specific simulator type
  const canUseDemo = useCallback((type: 'interview' | 'sales'): boolean => {
    if (type === 'interview') return !demoState.interviewUsed;
    if (type === 'sales') return !demoState.salesUsed;
    return false;
  }, [demoState]);

  // Mark demo as used for a specific simulator type
  const markDemoUsed = useCallback((type: 'interview' | 'sales') => {
    setDemoState((prev) => {
      const updated: DemoState = {
        ...prev,
        [type === 'interview' ? 'interviewUsed' : 'salesUsed']: true,
      };
      try {
        localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error("Failed to save demo state:", error);
      }
      return updated;
    });
  }, []);

  // Check if any demo is available
  const hasAnyDemoAvailable = !demoState.interviewUsed || !demoState.salesUsed;

  // Reset demo state (for testing)
  const resetDemo = useCallback(() => {
    const resetState: DemoState = {
      ...DEFAULT_STATE,
      lastReset: new Date().toISOString().split('T')[0],
    };
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(resetState));
    setDemoState(resetState);
  }, []);

  return {
    canUseDemo,
    markDemoUsed,
    hasAnyDemoAvailable,
    demoState,
    resetDemo,
  };
};
