const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// JSON schema for structured extraction
const projectSchema = {
  type: 'object',
  properties: {
    company_name: { type: 'string', description: 'The company or project name' },
    tagline: { type: 'string', description: 'The main tagline or value proposition' },
    problem: { type: 'string', description: 'The problem the company solves' },
    solution: { type: 'string', description: 'How the company solves the problem' },
    target_audience: { type: 'string', description: 'Who the product is for' },
    key_features: { 
      type: 'array', 
      items: { type: 'string' },
      description: 'Main features or capabilities'
    },
    pricing_info: { type: 'string', description: 'Pricing information if available' },
    tech_stack: { 
      type: 'array', 
      items: { type: 'string' },
      description: 'Technologies mentioned'
    },
    team_info: { type: 'string', description: 'Team or founder information' },
    traction: { type: 'string', description: 'Metrics, users, revenue, or growth data' },
    call_to_action: { type: 'string', description: 'Main CTA or next step' }
  },
  required: ['company_name', 'problem', 'solution']
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('Scraping URL with JSON extraction:', formattedUrl);

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ['markdown', 'extract'],
        extract: {
          schema: projectSchema,
          prompt: 'Extract comprehensive information about this company/project for a pitch presentation. Focus on their value proposition, problem they solve, target market, and any traction or team info.'
        },
        onlyMainContent: true,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Firecrawl API error:', data);
      return new Response(
        JSON.stringify({ success: false, error: data.error || `Request failed with status ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract structured data from response
    const extractData = data.data?.extract || data.extract || {};
    const markdown = data.data?.markdown || data.markdown || '';
    const metadata = data.data?.metadata || data.metadata || {};
    
    // Build enhanced response
    const extractedData = {
      name: extractData.company_name || metadata.title || extractDomainName(formattedUrl),
      tagline: extractData.tagline || metadata.description || '',
      problem: extractData.problem || '',
      solution: extractData.solution || '',
      audience: detectAudience(extractData, markdown),
      targetAudience: extractData.target_audience || '',
      keyFeatures: extractData.key_features || [],
      pricingInfo: extractData.pricing_info || '',
      techStack: extractData.tech_stack || [],
      teamInfo: extractData.team_info || '',
      traction: extractData.traction || '',
      callToAction: extractData.call_to_action || '',
    };

    console.log('Scrape successful with extraction:', extractedData.name);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: extractedData,
        raw: { 
          markdown: markdown.slice(0, 2000), 
          metadata,
          extract: extractData
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scraping:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to scrape';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function detectAudience(jsonData: any, markdown: string): string {
  const content = (JSON.stringify(jsonData) + ' ' + markdown).toLowerCase();
  
  if (content.includes('invest') || content.includes('fund') || content.includes('capital') || content.includes('seed') || content.includes('series')) {
    return 'investors';
  }
  if (content.includes('academic') || content.includes('research') || content.includes('university') || content.includes('paper')) {
    return 'academic';
  }
  if (content.includes('enterprise') || content.includes('b2b') || content.includes('saas')) {
    return 'investors';
  }
  return 'judges';
}

function extractDomainName(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/^www\./, '');
    const parts = hostname.split('.');
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  } catch {
    return 'Project';
  }
}
