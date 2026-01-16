import { supabase } from '@/integrations/supabase/client';

export interface ParsedSlide {
  slide_number: number;
  title: string;
  content: string[];
  notes?: string;
  word_count: number;
}

export interface ParsedPresentation {
  slides: ParsedSlide[];
  total_slides: number;
  total_words: number;
  detected_sections: string[];
  summary: string;
}

export interface PresentationParseResponse {
  success: boolean;
  error?: string;
  data?: ParsedPresentation;
  filename?: string;
  fileSize?: number;
  fileType?: 'pptx' | 'pdf';
}

export const SUPPORTED_PRESENTATION_TYPES = ['.pptx', '.pdf'];
export const SUPPORTED_PRESENTATION_MIMES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];
export const MAX_PRESENTATION_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Check if a file is a supported presentation format
 */
export function isPresentationSupported(file: File): boolean {
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  return SUPPORTED_PRESENTATION_TYPES.includes(extension) || 
         SUPPORTED_PRESENTATION_MIMES.includes(file.type);
}

/**
 * Parse a presentation file (PPTX or PDF) and extract slide structure
 */
export async function parsePresentation(file: File): Promise<PresentationParseResponse> {
  // Validate file size
  if (file.size > MAX_PRESENTATION_SIZE) {
    return {
      success: false,
      error: `File too large. Maximum size is ${MAX_PRESENTATION_SIZE / 1024 / 1024}MB`
    };
  }

  // Validate file type
  if (!isPresentationSupported(file)) {
    return {
      success: false,
      error: 'Unsupported file type. Please upload a PPTX or PDF file.'
    };
  }

  try {
    const formData = new FormData();
    formData.append('file', file);

    const projectUrl = import.meta.env.VITE_SUPABASE_URL;
    const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    const response = await fetch(`${projectUrl}/functions/v1/parse-presentation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Failed to parse presentation: ${response.status}`
      };
    }

    return data;
  } catch (err) {
    console.error('Presentation parse error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to parse presentation'
    };
  }
}

/**
 * Generate timing segments for slides based on total duration
 */
export function generateSlideTimings(
  slides: ParsedSlide[], 
  totalDurationMinutes: number
): Array<{ slide: number; start: string; end: string; duration_seconds: number }> {
  const totalWords = slides.reduce((sum, s) => sum + s.word_count, 0);
  const totalSeconds = totalDurationMinutes * 60;
  
  // Weight slides by word count for time allocation
  let currentTime = 0;
  
  return slides.map((slide, index) => {
    const weight = totalWords > 0 ? slide.word_count / totalWords : 1 / slides.length;
    const slideDuration = Math.round(totalSeconds * weight);
    
    const start = formatTime(currentTime);
    currentTime += slideDuration;
    const end = formatTime(currentTime);
    
    return {
      slide: slide.slide_number,
      start,
      end,
      duration_seconds: slideDuration
    };
  });
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Convert parsed presentation to context for script generation
 */
export function presentationToContext(
  presentation: ParsedPresentation,
  options: {
    mode: 'strict' | 'improve';
    pitchType: 'investor' | 'sales' | 'demo' | 'hackathon';
    durationMinutes: number;
  }
): Record<string, unknown> {
  const timings = generateSlideTimings(presentation.slides, options.durationMinutes);
  
  return {
    hasPresentation: true,
    presentationMode: options.mode,
    pitchType: options.pitchType,
    duration: options.durationMinutes,
    slides: presentation.slides.map((slide, i) => ({
      ...slide,
      timing: timings[i]
    })),
    totalSlides: presentation.total_slides,
    totalWords: presentation.total_words,
    detectedSections: presentation.detected_sections,
    summary: presentation.summary
  };
}
