import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateTrack, validateDuration, validateContext } from "../_shared/input-validation.ts";
import { checkRateLimit, getRateLimitKey, createRateLimitResponse, RATE_LIMITS } from "../_shared/rate-limit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Constants for time control engine
const SPEAKING_RATE = 130; // words per minute

// Hook style definitions for dynamic openers
type HookStyle = 'auto' | 'statistic' | 'villain' | 'story' | 'contrarian' | 'question';

const HOOK_STYLE_INSTRUCTIONS: Record<Exclude<HookStyle, 'auto'>, string> = {
  statistic: `**THE STATISTIC:** Start with a hard, quantifiable fact that shows the scale of the problem. Example: "70% of food is wasted before it ever reaches a plate." or "Companies lose $4.7 trillion annually to poor communication."`,
  villain: `**THE VILLAIN:** Immediately identify the enemy (inefficiency, cost, time, a broken system). Make it visceral. Example: "Manual data entry is the silent killer of productivity." or "Spreadsheets are where good ideas go to die."`,
  story: `**THE STORY:** Start with a specific micro-moment or anecdote. Ground it in time and place. Example: "Last Tuesday, I tried to buy a train ticket. 45 minutes later, I was still stuck in a queue." or "When my grandmother called me crying because she couldn't use her medication app..."`,
  contrarian: `**THE CONTRARIAN:** State something counter-intuitive or provocative. Challenge assumptions. Example: "Marketing is dead. Community is the new king." or "The best product doesn't always win. Distribution does."`,
  question: `**THE QUESTION:** Ask the audience something relatable that they'll mentally answer. Example: "Who here has ever lost their keys?" or "How many hours did you spend this week in meetings that could have been emails?"`,
};

// Track-specific hook preferences
const TRACK_HOOK_PREFERENCES: Record<string, HookStyle[]> = {
  'investor': ['statistic', 'villain'],
  'hackathon-no-demo': ['villain', 'question'],
  'hackathon-with-demo': ['villain', 'question'],
  'academic': ['statistic', 'contrarian'],
  'grandma': ['story'],
  'peers': ['question', 'story'],
};

function selectHookStyle(requestedStyle: HookStyle, track: string): Exclude<HookStyle, 'auto'> {
  if (requestedStyle !== 'auto') {
    return requestedStyle;
  }
  
  // Get track preferences or default to all styles
  const preferences = TRACK_HOOK_PREFERENCES[track] || ['statistic', 'villain', 'story', 'contrarian', 'question'];
  
  // Randomly select from preferences for variety
  const selected = preferences[Math.floor(Math.random() * preferences.length)];
  return selected as Exclude<HookStyle, 'auto'>;
}

interface SectionWeights {
  short: Record<string, number>;
  medium: Record<string, number>;
  long: Record<string, number>;
}

interface TrackConfig {
  name: string;
  tone: string;
  sections: string[];
  sectionWeights: SectionWeights;
}

