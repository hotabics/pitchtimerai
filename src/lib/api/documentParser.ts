import { supabase } from '@/integrations/supabase/client';
import { ScrapedProjectData } from './firecrawl';

export interface DocumentParseResponse {
  success: boolean;
  error?: string;
  data?: ScrapedProjectData;
  filename?: string;
  fileSize?: number;
}

// Supported file types for parsing
export const SUPPORTED_FILE_TYPES = [
  '.txt', '.md', '.markdown',
  '.pdf',
  '.doc', '.docx',
  '.ppt', '.pptx',
  '.json', '.yaml', '.yml',
  '.csv'
];

export const SUPPORTED_MIME_TYPES = [
  'text/plain',
  'text/markdown',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/json',
  'text/csv',
  'application/x-yaml',
  'text/yaml'
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Check if a file is supported for parsing
 */
export function isFileSupported(file: File): boolean {
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  const mimeSupported = SUPPORTED_MIME_TYPES.includes(file.type);
  const extensionSupported = SUPPORTED_FILE_TYPES.includes(extension);
  return mimeSupported || extensionSupported;
}

/**
 * Parse a document file and extract pitch-relevant information
 */
export async function parseDocument(file: File): Promise<DocumentParseResponse> {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
    };
  }

  // Validate file type
  if (!isFileSupported(file)) {
    return {
      success: false,
      error: 'Unsupported file type. Please upload a text, PDF, Word, or PowerPoint file.'
    };
  }

  try {
    // Create FormData and append file
    const formData = new FormData();
    formData.append('file', file);

    // Call the edge function directly with FormData
    const projectUrl = import.meta.env.VITE_SUPABASE_URL;
    const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    const response = await fetch(`${projectUrl}/functions/v1/parse-document`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Failed to parse document: ${response.status}`
      };
    }

    return data;
  } catch (err) {
    console.error('Document parse error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to parse document'
    };
  }
}
