import { useState, useRef } from 'react';
import { Pencil, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slide } from '@/stores/slidesStore';
import { SlidePreview } from './SlidePreview';
import { cn } from '@/lib/utils';

interface DraggableThumbnailProps {
  slide: Slide;
  index: number;
  isActive: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  dragOverIndex: number | null;
}

export const DraggableThumbnail = ({
  slide,
  index,
  isActive,
  onSelect,
  onEdit,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
  dragOverIndex,
}: DraggableThumbnailProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    onDragStart(index);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    onDragOver(index);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    onDragEnd();
  };

  const showDropIndicator = dragOverIndex === index && isDragging;

  return (
    <div
      ref={dragRef}
      className={cn(
        'relative group transition-all duration-200',
        showDropIndicator && 'before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-primary before:rounded-full before:-translate-y-1'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={onDragEnd}
    >
      {/* Drag handle */}
      <div 
        className={cn(
          'absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center z-10 cursor-grab active:cursor-grabbing transition-opacity',
          isHovered ? 'opacity-100' : 'opacity-0'
        )}
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      
      <div className="pl-5">
        <SlidePreview
          slide={slide}
          isActive={isActive}
          isThumbnail
          onClick={onSelect}
        />
      </div>
      
      <Button
        variant="secondary"
        size="icon"
        className={cn(
          'absolute top-1 right-1 h-6 w-6 transition-opacity',
          isHovered ? 'opacity-100' : 'opacity-0'
        )}
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
      >
        <Pencil className="w-3 h-3" />
      </Button>
    </div>
  );
};
