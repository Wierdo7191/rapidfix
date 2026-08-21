// Vercel Serverless Function: Admin Session Verification
// Verifies JWT and admin role, returns minimal admin info

import { setCorsHeaders, handlePreflight, verifyAdminSession, safeError } from '../_security.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return handlePreflight(res);
  }

  if (req.method !== 'GET') {
    setCorsHeaders(res);
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY) {
    setCorsHeaders(res);
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  try {
    const sessionResult = await verifyAdminSession(req, SUPABASE_URL, SUPABASE_ANON_KEY, SERVICE_ROLE_KEY);

    if (!sessionResult.authorized) {
      return res.status(401).json({ error: sessionResult.error || 'Unauthorized' });
    }

    return res.status(200).json({
      email: sessionResult.user.email,
      role: sessionResult.profile.role
    });
  } catch (error) {
    console.error('[API] Admin session error:', error);
    setCorsHeaders(res);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
