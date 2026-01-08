import { supabase } from '@/integrations/supabase/client';
import { Slide, SlideType } from '@/stores/slidesStore';

export interface AISlideContent {
  title: string;
  content: string[];
  type: SlideType;
  imageKeyword?: string;
}

export interface AIGeneratedSlides {
  slides: AISlideContent[];
}

export const generateAISlides = async (
  scriptBlocks: { title: string; content: string }[],
  projectTitle: string
): Promise<Slide[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-slides', {
      body: {
        scriptBlocks,
        projectTitle,
      },
    });

    if (error) {
      console.error('Error generating AI slides:', error);
      throw error;
    }

    return data.slides;
  } catch (error) {
    console.error('AI slide generation failed:', error);
    throw error;
  }
};

export const enhanceSlideContent = async (
  slide: Slide,
  context: string
): Promise<Partial<Slide>> => {
  try {
    const { data, error } = await supabase.functions.invoke('enhance-slide', {
      body: {
        slide,
        context,
      },
    });

    if (error) {
      console.error('Error enhancing slide:', error);
      throw error;
    }

    return data.enhancedSlide;
  } catch (error) {
    console.error('Slide enhancement failed:', error);
    throw error;
  }
};
