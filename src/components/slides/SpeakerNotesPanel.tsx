import { motion } from 'framer-motion';
import { StickyNote, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slide, useSlidesStore } from '@/stores/slidesStore';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface SpeakerNotesPanelProps {
  slide: Slide;
  isEditing?: boolean;
  onNotesChange?: (notes: string) => void;
}

export const SpeakerNotesPanel = ({ 
  slide, 
  isEditing = false,
  onNotesChange 
}: SpeakerNotesPanelProps) => {
  const { showSpeakerNotes, setShowSpeakerNotes, updateSlide } = useSlidesStore();
  const [isExpanded, setIsExpanded] = useState(true);

  const handleNotesChange = (value: string) => {
    if (onNotesChange) {
      onNotesChange(value);
    } else {
      updateSlide(slide.id, { speakerNotes: value });
    }
  };

  if (!showSpeakerNotes) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="border-t bg-muted/30"
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full p-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <StickyNote className="w-4 h-4" />
          Speaker Notes
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-3 pb-3">
          {isEditing ? (
            <Textarea
              value={slide.speakerNotes || ''}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Add speaker notes for this slide..."
              className="min-h-[80px] text-sm resize-none"
            />
          ) : (
            <div className={cn(
              'text-sm p-3 rounded-lg bg-background min-h-[60px]',
              !slide.speakerNotes && 'text-muted-foreground italic'
            )}>
              {slide.speakerNotes || 'No speaker notes for this slide.'}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

// Toggle button component
export const SpeakerNotesToggle = () => {
  const { showSpeakerNotes, setShowSpeakerNotes } = useSlidesStore();

  return (
    <Button
      variant={showSpeakerNotes ? 'default' : 'outline'}
      size="sm"
      onClick={() => setShowSpeakerNotes(!showSpeakerNotes)}
      className="gap-2"
    >
      <StickyNote className="w-4 h-4" />
      <span className="hidden sm:inline">Notes</span>
    </Button>
  );
};
