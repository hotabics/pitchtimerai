import { motion } from 'framer-motion';
import { Slide } from '@/stores/slidesStore';
import { cn } from '@/lib/utils';

interface SlidePreviewProps {
  slide: Slide;
  isActive?: boolean;
  isThumbnail?: boolean;
  onClick?: () => void;
}

export const SlidePreview = ({ slide, isActive, isThumbnail, onClick }: SlidePreviewProps) => {
  const baseClasses = cn(
    'relative rounded-lg overflow-hidden transition-all duration-200',
    isThumbnail ? 'aspect-video cursor-pointer' : 'aspect-video w-full',
    isActive && isThumbnail && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
    isThumbnail && 'hover:ring-2 hover:ring-muted-foreground/50'
  );

  const renderSlideContent = () => {
    switch (slide.type) {
      case 'title':
        return (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gradient-to-br from-primary to-primary/80">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'font-bold text-primary-foreground',
                isThumbnail ? 'text-sm' : 'text-4xl md:text-5xl'
              )}
            >
              {slide.title}
            </motion.h1>
            {slide.content[0] && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className={cn(
                  'mt-4 text-primary-foreground/80',
                  isThumbnail ? 'text-xs' : 'text-xl'
                )}
              >
                {slide.content[0]}
              </motion.p>
            )}
          </div>
        );

      case 'big_number':
        return (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-card">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                'font-bold text-primary',
                isThumbnail ? 'text-2xl' : 'text-7xl md:text-8xl'
              )}
            >
              {slide.content[0]}
            </motion.div>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={cn(
                'mt-4 text-muted-foreground',
                isThumbnail ? 'text-xs' : 'text-xl'
              )}
            >
              {slide.content[1] || slide.title}
            </motion.p>
          </div>
        );

      case 'quote':
        return (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gradient-to-br from-secondary to-secondary/80">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn(
                'text-primary italic',
                isThumbnail ? 'text-xs' : 'text-2xl md:text-3xl'
              )}
            >
              "{slide.content[0]}"
            </motion.div>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={cn(
                'mt-6 text-muted-foreground',
                isThumbnail ? 'text-[10px]' : 'text-lg'
              )}
            >
              — {slide.title}
            </motion.p>
          </div>
        );

      case 'bullets':
      default:
        return (
          <div className="flex flex-col h-full p-6 bg-card">
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                'font-semibold text-foreground mb-4',
                isThumbnail ? 'text-xs' : 'text-2xl md:text-3xl'
              )}
            >
              {slide.title}
            </motion.h2>
            <ul className="space-y-2 flex-1">
              {slide.content.map((point, idx) => (
                <motion.li
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * (idx + 1) }}
                  className={cn(
                    'flex items-start gap-2 text-muted-foreground',
                    isThumbnail ? 'text-[8px]' : 'text-base md:text-lg'
                  )}
                >
                  <span className="text-primary mt-1">•</span>
                  <span className="line-clamp-2">{point}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        );
    }
  };

  return (
    <div className={baseClasses} onClick={onClick}>
      {renderSlideContent()}
      {isThumbnail && (
        <div className="absolute bottom-1 right-1 bg-background/80 text-[10px] px-1.5 py-0.5 rounded text-muted-foreground">
          {slide.id}
        </div>
      )}
    </div>
  );
};
