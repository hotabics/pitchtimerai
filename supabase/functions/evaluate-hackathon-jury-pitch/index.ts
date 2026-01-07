import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Segment {
  start: number;
  end: number;
  text: string;
}

interface Sentence {
  start: number;
  end: number;
  text: string;
  normalized: string;
}

interface DetectedEvent {
  type: string;
  timestamp: number;
  quote: string;
  confidence: number;
  status: 'found' | 'missing' | 'late';
}

interface PrimaryIssue {
  key: string;
  title: string;
  evidence_timestamp: number | null;
  evidence_quote: string | null;
  next_action: string;
  severity: number;
}

// Token sets for detection
const WHO_TOKENS = ['users', 'people', 'teams', 'companies', 'businesses', 'students', 'hospitals', 'patients', 'developers', 'communities', 'customers', 'clients'];
const PAIN_VERBS = ['struggle', 'waste', 'hard', 'difficult', 'slow', 'expensive', 'manual', 'confusing', 'broken', 'inefficient', 'frustrating', 'problem', 'issue', 'challenge', 'fail', 'painful'];
const IMPACT_TOKENS = ['time', 'cost', 'effort', 'access', 'quality', 'risk', 'errors', 'money', 'hours', 'days', 'productivity'];

const INNOVATION_TOKENS = ['new', 'novel', 'innovative', 'first', 'unique', 'different', 'unlike', 'alternative', 'instead of', 'replaces', 'breakthrough', 'revolutionize', 'transform'];
const COMPARISON_TOKENS = ['existing', 'current', 'today', 'traditional', 'manual', 'competitors', 'other solutions', 'before', 'previously', 'old', 'legacy'];

const TECH_TOKENS = ['we built', 'prototype', 'demo', 'architecture', 'system', 'algorithm', 'model', 'api', 'backend', 'frontend', 'database', 'stack', 'trained', 'implemented', 'developed', 'coded', 'created', 'machine learning', 'ai', 'neural', 'framework'];

const BUSINESS_TOKENS = ['users', 'customers', 'adoption', 'value', 'benefit', 'save', 'reduce', 'improve', 'scale', 'revenue', 'cost', 'impact', 'sustainability', 'market', 'growth', 'opportunity', 'monetize', 'business model'];

const SOLUTION_TOKENS = ['we built', 'our solution', 'our product', 'this app', 'this platform', 'this system', 'our approach', 'we created', 'we developed', 'introducing'];

// Parse segments into sentences with timestamps
function parseIntoSentences(segments: Segment[]): Sentence[] {
  const sentences: Sentence[] = [];
  
  for (const segment of segments) {
    // Split on sentence boundaries
    const sentenceTexts = segment.text.split(/(?<=[.!?])\s+/);
    const segmentDuration = segment.end - segment.start;
    const wordsInSegment = segment.text.split(/\s+/).length;
    
    let currentTime = segment.start;
    
    for (const sentenceText of sentenceTexts) {
      if (!sentenceText.trim()) continue;
      
      const wordsInSentence = sentenceText.split(/\s+/).length;
      const sentenceDuration = (wordsInSentence / wordsInSegment) * segmentDuration;
      
      sentences.push({
        start: currentTime,
        end: currentTime + sentenceDuration,
        text: sentenceText.trim(),
        normalized: sentenceText.toLowerCase().trim(),
      });
      
      currentTime += sentenceDuration;
    }
  }
  
  return sentences;
}

// Check if any token from list is in text
function hasToken(text: string, tokens: string[]): boolean {
  return tokens.some(token => text.includes(token));
}

// Count matching tokens
function countTokens(text: string, tokens: string[]): number {
  return tokens.filter(token => text.includes(token)).length;
}

