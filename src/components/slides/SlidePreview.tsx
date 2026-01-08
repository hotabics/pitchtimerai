import { motion } from 'framer-motion';
import { Slide, useSlidesStore, LayoutType } from '@/stores/slidesStore';
import { cn } from '@/lib/utils';
import { Lightbulb, Target, Zap, TrendingUp, Users, Rocket, CheckCircle2 } from 'lucide-react';

interface SlidePreviewProps {
  slide: Slide;
  isActive?: boolean;
  isThumbnail?: boolean;
  onClick?: () => void;
}

// Icons for grid layout bullets
const BULLET_ICONS = [Lightbulb, Target, Zap, TrendingUp, Users, Rocket, CheckCircle2];

// Animation variants for "alive" feel
const fadeInUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const scaleInVariants = {
  hidden: { opacity: 0, scale: 1.05 },
  visible: { opacity: 1, scale: 1 },
};

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
    borderRadius: currentTheme.borderRadius || '8px',
  };

  const headingStyles = {
    color: currentTheme.primaryColor,
    fontFamily: currentTheme.fontFamilyHeading,
  };

  // Layout-specific rendering
  const renderLayoutContent = () => {
    const layout = slide.layout || 'default';

    switch (layout) {
      case 'shout':
        return renderShoutLayout();
      case 'split':
        return renderSplitLayout();
      case 'card':
        return renderCardLayout();
      case 'grid':
        return renderGridLayout();
      default:
        return renderDefaultLayout();
    }
  };

  // Layout A: The Shout - Big centered text
  const renderShoutLayout = () => (
    <motion.div
      className="flex flex-col items-center justify-center h-full p-8 text-center"
      style={{
        background: `linear-gradient(135deg, ${currentTheme.gradientFrom || currentTheme.primaryColor}, ${currentTheme.gradientTo || currentTheme.secondaryColor})`,
      }}
      initial="hidden"
      animate="visible"
      variants={scaleInVariants}
      transition={{ duration: 0.5 }}
    >
      <motion.h1
        variants={fadeInUpVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1, duration: 0.4 }}
        className={cn(
          'font-black tracking-tight',
          isThumbnail ? 'text-lg' : 'text-5xl md:text-6xl lg:text-7xl'
        )}
        style={{ 
          color: '#ffffff',
          fontFamily: currentTheme.fontFamilyHeading,
          textShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
      >
        {slide.type === 'big_number' ? slide.content[0] : slide.title}
      </motion.h1>
      {(slide.content[0] || slide.content[1]) && (
        <motion.p
          variants={fadeInUpVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3, duration: 0.4 }}
          className={cn(
            'mt-6 opacity-90',
            isThumbnail ? 'text-xs' : 'text-xl md:text-2xl'
          )}
          style={{ color: 'rgba(255,255,255,0.9)' }}
        >
          {slide.type === 'big_number' ? slide.content[1] : slide.content[0]}
        </motion.p>
      )}
    </motion.div>
  );

  // Layout B: The Split - 50/50 image + text
  const renderSplitLayout = () => (
    <div className="flex h-full" style={themeStyles}>
      {/* Left: Image */}
      <motion.div
        className="w-1/2 h-full relative overflow-hidden"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        {slide.generatedImageUrl ? (
          <motion.img
            src={slide.generatedImageUrl}
            alt={slide.title}
            className="w-full h-full object-cover"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.primaryColor}40, ${currentTheme.secondaryColor}40)`,
            }}
          />
        )}
      </motion.div>
      
      {/* Right: Content */}
      <motion.div
        className="w-1/2 flex flex-col justify-center p-6"
        variants={fadeInUpVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <h2
          className={cn('font-bold mb-4', isThumbnail ? 'text-xs' : 'text-2xl md:text-3xl')}
          style={headingStyles}
        >
          {slide.title}
        </h2>
        <ul className="space-y-2">
          {slide.content.map((point, idx) => (
            <motion.li
              key={idx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              className={cn(
                'flex items-start gap-2 opacity-80',
                isThumbnail ? 'text-[8px]' : 'text-sm md:text-base'
              )}
            >
              <span style={{ color: currentTheme.accentColor }} className="mt-0.5">•</span>
              <span className="line-clamp-2">{point}</span>
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </div>
  );

  // Layout C: The Card - Glassmorphism overlay
  const renderCardLayout = () => (
    <div
      className="relative h-full"
      style={{
        background: slide.generatedImageUrl
          ? undefined
          : `linear-gradient(135deg, ${currentTheme.primaryColor}20, ${currentTheme.secondaryColor}20)`,
        backgroundColor: currentTheme.backgroundColor,
      }}
    >
      {/* Background image with zoom animation */}
      {slide.generatedImageUrl && (
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        >
          <img
            src={slide.generatedImageUrl}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
        </motion.div>
      )}
      
      {/* Glassmorphism card */}
      <motion.div
        className={cn(
          'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
          'backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl',
          isThumbnail ? 'w-[85%] p-3 rounded-lg' : 'w-[80%] max-w-xl p-8 rounded-2xl'
        )}
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <h2
          className={cn(
            'font-bold text-center',
            isThumbnail ? 'text-xs' : 'text-2xl md:text-3xl'
          )}
          style={{ color: slide.generatedImageUrl ? '#ffffff' : currentTheme.primaryColor }}
        >
          {slide.title}
        </h2>
        {slide.content[0] && (
          <p
            className={cn(
              'mt-4 text-center opacity-90',
              isThumbnail ? 'text-[8px]' : 'text-base md:text-lg'
            )}
            style={{ color: slide.generatedImageUrl ? 'rgba(255,255,255,0.9)' : currentTheme.textColor }}
          >
            "{slide.content[0]}"
          </p>
        )}
      </motion.div>
    </div>
  );

  // Layout D: The Grid - Icon-based bullets
  const renderGridLayout = () => (
    <div className="flex flex-col h-full p-6" style={themeStyles}>
      <motion.h2
        variants={fadeInUpVariants}
        initial="hidden"
        animate="visible"
        className={cn('font-bold mb-6', isThumbnail ? 'text-xs' : 'text-2xl md:text-3xl')}
        style={headingStyles}
      >
        {slide.title}
      </motion.h2>
      
      <div className={cn(
        'grid gap-4 flex-1',
        slide.content.length <= 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'
      )}>
        {slide.content.slice(0, 6).map((point, idx) => {
          const IconComponent = BULLET_ICONS[idx % BULLET_ICONS.length];
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.1 }}
              className={cn(
                'flex flex-col items-center text-center p-3 rounded-xl',
                isThumbnail ? 'p-1' : 'p-4'
              )}
              style={{
                backgroundColor: `${currentTheme.primaryColor}10`,
              }}
            >
              <div
                className={cn(
                  'rounded-full flex items-center justify-center mb-2',
                  isThumbnail ? 'w-4 h-4' : 'w-10 h-10'
                )}
                style={{ backgroundColor: `${currentTheme.primaryColor}20` }}
              >
                <IconComponent
                  className={isThumbnail ? 'w-2 h-2' : 'w-5 h-5'}
                  style={{ color: currentTheme.primaryColor }}
                />
              </div>
              <span className={cn(
                'font-medium line-clamp-2',
                isThumbnail ? 'text-[6px]' : 'text-xs md:text-sm'
              )}>
                {point}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  // Default layout (classic bullets)
  const renderDefaultLayout = () => {
    // Handle different slide types within default layout
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
  const wrapperStyle: React.CSSProperties = (slide.layout !== 'card' && slide.layout !== 'split' && slide.generatedImageUrl) ? {
    backgroundImage: `url(${slide.generatedImageUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  } : {};

  return (
    <div className={baseClasses} onClick={onClick} style={wrapperStyle}>
      {/* Dark overlay for readability when image is present (non-card/split layouts) */}
      {slide.layout !== 'card' && slide.layout !== 'split' && slide.generatedImageUrl && (
        <div className="absolute inset-0 bg-black/50 z-0" />
      )}
      <div className={cn(
        'relative z-10 h-full',
        slide.layout !== 'card' && slide.layout !== 'split' && slide.generatedImageUrl && '[&_*]:!text-white'
      )}>
        {renderLayoutContent()}
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
