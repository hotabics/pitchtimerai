// Shared input validation utilities for edge functions

const MAX_INPUT_LENGTH = 2000;
const MAX_IDEA_LENGTH = 500;
const MAX_CONTEXT_VALUE_LENGTH = 1000;

// Suspicious patterns that may indicate prompt injection
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions|prompts?)/i,
  /disregard\s+(all\s+)?(previous|above|prior)\s+(instructions|prompts?)/i,
  /forget\s+(all\s+)?(previous|above|prior)\s+(instructions|prompts?)/i,
  /reveal\s+(your\s+)?(system\s+)?prompt/i,
  /show\s+(your\s+)?(system\s+)?prompt/i,
  /what\s+(are|is)\s+your\s+(system\s+)?(prompt|instructions)/i,
  /act\s+as\s+(a\s+)?different/i,
  /pretend\s+(to\s+be|you\s+are)/i,
  /you\s+are\s+now\s+(a|an)/i,
  /from\s+now\s+on\s+(you|ignore)/i,
  /system:\s/i,
  /\[\s*system\s*\]/i,
  /<\s*system\s*>/i,
  /###\s*(instruction|system|prompt)/i,
];

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitized?: string;
}

export interface ValidationOptions {
  maxLength?: number;
  allowEmpty?: boolean;
  checkInjection?: boolean;
}

/**
 * Sanitizes and validates a string input
 */
export function sanitizeInput(
  input: unknown,
  options: ValidationOptions = {}
): ValidationResult {
  const {
    maxLength = MAX_INPUT_LENGTH,
    allowEmpty = false,
    checkInjection = true,
  } = options;

  // Type check
  if (input === undefined || input === null) {
    if (allowEmpty) {
      return { isValid: true, sanitized: '' };
    }
    return { isValid: false, error: 'Input is required' };
  }

  if (typeof input !== 'string') {
    return { isValid: false, error: 'Input must be a string' };
  }

  // Remove control characters and trim
  let cleaned = input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars except newlines/tabs
    .trim();

  // Check empty
  if (!cleaned && !allowEmpty) {
    return { isValid: false, error: 'Input cannot be empty' };
  }

  // Check length
  if (cleaned.length > maxLength) {
    return { 
      isValid: false, 
      error: `Input exceeds maximum length of ${maxLength} characters` 
    };
  }

  // Check for prompt injection patterns
  if (checkInjection) {
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(cleaned)) {
        console.warn('Potential prompt injection detected:', cleaned.substring(0, 100));
        return { isValid: false, error: 'Invalid input detected' };
      }
    }
  }

  return { isValid: true, sanitized: cleaned };
}

/**
 * Validates the 'idea' field specifically
 */
export function validateIdea(idea: unknown): ValidationResult {
  return sanitizeInput(idea, { 
    maxLength: MAX_IDEA_LENGTH, 
    allowEmpty: false,
    checkInjection: true 
  });
}

/**
 * Validates a context object with nested values
 */
export function validateContext(
  context: unknown
): { isValid: boolean; error?: string; sanitized?: Record<string, unknown> } {
  if (context === undefined || context === null) {
    return { isValid: true, sanitized: {} };
  }

  if (typeof context !== 'object' || Array.isArray(context)) {
    return { isValid: false, error: 'Context must be an object' };
  }

  const sanitized: Record<string, unknown> = {};
  const contextObj = context as Record<string, unknown>;

  for (const [key, value] of Object.entries(contextObj)) {
    // Sanitize key
    const keyResult = sanitizeInput(key, { maxLength: 50, checkInjection: false });
    if (!keyResult.isValid) {
      return { isValid: false, error: `Invalid context key: ${key}` };
    }

    // Handle different value types
    if (typeof value === 'string') {
      const valueResult = sanitizeInput(value, { 
        maxLength: MAX_CONTEXT_VALUE_LENGTH, 
        allowEmpty: true,
        checkInjection: true 
      });
      if (!valueResult.isValid) {
        return { isValid: false, error: `Invalid context value for ${key}: ${valueResult.error}` };
      }
      sanitized[key] = valueResult.sanitized;
    } else if (Array.isArray(value)) {
      const sanitizedArray: string[] = [];
      for (const item of value) {
        if (typeof item === 'string') {
          const itemResult = sanitizeInput(item, { 
            maxLength: MAX_CONTEXT_VALUE_LENGTH, 
            allowEmpty: true,
            checkInjection: true 
          });
          if (!itemResult.isValid) {
            return { isValid: false, error: `Invalid array item in ${key}: ${itemResult.error}` };
          }
          sanitizedArray.push(itemResult.sanitized || '');
        } else {
          sanitizedArray.push(String(item));
        }
      }
      sanitized[key] = sanitizedArray;
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = value;
    } else if (value !== null && typeof value === 'object') {
      // Recursively validate nested objects (one level deep)
      const nestedResult = validateContext(value);
      if (!nestedResult.isValid) {
        return nestedResult;
      }
      sanitized[key] = nestedResult.sanitized;
    }
  }

  return { isValid: true, sanitized };
}

/**
 * Validates the 'type' field against allowed values
 */
export function validateType(type: unknown, allowedTypes: string[]): ValidationResult {
  if (typeof type !== 'string') {
    return { isValid: false, error: 'Type must be a string' };
  }

  if (!allowedTypes.includes(type)) {
    return { isValid: false, error: `Invalid type: ${type}` };
  }

  return { isValid: true, sanitized: type };
}

/**
 * Validates duration for speech generation
 */
export function validateDuration(duration: unknown): { isValid: boolean; error?: string; value?: number } {
  if (typeof duration !== 'number') {
    return { isValid: false, error: 'Duration must be a number' };
  }

  if (duration < 1 || duration > 30) {
    return { isValid: false, error: 'Duration must be between 1 and 30 minutes' };
  }

  return { isValid: true, value: Math.round(duration) };
}

/**
 * Validates track type
 */
export function validateTrack(track: unknown): ValidationResult {
  const allowedTracks = [
    'hackathon-no-demo',
    'hackathon-with-demo',
    'investor',
    'academic',
    'grandma',
    'peers'
  ];

  if (typeof track !== 'string') {
    return { isValid: false, error: 'Track must be a string' };
  }

  if (!allowedTracks.includes(track)) {
    return { isValid: false, error: `Invalid track: ${track}` };
  }

  return { isValid: true, sanitized: track };
}

/**
 * Validates text for TTS (less strict, just length limits)
 */
export function validateTTSText(text: unknown): ValidationResult {
  if (typeof text !== 'string') {
    return { isValid: false, error: 'Text must be a string' };
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Text cannot be empty' };
  }

  if (trimmed.length > 5000) {
    return { isValid: false, error: 'Text exceeds maximum length of 5000 characters' };
  }

  return { isValid: true, sanitized: trimmed };
}

/**
 * Validates voice ID
 */
export function validateVoiceId(voiceId: unknown): ValidationResult {
  if (voiceId === undefined || voiceId === null) {
    return { isValid: true, sanitized: 'JBFqnCBsd6RMkjVDRZzb' }; // Default voice
  }

  if (typeof voiceId !== 'string') {
    return { isValid: false, error: 'Voice ID must be a string' };
  }

  // ElevenLabs voice IDs are alphanumeric, typically 20-24 chars
  if (!/^[a-zA-Z0-9]{10,30}$/.test(voiceId)) {
    return { isValid: false, error: 'Invalid voice ID format' };
  }

  return { isValid: true, sanitized: voiceId };
}