// A) Problem Statement Detector
function detectProblem(sentences: Sentence[]): DetectedEvent {
  let bestMatch: { sentence: Sentence; confidence: number } | null = null;
  
  for (const sentence of sentences) {
    const text = sentence.normalized;
    const wordCount = text.split(/\s+/).length;
    
    const painHit = hasToken(text, PAIN_VERBS) ? 1 : 0;
    const whoHit = hasToken(text, WHO_TOKENS) ? 1 : 0;
    const impactHit = hasToken(text, IMPACT_TOKENS) ? 1 : 0;
    
    // Length penalty for very long sentences
    const lengthPenalty = wordCount > 30 ? 0.1 : 0;
    
    const confidence = 0.55 * painHit + 0.30 * whoHit + 0.15 * impactHit - lengthPenalty;
    
    if (confidence >= 0.55 && (!bestMatch || sentence.start < bestMatch.sentence.start)) {
      bestMatch = { sentence, confidence };
    }
  }
  
  if (!bestMatch) {
    return {
      type: 'problem',
      timestamp: -1,
      quote: '',
      confidence: 0,
      status: 'missing',
    };
  }
  
  return {
    type: 'problem',
    timestamp: bestMatch.sentence.start,
    quote: bestMatch.sentence.text,
    confidence: bestMatch.confidence,
    status: bestMatch.sentence.start > 20 ? 'late' : 'found',
  };
}

// B) Innovation / Differentiation Detector
function detectInnovation(sentences: Sentence[]): DetectedEvent {
  for (const sentence of sentences) {
    const text = sentence.normalized;
    
    const hasInnovation = hasToken(text, INNOVATION_TOKENS);
    const hasComparison = hasToken(text, COMPARISON_TOKENS);
    
    // Need innovation token AND either comparison or explanation
    if (hasInnovation && (hasComparison || text.length > 50)) {
      return {
        type: 'innovation',
        timestamp: sentence.start,
        quote: sentence.text,
        confidence: hasComparison ? 0.9 : 0.7,
        status: 'found',
      };
    }
  }
  
  return {
    type: 'innovation',
    timestamp: -1,
    quote: '',
    confidence: 0,
    status: 'missing',
  };
}

// C) Technical Feasibility Detector
function detectTechnical(sentences: Sentence[]): DetectedEvent {
  for (const sentence of sentences) {
    const text = sentence.normalized;
    
    if (hasToken(text, TECH_TOKENS)) {
      return {
        type: 'technical',
        timestamp: sentence.start,
        quote: sentence.text,
        confidence: 0.85,
        status: 'found',
      };
    }
  }
  
  return {
    type: 'technical',
    timestamp: -1,
    quote: '',
    confidence: 0,
    status: 'missing',
  };
}

// D) Business Model / Impact Detector
function detectBusinessModel(sentences: Sentence[]): DetectedEvent {
  for (const sentence of sentences) {
    const text = sentence.normalized;
    const matchCount = countTokens(text, BUSINESS_TOKENS);
    
    if (matchCount >= 2) {
      return {
        type: 'business_model',
        timestamp: sentence.start,
        quote: sentence.text,
        confidence: Math.min(0.95, 0.5 + matchCount * 0.15),
        status: 'found',
      };
    }
  }
  
  return {
    type: 'business_model',
    timestamp: -1,
    quote: '',
    confidence: 0,
    status: 'missing',
  };
}

// E) Solution Intro Detector
function detectSolution(sentences: Sentence[]): DetectedEvent {
  for (const sentence of sentences) {
    const text = sentence.normalized;
    
    if (hasToken(text, SOLUTION_TOKENS)) {
      return {
        type: 'solution',
        timestamp: sentence.start,
        quote: sentence.text,
        confidence: 0.9,
        status: 'found',
      };
    }
  }
  
  return {
    type: 'solution',
    timestamp: -1,
    quote: '',
    confidence: 0,
    status: 'missing',
  };
}

