import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Play, Pause, Maximize2, Minimize2,
  Plus, Pencil, Sparkles, Download, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSlidesStore, generateSlidesFromBlocks, Slide } from '@/stores/slidesStore';
import { SlidePreview } from './SlidePreview';
import { SlideEditor } from './SlideEditor';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface SlideDeckProps {
  scriptBlocks?: { title: string; content: string }[];
  projectTitle?: string;
  onClose?: () => void;
}

export const SlideDeck = ({ scriptBlocks, projectTitle = 'My Pitch', onClose }: SlideDeckProps) => {
  const {
    slides,
    currentSlideIndex,
    isGenerating,
    setSlides,
    setCurrentSlideIndex,
    setIsGenerating,
    addSlide,
    clearSlides,
  } = useSlidesStore();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<Slide | null>(null);
  const [showThumbnails, setShowThumbnails] = useState(true);

  // Generate slides from script blocks
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
    
    // Simulate generation delay for better UX
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

  // Auto-generate on mount if no slides exist
  useEffect(() => {
    if (slides.length === 0 && scriptBlocks && scriptBlocks.length > 0) {
      handleGenerateSlides();
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingSlide) return;
      
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
  }, [editingSlide, currentSlideIndex, slides.length]);

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || slides.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlideIndex((currentSlideIndex + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, currentSlideIndex, slides.length, setCurrentSlideIndex]);

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
    // Create a simple JSON export
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
  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Generating your slide deck...</p>
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
            Transform your pitch script into a professional slide deck with one click.
          </p>
        </div>
        <Button onClick={handleGenerateSlides} disabled={!scriptBlocks?.length}>
          <Sparkles className="w-4 h-4 mr-2" />
          Generate Slides
        </Button>
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateSlides}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Regenerate
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
        {/* Thumbnails sidebar */}
        {showThumbnails && !isFullscreen && (
          <div className="w-48 border-r bg-muted/30">
            <ScrollArea className="h-full p-2">
              <div className="space-y-2">
                {slides.map((slide, idx) => (
                  <div key={slide.id} className="relative group">
                    <SlidePreview
                      slide={slide}
                      isActive={idx === currentSlideIndex}
                      isThumbnail
                      onClick={() => setCurrentSlideIndex(idx)}
                    />
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSlide(slide);
                      }}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                  </div>
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
                disabled={currentSlideIndex === 0}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              
              <Button
                variant="default"
                size="icon"
                onClick={() => setIsPlaying(!isPlaying)}
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
                disabled={currentSlideIndex === slides.length - 1}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
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
