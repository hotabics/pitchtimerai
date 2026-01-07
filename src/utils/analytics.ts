/**
 * PostHog Analytics Integration
 * 
 * Provides a centralized way to track user events throughout the application.
 * Uses PostHog for product analytics and session replay.
 */

import posthog from 'posthog-js';

// PostHog configuration
const POSTHOG_API_KEY = 'ph_placeholder_key';
const POSTHOG_HOST = 'https://app.posthog.com';

// Track whether PostHog has been initialized
let isInitialized = false;

/**
 * Initialize PostHog analytics.
 * Only initializes if a valid API key is present.
 */
export const initializeAnalytics = (): void => {
  // Skip initialization if no API key or already initialized
  if (!POSTHOG_API_KEY || POSTHOG_API_KEY === 'ph_placeholder_key') {
    console.log('[Analytics] PostHog not initialized: No API key configured');
    return;
  }

  if (isInitialized) {
    console.log('[Analytics] PostHog already initialized');
    return;
  }

  try {
    posthog.init(POSTHOG_API_KEY, {
      api_host: POSTHOG_HOST,
      // Enable session replay by default
      enable_recording_console_log: true,
      // Capture pageviews automatically
      capture_pageview: true,
      // Capture page leaves
      capture_pageleave: true,
      // Persistence type
      persistence: 'localStorage',
      // Respect Do Not Track
      respect_dnt: true,
      // Disable in development if needed
      loaded: (posthog) => {
        if (import.meta.env.DEV) {
          console.log('[Analytics] PostHog loaded in development mode');
        }
      },
    });

    isInitialized = true;
    console.log('[Analytics] PostHog initialized successfully');
  } catch (error) {
    console.error('[Analytics] Failed to initialize PostHog:', error);
  }
};

/**
 * Track a custom event with optional properties.
 * 
 * @param eventName - The name of the event to track
 * @param properties - Optional properties to attach to the event
 */
export const trackEvent = (eventName: string, properties?: Record<string, unknown>): void => {
  // Skip if not initialized or no valid API key
  if (!isInitialized || POSTHOG_API_KEY === 'ph_placeholder_key') {
    // Log events in development for debugging
    if (import.meta.env.DEV) {
      console.log(`[Analytics] Event: ${eventName}`, properties || {});
    }
    return;
  }

  try {
    posthog.capture(eventName, properties);
  } catch (error) {
    console.error('[Analytics] Failed to track event:', error);
  }
};

/**
 * Identify a user with optional traits.
 * 
 * @param userId - Unique identifier for the user
 * @param traits - Optional user properties
 */
export const identifyUser = (userId: string, traits?: Record<string, unknown>): void => {
  if (!isInitialized || POSTHOG_API_KEY === 'ph_placeholder_key') {
    if (import.meta.env.DEV) {
      console.log(`[Analytics] Identify: ${userId}`, traits || {});
    }
    return;
  }

  try {
    posthog.identify(userId, traits);
  } catch (error) {
    console.error('[Analytics] Failed to identify user:', error);
  }
};

/**
 * Reset the current user session (for logout).
 */
export const resetAnalytics = (): void => {
  if (!isInitialized || POSTHOG_API_KEY === 'ph_placeholder_key') {
    return;
  }

  try {
    posthog.reset();
  } catch (error) {
    console.error('[Analytics] Failed to reset session:', error);
  }
};

// Export PostHog instance for advanced usage
export { posthog };