// Primary Issue Selection
function selectPrimaryIssue(events: Record<string, DetectedEvent>): PrimaryIssue {
  const issues: Array<{ key: string; priority: number; severity: number; event: DetectedEvent }> = [];
  
  const problem = events.problem;
  const innovation = events.innovation;
  const businessModel = events.business_model;
  const technical = events.technical;
  const solution = events.solution;
  
  // Priority 1: Problem missing
  if (problem.status === 'missing') {
    issues.push({
      key: 'problem_missing',
      priority: 1,
      severity: 1.0,
      event: problem,
    });
  }
  
  // Priority 2: Problem late (> 20s)
  if (problem.status === 'late') {
    const lateness = Math.min(1, (problem.timestamp - 20) / 40);
    issues.push({
      key: 'problem_late',
      priority: 2,
      severity: lateness,
      event: problem,
    });
  }
  
  // Priority 3: Innovation missing
  if (innovation.status === 'missing') {
    issues.push({
      key: 'innovation_missing',
      priority: 3,
      severity: 0.8,
      event: innovation,
    });
  }
  
  // Priority 4: Business model missing
  if (businessModel.status === 'missing') {
    issues.push({
      key: 'business_model_missing',
      priority: 4,
      severity: 0.7,
      event: businessModel,
    });
  }
  
  // Priority 5: Technical feasibility missing
  if (technical.status === 'missing') {
    issues.push({
      key: 'technical_feasibility_missing',
      priority: 5,
      severity: 0.6,
      event: technical,
    });
  }
  
  // Priority 6: Structure out of order (solution before problem)
  if (solution.status === 'found' && problem.status === 'found' && solution.timestamp < problem.timestamp) {
    issues.push({
      key: 'structure_out_of_order',
      priority: 6,
      severity: 0.5,
      event: solution,
    });
  }
  
  // Sort by priority (lowest first), then by severity * confidence (highest first)
  issues.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return (b.severity * b.event.confidence) - (a.severity * a.event.confidence);
  });
  
  if (issues.length === 0) {
    return {
      key: 'none',
      title: 'Great pitch structure!',
      evidence_timestamp: null,
      evidence_quote: null,
      next_action: 'Your pitch covers all key elements. Focus on delivery and confidence.',
      severity: 0,
    };
  }
  
  const topIssue = issues[0];
  return mapIssueToPrimaryIssue(topIssue.key, topIssue.event, events);
}

interface IssueGuideline {
  title: string;
  guideline: string;
  next_action: string;
}

const ISSUE_GUIDELINES: Record<string, IssueGuideline> = {
  problem_missing: {
    title: 'State the problem clearly',
    guideline: 'Every hackathon pitch must start with a clear problem statement within the first 20 seconds.',
    next_action: 'Start with WHO has the problem and WHAT pain they experience. Example: "Developers waste 3 hours daily on manual code reviews."',
  },
  problem_late: {
    title: 'Lead with the problem sooner',
    guideline: 'The problem statement should appear in the first 20 seconds to hook the jury.',
    next_action: 'Move your problem statement to the opening of your pitch to capture attention immediately.',
  },
  innovation_missing: {
    title: 'Explain what makes this different',
    guideline: 'Juries need to understand what sets your solution apart from existing approaches.',
    next_action: 'Add a sentence comparing your approach to existing solutions. What\'s new or unique about your solution?',
  },
  business_model_missing: {
    title: 'Show real-world impact',
    guideline: 'Even hackathon projects should demonstrate potential real-world value or impact.',
    next_action: 'Explain who will use this and how it creates value. Even for hackathons, juries want to see potential impact.',
  },
  technical_feasibility_missing: {
    title: 'Mention your technical approach',
    guideline: 'Technical details build credibility and show your solution is actually buildable.',
    next_action: 'Briefly describe what you built and how. This builds confidence that your solution is real.',
  },
  structure_out_of_order: {
    title: 'Reorder: Problem before Solution',
    guideline: 'Always establish the problem context before presenting your solution.',
    next_action: 'Lead with the pain point to create context for your solution.',
  },
};

function mapIssueToPrimaryIssue(key: string, event: DetectedEvent, allEvents: Record<string, DetectedEvent>): PrimaryIssue {
  const info = ISSUE_GUIDELINES[key] || {
    title: 'Improve your pitch',
    guideline: 'Ensure all key elements are present in your pitch.',
    next_action: 'Review your pitch structure and ensure all key elements are present.',
  };
  
  return {
    key,
    title: info.title,
    evidence_timestamp: event.timestamp > 0 ? event.timestamp : null,
    evidence_quote: event.quote || null,
    next_action: info.next_action,
    severity: 1,
  };
}

interface CoachFeedback {
  headline: string;
  what_i_noticed: string;
  why_it_matters: string;
  evidence: { timestamp: number; quote: string };
  one_change_to_try: string;
  encouragement: string;
}

