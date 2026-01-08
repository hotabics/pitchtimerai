// Zustand store for Auto-Deck Slides state management

import { create } from 'zustand';

export type SlideType = 'title' | 'bullets' | 'image' | 'big_number' | 'quote';

export interface Slide {
  id: number;
  type: SlideType;
  title: string;
  content: string[];
  imageKeyword?: string;
  scriptSegment: string;
  backgroundColor?: string;
  accentColor?: string;
}

interface SlidesState {
  // Slides data
  slides: Slide[];
  currentSlideIndex: number;
  isGenerating: boolean;
  
  // Actions
  setSlides: (slides: Slide[]) => void;
  addSlide: (slide: Slide) => void;
  updateSlide: (id: number, updates: Partial<Slide>) => void;
  removeSlide: (id: number) => void;
  reorderSlides: (fromIndex: number, toIndex: number) => void;
  setCurrentSlideIndex: (index: number) => void;
  setIsGenerating: (generating: boolean) => void;
  clearSlides: () => void;
}

export const useSlidesStore = create<SlidesState>((set) => ({
  // Initial state
  slides: [],
  currentSlideIndex: 0,
  isGenerating: false,

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
    // Re-assign IDs based on new order
    return {
      slides: newSlides.map((slide, index) => ({ ...slide, id: index + 1 })),
    };
  }),
  
  setCurrentSlideIndex: (index) => set({ currentSlideIndex: index }),
  
  setIsGenerating: (generating) => set({ isGenerating: generating }),
  
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
    backgroundColor: 'primary',
  });
  
  // Generate slides for each block
  blocks.forEach((block, index) => {
    const slideId = slides.length + 1;
    const sentences = block.content.split(/[.!?]+/).filter(s => s.trim());
    
    // Determine slide type based on content analysis
    let slideType: SlideType = 'bullets';
    let content: string[] = [];
    let imageKeyword: string | undefined;
    
    // Check for numbers/statistics
    const numberMatch = block.content.match(/(\d+(?:\.\d+)?[%KMB]?)/);
    if (numberMatch && sentences.length <= 2) {
      slideType = 'big_number';
      content = [numberMatch[1], sentences[0]?.trim() || block.title];
    } 
    // Check for quotes or testimonials
    else if (block.content.includes('"') || block.title.toLowerCase().includes('quote')) {
      slideType = 'quote';
      const quoteMatch = block.content.match(/"([^"]+)"/);
      content = quoteMatch ? [quoteMatch[1]] : [sentences[0]?.trim() || ''];
    }
    // Default to bullets
    else {
      slideType = 'bullets';
      content = sentences.slice(0, 4).map(s => s.trim()).filter(s => s.length > 0);
      if (content.length === 0) {
        content = [block.content.slice(0, 100)];
      }
    }
    
    // Extract image keywords from title/content
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
    });
  });
  
  return slides;
};
