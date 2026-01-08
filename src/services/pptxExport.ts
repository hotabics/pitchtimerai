import pptxgen from 'pptxgenjs';
import { Slide, SlideTheme } from '@/stores/slidesStore';

// Convert hex to pptxgenjs color format
const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? hex.replace('#', '') : '000000';
};

export const exportToPowerPoint = async (
  slides: Slide[],
  theme: SlideTheme,
  title: string
): Promise<void> => {
  const pptx = new pptxgen();
  
  // Set presentation properties
  pptx.author = 'Pitch Coach';
  pptx.title = title;
  pptx.subject = 'Auto-Generated Pitch Deck';
  pptx.company = 'Pitch Coach';
  
  // Define master slide layout based on theme
  pptx.defineSlideMaster({
    title: 'MAIN_SLIDE',
    background: { color: hexToRgb(theme.backgroundColor) },
    objects: [
      // Footer
      { 
        text: { 
          text: title, 
          options: { 
            x: 0.5, 
            y: '92%', 
            w: '90%', 
            h: 0.3, 
            fontSize: 10, 
            color: hexToRgb(theme.textColor),
            fontFace: theme.fontFamily.split(',')[0].trim(),
          } 
        } 
      },
    ],
  });

  // Generate each slide
  slides.forEach((slide) => {
    const pptSlide = pptx.addSlide({ masterName: 'MAIN_SLIDE' });
    
    // Add speaker notes if present
    if (slide.speakerNotes) {
      pptSlide.addNotes(slide.speakerNotes);
    }

    switch (slide.type) {
      case 'title':
        // Title slide
        pptSlide.addText(slide.title, {
          x: '10%',
          y: '35%',
          w: '80%',
          h: 1.5,
          fontSize: 44,
          bold: true,
          color: hexToRgb(theme.primaryColor),
          fontFace: theme.fontFamilyHeading.split(',')[0].trim(),
          align: 'center',
        });
        
        if (slide.content[0]) {
          pptSlide.addText(slide.content[0], {
            x: '10%',
            y: '55%',
            w: '80%',
            h: 0.8,
            fontSize: 24,
            color: hexToRgb(theme.textColor),
            fontFace: theme.fontFamily.split(',')[0].trim(),
            align: 'center',
          });
        }
        break;

      case 'big_number':
        // Big number slide
        pptSlide.addText(slide.content[0] || '', {
          x: '10%',
          y: '25%',
          w: '80%',
          h: 2,
          fontSize: 96,
          bold: true,
          color: hexToRgb(theme.primaryColor),
          fontFace: theme.fontFamilyHeading.split(',')[0].trim(),
          align: 'center',
        });
        
        pptSlide.addText(slide.content[1] || slide.title, {
          x: '10%',
          y: '60%',
          w: '80%',
          h: 1,
          fontSize: 28,
          color: hexToRgb(theme.textColor),
          fontFace: theme.fontFamily.split(',')[0].trim(),
          align: 'center',
        });
        break;

      case 'quote':
        // Quote slide
        pptSlide.addText(`"${slide.content[0] || ''}"`, {
          x: '10%',
          y: '30%',
          w: '80%',
          h: 2,
          fontSize: 32,
          italic: true,
          color: hexToRgb(theme.primaryColor),
          fontFace: theme.fontFamily.split(',')[0].trim(),
          align: 'center',
        });
        
        pptSlide.addText(`— ${slide.title}`, {
          x: '10%',
          y: '65%',
          w: '80%',
          h: 0.6,
          fontSize: 20,
          color: hexToRgb(theme.textColor),
          fontFace: theme.fontFamily.split(',')[0].trim(),
          align: 'center',
        });
        break;

      case 'bullets':
      default:
        // Title
        pptSlide.addText(slide.title, {
          x: '5%',
          y: '8%',
          w: '90%',
          h: 1,
          fontSize: 36,
          bold: true,
          color: hexToRgb(theme.primaryColor),
          fontFace: theme.fontFamilyHeading.split(',')[0].trim(),
        });
        
        // Bullet points
        const bulletText = slide.content.map((point) => ({
          text: point,
          options: { 
            bullet: { type: 'bullet' as const },
            fontSize: 20,
            color: hexToRgb(theme.textColor),
            fontFace: theme.fontFamily.split(',')[0].trim(),
          },
        }));
        
        pptSlide.addText(bulletText, {
          x: '5%',
          y: '25%',
          w: '90%',
          h: 4,
          valign: 'top',
        });
        break;
    }
  });

  // Save the file
  await pptx.writeFile({ fileName: `${title.toLowerCase().replace(/\s+/g, '-')}.pptx` });
};
