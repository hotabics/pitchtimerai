// Phase 3: The Verdict (Feedback Dashboard)
// Summary screen with Choreography, Ammunition, Cold-Bloodedness scores
// Includes Review My Answers section showing question-response pairs

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap, Brain, Trophy, ArrowRight, RotateCcw, ChevronRight, ChevronDown, MessageSquare, CheckCircle2, XCircle, Download, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { type JurorType, JURORS } from './JurorSelection';

export interface ResponseRecord {
  question: string;
  category: string;
  intensity: 'low' | 'medium' | 'high';
  response: string;
  analysis: {
    relevance: number;
    clarity: number;
    confidence: number;
    depth: number;
    feedback: string;
    fillerCount: number;
    wordCount: number;
  };
}

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
  responses?: ResponseRecord[];
}

interface InterrogationVerdictProps {
  data: VerdictData;
  juror: JurorType;
  onRetry: () => void;
  onBack: () => void;
  onExportPDF?: () => void;
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

export const InterrogationVerdict = ({ data, juror, onRetry, onBack, onExportPDF }: InterrogationVerdictProps) => {
  const jurorConfig = JURORS.find(j => j.id === juror)!;
  const statusStyle = STATUS_COLORS[data.status];
  const [expandedResponse, setExpandedResponse] = useState<number | null>(null);
  const [showResponses, setShowResponses] = useState(false);

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

  const getAverageScore = (analysis: ResponseRecord['analysis']) => {
    return Math.round((analysis.relevance + analysis.clarity + analysis.confidence + analysis.depth) / 4);
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

      {/* Review My Answers Section */}
      {data.responses && data.responses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-4"
        >
          <button
            onClick={() => setShowResponses(!showResponses)}
            className="w-full flex items-center justify-between text-xl font-bold text-[#FFD700] uppercase tracking-wider hover:text-[#FFD700]/80 transition-colors"
          >
            <span className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Review My Answers ({data.responses.length})
            </span>
            <ChevronDown className={`w-5 h-5 transition-transform ${showResponses ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showResponses && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-4 overflow-hidden"
              >
                {data.responses.map((record, index) => {
                  const avgScore = getAverageScore(record.analysis);
                  const isExpanded = expandedResponse === index;
                  
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden"
                    >
                      {/* Question Header */}
                      <button
                        onClick={() => setExpandedResponse(isExpanded ? null : index)}
                        className="w-full p-4 flex items-start justify-between text-left hover:bg-gray-800/30 transition-colors"
                      >
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-xs rounded-full uppercase tracking-wider ${
                              record.intensity === 'high' 
                                ? 'bg-[#8B0000]/30 text-red-400 border border-[#8B0000]/50'
                                : record.intensity === 'medium'
                                  ? 'bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30'
                                  : 'bg-gray-800 text-gray-400 border border-gray-700'
                            }`}>
                              Q{index + 1}: {record.category}
                            </span>
                            <span className={`flex items-center gap-1 text-xs ${
                              avgScore >= 70 ? 'text-green-400' : avgScore >= 50 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                              {avgScore >= 70 ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              {avgScore}%
                            </span>
                          </div>
                          <p className="text-white font-medium">{record.question}</p>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform flex-shrink-0 ml-4 ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Expanded Details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden border-t border-gray-800"
                          >
                            <div className="p-4 space-y-4">
                              {/* Your Response */}
                              <div>
                                <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Your Response</h5>
                                <p className="text-gray-300 text-sm bg-gray-800/50 p-3 rounded-lg italic">
                                  "{record.response}"
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                  {record.analysis.wordCount} words • {record.analysis.fillerCount} filler words
                                </p>
                              </div>

                              {/* Score Breakdown */}
                              <div className="grid grid-cols-2 gap-3">
                                {[
                                  { label: 'Relevance', value: record.analysis.relevance },
                                  { label: 'Clarity', value: record.analysis.clarity },
                                  { label: 'Confidence', value: record.analysis.confidence },
                                  { label: 'Depth', value: record.analysis.depth },
                                ].map(metric => (
                                  <div key={metric.label} className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                      <span className="text-gray-400">{metric.label}</span>
                                      <span style={{ color: getScoreColor(metric.value) }}>{metric.value}%</span>
                                    </div>
                                    <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full rounded-full transition-all" 
                                        style={{ 
                                          width: `${metric.value}%`,
                                          backgroundColor: getScoreColor(metric.value)
                                        }} 
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* AI Feedback */}
                              {record.analysis.feedback && (
                                <div className="p-3 rounded-lg bg-[#FFD700]/10 border border-[#FFD700]/20">
                                  <p className="text-sm text-[#FFD700]">
                                    💡 {record.analysis.feedback}
                                  </p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

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
        {onExportPDF && (
          <Button
            onClick={onExportPDF}
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        )}
        <Button
          onClick={onRetry}
          variant="outline"
          className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
        <Button
          onClick={() => window.location.href = '/interrogation-history'}
          variant="outline"
          className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
        >
          <History className="w-4 h-4 mr-2" />
          View History
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
