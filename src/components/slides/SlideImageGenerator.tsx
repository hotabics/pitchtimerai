import { useState } from 'react';
import { motion } from 'framer-motion';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slide, useSlidesStore } from '@/stores/slidesStore';
import { generateSlideImage } from '@/services/slideImport';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SlideImageGeneratorProps {
  slide: Slide;
  onImageGenerated?: (imageUrl: string) => void;
}

export const SlideImageGenerator = ({ slide, onImageGenerated }: SlideImageGeneratorProps) => {
  const { updateSlide } = useSlidesStore();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateImage = async () => {
    if (!slide.imageKeyword && !slide.title) {
      toast({
        title: 'No keyword available',
        description: 'Add an image keyword to generate an image.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
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
      
      if (onImageGenerated) {
        onImageGenerated(imageUrl);
      }
      
      toast({
        title: 'Image generated!',
        description: 'AI image has been added to your slide.',
      });
    } catch (error) {
      console.error('Image generation failed:', error);
      updateSlide(slide.id, { isGeneratingImage: false });
      toast({
        title: 'Generation failed',
        description: 'Could not generate image. Try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRemoveImage = () => {
    updateSlide(slide.id, { generatedImageUrl: undefined });
    toast({
      title: 'Image removed',
      description: 'The generated image has been removed.',
    });
  };

  if (slide.generatedImageUrl) {
    return (
      <div className="relative">
        <img 
          src={slide.generatedImageUrl} 
          alt={slide.title}
          className="w-full rounded-lg object-cover aspect-video"
        />
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 h-7 w-7"
          onClick={handleRemoveImage}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleGenerateImage}
      disabled={isGenerating}
      className="w-full"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <ImagePlus className="w-4 h-4 mr-2" />
          Generate AI Image
        </>
      )}
    </Button>
  );
};

// Inline image preview for slide with background
export const SlideWithImage = ({ 
  slide, 
  children, 
  className 
}: { 
  slide: Slide; 
  children: React.ReactNode;
  className?: string;
}) => {
  if (!slide.generatedImageUrl) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div 
      className={cn('relative', className)}
      style={{
        backgroundImage: `url(${slide.generatedImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10">{children}</div>
    </div>
  );
};
