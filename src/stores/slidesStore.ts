// Zustand store for Auto-Deck Slides state management

import { create } from 'zustand';

export type SlideType = 'title' | 'bullets' | 'image' | 'big_number' | 'quote';
export type TransitionEffect = 'fade' | 'slide' | 'zoom' | 'none';

export interface SlideTheme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
  fontFamilyHeading: string;
}

export const transitionEffects: { id: TransitionEffect; name: string; description: string }[] = [
  { id: 'fade', name: 'Fade', description: 'Smooth fade in/out' },
  { id: 'slide', name: 'Slide', description: 'Slide from right' },
  { id: 'zoom', name: 'Zoom', description: 'Scale in/out' },
  { id: 'none', name: 'None', description: 'No animation' },
];

export const slideThemes: SlideTheme[] = [
  {
    id: 'modern',
    name: 'Modern',
    primaryColor: '#6366f1',
    secondaryColor: '#818cf8',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    accentColor: '#f59e0b',
    fontFamily: 'Inter, sans-serif',
    fontFamilyHeading: 'Inter, sans-serif',
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    primaryColor: '#8b5cf6',
    secondaryColor: '#a78bfa',
    backgroundColor: '#1a1a2e',
    textColor: '#f8fafc',
    accentColor: '#22d3ee',
    fontFamily: 'Inter, sans-serif',
    fontFamilyHeading: 'Inter, sans-serif',
  },
  {
    id: 'corporate',
    name: 'Corporate',
    primaryColor: '#1e40af',
    secondaryColor: '#3b82f6',
    backgroundColor: '#f8fafc',
    textColor: '#1e293b',
    accentColor: '#059669',
    fontFamily: 'Georgia, serif',
    fontFamilyHeading: 'Arial, sans-serif',
  },
  {
    id: 'creative',
    name: 'Creative',
    primaryColor: '#ec4899',
    secondaryColor: '#f472b6',
    backgroundColor: '#fdf4ff',
    textColor: '#4a044e',
    accentColor: '#8b5cf6',
    fontFamily: 'Poppins, sans-serif',
    fontFamilyHeading: 'Poppins, sans-serif',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    primaryColor: '#171717',
    secondaryColor: '#404040',
    backgroundColor: '#fafafa',
    textColor: '#171717',
    accentColor: '#dc2626',
    fontFamily: 'system-ui, sans-serif',
    fontFamilyHeading: 'system-ui, sans-serif',
  },
  {
    id: 'nature',
    name: 'Nature',
    primaryColor: '#059669',
    secondaryColor: '#10b981',
    backgroundColor: '#f0fdf4',
    textColor: '#14532d',
    accentColor: '#84cc16',
    fontFamily: 'Georgia, serif',
    fontFamilyHeading: 'Georgia, serif',
  },
];

export interface Slide {
  id: number;
  type: SlideType;
  title: string;
  content: string[];
  imageKeyword?: string;
  scriptSegment: string;
  speakerNotes?: string;
  backgroundColor?: string;
  accentColor?: string;
  generatedImageUrl?: string;
  isGeneratingImage?: boolean;
}

interface SlidesState {
  // Slides data
  slides: Slide[];
  currentSlideIndex: number;
  isGenerating: boolean;
  currentTheme: SlideTheme;
  showSpeakerNotes: boolean;
  transitionEffect: TransitionEffect;
  
  // Actions
  setSlides: (slides: Slide[]) => void;
  addSlide: (slide: Slide) => void;
  updateSlide: (id: number, updates: Partial<Slide>) => void;
  removeSlide: (id: number) => void;
  reorderSlides: (fromIndex: number, toIndex: number) => void;
  setCurrentSlideIndex: (index: number) => void;
  setIsGenerating: (generating: boolean) => void;
  setCurrentTheme: (theme: SlideTheme) => void;
  setShowSpeakerNotes: (show: boolean) => void;
  setTransitionEffect: (effect: TransitionEffect) => void;
  clearSlides: () => void;
}

