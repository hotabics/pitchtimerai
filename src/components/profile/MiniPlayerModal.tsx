// Mini Player Modal - Quick video preview with simplified feedback

import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, Volume2, VolumeX, TrendingUp, Mic, MessageCircle, Target } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface MiniPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  recording: {
    id: string;
    title: string;
    score: number;
    wpm: number;
    filler_count: number;
    tone: string | null;
    track: string;
    date: string;
  } | null;
}

const getScoreLabel = (score: number) => {
  if (score >= 90) return { label: 'Excellent', color: 'text-green-400' };
  if (score >= 70) return { label: 'Good', color: 'text-blue-400' };
  if (score >= 50) return { label: 'Average', color: 'text-yellow-400' };
  return { label: 'Needs Work', color: 'text-red-400' };
};

const getPacingLabel = (wpm: number) => {
  if (wpm >= 120 && wpm <= 160) return { label: 'Perfect Pace', color: 'text-green-400' };
  if (wpm < 120) return { label: 'Slow', color: 'text-yellow-400' };
  return { label: 'Fast', color: 'text-orange-400' };
};

export const MiniPlayerModal = ({ isOpen, onClose, recording }: MiniPlayerModalProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress] = useState(0);

  if (!recording) return null;

  const scoreInfo = getScoreLabel(recording.score);
  const pacingInfo = getPacingLabel(recording.wpm);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl p-4"
          >
            <div className="bg-background border border-border rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div>
                  <h2 className="font-semibold line-clamp-1">{recording.title}</h2>
                  <p className="text-xs text-muted-foreground">
                    {new Date(recording.date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Video Player Area */}
              <div className="relative aspect-video bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                {/* Mock video placeholder */}
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    {isPlaying ? (
                      <Pause className="w-10 h-10 text-primary" />
                    ) : (
                      <Play className="w-10 h-10 text-primary ml-1" />
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">Recording Preview</p>
                  <p className="text-muted-foreground text-xs mt-1">(Demo Mode)</p>
                </div>

                {/* Video controls overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:text-white hover:bg-white/20"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </Button>
                    
                    <div className="flex-1">
                      <Progress value={progress} className="h-1" />
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:text-white hover:bg-white/20"
                      onClick={() => setIsMuted(!isMuted)}
                    >
                      {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Simplified Feedback Section */}
              <div className="p-4 space-y-4">
                {/* Score highlight */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Target className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{(recording.score / 10).toFixed(1)}<span className="text-sm text-muted-foreground">/10</span></p>
                      <p className={`text-sm ${scoreInfo.color}`}>{scoreInfo.label}</p>
                    </div>
                  </div>
                  
                  <Badge variant="secondary" className="text-sm">
                    {recording.track.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </Badge>
                </div>

                {/* Key metrics grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <Mic className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-semibold">{recording.wpm}</p>
                    <p className={`text-xs ${pacingInfo.color}`}>{pacingInfo.label}</p>
                  </div>
                  
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <MessageCircle className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-semibold">{recording.filler_count}</p>
                    <p className="text-xs text-muted-foreground">Fillers</p>
                  </div>
                  
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <TrendingUp className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-semibold capitalize">{recording.tone || 'N/A'}</p>
                    <p className="text-xs text-muted-foreground">Tone</p>
                  </div>
                </div>

                {/* Quick feedback */}
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-sm font-medium mb-1">Quick Feedback</p>
                  <p className="text-xs text-muted-foreground">
                    {recording.score >= 70 
                      ? "Great delivery! Your pacing and confidence are on point. Consider reducing filler words for an even more polished pitch."
                      : "Keep practicing! Focus on maintaining steady eye contact and reducing pauses. Your message is getting stronger with each attempt."}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
