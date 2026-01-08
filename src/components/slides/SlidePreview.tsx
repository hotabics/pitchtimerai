import { motion } from 'framer-motion';
import { Slide, useSlidesStore } from '@/stores/slidesStore';
import { cn } from '@/lib/utils';

interface SlidePreviewProps {
  slide: Slide;
  isActive?: boolean;
  isThumbnail?: boolean;
  onClick?: () => void;
}

export const SlidePreview = ({ slide, isActive, isThumbnail, onClick }: SlidePreviewProps) => {
  const { currentTheme } = useSlidesStore();
  
  const baseClasses = cn(
    'relative rounded-lg overflow-hidden transition-all duration-200',
    isThumbnail ? 'aspect-video cursor-pointer' : 'aspect-video w-full',
    isActive && isThumbnail && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
    isThumbnail && 'hover:ring-2 hover:ring-muted-foreground/50'
  );

  // Dynamic theme styles
  const themeStyles = {
    backgroundColor: currentTheme.backgroundColor,
    color: currentTheme.textColor,
    fontFamily: currentTheme.fontFamily,
  };

  const headingStyles = {
    color: currentTheme.primaryColor,
    fontFamily: currentTheme.fontFamilyHeading,
  };

  const renderSlideContent = () => {
    switch (slide.type) {
      case 'title':
        return (
          <div 
            className="flex flex-col items-center justify-center h-full p-8 text-center"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.primaryColor}, ${currentTheme.secondaryColor})`,
            }}
          >
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'font-bold',
                isThumbnail ? 'text-sm' : 'text-4xl md:text-5xl'
              )}
              style={{ 
                color: '#ffffff',
                fontFamily: currentTheme.fontFamilyHeading,
              }}
            >
              {slide.title}
            </motion.h1>
            {slide.content[0] && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className={cn(
                  'mt-4',
                  isThumbnail ? 'text-xs' : 'text-xl'
                )}
                style={{ color: 'rgba(255,255,255,0.85)' }}
              >
                {slide.content[0]}
              </motion.p>
            )}
          </div>
        );

      case 'big_number':
        return (
          <div 
            className="flex flex-col items-center justify-center h-full p-8 text-center"
            style={themeStyles}
          >
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                'font-bold',
                isThumbnail ? 'text-2xl' : 'text-7xl md:text-8xl'
              )}
              style={headingStyles}
            >
              {slide.content[0]}
            </motion.div>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={cn(
                'mt-4 opacity-70',
                isThumbnail ? 'text-xs' : 'text-xl'
              )}
            >
              {slide.content[1] || slide.title}
            </motion.p>
          </div>
        );

      case 'quote':
        return (
          <div 
            className="flex flex-col items-center justify-center h-full p-8 text-center"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.secondaryColor}20, ${currentTheme.primaryColor}20)`,
              backgroundColor: currentTheme.backgroundColor,
            }}
          >
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn(
                'italic',
                isThumbnail ? 'text-xs' : 'text-2xl md:text-3xl'
              )}
              style={headingStyles}
            >
              "{slide.content[0]}"
            </motion.div>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={cn(
                'mt-6 opacity-60',
                isThumbnail ? 'text-[10px]' : 'text-lg'
              )}
              style={{ color: currentTheme.textColor }}
            >
              — {slide.title}
            </motion.p>
          </div>
        );

      case 'bullets':
      default:
        return (
          <div className="flex flex-col h-full p-6" style={themeStyles}>
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                'font-semibold mb-4',
                isThumbnail ? 'text-xs' : 'text-2xl md:text-3xl'
              )}
              style={headingStyles}
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
                    'flex items-start gap-2 opacity-80',
                    isThumbnail ? 'text-[8px]' : 'text-base md:text-lg'
                  )}
                >
                  <span style={{ color: currentTheme.accentColor }} className="mt-1">•</span>
                  <span className="line-clamp-2">{point}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        );
    }
  };

  // Wrapper with optional generated image background
  const wrapperStyle: React.CSSProperties = slide.generatedImageUrl ? {
    backgroundImage: `url(${slide.generatedImageUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  } : {};

  return (
    <div className={baseClasses} onClick={onClick} style={wrapperStyle}>
      {/* Dark overlay for readability when image is present */}
      {slide.generatedImageUrl && (
        <div className="absolute inset-0 bg-black/50 z-0" />
      )}
      <div className={cn('relative z-10 h-full', slide.generatedImageUrl && '[&_*]:!text-white')}>
        {renderSlideContent()}
      </div>
      {isThumbnail && (
        <div className="absolute bottom-1 right-1 bg-background/80 text-[10px] px-1.5 py-0.5 rounded text-muted-foreground z-20">
          {slide.id}
        </div>
      )}
      {slide.isGeneratingImage && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};
