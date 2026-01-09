import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Play, Pause, Maximize2, Minimize2,
  Plus, Sparkles, Download, Loader2, Wand2, Radio, FileDown, Upload,
  Edit3, Eye, Mic, MicOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSlidesStore, generateSlidesFromBlocks, Slide, SlideTheme } from '@/stores/slidesStore';
import { SlidePreview } from './SlidePreview';
import { SlideWYSIWYG } from './SlideWYSIWYG';
import { SlideEditor } from './SlideEditor';
import { DraggableThumbnail } from './DraggableThumbnail';
import { ThemeSelector } from './ThemeSelector';
import { SpeakerNotesPanel, SpeakerNotesToggle } from './SpeakerNotesPanel';
import { SlideImportDialog } from './SlideImportDialog';
import { TransitionSelector, getTransitionVariants, getTransitionConfig } from './TransitionSelector';
import { BulkImageGenerator } from './BulkImageGenerator';
import { GeminiExportModal } from './GeminiExportModal';
import { generateAISlides } from '@/services/slideAI';
import { exportToPowerPoint } from '@/services/pptxExport';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

// Voice commands for slide navigation
const NEXT_COMMANDS = ['next slide', 'next', 'go next', 'forward', 'advance'];
const PREV_COMMANDS = ['previous slide', 'previous', 'go back', 'back'];
const FIRST_COMMANDS = ['first slide', 'go to first', 'beginning', 'start'];
const LAST_COMMANDS = ['last slide', 'go to last', 'end', 'final slide'];
// Pattern: "go to slide X" or "slide X"
const GO_TO_PATTERN = /(?:go to\s+)?slide\s+(\d+)/i;

