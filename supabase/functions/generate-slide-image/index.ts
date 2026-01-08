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
    const { keyword, slideTitle } = await req.json();

    if (!keyword && !slideTitle) {
      return new Response(
        JSON.stringify({ error: 'keyword or slideTitle is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating slide image for:', keyword, slideTitle);

    // Create a descriptive prompt from the keyword and title
    const prompt = `Professional presentation slide background image for: ${slideTitle || keyword}. 
Abstract, modern, corporate style. Clean, minimalist design with subtle gradients. 
High quality, suitable for business presentation. No text, no logos, no people.
Keyword theme: ${keyword || 'technology'}.`;

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'medium',
        output_format: 'png',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Image generated successfully');
    
    // gpt-image-1 returns base64 data directly
    const imageData = data.data[0]?.b64_json;
    
    if (!imageData) {
      throw new Error('No image data returned from API');
    }

    return new Response(
      JSON.stringify({ 
        image: `data:image/png;base64,${imageData}`,
        keyword,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-slide-image function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
