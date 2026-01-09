const SOUND_ENABLED_KEY = "pitchperfect_sound_enabled";

export const getSoundEnabled = (): boolean => {
  try {
    const stored = localStorage.getItem(SOUND_ENABLED_KEY);
    return stored !== "false"; // Default to true
  } catch {
    return true;
  }
};

export const setSoundEnabled = (enabled: boolean): void => {
  try {
    localStorage.setItem(SOUND_ENABLED_KEY, String(enabled));
  } catch {
    // Ignore localStorage errors
  }
};
