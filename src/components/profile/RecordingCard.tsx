// Recording Card Component - Grid card for video library

import { Play, Video, Calendar, Trash2, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface RecordingCardProps {
  id: string;
  title: string;
  date: string;
  score: number;
  track: string;
  tone?: string | null;
  wpm: number;
  onPlay: () => void;
  onAudit: () => void;
  onDelete: () => void;
}

const formatTypeName = (type: string) => {
  return type
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const getScoreColor = (score: number) => {
  if (score >= 80) return "bg-green-500/20 text-green-400 border-green-500/30";
  if (score >= 50) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  return "bg-red-500/20 text-red-400 border-red-500/30";
};

const getToneEmoji = (tone: string | null | undefined) => {
  if (!tone) return '🎤';
  const tones: Record<string, string> = {
    confident: '💪',
    nervous: '😰',
    enthusiastic: '🔥',
    calm: '😌',
    professional: '👔',
    passionate: '❤️',
  };
  return tones[tone.toLowerCase()] || '🎤';
};

export const RecordingCard = ({
  id,
  title,
  date,
  score,
  track,
  tone,
  wpm,
  onPlay,
  onAudit,
  onDelete,
}: RecordingCardProps) => {
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden group hover:shadow-lg hover:border-primary/30 transition-all duration-300">
        {/* Thumbnail Area */}
        <div 
          className="relative aspect-video bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center cursor-pointer"
          onClick={onPlay}
        >
          {/* Play overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300 shadow-lg">
              <Play className="w-6 h-6 text-primary-foreground ml-1" />
            </div>
          </div>
          
          {/* Video icon placeholder */}
          <Video className="w-12 h-12 text-muted-foreground/30" />
          
          {/* Score badge overlay */}
          <div className="absolute top-2 right-2">
            <Badge className={`${getScoreColor(score)} font-bold text-sm px-2 py-0.5`}>
              {(score / 10).toFixed(1)}
            </Badge>
          </div>
          
          {/* Tone indicator */}
          {tone && (
            <div className="absolute top-2 left-2">
              <span className="text-lg" title={`Tone: ${tone}`}>{getToneEmoji(tone)}</span>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          {/* Title */}
          <h3 className="font-semibold text-sm line-clamp-2 mb-2 min-h-[2.5rem]">
            {title}
          </h3>
          
          {/* Meta info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formattedDate}</span>
            </div>
            <span>{wpm} WPM</span>
          </div>
          
          {/* Track badge */}
          <Badge variant="secondary" className="text-xs mb-3">
            {formatTypeName(track)}
          </Badge>
          
          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={onPlay}
            >
              <Play className="w-3 h-3 mr-1" />
              Play
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={onAudit}
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Audit
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
