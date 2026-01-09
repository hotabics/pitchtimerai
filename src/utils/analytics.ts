/**
 * PostHog Analytics Integration
 * 
 * Provides a centralized way to track user events throughout the application.
 * Uses PostHog for product analytics and session replay.
 * 
 * Configuration:
 * Set VITE_POSTHOG_API_KEY in your .env file (or Lovable secrets for production)
 * Optionally set VITE_POSTHOG_HOST (defaults to https://app.posthog.com)
 */

import posthog from 'posthog-js';

// PostHog configuration
const POSTHOG_API_KEY = import.meta.env.VITE_POSTHOG_API_KEY || 'phc_1fY7Tst0Pjs1E4DeRlB7IYPSK76GsMLy7U1LKbjpG5z';
const POSTHOG_HOST = 'https://us.i.posthog.com';

// Track whether PostHog has been initialized
let isInitialized = false;

/**
 * Initialize PostHog analytics.
 * Initializes with the configured API key.
 */
export const initializeAnalytics = (): void => {
  if (isInitialized) {
    console.log('[Analytics] PostHog already initialized');
    return;
  }

  try {
    posthog.init(POSTHOG_API_KEY, {
      api_host: POSTHOG_HOST,
      // Person profiles configuration
      person_profiles: 'identified_only',
      // Capture pageviews automatically
      capture_pageview: true,
      // Capture page leaves
      capture_pageleave: true,
      // Persistence type
      persistence: 'localStorage',
      // Enable autocapture for all events
      autocapture: true,
      // Capture performance metrics
      capture_performance: true,
      // Disable session recording on initial load to reduce JS execution
      // It will be enabled lazily when needed
      disable_session_recording: true,
      // Loaded callback
      loaded: (posthog) => {
        if (import.meta.env.DEV) {
          console.log('[Analytics] PostHog loaded in development mode');
        }
        // Enable session recording after a delay to not block initial render
        setTimeout(() => {
          posthog.startSessionRecording();
        }, 5000);
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
  if (!isInitialized) {
    if (import.meta.env.DEV) {
      console.log(`[Analytics] Event (not initialized): ${eventName}`, properties || {});
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
  if (!isInitialized) {
    if (import.meta.env.DEV) {
      console.log(`[Analytics] Identify (not initialized): ${userId}`, traits || {});
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
  if (!isInitialized) {
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
