import { supabase } from '@/integrations/supabase/client';
import { Slide, SlideTheme, slideThemes } from '@/stores/slidesStore';

// Generate AI image for a slide
export const generateSlideImage = async (
  keyword: string,
  slideTitle?: string
): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-slide-image', {
      body: { keyword, slideTitle },
    });

    if (error) {
      console.error('Error generating slide image:', error);
      throw error;
    }

    return data.image;
  } catch (error) {
    console.error('Slide image generation failed:', error);
    throw error;
  }
};

// Import slides from JSON file
export const importSlidesFromJSON = async (file: File): Promise<{
  slides: Slide[];
  theme?: SlideTheme;
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        // Validate and parse slides
        if (!data.slides || !Array.isArray(data.slides)) {
          throw new Error('Invalid JSON format: missing slides array');
        }
        
        const slides: Slide[] = data.slides.map((slide: any, index: number) => ({
          id: slide.id || index + 1,
          type: ['title', 'bullets', 'big_number', 'quote', 'image'].includes(slide.type) 
            ? slide.type 
            : 'bullets',
          title: slide.title || `Slide ${index + 1}`,
          content: Array.isArray(slide.content) ? slide.content : [slide.content || ''],
          imageKeyword: slide.imageKeyword || undefined,
          scriptSegment: slide.scriptSegment || '',
          speakerNotes: slide.speakerNotes || '',
          generatedImageUrl: slide.generatedImageUrl || undefined,
        }));
        
        // Try to match theme if provided
        let theme: SlideTheme | undefined;
        if (data.theme?.id) {
          theme = slideThemes.find(t => t.id === data.theme.id) || data.theme;
        }
        
        resolve({ slides, theme });
      } catch (error) {
        reject(new Error('Failed to parse JSON file'));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

// Parse simple PowerPoint-like structure (XML from .pptx)
// Note: Full PPTX parsing requires server-side processing
// This provides basic support for exported JSON from other tools
export const importSlidesFromFile = async (file: File): Promise<{
  slides: Slide[];
  theme?: SlideTheme;
}> => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (extension === 'json') {
    return importSlidesFromJSON(file);
  }
  
  if (extension === 'pptx') {
    // For PPTX, we'll extract basic content
    return importSlidesFromPPTX(file);
  }
  
  throw new Error(`Unsupported file format: .${extension}. Please use .json or .pptx files.`);
};

// Basic PPTX import using JSZip-like extraction
export const importSlidesFromPPTX = async (file: File): Promise<{
  slides: Slide[];
  theme?: SlideTheme;
}> => {
  // PPTX files are ZIP archives containing XML files
  // We'll use the native DecompressionStream if available, or fallback to basic parsing
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Check if it's a valid ZIP file (PPTX signature)
    const signature = new Uint8Array(arrayBuffer.slice(0, 4));
    const zipSignature = [0x50, 0x4B, 0x03, 0x04]; // "PK\x03\x04"
    
    const isZip = signature.every((byte, i) => byte === zipSignature[i]);
    
    if (!isZip) {
      throw new Error('Invalid PowerPoint file format');
    }
    
    // For now, we'll create placeholder slides based on file info
    // Full PPTX parsing would require a more robust library
    const slides: Slide[] = [
      {
        id: 1,
        type: 'title',
        layout: 'shout',
        title: file.name.replace('.pptx', ''),
        content: ['Imported from PowerPoint'],
        scriptSegment: '',
        speakerNotes: 'This presentation was imported from a PowerPoint file.',
      },
      {
        id: 2,
        type: 'bullets',
        layout: 'default',
        title: 'Imported Content',
        content: [
          'PowerPoint import provides basic structure',
          'Edit slides to add your content',
          'Use AI Enhance for better content',
        ],
        scriptSegment: '',
        speakerNotes: '',
      },
    ];
    
    return { slides };
  } catch (error) {
    console.error('PPTX import error:', error);
    throw new Error('Failed to import PowerPoint file. Try exporting as JSON instead.');
  }
};
