import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScriptBlock {
  label: string;
  text: string;
  estimated_seconds: number;
}

interface StructuredScript {
  blocks: ScriptBlock[];
  total_words: number;
  estimated_total_seconds: number;
}

const WPM = 130;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { script } = await req.json();

    if (!script || typeof script !== "string") {
      return new Response(
        JSON.stringify({ error: "Script text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const trimmedScript = script.trim();
    const wordCount = trimmedScript.split(/\s+/).filter((w: string) => w.length > 0).length;

    if (wordCount < 10) {
      return new Response(
        JSON.stringify({ error: "Script is too short. Please provide at least 10 words." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if script has natural breaks (paragraphs/headings)
    const paragraphs = trimmedScript
      .split(/\n\s*\n+/)
      .map((p: string) => p.trim())
      .filter((p: string) => p.length > 0);

    let structuredScript: StructuredScript;

    if (paragraphs.length >= 3) {
      // Use natural paragraph breaks
      structuredScript = structureFromParagraphs(paragraphs);
    } else {
      // Use AI to segment into logical blocks
      structuredScript = await structureWithAI(trimmedScript);
    }

    return new Response(
      JSON.stringify(structuredScript),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Structure script error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to structure script" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function structureFromParagraphs(paragraphs: string[]): StructuredScript {
  const sectionLabels = ["Opening", "Problem", "Solution", "Proof", "Closing"];
  
  const blocks: ScriptBlock[] = paragraphs.map((text, index) => {
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    const estimatedSeconds = Math.round((wordCount / WPM) * 60);
    
    // Assign labels based on position
    let label: string;
    if (index === 0) {
      label = "Opening";
    } else if (index === paragraphs.length - 1) {
      label = "Closing";
    } else if (index === 1) {
      label = "Problem";
    } else if (index === 2) {
      label = "Solution";
    } else {
      label = sectionLabels[Math.min(index, sectionLabels.length - 1)] || `Section ${index + 1}`;
    }

    return {
      label,
      text,
      estimated_seconds: estimatedSeconds,
    };
  });

  const totalWords = blocks.reduce((sum, b) => 
    sum + b.text.split(/\s+/).filter(w => w.length > 0).length, 0
  );
  const estimatedTotalSeconds = blocks.reduce((sum, b) => sum + b.estimated_seconds, 0);

  return {
    blocks,
    total_words: totalWords,
    estimated_total_seconds: estimatedTotalSeconds,
  };
}

async function structureWithAI(script: string): Promise<StructuredScript> {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  
  if (!OPENAI_API_KEY) {
    // Fallback: simple sentence-based splitting
    return fallbackStructure(script);
  }

  const systemPrompt = `You are a pitch structure expert. Analyze the given pitch script and divide it into 4-6 logical sections.
Each section should have a clear purpose in the pitch narrative.

Return a JSON object with a "sections" array. Each section has:
- "label": One of "Opening", "Problem", "Solution", "Proof", "Benefits", "Closing", or a custom label
- "text": The exact text from the original script for this section (preserve the original wording exactly)

Important:
- Keep the original text exactly as provided
- Create logical breaks at natural transition points
- Each section should be substantial (at least 1-2 sentences)
- Return ONLY valid JSON, no markdown formatting`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: script },
      ],
      temperature: 0.3,
      tools: [
        {
          type: "function",
          function: {
            name: "structure_pitch",
            description: "Structure a pitch script into logical sections",
            parameters: {
              type: "object",
              properties: {
                sections: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      label: { type: "string" },
                      text: { type: "string" },
                    },
                    required: ["label", "text"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["sections"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "structure_pitch" } },
    }),
  });

  if (!response.ok) {
    console.error("AI gateway error:", response.status);
    return fallbackStructure(script);
  }

  const data = await response.json();
  
  try {
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return fallbackStructure(script);
    }

    const args = JSON.parse(toolCall.function.arguments);
    const sections = args.sections;

    if (!Array.isArray(sections) || sections.length === 0) {
      return fallbackStructure(script);
    }

    const blocks: ScriptBlock[] = sections.map((section: { label: string; text: string }) => {
      const wordCount = section.text.split(/\s+/).filter(w => w.length > 0).length;
      return {
        label: section.label,
        text: section.text,
        estimated_seconds: Math.round((wordCount / WPM) * 60),
      };
    });

    const totalWords = blocks.reduce((sum, b) => 
      sum + b.text.split(/\s+/).filter(w => w.length > 0).length, 0
    );
    const estimatedTotalSeconds = blocks.reduce((sum, b) => sum + b.estimated_seconds, 0);

    return {
      blocks,
      total_words: totalWords,
      estimated_total_seconds: estimatedTotalSeconds,
    };
  } catch (e) {
    console.error("Failed to parse AI response:", e);
    return fallbackStructure(script);
  }
}

function fallbackStructure(script: string): StructuredScript {
  // Simple fallback: split into 4 roughly equal parts
  const sentences = script.match(/[^.!?]+[.!?]+/g) || [script];
  const chunkSize = Math.ceil(sentences.length / 4);
  
  const labels = ["Opening", "Problem", "Solution", "Closing"];
  const blocks: ScriptBlock[] = [];

  for (let i = 0; i < 4; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, sentences.length);
    const text = sentences.slice(start, end).join(" ").trim();
    
    if (text) {
      const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
      blocks.push({
        label: labels[i],
        text,
        estimated_seconds: Math.round((wordCount / WPM) * 60),
      });
    }
  }

  const totalWords = blocks.reduce((sum, b) => 
    sum + b.text.split(/\s+/).filter(w => w.length > 0).length, 0
  );
  const estimatedTotalSeconds = blocks.reduce((sum, b) => sum + b.estimated_seconds, 0);

  return {
    blocks,
    total_words: totalWords,
    estimated_total_seconds: estimatedTotalSeconds,
  };
}
