// Gemini Canvas Export Modal - Pre-engineered prompt generator

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Check, Copy, ExternalLink, Sparkles } from 'lucide-react';
import { Slide } from '@/stores/slidesStore';
import { toast } from 'sonner';

interface GeminiExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slides: Slide[];
  projectTitle: string;
}

const STYLE_OPTIONS = [
  { id: 'minimal-tech', label: 'Minimalist Tech', description: 'Clean, modern, with generous whitespace' },
  { id: 'bold-startup', label: 'Bold Startup', description: 'High contrast, impactful typography' },
  { id: 'corporate-pro', label: 'Corporate Professional', description: 'Refined, trustworthy, data-focused' },
  { id: 'creative-pitch', label: 'Creative Pitch', description: 'Dynamic, colorful, energetic' },
];

export const GeminiExportModal = ({ open, onOpenChange, slides, projectTitle }: GeminiExportModalProps) => {
  const [selectedStyle, setSelectedStyle] = useState('minimal-tech');
  const [copied, setCopied] = useState(false);

  const generatePrompt = (): string => {
    const styleOption = STYLE_OPTIONS.find(s => s.id === selectedStyle);
    
    const slidesJSON = slides.map((slide, idx) => ({
      slideNumber: idx + 1,
      type: slide.type,
      title: slide.title,
      bulletPoints: slide.content,
      imageIdea: slide.imageKeyword || 'abstract technology',
      speakerNotes: slide.speakerNotes?.slice(0, 100),
    }));

    return `Act as a World-Class Presentation Designer. I have a pitch for a project called "${projectTitle}".

**The Goal:** Create a visually stunning presentation in Canvas mode.

**The Style:** ${styleOption?.label} - ${styleOption?.description}

**Design Requirements:**
- Use high-contrast typography that commands attention
- Include impactful imagery that reinforces each point
- Vary layouts between slides (50/50 splits, full-bleed images, centered big text, icon grids)
- Add subtle visual hierarchy with color and size
- Do NOT use generic clip art or basic templates

**The Content:** Here is the slide-by-slide breakdown:

\`\`\`json
${JSON.stringify(slidesJSON, null, 2)}
\`\`\`

**Instructions:**
1. Generate the visual structure for these ${slides.length} slides
2. For each slide, suggest specific imagery, color treatments, and layout
3. Focus on making the first slide (hook) and last slide (call-to-action) especially memorable
4. Use the "${styleOption?.label}" aesthetic consistently throughout

Begin with Slide 1 and work through each slide in order.`;
  };

  const prompt = generatePrompt();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      toast.success('Prompt copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy prompt');
    }
  };

  const handleOpenGemini = () => {
    window.open('https://gemini.google.com/', '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Export for Gemini Canvas
          </DialogTitle>
          <DialogDescription>
            Generate a professional prompt to create stunning slides in Gemini Canvas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Style Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Design Style</label>
            <Select value={selectedStyle} onValueChange={setSelectedStyle}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STYLE_OPTIONS.map(style => (
                  <SelectItem key={style.id} value={style.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{style.label}</span>
                      <span className="text-xs text-muted-foreground">{style.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Prompt Preview */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <label className="text-sm font-medium mb-2">Generated Prompt</label>
            <Textarea
              value={prompt}
              readOnly
              className="flex-1 min-h-[200px] font-mono text-xs resize-none bg-muted/50"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleCopy} className="flex-1">
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.span
                    key="check"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Copied!
                  </motion.span>
                ) : (
                  <motion.span
                    key="copy"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy to Clipboard
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
            <Button variant="outline" onClick={handleOpenGemini}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Gemini
            </Button>
          </div>

          {/* Instructions */}
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <p className="font-medium mb-1">How to use:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Copy the prompt above</li>
              <li>Open Gemini and start a new conversation</li>
              <li>Paste the prompt and enable Canvas mode</li>
              <li>Let Gemini generate your professional slides</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
