import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSlidesStore, transitionEffects, TransitionEffect } from '@/stores/slidesStore';
import { cn } from '@/lib/utils';

export const TransitionSelector = () => {
  const { transitionEffect, setTransitionEffect } = useSlidesStore();

  const currentTransition = transitionEffects.find(t => t.id === transitionEffect);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Sparkles className="w-4 h-4" />
          <span className="hidden sm:inline">{currentTransition?.name || 'Fade'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {transitionEffects.map((transition) => (
          <DropdownMenuItem
            key={transition.id}
            onClick={() => setTransitionEffect(transition.id)}
            className={cn(
              'flex flex-col items-start gap-1 cursor-pointer',
              transitionEffect === transition.id && 'bg-accent'
            )}
          >
            <span className="font-medium">{transition.name}</span>
            <span className="text-xs text-muted-foreground">{transition.description}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Helper to get framer-motion variants based on transition effect
export const getTransitionVariants = (effect: TransitionEffect) => {
  switch (effect) {
    case 'slide':
      return {
        initial: { opacity: 0, x: 100 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -100 },
      };
    case 'zoom':
      return {
        initial: { opacity: 0, scale: 0.8 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 1.2 },
      };
    case 'none':
      return {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 1 },
      };
    case 'fade':
    default:
      return {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.95 },
      };
  }
};

export const getTransitionConfig = (effect: TransitionEffect): { duration: number; ease?: [number, number, number, number] } => {
  switch (effect) {
    case 'slide':
      return { duration: 0.3, ease: [0.4, 0, 0.2, 1] };
    case 'zoom':
      return { duration: 0.25, ease: [0, 0, 0.2, 1] };
    case 'none':
      return { duration: 0 };
    case 'fade':
    default:
      return { duration: 0.2 };
  }
};
