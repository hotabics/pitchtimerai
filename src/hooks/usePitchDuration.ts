import { useState, useEffect, useCallback } from "react";

const DURATION_KEY = "pitchperfect_preferred_duration";
const DEFAULT_DURATION = 3; // 3 minutes default (hackathon standard)

export const DURATION_PRESETS = [
  { value: 0.5, label: "30s", description: "Elevator Pitch" },
  { value: 1, label: "1 min", description: "Quick Intro" },
  { value: 2, label: "2 min", description: "Standard" },
  { value: 3, label: "3 min", description: "Hackathon" },
  { value: 5, label: "5 min", description: "Demo Day" },
  { value: 10, label: "10 min", description: "Investor Meeting" },
] as const;

/**
 * Get the stored duration from localStorage
 */
export const getStoredDuration = (): number => {
  try {
    const stored = localStorage.getItem(DURATION_KEY);
    if (stored) {
      const parsed = parseFloat(stored);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
  } catch {
    // localStorage not available
  }
  return DEFAULT_DURATION;
};

/**
 * Save duration to localStorage
 */
export const saveDuration = (duration: number): void => {
  try {
    localStorage.setItem(DURATION_KEY, duration.toString());
  } catch {
    // localStorage not available
  }
};

/**
 * Format duration for display
 */
export const formatDurationLabel = (duration: number): string => {
  if (duration < 1) {
    return `${Math.round(duration * 60)}s`;
  }
  return `${duration} min`;
};

/**
 * Get preset info for a duration value
 */
export const getPresetInfo = (duration: number) => {
  return DURATION_PRESETS.find(p => p.value === duration) || {
    value: duration,
    label: formatDurationLabel(duration),
    description: "Custom",
  };
};

/**
 * Hook for managing pitch duration with localStorage persistence
 */
export const usePitchDuration = (initialDuration?: number) => {
  const [duration, setDurationState] = useState<number>(() => {
    return initialDuration ?? getStoredDuration();
  });

  // Sync with localStorage on mount
  useEffect(() => {
    if (initialDuration === undefined) {
      setDurationState(getStoredDuration());
    }
  }, [initialDuration]);

  const setDuration = useCallback((newDuration: number) => {
    setDurationState(newDuration);
    saveDuration(newDuration);
  }, []);

  const presetInfo = getPresetInfo(duration);

  return {
    duration,
    setDuration,
    presetInfo,
    presets: DURATION_PRESETS,
    formattedLabel: formatDurationLabel(duration),
  };
};
