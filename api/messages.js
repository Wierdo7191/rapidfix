// Vercel Serverless Function: Messages API
// Uses native fetch to call Supabase REST API
// No npm dependencies required — Node.js 18+ has native fetch

import { setCorsHeaders, handlePreflight, rateLimit, sanitizeString, validateEmail, validatePhone, requireAdmin, safeError } from './_security.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return handlePreflight(res);
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY) {
    console.error('[API] Missing Supabase environment variables.');
    setCorsHeaders(res);
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  try {
    switch (req.method) {
      case 'POST': {
        setCorsHeaders(res);
        const rateLimitResult = rateLimit(req, res);
        if (rateLimitResult) return rateLimitResult;

        const { name, email, phone, appliance, description } = req.body;

        if (!name || !phone || !appliance || !description) {
          return res.status(400).json({ error: 'Missing required fields.' });
        }

        const message = {
          name: sanitizeString(name, 100),
          email: validateEmail(email) ? sanitizeString(email, 255) : null,
          phone: sanitizeString(phone, 20),
          appliance: sanitizeString(appliance, 100),
          description: sanitizeString(description, 5000),
          status: 'new'
        };

        if (!validatePhone(message.phone)) {
          return res.status(400).json({ error: 'Invalid phone number format.' });
        }

        const response = await fetch(`${SUPABASE_URL}/rest/v1/messages`, {
          method: 'POST',
          headers: {
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(message)
        });

        const data = await response.json();
        if (!response.ok) {
          console.error('[API] Supabase POST error:', data);
          return res.status(response.status).json({ error: safeError(data.message) });
        }

        return res.status(201).json(data[0] || data);
      }

      case 'PATCH': {
        const adminCheck = await requireAdmin(req, res, SUPABASE_URL, SUPABASE_ANON_KEY, SERVICE_ROLE_KEY);
        if (adminCheck) return adminCheck;

        const { id, status } = req.body;

        if (!id || !status) {
          return res.status(400).json({ error: 'Missing required fields: id, status.' });
        }

        if (!['new', 'read', 'archived'].includes(status)) {
          return res.status(400).json({ error: 'Invalid status.' });
        }

        const updateData = {
          status: sanitizeString(status, 50),
          updated_at: new Date().toISOString()
        };

        if (status === 'read') {
          updateData.read_at = new Date().toISOString();
        }

        const patchResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/messages?id=eq.${encodeURIComponent(id)}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(updateData)
          }
        );

        const patchData = await patchResponse.json();
        if (!patchResponse.ok) {
          console.error('[API] Supabase PATCH error:', patchData);
          return res.status(patchResponse.status).json({ error: safeError(patchData.message) });
        }

        return res.status(200).json(patchData[0] || patchData);
      }

      case 'GET': {
        const adminCheck = await requireAdmin(req, res, SUPABASE_URL, SUPABASE_ANON_KEY, SERVICE_ROLE_KEY);
        if (adminCheck) return adminCheck;

        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/messages?order=created_at.desc`,
          {
            headers: {
              'apikey': SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const data = await response.json();
        if (!response.ok) {
          console.error('[API] Supabase GET error:', data);
          return res.status(response.status).json({ error: safeError(data.message) });
        }

        return res.status(200).json(data);
      }

      default:
        setCorsHeaders(res);
        return res.status(405).json({ error: 'Method not allowed.' });
    }
  } catch (error) {
    console.error('[API] Unexpected error:', error);
    setCorsHeaders(res);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
