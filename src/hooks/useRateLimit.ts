import { useState, useCallback, useRef } from "react";

interface UseRateLimitOptions {
  maxAttempts: number;
  windowMs: number;
  cooldownMs: number;
}

export const useRateLimit = ({
  maxAttempts = 5,
  windowMs = 60000, // 1 minute window
  cooldownMs = 30000, // 30 second cooldown when limit hit
}: Partial<UseRateLimitOptions> = {}) => {
  const [isLimited, setIsLimited] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(maxAttempts);
  const [cooldownEnd, setCooldownEnd] = useState<number | null>(null);
  const attemptsRef = useRef<number[]>([]);

  const checkLimit = useCallback((): boolean => {
    const now = Date.now();
    
    // If in cooldown, check if it's over
    if (cooldownEnd && now < cooldownEnd) {
      return false;
    } else if (cooldownEnd && now >= cooldownEnd) {
      // Cooldown ended, reset
      setCooldownEnd(null);
      setIsLimited(false);
      attemptsRef.current = [];
      setRemainingAttempts(maxAttempts);
    }

    // Clean up old attempts outside the window
    attemptsRef.current = attemptsRef.current.filter(
      (timestamp) => now - timestamp < windowMs
    );

    // Check if we're at the limit
    if (attemptsRef.current.length >= maxAttempts) {
      setIsLimited(true);
      setCooldownEnd(now + cooldownMs);
      setRemainingAttempts(0);
      return false;
    }

    // Record this attempt
    attemptsRef.current.push(now);
    setRemainingAttempts(maxAttempts - attemptsRef.current.length);
    
    return true;
  }, [maxAttempts, windowMs, cooldownMs, cooldownEnd]);

  const getRemainingCooldown = useCallback((): number => {
    if (!cooldownEnd) return 0;
    const remaining = cooldownEnd - Date.now();
    return Math.max(0, Math.ceil(remaining / 1000));
  }, [cooldownEnd]);

  return {
    checkLimit,
    isLimited,
    remainingAttempts,
    getRemainingCooldown,
  };
};
