import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Play, Pause, Maximize2, Minimize2,
  Plus, Sparkles, Download, Loader2, Wand2, Radio
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useSlidesStore, generateSlidesFromBlocks, Slide } from '@/stores/slidesStore';
import { SlidePreview } from './SlidePreview';
import { SlideEditor } from './SlideEditor';
import { DraggableThumbnail } from './DraggableThumbnail';
import { generateAISlides } from '@/services/slideAI';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface SlideDeckProps {
  scriptBlocks?: { title: string; content: string }[];
  projectTitle?: string;
  onClose?: () => void;
  // Presentation sync props
  isPresentationMode?: boolean;
  currentPracticeBlock?: number;
  isPlaying?: boolean;
}

export const SlideDeck = ({ 
  scriptBlocks, 
  projectTitle = 'My Pitch', 
  onClose,
  isPresentationMode = false,
  currentPracticeBlock = 0,
  isPlaying: externalIsPlaying = false,
}: SlideDeckProps) => {
  const {
    slides,
    currentSlideIndex,
    isGenerating,
    setSlides,
    setCurrentSlideIndex,
    setIsGenerating,
    addSlide,
    reorderSlides,
    clearSlides,
  } = useSlidesStore();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<Slide | null>(null);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  
  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Sync slides with practice mode
  useEffect(() => {
    if (isPresentationMode && slides.length > 0) {
      // Map practice block to slide (offset by 1 for title slide)
      const slideIndex = Math.min(currentPracticeBlock + 1, slides.length - 1);
      setCurrentSlideIndex(slideIndex);
    }
  }, [isPresentationMode, currentPracticeBlock, slides.length, setCurrentSlideIndex]);

  // Use external playing state in presentation mode
  useEffect(() => {
    if (isPresentationMode) {
      setIsPlaying(externalIsPlaying);
    }
  }, [isPresentationMode, externalIsPlaying]);

  // Generate slides from script blocks (basic)
  const handleGenerateSlides = useCallback(async () => {
    if (!scriptBlocks || scriptBlocks.length === 0) {
      toast({
        title: 'No script available',
        description: 'Generate a pitch script first to create slides.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const generatedSlides = generateSlidesFromBlocks(scriptBlocks, projectTitle);
    setSlides(generatedSlides);
    setCurrentSlideIndex(0);
    setIsGenerating(false);
    
    toast({
      title: 'Slides generated!',
      description: `Created ${generatedSlides.length} slides from your pitch.`,
    });
  }, [scriptBlocks, projectTitle, setSlides, setCurrentSlideIndex, setIsGenerating]);

  // Generate slides with AI
  const handleAIGenerateSlides = useCallback(async () => {
    if (!scriptBlocks || scriptBlocks.length === 0) {
      toast({
        title: 'No script available',
        description: 'Generate a pitch script first to create slides.',
        variant: 'destructive',
      });
      return;
    }

    setIsAIGenerating(true);
    
    try {
      const aiSlides = await generateAISlides(scriptBlocks, projectTitle);
      setSlides(aiSlides);
      setCurrentSlideIndex(0);
      
      toast({
        title: 'AI slides generated!',
        description: `Created ${aiSlides.length} enhanced slides with AI.`,
      });
    } catch (error) {
      console.error('AI generation failed:', error);
      // Fallback to basic generation
      toast({
        title: 'AI generation unavailable',
        description: 'Using standard slide generation instead.',
        variant: 'destructive',
      });
      await handleGenerateSlides();
    } finally {
      setIsAIGenerating(false);
    }
  }, [scriptBlocks, projectTitle, setSlides, setCurrentSlideIndex, handleGenerateSlides]);

  // Auto-generate on mount if no slides exist
  useEffect(() => {
    if (slides.length === 0 && scriptBlocks && scriptBlocks.length > 0) {
      handleGenerateSlides();
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingSlide || isPresentationMode) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          goToPreviousSlide();
          break;
        case 'ArrowRight':
          goToNextSlide();
          break;
        case ' ':
          e.preventDefault();
          setIsPlaying(p => !p);
          break;
        case 'Escape':
          setIsFullscreen(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingSlide, currentSlideIndex, slides.length, isPresentationMode]);

  // Auto-play functionality (disabled in presentation mode)
  useEffect(() => {
    if (!isPlaying || slides.length === 0 || isPresentationMode) return;

    const interval = setInterval(() => {
      setCurrentSlideIndex((currentSlideIndex + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, currentSlideIndex, slides.length, setCurrentSlideIndex, isPresentationMode]);

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (index: number) => {
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      reorderSlides(draggedIndex, dragOverIndex);
      toast({
        title: 'Slide reordered',
        description: `Moved slide ${draggedIndex + 1} to position ${dragOverIndex + 1}`,
      });
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const goToNextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const goToPreviousSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  const handleAddSlide = () => {
    const newSlide: Slide = {
      id: slides.length + 1,
      type: 'bullets',
      title: 'New Slide',
      content: ['Add your content here'],
      scriptSegment: '',
    };
    addSlide(newSlide);
    setCurrentSlideIndex(slides.length);
    setEditingSlide(newSlide);
  };

  const handleExportSlides = () => {
    const exportData = {
      title: projectTitle,
      slides: slides.map(({ id, type, title, content, imageKeyword }) => ({
        id,
        type,
        title,
        content,
        imageKeyword,
      })),
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectTitle.toLowerCase().replace(/\s+/g, '-')}-slides.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Slides exported',
      description: 'Your slide deck has been downloaded as JSON.',
    });
  };

  const currentSlide = slides[currentSlideIndex];
  const progress = slides.length > 0 ? ((currentSlideIndex + 1) / slides.length) * 100 : 0;

  // Loading state
  if (isGenerating || isAIGenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">
          {isAIGenerating ? 'AI is crafting your slides...' : 'Generating your slide deck...'}
        </p>
      </div>
    );
  }

  // Empty state
  if (slides.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-6">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground mb-2">Auto-Generate Slides</h3>
          <p className="text-muted-foreground text-sm max-w-sm">
            Transform your pitch script into a professional slide deck.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleGenerateSlides} disabled={!scriptBlocks?.length}>
            <Sparkles className="w-4 h-4 mr-2" />
            Quick Generate
          </Button>
          <Button onClick={handleAIGenerateSlides} disabled={!scriptBlocks?.length}>
            <Wand2 className="w-4 h-4 mr-2" />
            AI Generate
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'flex flex-col h-full',
      isFullscreen && 'fixed inset-0 z-50 bg-background'
    )}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b bg-card">
        <div className="flex items-center gap-2">
          {isPresentationMode && (
            <Badge variant="secondary" className="gap-1">
              <Radio className="w-3 h-3 animate-pulse text-red-500" />
              Synced
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleAIGenerateSlides}
            disabled={isAIGenerating}
          >
            <Wand2 className="w-4 h-4 mr-2" />
            AI Enhance
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddSlide}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Slide
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {currentSlideIndex + 1} / {slides.length}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportSlides}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Thumbnails sidebar with drag-and-drop */}
        {showThumbnails && !isFullscreen && (
          <div className="w-52 border-r bg-muted/30">
            <ScrollArea className="h-full p-2">
              <div className="space-y-2">
                {slides.map((slide, idx) => (
                  <DraggableThumbnail
                    key={slide.id}
                    slide={slide}
                    index={idx}
                    isActive={idx === currentSlideIndex}
                    onSelect={() => setCurrentSlideIndex(idx)}
                    onEdit={() => setEditingSlide(slide)}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                    isDragging={draggedIndex !== null}
                    dragOverIndex={dragOverIndex}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Main slide area */}
        <div className="flex-1 flex flex-col">
          {/* Slide viewer */}
          <div className="flex-1 p-6 flex items-center justify-center bg-muted/20">
            <AnimatePresence mode="wait">
              {currentSlide && (
                <motion.div
                  key={currentSlide.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="w-full max-w-4xl shadow-xl rounded-xl overflow-hidden"
                >
                  <SlidePreview slide={currentSlide} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Script segment */}
          {currentSlide?.scriptSegment && !isFullscreen && (
            <div className="p-4 border-t bg-card">
              <p className="text-sm text-muted-foreground italic line-clamp-2">
                "{currentSlide.scriptSegment}"
              </p>
            </div>
          )}

          {/* Controls */}
          <div className="p-4 border-t bg-card space-y-3">
            <Progress value={progress} className="h-1" />
            
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPreviousSlide}
                disabled={currentSlideIndex === 0 || isPresentationMode}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              
              <Button
                variant="default"
                size="icon"
                onClick={() => setIsPlaying(!isPlaying)}
                disabled={isPresentationMode}
                className="h-12 w-12"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={goToNextSlide}
                disabled={currentSlideIndex === slides.length - 1 || isPresentationMode}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
            
            {isPresentationMode && (
              <p className="text-xs text-center text-muted-foreground">
                Slides sync automatically with practice mode
              </p>
            )}
          </div>
        </div>

        {/* Editor sidebar */}
        <AnimatePresence>
          {editingSlide && !isFullscreen && (
            <div className="w-80 border-l bg-background p-4">
              <SlideEditor
                slide={editingSlide}
                onClose={() => setEditingSlide(null)}
              />
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