const trackConfigs: Record<string, TrackConfig> = {
  'hackathon-no-demo': {
    name: 'Hackathon Pitch',
    tone: 'Energetic, technical but accessible, confident',
    sections: ['Hook', 'Problem', 'Existing Solutions', 'Your Solution', 'Work Done', 'Feasibility', 'Target Users', 'Next Steps', 'Closing'],
    sectionWeights: {
      short: { Hook: 15, Problem: 20, Solution: 25, 'Work Done': 25, Closing: 15 },
      medium: { Hook: 10, Problem: 15, 'Existing Solutions': 10, Solution: 20, 'Work Done': 20, Feasibility: 10, 'Next Steps': 10, Closing: 5 },
      long: { Hook: 8, Problem: 12, 'Existing Solutions': 10, Solution: 15, 'Work Done': 18, Feasibility: 12, Target: 10, 'Next Steps': 10, Closing: 5 },
    },
  },
  'hackathon-with-demo': {
    name: 'Hackathon Pitch with Demo',
    tone: 'Energetic, demo-focused, technical but accessible',
    sections: ['Hook', 'Problem', 'Solution', 'Demo', 'Work Done', 'Feasibility', 'Next Steps', 'Closing'],
    sectionWeights: {
      short: { Hook: 10, Problem: 15, Solution: 15, Demo: 35, 'Work Done': 15, Closing: 10 },
      medium: { Hook: 8, Problem: 12, Solution: 15, Demo: 30, 'Work Done': 15, Feasibility: 10, Closing: 10 },
      long: { Hook: 6, Problem: 10, Solution: 12, Demo: 25, 'Work Done': 15, Feasibility: 12, 'Next Steps': 12, Closing: 8 },
    },
  },
  'investor': {
    name: 'Investor Pitch',
    tone: 'Professional, confident, data-driven, compelling',
    sections: ['Hook', 'Problem', 'Solution', 'Market Size', 'Traction', 'Business Model', 'Competition', 'Team', 'Roadmap', 'The Ask'],
    sectionWeights: {
      short: { Hook: 10, Problem: 20, Solution: 20, Market: 15, Traction: 20, 'The Ask': 15 },
      medium: { Hook: 8, Problem: 12, Solution: 15, Market: 12, Traction: 15, 'Business Model': 15, Competition: 8, 'The Ask': 15 },
      long: { Hook: 5, Problem: 10, Solution: 12, Market: 12, Traction: 12, 'Business Model': 12, Competition: 10, Team: 10, Roadmap: 10, 'The Ask': 7 },
    },
  },
  'academic': {
    name: 'Academic Defense',
    tone: 'Formal, scholarly, precise, evidence-based',
    sections: ['Introduction', 'Problem Statement', 'Research Goals', 'Methodology', 'Results', 'Analysis', 'Conclusions', 'Contributions', 'Future Work'],
    sectionWeights: {
      short: { Introduction: 15, Problem: 20, Methodology: 25, Results: 25, Conclusions: 15 },
      medium: { Introduction: 10, Problem: 12, Goals: 10, Methodology: 20, Results: 20, Conclusions: 15, Contributions: 13 },
      long: { Introduction: 8, Problem: 10, Goals: 8, Methodology: 18, Results: 18, Analysis: 12, Conclusions: 10, Contributions: 10, 'Future Work': 6 },
    },
  },
  'grandma': {
    name: 'Simple Explanation',
    tone: 'Warm, patient, simple, caring, jargon-free',
    sections: ['Personal Connection', 'The Problem', 'What It Is', 'How It Helps', 'How to Use It', 'Safety & Trust', 'Closing'],
    sectionWeights: {
      short: { 'Personal Connection': 20, 'The Problem': 20, 'What It Is': 25, 'How It Helps': 25, Closing: 10 },
      medium: { 'Personal Connection': 15, 'The Problem': 15, 'What It Is': 20, 'How It Helps': 20, 'How to Use It': 15, 'Safety & Trust': 10, Closing: 5 },
      long: { 'Personal Connection': 12, 'The Problem': 12, 'What It Is': 18, 'How It Helps': 18, 'How to Use It': 15, 'Safety & Trust': 15, Closing: 10 },
    },
  },
  'peers': {
    name: 'Peers & Friends',
    tone: 'Casual, authentic, relatable, no-BS, conversational',
    sections: ['Hook', 'Relatable Problem', 'What It Is', 'Why You Should Care', 'How It Works', 'Comparison', 'Personal Story', 'CTA'],
    sectionWeights: {
      short: { Hook: 15, 'Relatable Problem': 20, 'What It Is': 25, 'Why You Should Care': 25, CTA: 15 },
      medium: { Hook: 12, 'Relatable Problem': 15, 'What It Is': 18, 'Why You Should Care': 18, 'How It Works': 15, 'Personal Story': 12, CTA: 10 },
      long: { Hook: 10, 'Relatable Problem': 12, 'What It Is': 15, 'Why You Should Care': 15, 'How It Works': 13, Comparison: 10, 'Personal Story': 15, CTA: 10 },
    },
  },
};

function getTimeCategory(minutes: number): 'short' | 'medium' | 'long' {
  if (minutes < 2) return 'short';
  if (minutes <= 5) return 'medium';
  return 'long';
}