export const useSlidesStore = create<SlidesState>((set) => ({
  // Initial state
  slides: [],
  currentSlideIndex: 0,
  isGenerating: false,
  currentTheme: slideThemes[0],
  showSpeakerNotes: true,
  transitionEffect: 'fade' as TransitionEffect,

  // Actions
  setSlides: (slides) => set({ slides }),
  
  addSlide: (slide) => set((state) => ({
    slides: [...state.slides, slide],
  })),
  
  updateSlide: (id, updates) => set((state) => ({
    slides: state.slides.map((slide) =>
      slide.id === id ? { ...slide, ...updates } : slide
    ),
  })),
  
  removeSlide: (id) => set((state) => ({
    slides: state.slides.filter((slide) => slide.id !== id),
  })),
  
  reorderSlides: (fromIndex, toIndex) => set((state) => {
    const newSlides = [...state.slides];
    const [removed] = newSlides.splice(fromIndex, 1);
    newSlides.splice(toIndex, 0, removed);
    return {
      slides: newSlides.map((slide, index) => ({ ...slide, id: index + 1 })),
    };
  }),
  
  setCurrentSlideIndex: (index) => set({ currentSlideIndex: index }),
  
  setIsGenerating: (generating) => set({ isGenerating: generating }),
  
  setCurrentTheme: (theme) => set({ currentTheme: theme }),
  
  setShowSpeakerNotes: (show) => set({ showSpeakerNotes: show }),
  
  setTransitionEffect: (effect) => set({ transitionEffect: effect }),
  
  clearSlides: () => set({ slides: [], currentSlideIndex: 0 }),
}));

// Helper function to generate slides from speech blocks
export const generateSlidesFromBlocks = (
  blocks: { title: string; content: string }[],
  projectTitle: string
): Slide[] => {
  const slides: Slide[] = [];
  
  // Title slide
  slides.push({
    id: 1,
    type: 'title',
    title: projectTitle,
    content: ['Your Pitch Deck'],
    scriptSegment: blocks[0]?.content?.slice(0, 100) || '',
    speakerNotes: 'Welcome the audience and introduce yourself.',
    backgroundColor: 'primary',
  });
  
  // Generate slides for each block
  blocks.forEach((block, index) => {
    const slideId = slides.length + 1;
    const sentences = block.content.split(/[.!?]+/).filter(s => s.trim());
    
    let slideType: SlideType = 'bullets';
    let content: string[] = [];
    let imageKeyword: string | undefined;
    
    const numberMatch = block.content.match(/(\d+(?:\.\d+)?[%KMB]?)/);
    if (numberMatch && sentences.length <= 2) {
      slideType = 'big_number';
      content = [numberMatch[1], sentences[0]?.trim() || block.title];
    } else if (block.content.includes('"') || block.title.toLowerCase().includes('quote')) {
      slideType = 'quote';
      const quoteMatch = block.content.match(/"([^"]+)"/);
      content = quoteMatch ? [quoteMatch[1]] : [sentences[0]?.trim() || ''];
    } else {
      slideType = 'bullets';
      content = sentences.slice(0, 4).map(s => s.trim()).filter(s => s.length > 0);
      if (content.length === 0) {
        content = [block.content.slice(0, 100)];
      }
    }
    
    const keywords = block.title.toLowerCase().split(' ').filter(w => 
      w.length > 3 && !['the', 'and', 'for', 'with', 'that', 'this'].includes(w)
    );
    imageKeyword = keywords[0] || 'technology';
    
    slides.push({
      id: slideId,
      type: slideType,
      title: block.title,
      content,
      imageKeyword,
      scriptSegment: block.content,
      speakerNotes: `Key points: ${block.title}. ${sentences[0] || ''}`,
    });
  });
  
  return slides;
};
