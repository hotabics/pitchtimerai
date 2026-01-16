import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileUp, FileText, Loader2, Check, X, 
  Presentation, Clock, Hash, ChevronDown, ChevronUp,
  Sparkles, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { 
  parsePresentation, 
  isPresentationSupported,
  ParsedPresentation,
  ParsedSlide,
  MAX_PRESENTATION_SIZE
} from '@/lib/api/presentationParser';
import { cn } from '@/lib/utils';

interface PresentationUploadProps {
  onPresentationParsed: (data: ParsedPresentation, filename: string) => void;
  onPresentationRemoved: () => void;
  currentPresentation?: {
    data: ParsedPresentation;
    filename: string;
  } | null;
  disabled?: boolean;
}

export function PresentationUpload({
  onPresentationParsed,
  onPresentationRemoved,
  currentPresentation,
  disabled
}: PresentationUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!isPresentationSupported(file)) {
      toast({
        title: 'Unsupported file',
        description: 'Please upload a PPTX or PDF file.',
        variant: 'destructive'
      });
      return;
    }

    if (file.size > MAX_PRESENTATION_SIZE) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 25MB.',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);

    try {
      const result = await parsePresentation(file);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to parse presentation');
      }

      onPresentationParsed(result.data, file.name);
      toast({
        title: '📊 Presentation analyzed!',
        description: `Extracted ${result.data.slides.length} slides, ${result.data.total_words} words`,
      });
    } catch (error) {
      console.error('Presentation parse error:', error);
      toast({
        title: 'Parse failed',
        description: error instanceof Error ? error.message : 'Could not parse presentation',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Compact view when presentation is loaded
  if (currentPresentation) {
    const { data, filename } = currentPresentation;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-primary/30 bg-primary/5 overflow-hidden"
      >
        {/* Header - always visible */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-primary/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Presentation className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground truncate max-w-[150px]">
                {filename}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  {data.slides.length} slides
                </span>
                <span>•</span>
                <span>{data.total_words} words</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onPresentationRemoved();
              }}
            >
              <X className="w-4 h-4" />
            </Button>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </button>

        {/* Expanded content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-3">
                {/* Detected sections */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Detected Sections</p>
                  <div className="flex flex-wrap gap-1.5">
                    {data.detected_sections.map((section) => (
                      <Badge 
                        key={section} 
                        variant="secondary" 
                        className="text-xs"
                      >
                        {section}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Summary</p>
                  <p className="text-sm text-foreground/80 line-clamp-3">
                    {data.summary}
                  </p>
                </div>

                {/* Slide preview */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Slides Preview</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {data.slides.slice(0, 5).map((slide) => (
                      <div 
                        key={slide.slide_number}
                        className="flex items-center gap-2 text-xs p-1.5 rounded bg-muted/50"
                      >
                        <span className="w-5 h-5 rounded bg-primary/20 text-primary flex items-center justify-center text-[10px] font-medium">
                          {slide.slide_number}
                        </span>
                        <span className="text-foreground truncate flex-1">
                          {slide.title}
                        </span>
                        <span className="text-muted-foreground">
                          {slide.word_count}w
                        </span>
                      </div>
                    ))}
                    {data.slides.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center py-1">
                        +{data.slides.length - 5} more slides
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // Upload zone when no presentation
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "rounded-xl border-2 border-dashed transition-all duration-200",
        isDragging 
          ? "border-primary bg-primary/10" 
          : "border-border/50 hover:border-primary/50 bg-muted/30",
        disabled && "opacity-50 pointer-events-none"
      )}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pptx,.pdf"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading}
      />
      
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading}
        className="w-full p-4 flex flex-col items-center gap-2 text-center"
      >
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
          isDragging ? "bg-primary/20" : "bg-muted"
        )}>
          {isUploading ? (
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          ) : (
            <FileUp className={cn(
              "w-5 h-5 transition-colors",
              isDragging ? "text-primary" : "text-muted-foreground"
            )} />
          )}
        </div>
        
        <div>
          <p className="text-sm font-medium text-foreground">
            {isUploading ? 'Analyzing...' : 'Upload Presentation'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            PPTX or PDF • Optional
          </p>
        </div>

        {!isUploading && (
          <div className="flex items-center gap-1.5 text-xs text-primary/80">
            <Sparkles className="w-3 h-3" />
            <span>AI will structure script by slides</span>
          </div>
        )}
      </button>
    </motion.div>
  );
}
