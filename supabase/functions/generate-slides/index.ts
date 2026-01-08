import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scriptBlocks, projectTitle } = await req.json();

    if (!scriptBlocks || !Array.isArray(scriptBlocks)) {
      return new Response(
        JSON.stringify({ error: 'scriptBlocks is required and must be an array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating slides for:', projectTitle);
    console.log('Script blocks:', scriptBlocks.length);

    const systemPrompt = `You are a professional presentation designer. Your task is to transform pitch script content into compelling slide content.

For each script block, create slide content that:
1. Uses concise, impactful titles (max 6 words)
2. Extracts key bullet points (max 4 per slide)
3. Identifies the best slide type based on content:
   - "title": For opening/closing slides
   - "bullets": For lists of points or features
   - "big_number": For impressive statistics or metrics (extract the key number)
   - "quote": For testimonials or memorable statements
   - "image": For concepts that benefit from visuals
4. Suggests relevant image keywords for each slide

Return a JSON array of slides with this structure:
{
  "slides": [
    {
      "id": 1,
      "type": "title" | "bullets" | "big_number" | "quote" | "image",
      "title": "Concise slide title",
      "content": ["Array", "of", "bullet points or content"],
      "imageKeyword": "relevant image search term",
      "scriptSegment": "Original script segment for reference"
    }
  ]
}

Make the content punchy, memorable, and visually oriented. Each bullet should be action-oriented and scannable.`;

    const userPrompt = `Create presentation slides for a pitch titled "${projectTitle}".

Script content to transform:
${scriptBlocks.map((block: { title: string; content: string }, i: number) => 
  `Section ${i + 1}: ${block.title}\n${block.content}`
).join('\n\n')}

Generate ${scriptBlocks.length + 1} slides (including a title slide). Make the content compelling and presentation-ready.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('AI response:', content);
    
    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Failed to parse AI response');
    }

    // Validate and sanitize slides
    const slides = parsedContent.slides?.map((slide: any, index: number) => ({
      id: index + 1,
      type: ['title', 'bullets', 'big_number', 'quote', 'image'].includes(slide.type) 
        ? slide.type 
        : 'bullets',
      title: slide.title || `Slide ${index + 1}`,
      content: Array.isArray(slide.content) 
        ? slide.content.slice(0, 5) 
        : [slide.content || ''],
      imageKeyword: slide.imageKeyword || 'technology',
      scriptSegment: slide.scriptSegment || scriptBlocks[index]?.content?.slice(0, 150) || '',
    })) || [];

    return new Response(
      JSON.stringify({ slides }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-slides function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