// TypeScript declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: Event & { error: string }) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SlideDeckProps {
  scriptBlocks?: { title: string; content: string }[];
  projectTitle?: string;
  onClose?: () => void;
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
    currentTheme,
    showSpeakerNotes,
    transitionEffect,
    setSlides,
    setCurrentSlideIndex,
    setIsGenerating,
    setCurrentTheme,
    addSlide,
    reorderSlides,
    clearSlides,
  } = useSlidesStore();

  // Import handler
  const handleImport = useCallback((importedSlides: Slide[], theme?: SlideTheme) => {
    setSlides(importedSlides);
    setCurrentSlideIndex(0);
    if (theme) {
      setCurrentTheme(theme);
    }
  }, [setSlides, setCurrentSlideIndex, setCurrentTheme]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<Slide | null>(null);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showGeminiModal, setShowGeminiModal] = useState(false);
  const [isWYSIWYGMode, setIsWYSIWYGMode] = useState(false);
  
  // Voice control state
  const [voiceControlEnabled, setVoiceControlEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string | null>(null);
  const [lastVoiceCommand, setLastVoiceCommand] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const lastCommandTimeRef = useRef(0);
  const transcriptTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Sync slides with practice mode
  useEffect(() => {
    if (isPresentationMode && slides.length > 0) {
      const slideIndex = Math.min(currentPracticeBlock + 1, slides.length - 1);
      setCurrentSlideIndex(slideIndex);
    }
  }, [isPresentationMode, currentPracticeBlock, slides.length, setCurrentSlideIndex]);

  useEffect(() => {
    if (isPresentationMode) {
      setIsPlaying(externalIsPlaying);
    }
  }, [isPresentationMode, externalIsPlaying]);

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

  // Export handlers
  const handleExportJSON = () => {
    const exportData = {
      title: projectTitle,
      theme: currentTheme,
      slides: slides.map(({ id, type, title, content, imageKeyword, speakerNotes }) => ({
        id,
        type,
        title,
        content,
        imageKeyword,
        speakerNotes,
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

  const handleExportPowerPoint = async () => {
    setIsExporting(true);
    try {
      await exportToPowerPoint(slides, currentTheme, projectTitle);
      toast({
        title: 'PowerPoint exported!',
        description: 'Your presentation has been downloaded as .pptx',
      });
    } catch (error) {
      console.error('PowerPoint export failed:', error);
      toast({
        title: 'Export failed',
        description: 'Could not export to PowerPoint. Try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    if (slides.length === 0 && scriptBlocks && scriptBlocks.length > 0) {
      handleGenerateSlides();
    }
  }, []);

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

  useEffect(() => {
    if (!isPlaying || slides.length === 0 || isPresentationMode) return;

    const interval = setInterval(() => {
      setCurrentSlideIndex((currentSlideIndex + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, currentSlideIndex, slides.length, setCurrentSlideIndex, isPresentationMode]);

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

  const goToNextSlide = useCallback(() => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  }, [currentSlideIndex, slides.length, setCurrentSlideIndex]);

  const goToPreviousSlide = useCallback(() => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  }, [currentSlideIndex, setCurrentSlideIndex]);

  const goToFirstSlide = useCallback(() => {
    setCurrentSlideIndex(0);
  }, [setCurrentSlideIndex]);

  const goToLastSlide = useCallback(() => {
    if (slides.length > 0) {
      setCurrentSlideIndex(slides.length - 1);
    }
  }, [slides.length, setCurrentSlideIndex]);

  const goToSlide = useCallback((slideNumber: number) => {
    const index = slideNumber - 1; // Convert to 0-based
    if (index >= 0 && index < slides.length) {
      setCurrentSlideIndex(index);
      return true;
    }
    return false;
  }, [slides.length, setCurrentSlideIndex]);

  // Show voice command feedback
  const showVoiceFeedback = useCallback((command: string, transcript: string) => {
    setLastVoiceCommand(command);
    setVoiceTranscript(transcript);
    
    // Clear after 2 seconds
    if (transcriptTimeoutRef.current) {
      clearTimeout(transcriptTimeoutRef.current);
    }
    transcriptTimeoutRef.current = setTimeout(() => {
      setVoiceTranscript(null);
      setLastVoiceCommand(null);
    }, 2000);
  }, []);

  // Voice control for slide navigation
  useEffect(() => {
    if (!voiceControlEnabled) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setIsListening(false);
      setVoiceTranscript(null);
      setLastVoiceCommand(null);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: 'Voice control unavailable',
        description: 'Your browser does not support speech recognition.',
        variant: 'destructive',
      });
      setVoiceControlEnabled(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      toast({ title: 'Voice control active', description: 'Say "next", "previous", "first", "last", or "go to slide 3"', duration: 3000 });
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const now = Date.now();
      // Cooldown of 1.5 seconds between commands
      if (now - lastCommandTimeRef.current < 1500) return;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript.toLowerCase().trim();
        
        // Show interim transcript for feedback
        if (!result.isFinal) {
          setVoiceTranscript(transcript);
          continue;
        }
        
        // Check for "go to slide X" pattern first
        const goToMatch = transcript.match(GO_TO_PATTERN);
        if (goToMatch) {
          const slideNum = parseInt(goToMatch[1], 10);
          if (goToSlide(slideNum)) {
            lastCommandTimeRef.current = now;
            showVoiceFeedback(`→ Slide ${slideNum}`, transcript);
            break;
          }
        }
        
        // Check for first slide commands
        if (FIRST_COMMANDS.some(cmd => transcript.includes(cmd))) {
          lastCommandTimeRef.current = now;
          goToFirstSlide();
          showVoiceFeedback('⇤ First slide', transcript);
          break;
        }
        
        // Check for last slide commands
        if (LAST_COMMANDS.some(cmd => transcript.includes(cmd))) {
          lastCommandTimeRef.current = now;
          goToLastSlide();
          showVoiceFeedback('⇥ Last slide', transcript);
          break;
        }
        
        // Check for next commands
        if (NEXT_COMMANDS.some(cmd => transcript.includes(cmd))) {
          lastCommandTimeRef.current = now;
          goToNextSlide();
          showVoiceFeedback('→ Next slide', transcript);
          break;
        }
        
        // Check for previous commands
        if (PREV_COMMANDS.some(cmd => transcript.includes(cmd))) {
          lastCommandTimeRef.current = now;
          goToPreviousSlide();
          showVoiceFeedback('← Previous slide', transcript);
          break;
        }
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        toast({
          title: 'Microphone access denied',
          description: 'Please allow microphone access for voice control.',
          variant: 'destructive',
        });
        setVoiceControlEnabled(false);
      }
    };

    recognition.onend = () => {
      // Restart if still enabled
      if (voiceControlEnabled && recognitionRef.current) {
        try {
          recognition.start();
        } catch (e) {
          // Ignore if already started
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();

    return () => {
      recognition.stop();
      recognitionRef.current = null;
      if (transcriptTimeoutRef.current) {
        clearTimeout(transcriptTimeoutRef.current);
      }
    };
  }, [voiceControlEnabled, goToNextSlide, goToPreviousSlide, goToFirstSlide, goToLastSlide, goToSlide, showVoiceFeedback]);

  const handleAddSlide = () => {
    const newSlide: Slide = {
      id: slides.length + 1,
      type: 'bullets',
      layout: 'default',
      title: 'New Slide',
      content: ['Add your content here'],
      scriptSegment: '',
      speakerNotes: '',
    };
    addSlide(newSlide);
    setCurrentSlideIndex(slides.length);
    setEditingSlide(newSlide);
  };

  const currentSlide = slides[currentSlideIndex];
  const progress = slides.length > 0 ? ((currentSlideIndex + 1) / slides.length) * 100 : 0;

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
      <div className="flex items-center justify-between p-3 border-b bg-card flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
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
            Add
          </Button>
          <Button
            variant={isWYSIWYGMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsWYSIWYGMode(!isWYSIWYGMode)}
            title={isWYSIWYGMode ? "Switch to preview mode" : "Edit slide content directly"}
          >
            {isWYSIWYGMode ? (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </>
            ) : (
              <>
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Text
              </>
            )}
          </Button>
          <Button
            variant={voiceControlEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => setVoiceControlEnabled(!voiceControlEnabled)}
            title={voiceControlEnabled ? 'Disable voice control' : 'Enable voice control (say "next slide")'}
            className={cn(
              voiceControlEnabled && "bg-green-600 hover:bg-green-700"
            )}
          >
            {voiceControlEnabled ? (
              <>
                <Mic className={cn("w-4 h-4 mr-2", isListening && "animate-pulse")} />
                Voice On
              </>
            ) : (
              <>
                <MicOff className="w-4 h-4 mr-2" />
                Voice
              </>
            )}
          </Button>
          <ThemeSelector />
          <TransitionSelector />
          <SpeakerNotesToggle />
          <BulkImageGenerator />
          <SlideImportDialog onImport={handleImport} />
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {currentSlideIndex + 1} / {slides.length}
          </span>
          
          {/* Export dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isExporting}>
                {isExporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportPowerPoint}>
                <FileDown className="w-4 h-4 mr-2" />
                PowerPoint (.pptx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportJSON}>
                <Download className="w-4 h-4 mr-2" />
                JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowGeminiModal(true)}>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Gemini Prompt
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
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
          <div className="flex-1 p-6 flex items-center justify-center bg-muted/20 relative">
            {/* Voice transcript overlay */}
            <AnimatePresence>
              {voiceControlEnabled && (voiceTranscript || lastVoiceCommand) && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-background/95 backdrop-blur-sm border border-primary/30 rounded-lg px-4 py-2 shadow-lg flex items-center gap-3"
                >
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    lastVoiceCommand ? "bg-green-500" : "bg-yellow-500 animate-pulse"
                  )} />
                  <div className="flex flex-col">
                    {lastVoiceCommand && (
                      <span className="text-sm font-semibold text-primary">{lastVoiceCommand}</span>
                    )}
                    {voiceTranscript && (
                      <span className="text-xs text-muted-foreground truncate max-w-xs">
                        "{voiceTranscript}"
                      </span>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <AnimatePresence mode="wait">
              {currentSlide && (
                <motion.div
                  key={`${currentSlide.id}-${isWYSIWYGMode ? 'edit' : 'view'}`}
                  variants={getTransitionVariants(transitionEffect)}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={getTransitionConfig(transitionEffect)}
                  className="w-full max-w-4xl shadow-xl rounded-xl overflow-hidden"
                >
                  {isWYSIWYGMode ? (
                    <SlideWYSIWYG 
                      slide={currentSlide} 
                      isEditing={true}
                      onExitEdit={() => setIsWYSIWYGMode(false)}
                    />
                  ) : (
                    <SlidePreview slide={currentSlide} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Speaker Notes Panel */}
          {currentSlide && !isFullscreen && showSpeakerNotes && (
            <SpeakerNotesPanel slide={currentSlide} />
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
            <div className="w-80 border-l bg-background p-4 overflow-y-auto">
              <SlideEditor
                slide={editingSlide}
                onClose={() => setEditingSlide(null)}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Gemini Export Modal */}
      <GeminiExportModal
        open={showGeminiModal}
        onOpenChange={setShowGeminiModal}
        slides={slides}
        projectTitle={projectTitle}
      />
    </div>
  );
};
