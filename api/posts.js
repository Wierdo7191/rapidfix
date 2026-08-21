// Vercel Serverless Function: Posts API
// Uses native fetch to call Supabase REST API
// No npm dependencies required — Node.js 18+ has native fetch

import { setCorsHeaders, handlePreflight, rateLimit, sanitizeString, requireAdmin, safeError } from './_security.js';

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
        let url = `${SUPABASE_URL}/rest/v1/posts?select=*`;

        if (status === 'all') {
          const adminCheck = await requireAdmin(req, res, SUPABASE_URL, SUPABASE_ANON_KEY, SERVICE_ROLE_KEY);
          if (adminCheck) return adminCheck;
          url += '&order=published_at.desc';
        } else if (status === 'draft' || status === 'published' || status === 'archived') {
          const adminCheck = await requireAdmin(req, res, SUPABASE_URL, SUPABASE_ANON_KEY, SERVICE_ROLE_KEY);
          if (adminCheck) return adminCheck;
          url += `&status=eq.${encodeURIComponent(status)}&order=published_at.desc`;
        } else {
          url += '&status=eq.published&order=published_at.desc';
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

        const adminCheck = await requireAdmin(req, res, SUPABASE_URL, SUPABASE_ANON_KEY, SERVICE_ROLE_KEY);
        if (adminCheck) return adminCheck;

        const {
          title,
          slug,
          content,
          excerpt,
          category,
          status,
          published_at,
          author_id,
          image_url,
          meta_description,
          meta_keywords,
          read_time
        } = req.body;

        if (!title || !slug || !content) {
          return res.status(400).json({ error: 'Missing required fields: title, slug, content.' });
        }

        const post = {
          title: sanitizeString(title, 255),
          slug: sanitizeString(slug, 255),
          content: content,
          excerpt: excerpt ? sanitizeString(excerpt, 500) : null,
          category: category ? sanitizeString(category, 100) : null,
          status: ['draft', 'published', 'archived'].includes(status) ? status : 'draft',
          published_at: published_at || new Date().toISOString(),
          author_id: author_id || null,
          image_url: image_url ? sanitizeString(image_url, 500) : null,
          meta_description: meta_description ? sanitizeString(meta_description, 500) : null,
          meta_keywords: meta_keywords ? sanitizeString(meta_keywords, 500) : null,
          read_time: read_time ? sanitizeString(read_time, 50) : null
        };

        const response = await fetch(`${SUPABASE_URL}/rest/v1/posts`, {
          method: 'POST',
          headers: {
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(post)
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

        const { id, ...updates } = req.body;

        if (!id) {
          return res.status(400).json({ error: 'Missing required field: id.' });
        }

        const allowedFields = [
          'title', 'slug', 'content', 'excerpt', 'category', 'status',
          'published_at', 'author_id', 'image_url', 'meta_description', 'meta_keywords', 'read_time'
        ];

        const updateData = {};
        allowedFields.forEach(function (field) {
          if (updates.hasOwnProperty(field)) {
            if (field === 'content') {
              updateData[field] = updates[field];
            } else if (field === 'published_at') {
              updateData[field] = updates[field] || new Date().toISOString();
            } else {
              updateData[field] = sanitizeString(updates[field], 255);
            }
          }
        });

        if (updateData.status && !['draft', 'published', 'archived'].includes(updateData.status)) {
          return res.status(400).json({ error: 'Invalid status.' });
        }

        if (Object.keys(updateData).length === 0) {
          return res.status(400).json({ error: 'No valid fields to update.' });
        }

        const patchResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/posts?id=eq.${encodeURIComponent(id)}`,
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

      case 'DELETE': {
        const adminCheck = await requireAdmin(req, res, SUPABASE_URL, SUPABASE_ANON_KEY, SERVICE_ROLE_KEY);
        if (adminCheck) return adminCheck;

        const id = req.query?.id;

        if (!id || typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
          return res.status(400).json({ error: 'Missing or invalid required field: id.' });
        }

        const deleteResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/posts?id=eq.${encodeURIComponent(id)}`,
          {
            method: 'DELETE',
            headers: {
              'apikey': SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!deleteResponse.ok) {
          const data = await deleteResponse.json();
          console.error('[API] Supabase DELETE error:', data);
          return res.status(deleteResponse.status).json({ error: safeError(data.message) });
        }

        return res.status(204).end();
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
