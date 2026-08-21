// Admin Authentication for RapidFix Kenya
// Client-side auth utilities for /admin pages
// Uses Supabase Auth — session truth is server-side via /api/admin/session

(function () {
  'use strict';

  var ADMIN_SESSION_API = '/api/admin/session';
  var supabase = null;

  function getConfig() {
    return window.__RAPIDFIX_SUPABASE__ || null;
  }

  async function initSupabase() {
    var config = getConfig();
    if (!config || !config.url || !config.anonKey) {
      console.error('[AdminAuth] Supabase configuration missing.');
      return false;
    }

    try {
      if (typeof supabase !== 'undefined' && supabase.createClient) {
        supabase = supabase.createClient(config.url, config.anonKey);
        return true;
      }
      console.error('[AdminAuth] Supabase JS client not loaded.');
      return false;
    } catch (e) {
      console.error('[AdminAuth] Initialization failed:', e);
      return false;
    }
  }

  async function verifySession() {
    if (!supabase) {
      var initialized = await initSupabase();
      if (!initialized) return { valid: false, error: 'Supabase not configured' };
    }

    try {
      var sessionResult = await supabase.auth.getSession();
      var session = sessionResult.data?.session;

      if (!session || !session.access_token) {
        return { valid: false, error: 'No active session' };
      }

      var response = await fetch(ADMIN_SESSION_API, {
        headers: {
          'Authorization': 'Bearer ' + session.access_token
        }
      });

      if (!response.ok) {
        return { valid: false, error: 'Session invalid or expired' };
      }

      var data = await response.json();
      return { valid: true, user: data };
    } catch (e) {
      console.error('[AdminAuth] Session verification failed:', e);
      return { valid: false, error: 'Verification failed' };
    }
  }

  async function login(email, password) {
    if (!supabase) {
      var initialized = await initSupabase();
      if (!initialized) return { success: false, error: 'Supabase not configured' };
    }

    try {
      var response = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (response.error) {
        return { success: false, error: response.error.message || 'Login failed' };
      }

      return { success: true };
    } catch (e) {
      console.error('[AdminAuth] Login error:', e);
      return { success: false, error: 'Login failed' };
    }
  }

  async function logout() {
    if (!supabase) {
      var initialized = await initSupabase();
      if (!initialized) return { success: false };
    }

    try {
      await supabase.auth.signOut();
      return { success: true };
    } catch (e) {
      console.error('[AdminAuth] Logout error:', e);
      return { success: false };
    }
  }

  async function requireAdmin(options) {
    options = options || {};
    var redirectTo = options.redirectTo || '/admin/login.html';
    var onUnauthorized = options.onUnauthorized || null;

    var result = await verifySession();
    if (!result.valid) {
      if (onUnauthorized) {
        onUnauthorized(result.error);
      }
      window.location.href = redirectTo;
      return null;
    }

    return result.user;
  }

  window.RapidFixAdmin = {
    verifySession: verifySession,
    login: login,
    logout: logout,
    requireAdmin: requireAdmin
  };
})();