interface ImprovementSummary {
  issue_key: string;
  before: string;
  after: string;
  improved: boolean;
  before_timestamp: number | null;
  after_timestamp: number | null;
}

async function generateCoachFeedback(
  primaryIssue: PrimaryIssue,
  durationSeconds: number
): Promise<CoachFeedback | null> {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  
  if (!OPENAI_API_KEY || primaryIssue.key === 'none') {
    return null;
  }
  
  const guideline = ISSUE_GUIDELINES[primaryIssue.key]?.guideline || 'Ensure all key elements are present.';
  
  const systemPrompt = `You are an experienced hackathon pitch coach.

You help teams impress juries by clarifying the problem, highlighting innovation, explaining feasibility, and showing real-world impact.

Rules:
- Do NOT grade or score.
- Provide ONLY ONE improvement.
- Do NOT mention AI or analysis.
- Always cite the provided timestamp and quote.
- Be practical, supportive, and jury-oriented.
- Output valid JSON only.`;

  const userPrompt = `Track: hackathon_jury
Audience: Hackathon Jury
Pitch duration seconds: ${durationSeconds}

Primary issue:
- issue_key: ${primaryIssue.key}
- title: "${primaryIssue.title}"
- guideline: "${guideline}"
- evidence_timestamp: ${primaryIssue.evidence_timestamp ?? 'null'}
- evidence_quote: "${primaryIssue.evidence_quote ?? ''}"
- next_action: "${primaryIssue.next_action}"

Write coach feedback in this JSON schema:

{
  "headline": string,
  "what_i_noticed": string,
  "why_it_matters": string,
  "evidence": { "timestamp": number, "quote": string },
  "one_change_to_try": string,
  "encouragement": string
}

Constraints:
- One improvement only.
- One concrete action the team can apply immediately.
- Keep each field 1–2 sentences.
- Output JSON only.`;

  try {
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
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, await response.text());
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('No content in AI response');
      return null;
    }

    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    const feedback = JSON.parse(jsonStr) as CoachFeedback;
    console.log('Generated coach feedback:', feedback);
    return feedback;
  } catch (error) {
    console.error('Error generating coach feedback:', error);
    return null;
  }
}

