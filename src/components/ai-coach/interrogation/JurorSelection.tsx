// Phase 1: Juror Selection
// Three distinct character cards with hover animations

import { useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, BookOpen, Zap, Sparkles } from 'lucide-react';

export type JurorType = 'mentor' | 'reviewer' | 'shark';

interface JurorConfig {
  id: JurorType;
  name: string;
  title: string;
  description: string;
  audience: string;
  icon: React.ReactNode;
  traits: string[];
  voiceStyle: string;
  gradient: string;
  accentColor: string;
}

const JURORS: JurorConfig[] = [
  {
    id: 'mentor',
    name: 'The Curious Mentor',
    title: 'Prof. Eleanor Sage',
    description: 'Supportive but probing. Wants to see you grow.',
    audience: 'School ZPD Projects',
    icon: <GraduationCap className="w-8 h-8" />,
    traits: ['Encouraging', 'Thoughtful', 'Educational'],
    voiceStyle: 'Warm and inquisitive',
    gradient: 'from-emerald-600/20 to-emerald-900/40',
    accentColor: '#10B981',
  },
  {
    id: 'reviewer',
    name: 'The Harsh Reviewer',
    title: 'Dr. Victor Stern',
    description: 'Academic, cold, focuses on methodology.',
    audience: 'Bachelor & Academic',
    icon: <BookOpen className="w-8 h-8" />,
    traits: ['Critical', 'Methodical', 'Unforgiving'],
    voiceStyle: 'Cold and analytical',
    gradient: 'from-blue-600/20 to-blue-900/40',
    accentColor: '#3B82F6',
  },
  {
    id: 'shark',
    name: 'The Skeptical Shark',
    title: 'Marcus "Money" Chen',
    description: 'Aggressive, fast-paced, focuses on ROI.',
    audience: 'Hackathons & Startups',
    icon: <Zap className="w-8 h-8" />,
    traits: ['Aggressive', 'ROI-focused', 'Scalability'],
    voiceStyle: 'Sharp and impatient',
    gradient: 'from-[#8B0000]/30 to-[#8B0000]/60',
    accentColor: '#8B0000',
  },
];

interface JurorSelectionProps {
  onSelect: (juror: JurorType) => void;
}

export const JurorSelection = ({ onSelect }: JurorSelectionProps) => {
  const [hoveredJuror, setHoveredJuror] = useState<JurorType | null>(null);

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center space-y-4"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/30">
          <Sparkles className="w-4 h-4 text-[#FFD700]" />
          <span className="text-sm text-[#FFD700] uppercase tracking-wider font-medium">
            Choose Your Opponent
          </span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
          Who Will <span className="text-[#FFD700]">Interrogate</span> You?
        </h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Each juror has a unique style. Pick one that matches your audience — or challenge yourself with someone tougher.
        </p>
      </motion.div>

      {/* Juror Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {JURORS.map((juror, index) => (
          <motion.div
            key={juror.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            onHoverStart={() => setHoveredJuror(juror.id)}
            onHoverEnd={() => setHoveredJuror(null)}
            onClick={() => onSelect(juror.id)}
            className="cursor-pointer group"
          >
            <div
              className={`relative h-full rounded-2xl border-2 transition-all duration-500 overflow-hidden ${
                hoveredJuror === juror.id
                  ? 'border-[#FFD700] shadow-[0_0_40px_rgba(255,215,0,0.3)] scale-105'
                  : 'border-gray-800 hover:border-gray-700'
              }`}
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${juror.gradient} opacity-50`} />
              
              {/* Spotlight Effect on Hover */}
              <motion.div
                className="absolute inset-0"
                animate={{
                  background: hoveredJuror === juror.id
                    ? `radial-gradient(circle at 50% 30%, ${juror.accentColor}40 0%, transparent 60%)`
                    : 'transparent',
                }}
                transition={{ duration: 0.4 }}
              />

              {/* Content */}
              <div className="relative p-6 space-y-6">
                {/* Avatar */}
                <motion.div
                  animate={{
                    scale: hoveredJuror === juror.id ? 1.1 : 1,
                    y: hoveredJuror === juror.id ? -5 : 0,
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="relative mx-auto w-24 h-24"
                >
                  {/* Glow Ring */}
                  <div 
                    className={`absolute inset-0 rounded-full blur-xl transition-opacity duration-500 ${
                      hoveredJuror === juror.id ? 'opacity-60' : 'opacity-0'
                    }`}
                    style={{ backgroundColor: juror.accentColor }}
                  />
                  
                  {/* Avatar Circle */}
                  <div 
                    className="relative w-full h-full rounded-full flex items-center justify-center border-2"
                    style={{ 
                      backgroundColor: `${juror.accentColor}20`,
                      borderColor: juror.accentColor,
                    }}
                  >
                    <div style={{ color: juror.accentColor }}>
                      {juror.icon}
                    </div>
                  </div>
                </motion.div>

                {/* Name & Title */}
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-bold text-white">{juror.name}</h3>
                  <p className="text-sm text-gray-500">{juror.title}</p>
                </div>

                {/* Description */}
                <p className="text-center text-gray-400 text-sm leading-relaxed">
                  {juror.description}
                </p>

                {/* Traits */}
                <div className="flex flex-wrap justify-center gap-2">
                  {juror.traits.map((trait) => (
                    <span
                      key={trait}
                      className="px-3 py-1 text-xs rounded-full bg-gray-800/80 text-gray-300 border border-gray-700"
                    >
                      {trait}
                    </span>
                  ))}
                </div>

                {/* Audience Tag */}
                <div className="pt-4 border-t border-gray-800">
                  <div className="text-center">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Best for</span>
                    <p 
                      className="text-sm font-semibold mt-1"
                      style={{ color: juror.accentColor }}
                    >
                      {juror.audience}
                    </p>
                  </div>
                </div>

                {/* Select CTA */}
                <motion.div
                  animate={{
                    opacity: hoveredJuror === juror.id ? 1 : 0,
                    y: hoveredJuror === juror.id ? 0 : 10,
                  }}
                  transition={{ duration: 0.3 }}
                  className="absolute bottom-0 left-0 right-0 p-4"
                >
                  <div 
                    className="w-full py-3 rounded-lg text-center text-sm font-bold uppercase tracking-wider"
                    style={{ 
                      backgroundColor: juror.accentColor,
                      color: 'white',
                    }}
                  >
                    Begin Interrogation
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom Warning */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center text-gray-600 text-sm"
      >
        ⚠️ Warning: Your pitch will be put under intense scrutiny. Are you ready?
      </motion.p>
    </div>
  );
};

export { JURORS };
