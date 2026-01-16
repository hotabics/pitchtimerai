import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { checkRateLimit, getRateLimitKey, createRateLimitResponse, getRateLimitConfig } from "../_shared/rate-limit.ts";
import { getAuthStatus } from "../_shared/auth-validation.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Maximum audio file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed audio MIME types
const ALLOWED_MIME_TYPES = [
  'audio/webm',
  'audio/wav',
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/ogg',
  'audio/flac',
  'audio/x-wav',
  'audio/x-m4a',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check authentication status (optional - allows both authenticated and anonymous)
    const authResult = await getAuthStatus(req);
    const isAuthenticated = authResult.authenticated;
    
    // Rate limiting - MUCH stricter for unauthenticated users (3/min vs 40/min)
    const rateLimitKey = getRateLimitKey(req, `elevenlabs-stt:${isAuthenticated ? 'auth' : 'anon'}`);
    const rateLimitConfig = getRateLimitConfig('speech', isAuthenticated);
    const rateLimitResult = checkRateLimit(rateLimitKey, rateLimitConfig);
    
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for key: ${rateLimitKey} (authenticated: ${isAuthenticated}, limit: ${rateLimitConfig.maxRequests}/min)`);
      return createRateLimitResponse(rateLimitResult, corsHeaders);
    }

    console.log(`STT request from ${isAuthenticated ? `user ${authResult.userId}` : 'anonymous'} (limit: ${rateLimitConfig.maxRequests}/min, remaining: ${rateLimitResult.remaining})`);

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');

    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    if (!audioFile) {
      return new Response(JSON.stringify({ error: 'Audio file is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate file size
    if (audioFile.size > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ error: 'Audio file exceeds maximum size of 10MB' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate file type
    const mimeType = audioFile.type.toLowerCase();
    if (!ALLOWED_MIME_TYPES.some(allowed => mimeType.includes(allowed.split('/')[1]))) {
      console.warn(`Invalid audio type received: ${mimeType}`);
      // Be lenient - some browsers report different MIME types
      // Just log a warning but proceed
    }

    console.log(`Processing audio file: ${audioFile.name}, size: ${audioFile.size} bytes, type: ${mimeType}`);

    // Prepare form data for ElevenLabs Scribe API
    const apiFormData = new FormData();
    apiFormData.append('file', audioFile);
    apiFormData.append('model_id', 'scribe_v1');
    apiFormData.append('tag_audio_events', 'false');
    apiFormData.append('diarize', 'false');
    apiFormData.append('language_code', 'eng');
    apiFormData.append('timestamps_granularity', 'word'); // Request word-level timestamps

    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: apiFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs STT error:', response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const transcription = await response.json();
    console.log('Transcription complete:', transcription.text?.substring(0, 100));

    return new Response(JSON.stringify(transcription), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in elevenlabs-stt:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
