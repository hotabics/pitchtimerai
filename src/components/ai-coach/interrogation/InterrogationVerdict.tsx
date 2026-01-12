// Phase 3: The Verdict (Feedback Dashboard)
// Summary screen with Choreography, Ammunition, Cold-Bloodedness scores

import { motion } from 'framer-motion';
import { Shield, Zap, Brain, Trophy, ArrowRight, RotateCcw, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { type JurorType, JURORS } from './JurorSelection';

export interface VerdictData {
  choreography: {
    score: number;
    details: {
      delivery: number;
      pace: number;
      fillerWords: number;
    };
  };
  ammunition: {
    score: number;
    details: {
      logicalFlow: number;
      evidence: number;
      dataUsage: number;
    };
  };
  coldBloodedness: {
    score: number;
    details: {
      confidence: number;
      stressLevel: number;
      eyeContact: number;
    };
  };
  overallScore: number;
  status: 'The Mastermind' | 'Battle Ready' | 'Survivor' | 'Needs Training';
  tips: Array<{
    title: string;
    description: string;
  }>;
}

interface InterrogationVerdictProps {
  data: VerdictData;
  juror: JurorType;
  onRetry: () => void;
  onBack: () => void;
}

const STATUS_COLORS: Record<VerdictData['status'], { bg: string; text: string; glow: string }> = {
  'The Mastermind': { bg: '#FFD700', text: '#000', glow: 'rgba(255,215,0,0.4)' },
  'Battle Ready': { bg: '#10B981', text: '#fff', glow: 'rgba(16,185,129,0.4)' },
  'Survivor': { bg: '#F59E0B', text: '#000', glow: 'rgba(245,158,11,0.4)' },
  'Needs Training': { bg: '#8B0000', text: '#fff', glow: 'rgba(139,0,0,0.4)' },
};

const CATEGORY_ICONS = {
  choreography: Shield,
  ammunition: Zap,
  coldBloodedness: Brain,
};

const CATEGORY_LABELS = {
  choreography: 'Choreography',
  ammunition: 'Ammunition',
  coldBloodedness: 'Cold-Bloodedness',
};

const CATEGORY_DESCRIPTIONS = {
  choreography: 'Delivery, pace, and filler word control',
  ammunition: 'Logical flow and use of evidence',
  coldBloodedness: 'Confidence and composure under pressure',
};

export const InterrogationVerdict = ({ data, juror, onRetry, onBack }: InterrogationVerdictProps) => {
  const jurorConfig = JURORS.find(j => j.id === juror)!;
  const statusStyle = STATUS_COLORS[data.status];

  const categories = [
    { key: 'choreography' as const, ...data.choreography },
    { key: 'ammunition' as const, ...data.ammunition },
    { key: 'coldBloodedness' as const, ...data.coldBloodedness },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#FFD700';
    return '#8B0000';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center space-y-6"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-white uppercase tracking-wider">
          The <span className="text-[#FFD700]">Verdict</span>
        </h2>

        {/* Overall Score Circle */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
          className="relative inline-flex items-center justify-center"
        >
          <div 
            className="w-40 h-40 rounded-full flex items-center justify-center"
            style={{
              background: `conic-gradient(${getScoreColor(data.overallScore)} ${data.overallScore * 3.6}deg, #1f1f1f ${data.overallScore * 3.6}deg)`,
              boxShadow: `0 0 60px ${statusStyle.glow}`,
            }}
          >
            <div className="w-32 h-32 rounded-full bg-[#121212] flex flex-col items-center justify-center">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-4xl font-bold text-white"
              >
                {data.overallScore}%
              </motion.span>
              <span className="text-xs text-gray-500 uppercase tracking-wider">Score</span>
            </div>
          </div>
        </motion.div>

        {/* Status Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div 
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full"
            style={{ 
              backgroundColor: statusStyle.bg,
              color: statusStyle.text,
              boxShadow: `0 0 30px ${statusStyle.glow}`,
            }}
          >
            <Trophy className="w-5 h-5" />
            <span className="font-bold uppercase tracking-wider">{data.status}</span>
          </div>
        </motion.div>

        <p className="text-gray-400 text-sm">
          You were interrogated by <span className="text-white">{jurorConfig.title}</span>
        </p>
      </motion.div>

      {/* Category Scores */}
      <div className="grid md:grid-cols-3 gap-6">
        {categories.map((category, index) => {
          const Icon = CATEGORY_ICONS[category.key];
          const details = Object.entries(category.details);
          
          return (
            <motion.div
              key={category.key}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="relative rounded-xl border border-gray-800 bg-gray-900/50 p-6 space-y-4"
            >
              {/* Glow */}
              <div 
                className="absolute inset-0 rounded-xl opacity-20 blur-xl"
                style={{ backgroundColor: getScoreColor(category.score) }}
              />
              
              <div className="relative">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${getScoreColor(category.score)}20` }}
                    >
                      <Icon 
                        className="w-5 h-5"
                        style={{ color: getScoreColor(category.score) }}
                      />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">
                        {CATEGORY_LABELS[category.key]}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {CATEGORY_DESCRIPTIONS[category.key]}
                      </p>
                    </div>
                  </div>
                  <span 
                    className="text-2xl font-bold"
                    style={{ color: getScoreColor(category.score) }}
                  >
                    {category.score}
                  </span>
                </div>

                {/* Detail Bars */}
                <div className="space-y-3">
                  {details.map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="text-gray-300">{value}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${value}%` }}
                          transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: getScoreColor(value) }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* AI Pro-Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="space-y-4"
      >
        <h3 className="text-xl font-bold text-[#FFD700] uppercase tracking-wider flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Director's Notes
        </h3>
        
        <div className="grid md:grid-cols-3 gap-4">
          {data.tips.map((tip, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 + index * 0.1 }}
              className="relative group cursor-pointer"
            >
              <div className="p-4 rounded-lg border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-900/50 hover:border-[#FFD700]/50 transition-all">
                <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-[#FFD700]" />
                  {tip.title}
                </h4>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {tip.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6"
      >
        <Button
          onClick={onRetry}
          variant="outline"
          className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
        <Button
          onClick={onBack}
          className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90"
        >
          Return to Hub
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>
    </div>
  );
};
