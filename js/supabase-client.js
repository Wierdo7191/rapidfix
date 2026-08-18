// Supabase Client for RapidFix Kenya
// This file initializes the Supabase JS client for browser use.
// The anon key is public by design; security is enforced by RLS policies.
// Service role key is NEVER exposed here — it only exists in serverless functions.

(function () {
  'use strict';

  var SUPABASE_URL = null;
  var SUPABASE_ANON_KEY = null;
  var supabase = null;

  function init() {
    // In a static site without a build step, credentials are provided via
    // a small inline config or environment-specific JS file.
    // For now, this fails gracefully if not configured.
    if (typeof window !== 'undefined' && window.__RAPIDFIX_SUPABASE__) {
      SUPABASE_URL = window.__RAPIDFIX_SUPABASE__.url;
      SUPABASE_ANON_KEY = window.__RAPIDFIX_SUPABASE__.anonKey;
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn('[Supabase] Client not initialized: missing URL or anon key.');
      return;
    }

    try {
      // Use Supabase JS client from CDN
      if (typeof supabase !== 'undefined' && supabase.createClient) {
        supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('[Supabase] Client initialized successfully.');
      } else {
        console.warn('[Supabase] Supabase JS client not loaded. Include the CDN script.');
      }
    } catch (e) {
      console.error('[Supabase] Initialization failed:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for debugging (remove in production if desired)
  window.__RAPIDFIX_SUPABASE_CLIENT__ = function () {
    return supabase;
  };
})();
