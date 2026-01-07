import { supabase } from '@/integrations/supabase/client';

export interface ScrapedProjectData {
  name: string;
  tagline?: string;
  problem: string;
  solution: string;
  audience: string;
  targetAudience?: string;
  keyFeatures?: string[];
  pricingInfo?: string;
  techStack?: string[];
  teamInfo?: string;
  traction?: string;
  callToAction?: string;
}

export interface FirecrawlResponse {
  success: boolean;
  error?: string;
  data?: ScrapedProjectData;
  raw?: {
    markdown: string;
    metadata: Record<string, any>;
    json?: Record<string, any>;
  };
}

/**
 * Scrape a URL using Firecrawl and extract structured project information
 */
export async function scrapeUrl(url: string): Promise<FirecrawlResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('firecrawl-scrape', {
      body: { url },
    });

    if (error) {
      console.error('Firecrawl error:', error);
      return { success: false, error: error.message };
    }

    return data;
  } catch (err) {
    console.error('Scrape error:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Failed to scrape URL' 
    };
  }
}

/**
 * Check if a string looks like a URL
 */
export function isUrl(input: string): boolean {
  const urlPattern = /^(https?:\/\/|www\.)/i;
  return urlPattern.test(input.trim());
}
