import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Pencil, Trash2, Plus, Type, List, Hash, Quote, Image,
  ChevronUp, ChevronDown, Check, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Slide, SlideType, useSlidesStore } from '@/stores/slidesStore';
import { cn } from '@/lib/utils';

interface SlideEditorProps {
  slide: Slide;
  onClose: () => void;
}

const slideTypeOptions: { value: SlideType; label: string; icon: React.ReactNode }[] = [
  { value: 'title', label: 'Title', icon: <Type className="w-4 h-4" /> },
  { value: 'bullets', label: 'Bullets', icon: <List className="w-4 h-4" /> },
  { value: 'big_number', label: 'Big Number', icon: <Hash className="w-4 h-4" /> },
  { value: 'quote', label: 'Quote', icon: <Quote className="w-4 h-4" /> },
  { value: 'image', label: 'Image', icon: <Image className="w-4 h-4" /> },
];

export const SlideEditor = ({ slide, onClose }: SlideEditorProps) => {
  const { updateSlide, removeSlide, reorderSlides, slides } = useSlidesStore();
  
  const [title, setTitle] = useState(slide.title);
  const [content, setContent] = useState<string[]>(slide.content);
  const [type, setType] = useState<SlideType>(slide.type);
  const [imageKeyword, setImageKeyword] = useState(slide.imageKeyword || '');

  const currentIndex = slides.findIndex(s => s.id === slide.id);
  const canMoveUp = currentIndex > 0;
  const canMoveDown = currentIndex < slides.length - 1;

  const handleSave = () => {
    updateSlide(slide.id, {
      title,
      content: content.filter(c => c.trim()),
      type,
      imageKeyword: imageKeyword || undefined,
    });
    onClose();
  };

  const handleAddBullet = () => {
    setContent([...content, '']);
  };

  const handleUpdateBullet = (index: number, value: string) => {
    const newContent = [...content];
    newContent[index] = value;
    setContent(newContent);
  };

  const handleRemoveBullet = (index: number) => {
    setContent(content.filter((_, i) => i !== index));
  };

  const handleMoveUp = () => {
    if (canMoveUp) {
      reorderSlides(currentIndex, currentIndex - 1);
    }
  };

  const handleMoveDown = () => {
    if (canMoveDown) {
      reorderSlides(currentIndex, currentIndex + 1);
    }
  };

  const handleDelete = () => {
    removeSlide(slide.id);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="bg-card border rounded-xl p-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Edit Slide {slide.id}</h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleMoveUp}
            disabled={!canMoveUp}
            className="h-8 w-8"
          >
            <ChevronUp className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleMoveDown}
            disabled={!canMoveDown}
            className="h-8 w-8"
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Slide Type */}
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Slide Type</label>
        <Select value={type} onValueChange={(v) => setType(v as SlideType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {slideTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  {option.icon}
                  {option.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Title</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Slide title..."
        />
      </div>

      {/* Content */}
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Content</label>
        {type === 'bullets' ? (
          <div className="space-y-2">
            {content.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">•</span>
                <Input
                  value={item}
                  onChange={(e) => handleUpdateBullet(idx, e.target.value)}
                  placeholder={`Point ${idx + 1}...`}
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveBullet(idx)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddBullet}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Bullet Point
            </Button>
          </div>
        ) : (
          <Textarea
            value={content.join('\n')}
            onChange={(e) => setContent(e.target.value.split('\n'))}
            placeholder="Slide content..."
            rows={3}
          />
        )}
      </div>

      {/* Image Keyword */}
      {type === 'image' && (
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Image Keyword</label>
          <Input
            value={imageKeyword}
            onChange={(e) => setImageKeyword(e.target.value)}
            placeholder="e.g., technology, growth, team..."
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onClose} className="flex-1">
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={handleSave} className="flex-1">
          <Check className="w-4 h-4 mr-2" />
          Save
        </Button>
      </div>
    </motion.div>
  );
};