function buildSpeechPrompt(
  track: string,
  duration: number,
  targetWordCount: number,
  inputs: Record<string, unknown>,
  hasDemo: boolean,
  hookStyle: Exclude<HookStyle, 'auto'>
): { systemPrompt: string; userPrompt: string } {
  const config = trackConfigs[track] || trackConfigs['hackathon-no-demo'];
  const timeCategory = getTimeCategory(duration);
  
  const hookInstruction = HOOK_STYLE_INSTRUCTIONS[hookStyle];
  
  const systemPrompt = `You are a World-Class Pitch Coach and professional speechwriter. Generate a pitch for a ${config.name} audience.

OPENING STRATEGY - USE THIS EXACT STYLE:
${hookInstruction}

CRITICAL RULES:
1. The script MUST be approximately ${targetWordCount} words (±10% tolerance: ${Math.round(targetWordCount * 0.9)}-${Math.round(targetWordCount * 1.1)} words).
2. Break the script into time-blocked paragraphs with time ranges.
3. Use the SAME LANGUAGE as the user's inputs (detect and match their language).
4. **ABSOLUTELY NO GENERIC OPENINGS.** Do NOT start with:
   - "Imagine a world..."
   - "In today's world..."
   - "Picture this..."
   - "Have you ever wondered..."
   - "Let me tell you about..."
   - "Hello/Hi everyone, today I will..."
   - Any variation of "Imagine"
5. The FIRST SENTENCE must grab attention IMMEDIATELY using the opening strategy above.
6. Write in a conversational, spoken style - this will be read aloud.
7. Include natural pauses indicated by "..." for dramatic effect.
${hasDemo ? '8. Include [ACTION: ...] cues in bold for demo transitions.' : ''}

TONE: ${config.tone}

OUTPUT FORMAT:
Return a JSON object with:
- "full_script": The complete spoken text as a single string (all blocks combined, natural flow)
- "bullet_points": Array of strings, each a short summary of a key section (e.g., "The Hook: [Short summary]", "The Problem: [Short summary]")
- "estimated_duration": Estimated speaking time (e.g., "2 min", "3 min 30 sec")
- "blocks": Array of speech blocks, each with:
  - "timeStart": Start time in "M:SS" format (e.g., "0:00", "0:45", "1:30")
  - "timeEnd": End time in "M:SS" format
  - "title": Section title
  - "content": The spoken text for this section (natural, conversational)
  - "isDemo": boolean (true if this is a demo section)
  - "visualCue": Optional string describing what should be on screen (slide, demo action)
- "totalWords": The actual word count of all content combined
- "hookStyle": "${hookStyle}" (the opening style used)`;

  const userInputsFormatted = Object.entries(inputs)
    .filter(([_, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `- ${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
    .join('\n');

  const userPrompt = `Generate a ${duration}-minute speech script for:

**Track:** ${config.name}
**Total Time:** ${duration} Minutes
**Target Word Count:** ${targetWordCount} words (SPEAKING_RATE: ${SPEAKING_RATE} wpm)
**Has Demo:** ${hasDemo ? 'Yes - include [ACTION: ...] cues' : 'No'}
**Opening Style:** ${hookStyle.toUpperCase()} - Start IMMEDIATELY with this style. No preamble.

**User Inputs:**
${userInputsFormatted}

**Section Structure for ${timeCategory} speeches (${duration} min):**
${config.sections.join(' → ')}

Generate a compelling, natural speech that hits the target word count. The first sentence is CRITICAL - make it impossible to ignore. No fluff, no filler.`;

  return { systemPrompt, userPrompt };
}

// Post-processing: Check for generic openings and flag for potential regeneration
function validateOpening(content: string): { isValid: boolean; reason?: string } {
  const firstSentence = content.split(/[.!?]/)[0]?.toLowerCase().trim() || '';
  
  const bannedPatterns = [
    /^imagine\s/,
    /^picture\s/,
    /^in today's world/,
    /^in a world/,
    /^have you ever wondered/,
    /^let me tell you/,
    /^hello.*today/i,
    /^hi.*today/i,
    /^good morning.*today/i,
    /^welcome.*today/i,
  ];
  
  for (const pattern of bannedPatterns) {
    if (pattern.test(firstSentence)) {
      return { isValid: false, reason: `Opening starts with banned pattern: "${firstSentence.substring(0, 50)}..."` };
    }
  }
  
  return { isValid: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const rateLimitKey = getRateLimitKey(req, 'generate-speech');
    const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.aiGeneration);
    
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for key: ${rateLimitKey}`);
      return createRateLimitResponse(rateLimitResult, corsHeaders);
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const body = await req.json();
    const { track, duration, inputs, hasDemo, hookStyle: requestedHookStyle } = body;

    // Validate track
    const trackResult = validateTrack(track);
    if (!trackResult.isValid) {
      return new Response(JSON.stringify({ error: trackResult.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate duration
    const durationResult = validateDuration(duration);
    if (!durationResult.isValid) {
      return new Response(JSON.stringify({ error: durationResult.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate inputs
    const inputsResult = validateContext(inputs);
    if (!inputsResult.isValid) {
      return new Response(JSON.stringify({ error: inputsResult.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Select hook style (auto-select based on track if not specified)
    const hookStyle = selectHookStyle(
      (requestedHookStyle as HookStyle) || 'auto',
      trackResult.sanitized!
    );
    
    console.log(`Generating speech for track: ${trackResult.sanitized}, duration: ${durationResult.value} min, hookStyle: ${hookStyle}`);
    
    // Calculate target word count
    const targetWordCount = Math.round(durationResult.value! * SPEAKING_RATE);
    console.log(`Target word count: ${targetWordCount} words (${SPEAKING_RATE} wpm × ${durationResult.value} min)`);

    const { systemPrompt, userPrompt } = buildSpeechPrompt(
      trackResult.sanitized!,
      durationResult.value!,
      targetWordCount,
      inputsResult.sanitized || {},
      hasDemo === true,
      hookStyle
    );

    // Retry logic for generic openings
    let parsed;
    let attempts = 0;
    const maxAttempts = 2;
    
    while (attempts < maxAttempts) {
      attempts++;
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: attempts === 1 ? 0.7 : 0.9, // Higher temp on retry for creativity
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: 'AI credits depleted. Please add funds.' }), {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const errorText = await response.text();
        console.error('AI gateway error:', response.status, errorText);
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content in AI response');
      }

      console.log(`AI response received (attempt ${attempts}), parsing...`);

      // Parse the JSON from the response
      try {
        const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
        parsed = JSON.parse(cleanContent);
      } catch (e) {
        console.error('Failed to parse AI response:', e, content);
        throw new Error('Failed to parse AI response');
      }

      // Validate response structure
      if (!parsed.blocks || !Array.isArray(parsed.blocks)) {
        throw new Error('Invalid response structure: missing blocks array');
      }

      // Ensure full_script exists (fallback to concatenated blocks)
      if (!parsed.full_script) {
        parsed.full_script = parsed.blocks.map((b: { content: string }) => b.content).join('\n\n');
      }

      // Check for generic openings
      const validation = validateOpening(parsed.full_script);
      if (validation.isValid) {
        console.log(`Opening validated successfully on attempt ${attempts}`);
        break;
      } else {
        console.warn(`Generic opening detected on attempt ${attempts}: ${validation.reason}`);
        if (attempts >= maxAttempts) {
          console.warn('Max attempts reached, using last result despite generic opening');
        }
      }
    }

    // Ensure bullet_points exist (fallback to block titles)
    if (!parsed.bullet_points || !Array.isArray(parsed.bullet_points)) {
      parsed.bullet_points = parsed.blocks.map((b: { title: string; content: string }) => 
        `${b.title}: ${b.content.split('.')[0]}.`
      );
    }

    // Ensure estimated_duration exists
    if (!parsed.estimated_duration) {
      const mins = Math.floor(parsed.totalWords / SPEAKING_RATE);
      const secs = Math.round(((parsed.totalWords / SPEAKING_RATE) - mins) * 60);
      parsed.estimated_duration = secs > 0 ? `${mins} min ${secs} sec` : `${mins} min`;
    }

    // Add hook style to response
    parsed.hookStyle = hookStyle;

    console.log(`Generated speech with ${parsed.blocks.length} blocks, ${parsed.totalWords} words, hookStyle: ${hookStyle}`);

    return new Response(JSON.stringify({ 
      speech: parsed,
      meta: {
        track: trackResult.sanitized,
        duration: durationResult.value,
        targetWordCount,
        actualWordCount: parsed.totalWords,
        speakingRate: SPEAKING_RATE,
        hookStyle,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-speech:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
