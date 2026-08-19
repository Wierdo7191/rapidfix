// Shared security utilities for RapidFix Kenya API routes
// Runs in Vercel serverless functions only — never imported by browser code.

export const CORS_ORIGIN = 'https://rapidfixkenya.site';

export function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Vary', 'Origin');
}

export function handlePreflight(res) {
  setCorsHeaders(res);
  return res.status(200).end();
}

// Simple in-memory rate limiter.
// WARNING: Vercel serverless functions are multi-instance.
// This limiter is per-instance only and does NOT provide global rate limiting.
// For production-grade rate limiting, use Vercel Edge Middleware + Upstash Redis or similar.
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 20; // max requests per window per IP

function getClientIp(req) {
  const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket?.remoteAddress || '';
  if (Array.isArray(ip)) return String(ip[0]).split(',')[0].trim();
  return String(ip).split(',')[0].trim();
}

function checkRateLimit(ip) {
  if (!ip) return true;
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  if (!entry) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (now > entry.resetAt) {
    entry.count = 1;
    entry.resetAt = now + RATE_LIMIT_WINDOW_MS;
    return true;
  }
  entry.count += 1;
  if (entry.count > RATE_LIMIT_MAX) {
    return false;
  }
  return true;
}

export function rateLimit(req, res) {
  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) {
    setCorsHeaders(res);
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }
  return null;
}

export function sanitizeString(value, maxLength) {
  if (typeof value !== 'string') return '';
  let trimmed = value.trim();
  if (maxLength && trimmed.length > maxLength) {
    trimmed = trimmed.slice(0, maxLength);
  }
  return trimmed
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function validateEmail(email) {
  if (!email) return true; // optional field
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone) {
  if (!phone) return false;
  return /^[+]?[\d\s()-]{7,20}$/.test(phone);
}

export async function verifyJwt(req, SUPABASE_URL, ANON_KEY) {
  const authHeader = (req.headers.authorization || req.headers.Authorization || '');
  if (!authHeader.startsWith('Bearer ')) {
    return { authenticated: false, user: null, error: 'Missing Authorization header' };
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return { authenticated: false, user: null, error: 'Empty token' };
  }

  try {
    const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!userResponse.ok) {
      return { authenticated: false, user: null, error: 'Invalid token' };
    }

    const user = await userResponse.json();
    return { authenticated: true, user: user, error: null };
  } catch (e) {
    return { authenticated: false, user: null, error: 'Token verification failed' };
  }
}

export async function getAdminProfile(req, SUPABASE_URL, SERVICE_ROLE_KEY, userId) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=role`,
      {
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      return { authorized: false, profile: null, error: 'Profile lookup failed' };
    }

    const data = await response.json();
    if (!data || data.length === 0) {
      return { authorized: false, profile: null, error: 'No profile found' };
    }

    const profile = data[0];
    const isAdmin = profile.role === 'admin' || profile.role === 'superadmin';
    return { authorized: isAdmin, profile: profile, error: isAdmin ? null : 'Not an admin' };
  } catch (e) {
    return { authorized: false, profile: null, error: 'Profile verification failed' };
  }
}

export async function requireAdmin(req, res, SUPABASE_URL, ANON_KEY, SERVICE_ROLE_KEY) {
  setCorsHeaders(res);

  const rateLimitResult = rateLimit(req, res);
  if (rateLimitResult) return rateLimitResult;

  const jwtResult = await verifyJwt(req, SUPABASE_URL, ANON_KEY);
  if (!jwtResult.authenticated) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const adminResult = await getAdminProfile(req, SUPABASE_URL, SERVICE_ROLE_KEY, jwtResult.user.id);
  if (!adminResult.authorized) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  return null; // authorized
}

export async function verifyAdminSession(req, SUPABASE_URL, ANON_KEY, SERVICE_ROLE_KEY) {
  const jwtResult = await verifyJwt(req, SUPABASE_URL, ANON_KEY);
  if (!jwtResult.authenticated) {
    return { authorized: false, user: null, profile: null, error: 'Unauthorized' };
  }

  const adminResult = await getAdminProfile(req, SUPABASE_URL, SERVICE_ROLE_KEY, jwtResult.user.id);
  if (!adminResult.authorized) {
    return { authorized: false, user: null, profile: null, error: 'Forbidden' };
  }

  return { authorized: true, user: jwtResult.user, profile: adminResult.profile, error: null };
}

export function safeError(error) {
  if (typeof error !== 'string') return 'Internal server error.';
  // Do not expose database messages, stack traces, or internal details
  return 'Internal server error.';
}
