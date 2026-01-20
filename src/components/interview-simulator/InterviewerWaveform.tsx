import { motion } from "framer-motion";

interface InterviewerWaveformProps {
  isSpeaking: boolean;
  intensity?: "low" | "medium" | "high";
}

export const InterviewerWaveform = ({ isSpeaking, intensity = "medium" }: InterviewerWaveformProps) => {
  const bars = 12;
  const intensityMultiplier = { low: 0.5, medium: 1, high: 1.5 }[intensity];

  return (
    <div className="flex items-center justify-center gap-1 h-16">
      {[...Array(bars)].map((_, i) => {
        // Create wave pattern - higher in middle
        const distanceFromCenter = Math.abs(i - bars / 2);
        const baseHeight = 1 - (distanceFromCenter / (bars / 2)) * 0.6;
        
        return (
          <motion.div
            key={i}
            className="w-1 rounded-full bg-interview-cold"
            animate={isSpeaking ? {
              height: [
                `${baseHeight * 20 * intensityMultiplier}px`,
                `${baseHeight * 50 * intensityMultiplier}px`,
                `${baseHeight * 30 * intensityMultiplier}px`,
                `${baseHeight * 60 * intensityMultiplier}px`,
                `${baseHeight * 20 * intensityMultiplier}px`,
              ],
              opacity: [0.6, 1, 0.8, 1, 0.6],
            } : {
              height: "4px",
              opacity: 0.3,
            }}
            transition={isSpeaking ? {
              duration: 0.8 + Math.random() * 0.4,
              repeat: Infinity,
              delay: i * 0.05,
              ease: "easeInOut",
            } : {
              duration: 0.3,
            }}
            style={{
              boxShadow: isSpeaking ? "0 0 8px hsl(var(--interview-cold) / 0.5)" : "none",
            }}
          />
        );
      })}
    </div>
  );
};