// Compare current session with baseline and generate improvement summary
async function compareWithBaseline(
  supabase: any,
  baselineSessionId: string,
  currentEvents: Record<string, DetectedEvent>,
  currentPrimaryIssue: PrimaryIssue
): Promise<ImprovementSummary | null> {
  try {
    const { data: baseline, error } = await supabase
      .from('practice_sessions')
      .select('events_json, primary_issue_key')
      .eq('id', baselineSessionId)
      .single();
    
    if (error || !baseline) {
      console.error('Failed to fetch baseline session:', error);
      return null;
    }
    
    const baselineData = baseline as { events_json: Record<string, DetectedEvent>; primary_issue_key: string | null };
    if (!baselineData.events_json) {
      return null;
    }
    
    const baselineEvents = baselineData.events_json;
    const issueKey = baselineData.primary_issue_key || currentPrimaryIssue.key;
    
    // Get the event that corresponds to the primary issue
    const eventKeyMap: Record<string, string> = {
      'problem_missing': 'problem',
      'problem_late': 'problem',
      'innovation_missing': 'innovation',
      'business_model_missing': 'business_model',
      'technical_feasibility_missing': 'technical',
      'structure_out_of_order': 'solution',
    };
    
    const eventKey = eventKeyMap[issueKey] || 'problem';
    const baselineEvent = baselineEvents[eventKey];
    const currentEvent = currentEvents[eventKey];
    
    if (!baselineEvent || !currentEvent) {
      return null;
    }
    
    const formatEventLabel = (key: string): string => {
      const labels: Record<string, string> = {
        problem: 'Problem statement',
        innovation: 'Innovation',
        technical: 'Technical approach',
        business_model: 'Business model',
        solution: 'Solution',
      };
      return labels[key] || key;
    };
    
    const formatTimestamp = (ts: number): string => {
      if (ts < 0) return 'not mentioned';
      const mins = Math.floor(ts / 60);
      const secs = Math.round(ts % 60);
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
    
    const label = formatEventLabel(eventKey);
    const baselineTs = baselineEvent.timestamp;
    const currentTs = currentEvent.timestamp;
    
    // Determine improvement
    let improved = false;
    let before = '';
    let after = '';
    
    if (baselineEvent.status === 'missing' && currentEvent.status !== 'missing') {
      // Was missing, now present
      improved = true;
      before = `${label} was missing`;
      after = `${label} explained at ${formatTimestamp(currentTs)}`;
    } else if (baselineEvent.status !== 'missing' && currentEvent.status === 'missing') {
      // Was present, now missing (regression)
      improved = false;
      before = `${label} explained at ${formatTimestamp(baselineTs)}`;
      after = `${label} is now missing`;
    } else if (baselineEvent.status === 'late' && currentEvent.status === 'found') {
      // Was late, now on time
      improved = true;
      before = `${label} explained at ${formatTimestamp(baselineTs)}`;
      after = `${label} explained at ${formatTimestamp(currentTs)}`;
    } else if (baselineTs > 0 && currentTs > 0 && currentTs < baselineTs) {
      // Both present, but now earlier
      improved = true;
      before = `${label} explained at ${formatTimestamp(baselineTs)}`;
      after = `${label} explained at ${formatTimestamp(currentTs)}`;
    } else if (baselineTs > 0 && currentTs > 0) {
      // Both present, compare
      improved = currentTs <= baselineTs;
      before = `${label} explained at ${formatTimestamp(baselineTs)}`;
      after = `${label} explained at ${formatTimestamp(currentTs)}`;
    } else {
      return null;
    }
    
    return {
      issue_key: issueKey,
      before,
      after,
      improved,
      before_timestamp: baselineTs > 0 ? baselineTs : null,
      after_timestamp: currentTs > 0 ? currentTs : null,
    };
  } catch (error) {
    console.error('Error comparing with baseline:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id, track, segments, duration_seconds, baseline_session_id } = await req.json();
    
    console.log('Evaluating hackathon jury pitch:', { session_id, track, segmentCount: segments?.length, duration_seconds, baseline_session_id });
    
    if (!session_id || !segments || !Array.isArray(segments)) {
      throw new Error('Missing required fields: session_id and segments');
    }
    
    if (track !== 'hackathon_jury' && track !== 'hackathon_no_demo') {
      throw new Error('This endpoint is for hackathon jury track only');
    }
    
    // Parse segments into sentences
    const sentences = parseIntoSentences(segments);
    console.log('Parsed sentences:', sentences.length);
    
    // Run all detectors
    const events: Record<string, DetectedEvent> = {
      problem: detectProblem(sentences),
      innovation: detectInnovation(sentences),
      technical: detectTechnical(sentences),
      business_model: detectBusinessModel(sentences),
      solution: detectSolution(sentences),
    };
    
    console.log('Detected events:', events);
    
    // Select primary issue
    const primaryIssue = selectPrimaryIssue(events);
    console.log('Primary issue:', primaryIssue);
    
    // Generate coach-style feedback using Lovable AI
    const durationSecs = duration_seconds || 60;
    const coachFeedback = await generateCoachFeedback(primaryIssue, durationSecs);
    console.log('Coach feedback generated:', !!coachFeedback);
    
    // Store results in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Compare with baseline if provided
    let improvementSummary: ImprovementSummary | null = null;
    if (baseline_session_id) {
      improvementSummary = await compareWithBaseline(supabase, baseline_session_id, events, primaryIssue);
      console.log('Improvement summary:', improvementSummary);
    }
    
    const { error: updateError } = await supabase
      .from('practice_sessions')
      .update({
        events_json: events,
        primary_issue_key: primaryIssue.key,
        primary_issue_json: {
          ...primaryIssue,
          coach_feedback: coachFeedback,
        },
        baseline_session_id: baseline_session_id || null,
        improvement_summary_json: improvementSummary,
      })
      .eq('id', session_id);
    
    if (updateError) {
      console.error('Failed to update session:', updateError);
      throw updateError;
    }
    
    return new Response(
      JSON.stringify({
        events,
        primary_issue: primaryIssue,
        coach_feedback: coachFeedback,
        improvement_summary: improvementSummary,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error evaluating pitch:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
