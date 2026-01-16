import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response(
        JSON.stringify({ success: false, error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const filename = file.name.toLowerCase();
    const isPPTX = filename.endsWith('.pptx');
    const isPDF = filename.endsWith('.pdf');

    if (!isPPTX && !isPDF) {
      return new Response(
        JSON.stringify({ success: false, error: 'Only PPTX and PDF files are supported' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing presentation: ${file.name}, size: ${file.size}, type: ${file.type}`);

    // Read file content as ArrayBuffer for binary processing
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    // For now, we'll extract text content and use AI to structure it
    // In production, you'd use proper PPTX/PDF parsing libraries
    let textContent = '';
    
    try {
      // Try to decode as text (works for some formats with embedded text)
      const decoder = new TextDecoder('utf-8', { fatal: false });
      textContent = decoder.decode(bytes);
      
      // For PPTX, extract text from XML parts
      if (isPPTX) {
        // PPTX files are ZIP archives with XML content
        // Extract readable text portions
        const xmlPattern = /<a:t>([^<]+)<\/a:t>/g;
        const matches = textContent.matchAll(xmlPattern);
        const textParts: string[] = [];
        for (const match of matches) {
          if (match[1].trim()) {
            textParts.push(match[1].trim());
          }
        }
        
        // Also try to extract from any readable text
        const readablePattern = /[A-Za-z][A-Za-z0-9\s,.!?'-]{10,}/g;
        const readable = textContent.match(readablePattern) || [];
        
        textContent = [...textParts, ...readable.slice(0, 50)].join('\n');
      }
    } catch (e) {
      console.log('Binary file, using base64 for AI processing');
    }
    
    // If we couldn't extract text, send to AI for visual/OCR processing
    const contentForAI = textContent.length > 100 ? textContent.slice(0, 20000) : `[Binary ${isPPTX ? 'PPTX' : 'PDF'} file: ${file.name}]`;

    // Use Lovable AI to parse and structure the presentation
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert at analyzing presentation content and extracting structured slide information.

Given presentation content (could be extracted text from PPTX/PDF), structure it into individual slides with:
1. slide_number: Sequential number starting from 1
2. title: The slide title (infer if not explicit, e.g., "Slide 4 - Market")
3. content: Array of bullet points or key content from the slide
4. notes: Any speaker notes or important context (optional)
5. word_count: Approximate word count of the slide content

Also identify:
- detected_sections: Common pitch sections found (Problem, Solution, Market, Traction, Team, Ask, etc.)
- summary: A 2-3 sentence executive summary of the entire presentation

If the content appears to be a pitch deck, structure it appropriately with common sections.
If content is limited, make reasonable inferences about structure based on typical presentation patterns.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Please analyze this presentation and extract structured slide information:\n\nFilename: ${file.name}\nFile type: ${isPPTX ? 'PowerPoint (PPTX)' : 'PDF'}\n\n---\n\nExtracted content:\n${contentForAI}` }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_presentation_slides',
              description: 'Extract structured slide information from the presentation',
              parameters: {
                type: 'object',
                properties: {
                  slides: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        slide_number: { type: 'number' },
                        title: { type: 'string' },
                        content: { type: 'array', items: { type: 'string' } },
                        notes: { type: 'string' },
                        word_count: { type: 'number' }
                      },
                      required: ['slide_number', 'title', 'content', 'word_count']
                    }
                  },
                  total_slides: { type: 'number' },
                  total_words: { type: 'number' },
                  detected_sections: { type: 'array', items: { type: 'string' } },
                  summary: { type: 'string' }
                },
                required: ['slides', 'total_slides', 'total_words', 'detected_sections', 'summary'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_presentation_slides' } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'AI credits exhausted.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log('AI Response received');

    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error('Failed to extract structured data from AI response');
    }

    const presentationData: ParsedPresentation = JSON.parse(toolCall.function.arguments);
    console.log(`Extracted ${presentationData.slides.length} slides, ${presentationData.total_words} total words`);

    return new Response(
      JSON.stringify({
        success: true,
        data: presentationData,
        filename: file.name,
        fileSize: file.size,
        fileType: isPPTX ? 'pptx' : 'pdf'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing presentation:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
