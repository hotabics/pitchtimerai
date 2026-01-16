// JWT authentication validation for edge functions
// Uses Supabase to validate tokens and extract user info

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

export interface AuthResult {
  authenticated: boolean;
  userId?: string;
  email?: string;
  error?: string;
}

/**
 * Validate JWT token from Authorization header
 * Returns user info if valid, or authenticated: false if not
 * 
 * @param req - The incoming request
 * @param options - Configuration options
 * @returns AuthResult with authentication status and user info
 */
export async function validateAuth(
  req: Request,
  options: { required?: boolean } = {}
): Promise<AuthResult> {
  const { required = false } = options;
  
  const authHeader = req.headers.get("Authorization");
  
  // No auth header provided
  if (!authHeader) {
    if (required) {
      return { authenticated: false, error: "Authorization header required" };
    }
    return { authenticated: false };
  }
  
  // Extract token
  const token = authHeader.replace("Bearer ", "");
  if (!token) {
    if (required) {
      return { authenticated: false, error: "Invalid authorization token format" };
    }
    return { authenticated: false };
  }
  
  try {
    // Create Supabase client with service role for validation
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    
    // Validate the JWT and get user info
    const { data: { user }, error } = await supabaseClient.auth.getUser(token);
    
    if (error || !user) {
      console.warn("JWT validation failed:", error?.message || "No user found");
      if (required) {
        return { authenticated: false, error: "Invalid or expired token" };
      }
      return { authenticated: false };
    }
    
    console.log(`Authenticated user: ${user.id} (${user.email})`);
    
    return {
      authenticated: true,
      userId: user.id,
      email: user.email,
    };
  } catch (error) {
    console.error("Auth validation error:", error);
    if (required) {
      return { authenticated: false, error: "Authentication validation failed" };
    }
    return { authenticated: false };
  }
}

/**
 * Create an unauthorized response
 */
export function createUnauthorizedResponse(
  message: string,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status: 401,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    }
  );
}

/**
 * Helper to check if request has valid auth (non-blocking)
 * Useful for logging/analytics while still allowing anonymous access
 */
export async function getAuthStatus(req: Request): Promise<AuthResult> {
  return validateAuth(req, { required: false });
}

/**
 * Helper to require authentication
 * Returns AuthResult with error if not authenticated
 */
export async function requireAuth(req: Request): Promise<AuthResult> {
  return validateAuth(req, { required: true });
}
