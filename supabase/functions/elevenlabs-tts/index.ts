import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateTTSText, validateVoiceId } from "../_shared/input-validation.ts";
import { checkRateLimit, getRateLimitKey, createRateLimitResponse, RATE_LIMITS } from "../_shared/rate-limit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const rateLimitKey = getRateLimitKey(req, 'elevenlabs-tts');
    const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.speech);
    
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for key: ${rateLimitKey}`);
      return createRateLimitResponse(rateLimitResult, corsHeaders);
    }

    const body = await req.json();
    const { text, voiceId } = body;

    // Validate text
    const textResult = validateTTSText(text);
    if (!textResult.isValid) {
      return new Response(JSON.stringify({ error: textResult.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate voice ID
    const voiceResult = validateVoiceId(voiceId);
    if (!voiceResult.isValid) {
      return new Response(JSON.stringify({ error: voiceResult.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');

    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    console.log(`Generating TTS for text (${textResult.sanitized!.length} chars) with voice ${voiceResult.sanitized}`);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceResult.sanitized}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: textResult.sanitized,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    console.log(`Generated audio: ${audioBuffer.byteLength} bytes`);

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
      },
    });
  } catch (error) {
    console.error('Error in elevenlabs-tts:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
