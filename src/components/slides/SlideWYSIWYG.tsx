// WYSIWYG Slide Editor - Inline text editing directly on slides

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Slide, useSlidesStore } from '@/stores/slidesStore';
import { cn } from '@/lib/utils';
import { 
  Lightbulb, Target, Zap, TrendingUp, Users, Rocket, CheckCircle2,
  Plus, Trash2, GripVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SlideWYSIWYGProps {
  slide: Slide;
  isEditing?: boolean;
  onExitEdit?: () => void;
}

const BULLET_ICONS = [Lightbulb, Target, Zap, TrendingUp, Users, Rocket, CheckCircle2];

export const SlideWYSIWYG = ({ slide, isEditing = true, onExitEdit }: SlideWYSIWYGProps) => {
  const { updateSlide, currentTheme } = useSlidesStore();
  
  const [localTitle, setLocalTitle] = useState(slide.title);
  const [localContent, setLocalContent] = useState<string[]>(slide.content);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  const titleRef = useRef<HTMLDivElement>(null);
  
  // Sync with slide changes
  useEffect(() => {
    setLocalTitle(slide.title);
    setLocalContent(slide.content);
  }, [slide.id, slide.title, slide.content]);

  // Save changes
  const saveChanges = useCallback(() => {
    updateSlide(slide.id, {
      title: localTitle,
      content: localContent.filter(c => c.trim()),
    });
  }, [slide.id, localTitle, localContent, updateSlide]);

  // Auto-save on blur
  const handleTitleBlur = () => {
    saveChanges();
  };

  const handleContentBlur = (index: number) => {
    setEditingIndex(null);
    saveChanges();
  };

  const handleTitleInput = (e: React.FormEvent<HTMLDivElement>) => {
    setLocalTitle(e.currentTarget.textContent || '');
  };

  const handleContentInput = (index: number, e: React.FormEvent<HTMLDivElement>) => {
    const newContent = [...localContent];
    newContent[index] = e.currentTarget.textContent || '';
    setLocalContent(newContent);
  };

  const handleAddBullet = () => {
    const newContent = [...localContent, 'New point...'];
    setLocalContent(newContent);
    updateSlide(slide.id, { content: newContent });
    // Focus on the new bullet after render
    setTimeout(() => setEditingIndex(newContent.length - 1), 100);
  };

  const handleRemoveBullet = (index: number) => {
    const newContent = localContent.filter((_, i) => i !== index);
    setLocalContent(newContent);
    updateSlide(slide.id, { content: newContent });
  };

  // Theme styles
  const themeStyles = {
    backgroundColor: currentTheme.backgroundColor,
    color: currentTheme.textColor,
    fontFamily: currentTheme.fontFamily,
  };

  const headingStyles = {
    color: currentTheme.primaryColor,
    fontFamily: currentTheme.fontFamilyHeading,
  };

  // Editable text component
  const EditableText = ({ 
    value, 
    onInput, 
    onBlur, 
    className, 
    style,
    placeholder = 'Click to edit...',
    as: Tag = 'div'
  }: {
    value: string;
    onInput: (e: React.FormEvent<HTMLDivElement>) => void;
    onBlur: () => void;
    className?: string;
    style?: React.CSSProperties;
    placeholder?: string;
    as?: 'div' | 'span' | 'h1' | 'h2' | 'p';
  }) => (
    <Tag
      contentEditable={isEditing}
      suppressContentEditableWarning
      onInput={onInput}
      onBlur={onBlur}
      className={cn(
        className,
        isEditing && 'outline-none cursor-text hover:bg-white/5 focus:bg-white/10 focus:ring-2 focus:ring-cyan-400/50 rounded px-1 -mx-1 transition-all'
      )}
      style={style}
      data-placeholder={placeholder}
    >
      {value || placeholder}
    </Tag>
  );

  const layout = slide.layout || 'default';

  // Render based on layout type
  const renderContent = () => {
    switch (layout) {
      case 'shout':
        return (
          <div
            className="flex flex-col items-center justify-center h-full p-8 text-center"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.gradientFrom || currentTheme.primaryColor}, ${currentTheme.gradientTo || currentTheme.secondaryColor})`,
            }}
          >
            <EditableText
              value={slide.type === 'big_number' ? localContent[0] || '' : localTitle}
              onInput={(e) => slide.type === 'big_number' 
                ? handleContentInput(0, e) 
                : handleTitleInput(e)
              }
              onBlur={handleTitleBlur}
              className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight"
              style={{ 
                color: '#ffffff',
                fontFamily: currentTheme.fontFamilyHeading,
                textShadow: '0 4px 20px rgba(0,0,0,0.3)',
              }}
              placeholder="Enter headline..."
            />
            {(localContent[0] || slide.type === 'big_number') && (
              <EditableText
                value={slide.type === 'big_number' ? (localContent[1] || '') : (localContent[0] || '')}
                onInput={(e) => handleContentInput(slide.type === 'big_number' ? 1 : 0, e)}
                onBlur={() => handleContentBlur(0)}
                className="mt-6 text-xl md:text-2xl opacity-90"
                style={{ color: 'rgba(255,255,255,0.9)' }}
                placeholder="Add subtitle..."
              />
            )}
          </div>
        );

      case 'split':
        return (
          <div className="flex h-full" style={themeStyles}>
            {/* Left: Image placeholder */}
            <div className="w-1/2 h-full relative overflow-hidden">
              {slide.generatedImageUrl ? (
                <img
                  src={slide.generatedImageUrl}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${currentTheme.primaryColor}40, ${currentTheme.secondaryColor}40)`,
                  }}
                >
                  <span className="text-sm opacity-50">Image Area</span>
                </div>
              )}
            </div>
            
            {/* Right: Editable Content */}
            <div className="w-1/2 flex flex-col justify-center p-6">
              <EditableText
                value={localTitle}
                onInput={handleTitleInput}
                onBlur={handleTitleBlur}
                className="font-bold text-2xl md:text-3xl mb-4"
                style={headingStyles}
                placeholder="Enter title..."
              />
              <ul className="space-y-2">
                {localContent.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2 group">
                    <span style={{ color: currentTheme.accentColor }} className="mt-1">•</span>
                    <EditableText
                      value={point}
                      onInput={(e) => handleContentInput(idx, e)}
                      onBlur={() => handleContentBlur(idx)}
                      className="flex-1 text-sm md:text-base opacity-80"
                      placeholder="Add point..."
                    />
                    {isEditing && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                        onClick={() => handleRemoveBullet(idx)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
              {isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 text-muted-foreground hover:text-foreground"
                  onClick={handleAddBullet}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add bullet
                </Button>
              )}
            </div>
          </div>
        );

      case 'card':
        return (
          <div
            className="relative h-full"
            style={{
              background: slide.generatedImageUrl
                ? undefined
                : `linear-gradient(135deg, ${currentTheme.primaryColor}20, ${currentTheme.secondaryColor}20)`,
              backgroundColor: currentTheme.backgroundColor,
            }}
          >
            {slide.generatedImageUrl && (
              <div className="absolute inset-0">
                <img src={slide.generatedImageUrl} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40" />
              </div>
            )}
            
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl w-[80%] max-w-xl p-8 rounded-2xl">
              <EditableText
                value={localTitle}
                onInput={handleTitleInput}
                onBlur={handleTitleBlur}
                className="font-bold text-2xl md:text-3xl text-center"
                style={{ color: slide.generatedImageUrl ? '#ffffff' : currentTheme.primaryColor }}
                placeholder="Enter quote title..."
              />
              <EditableText
                value={localContent[0] || ''}
                onInput={(e) => handleContentInput(0, e)}
                onBlur={() => handleContentBlur(0)}
                className="mt-4 text-base md:text-lg text-center opacity-90"
                style={{ color: slide.generatedImageUrl ? 'rgba(255,255,255,0.9)' : currentTheme.textColor }}
                placeholder="Enter quote text..."
              />
            </div>
          </div>
        );

      case 'grid':
        return (
          <div className="flex flex-col h-full p-6" style={themeStyles}>
            <EditableText
              value={localTitle}
              onInput={handleTitleInput}
              onBlur={handleTitleBlur}
              className="font-bold text-2xl md:text-3xl mb-6"
              style={headingStyles}
              placeholder="Enter title..."
            />
            
            <div className={cn(
              'grid gap-4 flex-1',
              localContent.length <= 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'
            )}>
              {localContent.slice(0, 6).map((point, idx) => {
                const IconComponent = BULLET_ICONS[idx % BULLET_ICONS.length];
                return (
                  <div
                    key={idx}
                    className="flex flex-col items-center text-center p-4 rounded-xl group relative"
                    style={{ backgroundColor: `${currentTheme.primaryColor}10` }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
                      style={{ backgroundColor: `${currentTheme.primaryColor}20` }}
                    >
                      <IconComponent className="w-5 h-5" style={{ color: currentTheme.primaryColor }} />
                    </div>
                    <EditableText
                      value={point}
                      onInput={(e) => handleContentInput(idx, e)}
                      onBlur={() => handleContentBlur(idx)}
                      className="font-medium text-xs md:text-sm"
                      placeholder="Add point..."
                    />
                    {isEditing && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                        onClick={() => handleRemoveBullet(idx)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                );
              })}
              {isEditing && localContent.length < 6 && (
                <button
                  onClick={handleAddBullet}
                  className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors"
                >
                  <Plus className="w-6 h-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground mt-1">Add item</span>
                </button>
              )}
            </div>
          </div>
        );

      default:
        // Default bullets layout
        return (
          <div className="flex flex-col h-full p-6" style={themeStyles}>
            {/* Background image with overlay */}
            {slide.generatedImageUrl && (
              <div className="absolute inset-0">
                <img src={slide.generatedImageUrl} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70" />
              </div>
            )}
            
            <div className="relative z-10">
              <EditableText
                value={localTitle}
                onInput={handleTitleInput}
                onBlur={handleTitleBlur}
                className="font-bold text-2xl md:text-4xl mb-6"
                style={{
                  ...headingStyles,
                  color: slide.generatedImageUrl ? '#ffffff' : currentTheme.primaryColor,
                }}
                placeholder="Enter title..."
              />
              
              <ul className="space-y-3">
                {localContent.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-3 group">
                    <span 
                      className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: currentTheme.accentColor }}
                    />
                    <EditableText
                      value={point}
                      onInput={(e) => handleContentInput(idx, e)}
                      onBlur={() => handleContentBlur(idx)}
                      className="flex-1 text-base md:text-lg"
                      style={{ color: slide.generatedImageUrl ? 'rgba(255,255,255,0.9)' : currentTheme.textColor }}
                      placeholder="Add point..."
                    />
                    {isEditing && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                        onClick={() => handleRemoveBullet(idx)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
              
              {isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-4 text-muted-foreground hover:text-foreground"
                  onClick={handleAddBullet}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add bullet point
                </Button>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        'relative rounded-lg overflow-hidden aspect-video w-full',
        isEditing && 'ring-2 ring-cyan-400/50'
      )}
      style={themeStyles}
    >
      {renderContent()}
      
      {/* Edit mode indicator */}
      {isEditing && (
        <div className="absolute top-2 right-2 px-2 py-1 rounded bg-cyan-500/20 text-cyan-400 text-xs font-medium">
          Editing
        </div>
      )}
    </motion.div>
  );
};
