import { useState } from 'react';
import { Images, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useSlidesStore } from '@/stores/slidesStore';
import { generateSlideImage } from '@/services/slideImport';
import { toast } from '@/hooks/use-toast';

export const BulkImageGenerator = () => {
  const { slides, updateSlide } = useSlidesStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentSlide, setCurrentSlide] = useState('');
  const [completed, setCompleted] = useState(0);
  const [open, setOpen] = useState(false);

  // Filter slides that don't have images yet (skip title slides as they use gradient backgrounds)
  const slidesNeedingImages = slides.filter(
    slide => !slide.generatedImageUrl && slide.type !== 'title'
  );

  const handleGenerateAll = async () => {
    if (slidesNeedingImages.length === 0) {
      toast({
        title: 'All slides have images',
        description: 'Every slide already has a generated image.',
      });
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setCompleted(0);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < slidesNeedingImages.length; i++) {
      const slide = slidesNeedingImages[i];
      setCurrentSlide(slide.title);
      updateSlide(slide.id, { isGeneratingImage: true });

      try {
        const imageUrl = await generateSlideImage(
          slide.imageKeyword || 'presentation',
          slide.title
        );
        
        updateSlide(slide.id, { 
          generatedImageUrl: imageUrl,
          isGeneratingImage: false,
        });
        successCount++;
      } catch (error) {
        console.error(`Failed to generate image for slide ${slide.id}:`, error);
        updateSlide(slide.id, { isGeneratingImage: false });
        failCount++;
      }

      setCompleted(i + 1);
      setProgress(((i + 1) / slidesNeedingImages.length) * 100);
    }

    setIsGenerating(false);
    setCurrentSlide('');
    setOpen(false);

    toast({
      title: 'Bulk generation complete!',
      description: `Generated ${successCount} images${failCount > 0 ? `, ${failCount} failed` : ''}.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Images className="w-4 h-4" />
          <span className="hidden sm:inline">Generate All Images</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Images for All Slides</DialogTitle>
          <DialogDescription>
            AI will generate background images for slides without images.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!isGenerating ? (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Slides needing images:</span>
                <span className="font-medium">{slidesNeedingImages.length}</span>
              </div>
              
              {slidesNeedingImages.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Will generate for:
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {slidesNeedingImages.map((slide, idx) => (
                      <div 
                        key={slide.id} 
                        className="text-sm px-2 py-1 bg-muted rounded flex items-center gap-2"
                      >
                        <span className="text-muted-foreground">{idx + 1}.</span>
                        <span className="truncate">{slide.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  All slides already have images!
                </div>
              )}

              <Button 
                onClick={handleGenerateAll} 
                disabled={slidesNeedingImages.length === 0}
                className="w-full"
              >
                <Images className="w-4 h-4 mr-2" />
                Generate {slidesNeedingImages.length} Images
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm">Generating images...</span>
              </div>
              
              <Progress value={progress} className="h-2" />
              
              <div className="text-sm text-muted-foreground">
                {completed} / {slidesNeedingImages.length} completed
              </div>
              
              {currentSlide && (
                <div className="text-sm truncate">
                  Current: <span className="font-medium">{currentSlide}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
