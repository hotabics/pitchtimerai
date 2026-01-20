import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParsedDocumentData {
  name: string;
  problem: string;
  solution: string;
  audience: string;
  tagline?: string;
  keyFeatures?: string[];
  techStack?: string[];
  summary?: string;
}

/**
 * Extract image URLs and base64 images from document content
 */
function extractImages(content: string): string[] {
  const images: string[] = [];
  
  // Match URLs that look like images
  const urlPattern = /https?:\/\/[^\s"'<>]+\.(png|jpg|jpeg|gif|webp|svg)(\?[^\s"'<>]*)?/gi;
  let match;
  while ((match = urlPattern.exec(content)) !== null) {
    if (!images.includes(match[0])) {
      images.push(match[0]);
    }
  }
  
  // Match markdown images
  const mdPattern = /!\[.*?\]\((https?:\/\/[^)]+)\)/g;
  while ((match = mdPattern.exec(content)) !== null) {
    if (!images.includes(match[1])) {
      images.push(match[1]);
    }
  }
  
  // Match HTML img src
  const htmlPattern = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  while ((match = htmlPattern.exec(content)) !== null) {
    const src = match[1];
    if (src.startsWith('http') && !images.includes(src)) {
      images.push(src);
    }
  }
  
  return images.slice(0, 6); // Limit to 6 images
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let fileName = 'document';
    let fileSize = 0;
    let fileContent = '';
    
    // Check content type to determine how to parse the request
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      // Handle JSON body with base64 file
      const body = await req.json();
      const { file: base64File, filename, mimeType } = body;
      
      if (!base64File) {
        return new Response(
          JSON.stringify({ success: false, error: 'No file provided' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      fileName = filename || 'document';
      
      // Decode base64 to text
      try {
        const binaryString = atob(base64File);
        fileSize = binaryString.length;
        
        // For PDF files, we need special handling - just extract readable text
        if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
          // Simple PDF text extraction - look for text between stream markers
          // This is a basic approach; complex PDFs may not extract well
          const textParts: string[] = [];
          
          // Look for text objects in PDF
          const textMatches = binaryString.match(/\(([^)]+)\)/g);
          if (textMatches) {
            textMatches.forEach(match => {
              const text = match.slice(1, -1);
              // Filter out control characters and keep readable text
              const cleaned = text.replace(/[\x00-\x1f\x7f-\x9f]/g, ' ').trim();
              if (cleaned.length > 2 && /[a-zA-Z]/.test(cleaned)) {
                textParts.push(cleaned);
              }
            });
          }
          
          // Also try to find plain text content
          const plainText = binaryString
            .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          fileContent = textParts.length > 10 ? textParts.join(' ') : plainText;
        } else {
          // For text files, decode directly
          fileContent = binaryString;
        }
      } catch (decodeError) {
        console.error('Base64 decode error:', decodeError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to decode file' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (contentType.includes('multipart/form-data')) {
      // Handle FormData upload
      const formData = await req.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return new Response(
          JSON.stringify({ success: false, error: 'No file provided' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      fileName = file.name;
      fileSize = file.size;
      fileContent = await file.text();
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Unsupported content type. Use JSON or FormData.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing file: ${fileName}, size: ${fileSize}`);
    
    const truncatedContent = fileContent.slice(0, 15000); // Limit to ~15k chars for API
    console.log(`File content length: ${fileContent.length}, truncated to: ${truncatedContent.length}`);

    // Extract images from content
    const extractedImages = extractImages(fileContent);
    console.log(`Extracted ${extractedImages.length} images from document`);

    // Use Lovable AI to analyze and summarize the document
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert at analyzing project documents and extracting pitch-relevant information.
Given a document (could be a README, project description, business plan, pitch deck text, etc.), extract the following information:

1. name: The project/product name (infer from content if not explicit)
2. problem: The main problem or pain point being addressed (1-2 sentences)
3. solution: How the project solves this problem (1-2 sentences)
4. audience: The target audience - one of: "judges" (hackathon), "investors", "academic", "grandma" (non-technical), "peers" (developers)
5. tagline: A catchy one-liner for the project (optional)
6. keyFeatures: Array of 3-5 key features (optional)
7. techStack: Array of technologies mentioned (optional)
8. summary: A 2-3 sentence executive summary of the entire document

Be concise and focus on pitch-relevant information. If information is not available, make reasonable inferences from context.`;

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
          { role: 'user', content: `Please analyze this document and extract pitch information:\n\nFilename: ${fileName}\n\n---\n\n${truncatedContent}` }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_pitch_info',
              description: 'Extract structured pitch information from the document',
              parameters: {
                type: 'object',
                properties: {
                  name: { type: 'string', description: 'Project or product name' },
                  problem: { type: 'string', description: 'The problem being solved' },
                  solution: { type: 'string', description: 'How the project solves the problem' },
                  audience: { 
                    type: 'string', 
                    enum: ['judges', 'investors', 'academic', 'grandma', 'peers'],
                    description: 'Target audience type' 
                  },
                  tagline: { type: 'string', description: 'Catchy one-liner (optional)' },
                  keyFeatures: { 
                    type: 'array', 
                    items: { type: 'string' },
                    description: 'Key features list (optional)' 
                  },
                  techStack: { 
                    type: 'array', 
                    items: { type: 'string' },
                    description: 'Technologies used (optional)' 
                  },
                  summary: { type: 'string', description: 'Executive summary of the document' }
                },
                required: ['name', 'problem', 'solution', 'audience'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_pitch_info' } }
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
          JSON.stringify({ success: false, error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log('AI Response:', JSON.stringify(aiResponse, null, 2));

    // Extract the tool call result
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error('Failed to extract structured data from AI response');
    }

    const extractedData: ParsedDocumentData = JSON.parse(toolCall.function.arguments);
    console.log('Extracted data:', extractedData);

    return new Response(
      JSON.stringify({
        success: true,
        data: extractedData,
        text: truncatedContent, // Return raw text for CV parsing use case
        filename: fileName,
        fileSize: fileSize,
        extractedImages
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing document:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
