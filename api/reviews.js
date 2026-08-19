// Vercel Serverless Function: Reviews API
// Uses native fetch to call Supabase REST API
// No npm dependencies required — Node.js 18+ has native fetch

import { setCorsHeaders, handlePreflight, rateLimit, sanitizeString, validateEmail, requireAdmin, safeError } from './_security.js';

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
      case 'GET': {
        const status = req.query?.status;
        let url = `${SUPABASE_URL}/rest/v1/reviews?select=*`;

        if (status === 'all') {
          const adminCheck = await requireAdmin(req, res, SUPABASE_URL, SUPABASE_ANON_KEY, SERVICE_ROLE_KEY);
          if (adminCheck) return adminCheck;
          url += '&order=created_at.desc';
        } else if (status === 'pending') {
          const adminCheck = await requireAdmin(req, res, SUPABASE_URL, SUPABASE_ANON_KEY, SERVICE_ROLE_KEY);
          if (adminCheck) return adminCheck;
          url += '&status=eq.pending&order=created_at.desc';
        } else {
          url += '&status=eq.approved&order=created_at.desc';
        }

        const response = await fetch(url, {
          headers: {
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        if (!response.ok) {
          console.error('[API] Supabase GET error:', data);
          return res.status(response.status).json({ error: safeError(data.message) });
        }

        return res.status(200).json(data);
      }

      case 'POST': {
        setCorsHeaders(res);
        const rateLimitResult = rateLimit(req, res);
        if (rateLimitResult) return rateLimitResult;

        const { name, email, rating, review_text, article_slug, article_title } = req.body;

        if (!name || !rating || !review_text) {
          return res.status(400).json({ error: 'Missing required fields: name, rating, review_text.' });
        }

        const review = {
          name: sanitizeString(name, 100),
          email: validateEmail(email) ? sanitizeString(email, 255) : null,
          rating: Math.max(1, Math.min(5, parseInt(rating, 10) || 0)),
          review_text: sanitizeString(review_text, 2000),
          article_slug: article_slug ? sanitizeString(article_slug, 255) : null,
          article_title: article_title ? sanitizeString(article_title, 255) : null,
          status: 'pending'
        };

        if (!review.name || !review.review_text) {
          return res.status(400).json({ error: 'Invalid input: name and review_text are required.' });
        }

        const response = await fetch(`${SUPABASE_URL}/rest/v1/reviews`, {
          method: 'POST',
          headers: {
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(review)
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

        const { id, status, approved_by } = req.body;

        if (!id || !status) {
          return res.status(400).json({ error: 'Missing required fields: id, status.' });
        }

        const updateData = {
          status: sanitizeString(status, 50),
          updated_at: new Date().toISOString()
        };

        if (updateData.status === 'approved') {
          updateData.approved_at = new Date().toISOString();
          if (approved_by) updateData.approved_by = sanitizeString(approved_by, 255);
        }

        const patchResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/reviews?id=eq.${encodeURIComponent(id)}`,
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
