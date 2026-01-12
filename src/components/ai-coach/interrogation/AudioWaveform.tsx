// Audio Waveform Visualizer Component
// Real-time audio level visualization

import { motion } from 'framer-motion';

interface AudioWaveformProps {
  level: number; // 0 to 1
  color: string;
  bars?: number;
}

export const AudioWaveform = ({ level, color, bars = 40 }: AudioWaveformProps) => {
  return (
    <div className="flex items-center justify-center gap-0.5 h-16">
      {Array.from({ length: bars }).map((_, index) => {
        // Create a wave pattern with the audio level
        const centerDistance = Math.abs(index - bars / 2);
        const baseHeight = Math.max(0.1, 1 - (centerDistance / (bars / 2)) * 0.5);
        const randomFactor = 0.5 + Math.random() * 0.5;
        const height = Math.max(0.1, baseHeight * level * randomFactor);
        
        return (
          <motion.div
            key={index}
            animate={{
              scaleY: height,
              opacity: 0.4 + height * 0.6,
            }}
            transition={{
              duration: 0.1,
              ease: 'easeOut',
            }}
            className="w-1 rounded-full origin-center"
            style={{
              height: '100%',
              backgroundColor: color,
              boxShadow: level > 0.3 ? `0 0 10px ${color}40` : 'none',
            }}
          />
        );
      })}
    </div>
  );
};
