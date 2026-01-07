const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    console.log('Scraping URL:', formattedUrl);

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ['markdown', 'html'],
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

    // Extract useful info from scraped content
    const markdown = data.data?.markdown || data.markdown || '';
    const metadata = data.data?.metadata || data.metadata || {};
    
    // Try to extract problem/solution from content
    const extractedData = extractProjectInfo(markdown, metadata, formattedUrl);

    console.log('Scrape successful');
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: extractedData,
        raw: { markdown: markdown.slice(0, 2000), metadata }
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

function extractProjectInfo(markdown: string, metadata: any, url: string) {
  const title = metadata.title || extractDomainName(url);
  const description = metadata.description || '';
  
  // Extract first meaningful paragraphs for problem/solution
  const paragraphs = markdown
    .split('\n\n')
    .map((p: string) => p.replace(/[#*_`]/g, '').trim())
    .filter((p: string) => p.length > 30 && p.length < 500);
  
  // Look for problem/pain point indicators
  const problemKeywords = ['problem', 'challenge', 'struggle', 'pain', 'difficult', 'frustrat', 'waste', 'inefficient'];
  const solutionKeywords = ['solution', 'help', 'enable', 'automate', 'simplify', 'transform', 'platform', 'tool'];
  
  let problem = '';
  let solution = '';
  
  for (const para of paragraphs) {
    const lower = para.toLowerCase();
    if (!problem && problemKeywords.some(k => lower.includes(k))) {
      problem = para.slice(0, 200);
    }
    if (!solution && solutionKeywords.some(k => lower.includes(k))) {
      solution = para.slice(0, 200);
    }
  }
  
  // Fallback to description or first paragraphs
  if (!problem && paragraphs.length > 0) {
    problem = paragraphs[0].slice(0, 150);
  }
  if (!solution && paragraphs.length > 1) {
    solution = paragraphs[1].slice(0, 150);
  }
  if (!solution && description) {
    solution = description.slice(0, 150);
  }
  
  // Detect audience from content
  const content = (markdown + ' ' + description).toLowerCase();
  let audience = 'judges';
  if (content.includes('invest') || content.includes('fund') || content.includes('capital')) {
    audience = 'investors';
  } else if (content.includes('academic') || content.includes('research') || content.includes('university')) {
    audience = 'academic';
  }
  
  return {
    name: title,
    problem: problem || 'Manual processes that are slow and error-prone',
    solution: solution || description || 'An innovative platform that automates and streamlines the workflow',
    audience,
  };
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
