import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateIdea, validateType, validateContext } from "../_shared/input-validation.ts";
import { checkRateLimit, getRateLimitKey, createRateLimitResponse, RATE_LIMITS } from "../_shared/rate-limit.ts";
import { getAuthStatus } from "../_shared/auth-validation.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Allowed generation types
const ALLOWED_TYPES = [
  'problems', 'pain-suggestions', 'fix-suggestions', 'progress-suggestions',
  'hackathon_next_steps',
  'investor-opportunity-suggestions', 'investor-market-suggestions',
  'investor-traction-suggestions', 'investor-business-model-suggestions',
  'investor-ask-suggestions', 'academic-topic-suggestions',
  'academic-frame-suggestions', 'academic-methodology-suggestions',
  'academic-results-suggestions', 'academic-conclusions-suggestions',
  'grandma-connection-suggestions', 'grandma-pain-suggestions',
  'grandma-analogy-suggestions', 'grandma-benefits-suggestions',
  'grandma-safety-suggestions', 'peers-hook-suggestions',
  'peers-thing-suggestions', 'peers-why-care-suggestions',
  'peers-howto-suggestions', 'peers-comparison-suggestions',
  'peers-why-suggestions', 'peers-cta-suggestions',
  'persona', 'pitches', 'script'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check authentication status (optional - allows both authenticated and anonymous)
    const authResult = await getAuthStatus(req);
    const isAuthenticated = authResult.authenticated;
    const userId = authResult.userId;
    
    // Rate limiting - more generous for authenticated users
    const rateLimitKey = getRateLimitKey(req, 'generate-pitch');
    const rateLimitConfig = isAuthenticated 
      ? { ...RATE_LIMITS.aiGeneration, maxRequests: RATE_LIMITS.aiGeneration.maxRequests * 2 }
      : RATE_LIMITS.aiGeneration;
    const rateLimitResult = checkRateLimit(rateLimitKey, rateLimitConfig);
    
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for key: ${rateLimitKey} (authenticated: ${isAuthenticated})`);
      return createRateLimitResponse(rateLimitResult, corsHeaders);
    }

    console.log(`Request from ${isAuthenticated ? `user ${userId}` : 'anonymous'}`);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const body = await req.json();
    const { type, idea, context } = body;

    // Validate type
    const typeResult = validateType(type, ALLOWED_TYPES);
    if (!typeResult.isValid) {
      return new Response(JSON.stringify({ error: typeResult.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate idea
    const ideaResult = validateIdea(idea);
    if (!ideaResult.isValid) {
      return new Response(JSON.stringify({ error: ideaResult.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate context
    const contextResult = validateContext(context);
    if (!contextResult.isValid) {
      return new Response(JSON.stringify({ error: contextResult.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use sanitized values
    const sanitizedIdea = ideaResult.sanitized!;
    const sanitizedContext = contextResult.sanitized || {};

    console.log(`Generating ${typeResult.sanitized} for idea: ${sanitizedIdea.substring(0, 50)}...`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (typeResult.sanitized) {
      case 'problems':
        systemPrompt = 'You are a startup pitch expert. Generate realistic problem statements that a startup could solve.';
        userPrompt = `For a startup idea about "${sanitizedIdea}", generate 3 unique problem statements that this solution could address. 
        Return a JSON array with objects containing "id" (1, 2, 3), "title" (short 3-5 word title), and "description" (one sentence problem statement mentioning "${sanitizedIdea}").
        Only return valid JSON, no markdown.`;
        break;

      case 'pain-suggestions':
        systemPrompt = 'You are a startup pitch expert who identifies real pain points that users experience.';
        userPrompt = `For a startup idea about "${sanitizedIdea}", generate 4 specific pain point suggestions that this solution could address.
        Each pain point should:
        - Be specific about WHO experiences the problem
        - Mention WHEN or in what context it happens
        - Be concise (1 sentence, max 15 words)
        
        Return a JSON object with a "suggestions" array containing 4 strings.
        Example format: {"suggestions": ["Small business owners waste hours manually tracking inventory", "Freelancers struggle to manage invoices across multiple clients", ...]}
        Only return valid JSON, no markdown.`;
        break;

      case 'fix-suggestions':
        systemPrompt = 'You are a startup pitch expert who crafts compelling solution descriptions.';
        const painContext = sanitizedContext?.pain ? `The pain point being addressed: "${sanitizedContext.pain}"` : '';
        userPrompt = `For a startup idea about "${sanitizedIdea}"${painContext ? `, ${painContext}` : ''}, generate 4 specific solution/fix suggestions.
        Each solution should:
        - Describe HOW the solution works in simple terms
        - Be action-oriented and concrete
        - Be concise (1 sentence, max 15 words)
        
        Return a JSON object with a "suggestions" array containing 4 strings.
        Example format: {"suggestions": ["Automatically scans and categorizes receipts using AI", "Sends smart payment reminders before due dates", ...]}
        Only return valid JSON, no markdown.`;
        break;

      case 'progress-suggestions':
        systemPrompt = 'You are a hackathon mentor who helps teams describe their technical implementation.';
        userPrompt = `For a hackathon project about "${sanitizedIdea}", generate 4 architecture/tech stack suggestions that describe what was built.
        Each suggestion should:
        - Mention specific technologies or frameworks
        - Describe a key component or feature
        - Be concise (1 sentence, max 15 words)
        
        Return a JSON object with a "suggestions" array containing 4 strings.
        Example format: {"suggestions": ["Built real-time sync using Supabase Realtime and React hooks", "Implemented AI categorization with OpenAI GPT-4 API", ...]}
        Only return valid JSON, no markdown.`;
        break;

      case 'hackathon_next_steps':
        systemPrompt = 'You are a hackathon mentor who helps teams plan realistic next steps after the event.';
        const progressContext = sanitizedContext?.progress ? `Built so far: "${sanitizedContext.progress}". ` : '';
        const problemContext = sanitizedContext?.painPoint ? `Problem: "${sanitizedContext.painPoint}". ` : '';
        const solutionContext = sanitizedContext?.solution ? `Solution: "${sanitizedContext.solution}". ` : '';
        userPrompt = `For a hackathon project about "${sanitizedIdea}". ${problemContext}${solutionContext}${progressContext}Generate 4 actionable next steps for after the hackathon.
        Each suggestion should:
        - Be specific and time-bound (mention timeframes like "next week", "30 days", etc.)
        - Focus on validation, growth, or development milestones
        - Be realistic for an early-stage project
        - Be concise (1 sentence, max 20 words)
        
        Return a JSON object with a "suggestions" array containing 4 strings.
        Example format: {"suggestions": ["Next week: onboard 10 beta users and gather feedback", "Within 30 days: launch on Product Hunt and secure 500 signups", ...]}
        Only return valid JSON, no markdown.`;
        break;

      case 'investor-opportunity-suggestions':
        systemPrompt = 'You are an investor pitch expert who helps quantify market opportunities.';
        userPrompt = `For a startup idea about "${sanitizedIdea}", generate 4 opportunity/problem cost suggestions.
        Each suggestion should:
        - Quantify the problem (cost, time lost, frequency)
        - Be specific about who is affected
        - Be concise (1 sentence, max 20 words)
        
        Return a JSON object with a "suggestions" array containing 4 strings.
        Example format: {"suggestions": ["SMBs lose $10K annually to inventory mismanagement, affecting 68% of retailers", ...]}
        Only return valid JSON, no markdown.`;
        break;

      case 'investor-market-suggestions':
        systemPrompt = 'You are a market research expert who helps define TAM/SAM/SOM.';
        userPrompt = `For a startup idea about "${sanitizedIdea}", generate 4 market size suggestions.
        Each suggestion should:
        - Include realistic market size estimates
        - Reference a specific market segment
        - Be concise (1 sentence, max 20 words)
        
        Return a JSON object with a "suggestions" array containing 4 strings.
        Example format: {"suggestions": ["Global expense management market: $12B TAM, 15% CAGR through 2028", ...]}
        Only return valid JSON, no markdown.`;
        break;

      case 'investor-traction-suggestions':
        systemPrompt = 'You are a startup advisor who helps founders describe early traction metrics.';
        userPrompt = `For a startup idea about "${sanitizedIdea}", generate 4 traction/validation suggestions.
        Each suggestion should:
        - Describe a realistic early-stage metric
        - Be specific and measurable
        - Be concise (1 sentence, max 15 words)
        
        Return a JSON object with a "suggestions" array containing 4 strings.
        Example format: {"suggestions": ["500 beta users with 40% weekly retention rate", "3 enterprise pilots with Fortune 500 companies", ...]}
        Only return valid JSON, no markdown.`;
        break;

      case 'investor-business-model-suggestions':
        systemPrompt = 'You are a business strategy expert who helps define monetization models.';
        userPrompt = `For a startup idea about "${sanitizedIdea}", generate 4 business model/pricing suggestions.
        Each suggestion should:
        - Describe a specific pricing tier or revenue stream
        - Include example pricing
        - Be concise (1 sentence, max 15 words)
        
        Return a JSON object with a "suggestions" array containing 4 strings.
        Example format: {"suggestions": ["SaaS subscription: $29/mo starter, $99/mo team, $299/mo enterprise", ...]}
        Only return valid JSON, no markdown.`;
        break;

      case 'investor-ask-suggestions':
        systemPrompt = 'You are a fundraising advisor who helps founders structure investment asks.';
        userPrompt = `For a startup idea about "${sanitizedIdea}", generate 4 investment ask suggestions.
        Each suggestion should:
        - Include funding amount and allocation
        - Be specific about use of funds
        - Be concise (1 sentence, max 20 words)
        
        Return a JSON object with a "suggestions" array containing 4 strings.
        Example format: {"suggestions": ["Raising $500K: 50% engineering, 30% sales, 20% operations for 18-month runway", ...]}
        Only return valid JSON, no markdown.`;
        break;

      case 'academic-topic-suggestions':
        systemPrompt = 'You are an academic advisor who helps structure research presentations.';
        userPrompt = `For a research topic about "${sanitizedIdea}", generate 4 topic relevance suggestions.
        Each suggestion should:
        - Explain why this research matters
        - Reference real-world impact or applications
        - Be concise (1 sentence, max 20 words)
        
        Return a JSON object with a "suggestions" array containing 4 strings.
        Example format: {"suggestions": ["Addresses critical gap in early disease detection, potentially improving survival rates by 30%", ...]}
        Only return valid JSON, no markdown.`;
        break;

      case 'academic-frame-suggestions':
        systemPrompt = 'You are a research methodology expert who helps define research objectives.';
        userPrompt = `For a research topic about "${sanitizedIdea}", generate 4 research goal/hypothesis suggestions.
        Each suggestion should:
        - Define a clear research objective or hypothesis
        - Be testable and specific
        - Be concise (1 sentence, max 20 words)
        
        Return a JSON object with a "suggestions" array containing 4 strings.
        Example format: {"suggestions": ["Hypothesis: The proposed method achieves 95% accuracy while reducing computation time by 50%", ...]}
        Only return valid JSON, no markdown.`;
        break;

      case 'academic-methodology-suggestions':
        systemPrompt = 'You are a research methodology expert who helps describe research approaches.';
        userPrompt = `For a research topic about "${sanitizedIdea}", generate 4 methodology suggestions.
        Each suggestion should:
        - Describe a specific research method or approach
        - Include data or tools used
        - Be concise (1 sentence, max 15 words)
        
        Return a JSON object with a "suggestions" array containing 4 strings.
        Example format: {"suggestions": ["Quantitative analysis using 10,000-sample dataset with 5-fold cross-validation", ...]}
        Only return valid JSON, no markdown.`;
        break;

      case 'academic-results-suggestions':
        systemPrompt = 'You are a research presentation expert who helps articulate findings.';
        userPrompt = `For a research topic about "${sanitizedIdea}", generate 4 key results suggestions.
        Each suggestion should:
        - Present a quantifiable finding
        - Include metrics or statistical significance
        - Be concise (1 sentence, max 20 words)
        
        Return a JSON object with a "suggestions" array containing 4 strings.
        Example format: {"suggestions": ["Achieved 96.3% accuracy (p < 0.001), exceeding baseline performance by 12%", ...]}
        Only return valid JSON, no markdown.`;
        break;

      case 'academic-conclusions-suggestions':
        systemPrompt = 'You are an academic advisor who helps summarize research contributions.';
        userPrompt = `For a research topic about "${sanitizedIdea}", generate 4 conclusion/contribution suggestions.
        Each suggestion should:
        - Summarize a key contribution or implication
        - Be suitable for a thesis defense
        - Be concise (1 sentence, max 20 words)
        
        Return a JSON object with a "suggestions" array containing 4 strings.
        Example format: {"suggestions": ["Novel optimization technique reduces training time by 78% while maintaining accuracy", ...]}
        Only return valid JSON, no markdown.`;
        break;

      case 'grandma-connection-suggestions':
        systemPrompt = 'You are an expert at explaining technology to elderly family members in heartfelt, emotional terms.';
        userPrompt = `For a project about "${sanitizedIdea}", generate 4 personal connection suggestions for explaining to a grandma.
        Each suggestion should:
        - Be emotional and heartfelt
        - Focus on WHY sharing this matters personally
        - Be simple and jargon-free
        - Be concise (1 sentence, max 15 words)
        
        Return a JSON object with a "suggestions" array containing 4 strings.
        Example format: {"suggestions": ["I want you to understand what I've been working on because you always believed in me", ...]}
        Only return valid JSON, no markdown.`;
        break;

      case 'grandma-pain-suggestions':
        systemPrompt = 'You are an expert at explaining technology problems in relatable, everyday terms for elderly people.';
        userPrompt = `For a project about "${sanitizedIdea}", generate 4 relatable pain point suggestions a grandma would understand.
        Each suggestion should:
        - Use everyday situations she can relate to
        - Start with "You know how..." or similar phrasing
        - Avoid technical jargon completely
        - Be concise (1 sentence, max 15 words)
        
        Return a JSON object with a "suggestions" array containing 4 strings.
        Example format: {"suggestions": ["You know how it's hard to remember which pills to take and when?", ...]}
        Only return valid JSON, no markdown.`;
        break;

      case 'grandma-analogy-suggestions':
        systemPrompt = 'You are an expert at creating simple analogies that explain technology to elderly people.';
        userPrompt = `For a project about "${sanitizedIdea}", generate 4 simple analogy suggestions a grandma would understand.
        Each suggestion should:
        - Compare to something familiar from daily life
        - Use "It's like a..." format
        - Be completely jargon-free
        - Be concise (1 sentence, max 15 words)
        
        Return a JSON object with a "suggestions" array containing 4 strings.
        Example format: {"suggestions": ["It's like a friendly alarm clock that reminds you of important things", ...]}
        Only return valid JSON, no markdown.`;
        break;

      case 'grandma-benefits-suggestions':
        systemPrompt = 'You are an expert at explaining technology benefits to elderly people in practical, caring terms.';
        userPrompt = `For a project about "${sanitizedIdea}", generate 4 benefit suggestions a grandma would appreciate.
        Each suggestion should:
        - Focus on practical life improvements
        - Use warm, caring language
        - Avoid technical terms
        - Be concise (1 sentence, max 15 words)
        
        Return a JSON object with a "suggestions" array containing 4 strings.
        Example format: {"suggestions": ["It helps you stay connected with family without any confusing buttons", ...]}
        Only return valid JSON, no markdown.`;
        break;

      case 'grandma-safety-suggestions':
        systemPrompt = 'You are an expert at reassuring elderly people about technology safety and ease of use.';
        userPrompt = `For a project about "${sanitizedIdea}", generate 4 safety/trust reassurance suggestions for a grandma.
        Each suggestion should:
        - Address common concerns about technology
        - Be reassuring and gentle
        - Focus on simplicity and safety
        - Be concise (1 sentence, max 15 words)
        
        Return a JSON object with a "suggestions" array containing 4 strings.
        Example format: {"suggestions": ["It's completely safe and you can't accidentally break anything", ...]}
        Only return valid JSON, no markdown.`;
        break;

      case 'peers-hook-suggestions':
        systemPrompt = 'You are a Gen-Z/millennial pitch expert who creates relatable, casual hooks.';
        userPrompt = `For a project about "${sanitizedIdea}", generate 4 attention-grabbing hook suggestions for peers.
        Each suggestion should:
        - Feel authentic and conversational
        - Use casual, relatable language
        - Ask a question or make a bold statement
        - Be concise (1 sentence, max 15 words)
        
        Return a JSON object with a "suggestions" array containing 4 strings.
        Example format: {"suggestions": ["Have you ever wasted hours doing something that should take minutes?", ...]}
        Only return valid JSON, no markdown.`;
        break;

      case 'peers-thing-suggestions':
        systemPrompt = 'You are a Gen-Z/millennial pitch expert who explains things simply and casually.';
        userPrompt = `For a project about "${sanitizedIdea}", generate 4 simple definition suggestions for explaining to peers.
        Each suggestion should:
        - Be casual and conversational
        - Avoid marketing speak
        - Explain what it actually does
        - Be concise (1 sentence, max 15 words)
        
        Return a JSON object with a "suggestions" array containing 4 strings.
        Example format: {"suggestions": ["It's an app that automates the boring stuff so you can focus on what matters", ...]}
        Only return valid JSON, no markdown.`;
        break;

      case 'peers-why-care-suggestions':
        systemPrompt = 'You are a Gen-Z/millennial pitch expert who articulates value propositions casually.';
        userPrompt = `For a project about "${sanitizedIdea}", generate 4 "why should I care" suggestions for peers.
        Each suggestion should:
        - Focus on personal benefit
        - Be direct and honest
        - Use casual language
        - Be concise (1 phrase, max 10 words)
        
        Return a JSON object with a "suggestions" array containing 4 strings.
        Example format: {"suggestions": ["Saves you 2+ hours every single week", "No more embarrassing manual errors", ...]}
        Only return valid JSON, no markdown.`;
        break;

      case 'peers-howto-suggestions':
        systemPrompt = 'You are a Gen-Z/millennial pitch expert who explains processes casually.';
        userPrompt = `For a project about "${sanitizedIdea}", generate 4 "how it works" suggestions for peers.
        Each suggestion should:
        - Describe the process simply
        - Feel effortless and easy
        - Be action-oriented
        - Be concise (1 sentence, max 15 words)
        
        Return a JSON object with a "suggestions" array containing 4 strings.
        Example format: {"suggestions": ["Just connect your account and it handles everything automatically", ...]}
        Only return valid JSON, no markdown.`;
        break;

      case 'peers-comparison-suggestions':
        systemPrompt = 'You are a Gen-Z/millennial pitch expert who creates relatable comparisons.';
        userPrompt = `For a project about "${sanitizedIdea}", generate 4 comparison/differentiation suggestions for peers.
        Each suggestion should:
        - Compare to something they already know
        - Highlight what makes this different
        - Be honest and not salesy
        - Be concise (1 sentence, max 15 words)
        
        Return a JSON object with a "suggestions" array containing 4 strings.
        Example format: {"suggestions": ["Unlike other tools, this actually works with your existing workflow", ...]}
        Only return valid JSON, no markdown.`;
        break;

      case 'peers-why-suggestions':
        systemPrompt = 'You are a Gen-Z/millennial pitch expert who helps articulate authentic motivations.';
        userPrompt = `For a project about "${sanitizedIdea}", generate 4 authentic "why I built this" suggestions for peers.
        Each suggestion should:
        - Be personal and genuine
        - Show real motivation
        - Connect to a shared experience
        - Be concise (1 sentence, max 20 words)
        
        Return a JSON object with a "suggestions" array containing 4 strings.
        Example format: {"suggestions": ["I was so frustrated with existing solutions that I had to build something better", ...]}
        Only return valid JSON, no markdown.`;
        break;

      case 'peers-cta-suggestions':
        systemPrompt = 'You are a Gen-Z/millennial pitch expert who creates casual but effective calls to action.';
        userPrompt = `For a project about "${sanitizedIdea}", generate 4 call-to-action suggestions for peers.
        Each suggestion should:
        - Be casual and not pushy
        - Feel like a friend's recommendation
        - Include a specific action
        - Be concise (1 sentence, max 12 words)
        
        Return a JSON object with a "suggestions" array containing 4 strings.
        Example format: {"suggestions": ["Try it out and let me know what you think", ...]}
        Only return valid JSON, no markdown.`;
        break;

      case 'persona':
        systemPrompt = 'You are a market research expert specializing in target audience definition.';
        userPrompt = `For a startup idea about "${sanitizedIdea}", create a primary target persona.
        Return a JSON object with:
        - "description": A 2-sentence description of who this persona is
        - "keywords": An array of 5-6 relevant demographic/psychographic keywords
        Only return valid JSON, no markdown.`;
        break;

      case 'pitches':
        systemPrompt = 'You are a pitch deck expert who creates compelling elevator pitches using analogy-based frameworks.';
        userPrompt = `For a startup idea about "${sanitizedIdea}", create 3 different elevator pitch variations using famous company analogies.
        Return a JSON array with objects containing:
        - "id" (1, 2, 3)
        - "title" (e.g., "The Uber Model", "The Netflix Approach")
        - "pitch" (A compelling one-liner using the analogy, mentioning "${sanitizedIdea}")
        Only return valid JSON, no markdown.`;
        break;

      case 'script':
        systemPrompt = 'You are an expert pitch coach who creates compelling, time-appropriate pitch scripts. You carefully match the script length to the requested duration using approximately 150 words per minute as a speaking pace guide.';
        const { duration, problem, persona, pitch, businessModels, demo } = sanitizedContext as Record<string, unknown>;
        const durationVal = typeof duration === 'number' ? duration : 3;
        const problemVal = typeof problem === 'string' ? problem : '';
        const personaVal = typeof persona === 'string' ? persona : '';
        const pitchVal = typeof pitch === 'string' ? pitch : '';
        const businessModelsVal = Array.isArray(businessModels) ? businessModels.join(', ') : '';
        const demoObj = demo as Record<string, unknown> | undefined;
        
        // Calculate target word count based on 150 WPM speaking pace
        const targetWordCount = Math.round(durationVal * 150);
        const wordRange = {
          min: Math.round(targetWordCount * 0.9),
          max: Math.round(targetWordCount * 1.1)
        };
        
        // Adjust section complexity based on duration
        let sections = 'Hook, Problem, Solution, Call to Action';
        let sectionGuidance = '';
        
        if (durationVal <= 0.5) {
          sections = 'Hook + Problem, Solution, Call to Action';
          sectionGuidance = 'Keep it extremely concise - this is an elevator pitch. Each section should be 1-2 sentences max.';
        } else if (durationVal === 1) {
          sections = 'Hook, Problem, Solution, Call to Action';
          sectionGuidance = 'Keep sections brief but impactful. 2-3 sentences per section.';
        } else if (durationVal <= 3) {
          sections = `Hook, Problem, Solution, ${demoObj?.hasDemo ? 'Demo, ' : ''}Business Model, Call to Action`;
          sectionGuidance = 'Standard pitch format with moderate detail. 3-5 sentences per section.';
        } else if (durationVal <= 5) {
          sections = `Hook, Problem (with examples), Solution (with features), ${demoObj?.hasDemo ? 'Demo, ' : ''}Market Opportunity, Business Model, Traction/Validation, Call to Action`;
          sectionGuidance = 'Include more detail, examples, and data points. Build the narrative with supporting evidence.';
        } else {
          sections = `Hook, Problem (with multiple examples), Solution (detailed features), ${demoObj?.hasDemo ? 'Comprehensive Demo, ' : ''}Market Analysis, Competitive Advantage, Business Model (with pricing), Traction/Validation, Team (if relevant), Future Roadmap, Call to Action`;
          sectionGuidance = 'Full presentation format. Include detailed explanations, multiple examples, data, and comprehensive coverage of each section. Tell a complete story.';
        }
        
        userPrompt = `Create a ${durationVal}-minute pitch script for this startup.

CRITICAL: The script MUST be approximately ${targetWordCount} words (between ${wordRange.min}-${wordRange.max} words) to fit a ${durationVal}-minute delivery at 150 words per minute speaking pace.

Startup Details:
- Idea: ${sanitizedIdea}
- Problem: ${problemVal}
- Target Audience: ${personaVal}
- Elevator Pitch: ${pitchVal}
- Business Models: ${businessModelsVal}
${demoObj?.hasDemo ? `- Demo: ${demoObj.demoType} - ${demoObj.demoDescription}` : '- No demo included'}

Required Sections: ${sections}
Section Guidance: ${sectionGuidance}

Return a JSON object with:
- "script": The full pitch script as a string with clear section headers in [BRACKETS]. The script should flow naturally when read aloud.
- "wordCount": The actual word count of the script (number)
- "estimatedDuration": Estimated delivery time in minutes based on word count / 150 (number)
- "demoActions": ${demoObj?.hasDemo ? `An array of 3-4 specific demo actions based on ${demoObj.demoType}` : 'null'}

Only return valid JSON, no markdown.`;
        break;

      default:
        throw new Error(`Unknown generation type: ${type}`);
    }

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
        temperature: 0.7,
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

    console.log('AI response received successfully');

    // Parse the JSON from the response
    let parsed;
    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      parsed = JSON.parse(cleanContent);
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      throw new Error('Failed to parse AI response');
    }

    // For suggestions types, return the suggestions directly
    const suggestionTypes = [
      'pain-suggestions', 'fix-suggestions', 'progress-suggestions',
      'investor-opportunity-suggestions', 'investor-market-suggestions',
      'investor-traction-suggestions', 'investor-business-model-suggestions',
      'investor-ask-suggestions', 'academic-topic-suggestions',
      'academic-frame-suggestions', 'academic-methodology-suggestions',
      'academic-results-suggestions', 'academic-conclusions-suggestions',
      'grandma-connection-suggestions', 'grandma-pain-suggestions',
      'grandma-analogy-suggestions', 'grandma-benefits-suggestions',
      'grandma-safety-suggestions', 'peers-hook-suggestions',
      'peers-thing-suggestions', 'peers-why-care-suggestions',
      'peers-howto-suggestions', 'peers-comparison-suggestions',
      'peers-why-suggestions', 'peers-cta-suggestions'
    ];
    if (suggestionTypes.includes(typeResult.sanitized!) && parsed.suggestions) {
      return new Response(JSON.stringify({ suggestions: parsed.suggestions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ result: parsed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-pitch:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
