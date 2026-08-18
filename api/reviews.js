// Vercel Serverless Function: Reviews API
// Uses native fetch to call Supabase REST API
// No npm dependencies required — Node.js 18+ has native fetch

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('[API] Missing Supabase environment variables.');
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  const { method, query, body } = req;

  try {
    switch (method) {
      case 'GET': {
        // Public: fetch approved reviews
        // Admin: fetch all reviews with ?status=pending or ?status=all
        const status = query?.status;
        let url = `${SUPABASE_URL}/rest/v1/reviews?select=*`;
        
        if (status === 'all') {
          // Admin endpoint — in future, verify JWT here
          url += '&order=created_at.desc';
        } else if (status === 'pending') {
          url += '&status=eq.pending&order=created_at.desc';
        } else {
          // Public: only approved
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
          return res.status(response.status).json({ error: data.message || 'Failed to fetch reviews.' });
        }

        return res.status(200).json(data);
      }

      case 'POST': {
        // Public: submit a new review
        const { name, email, rating, review_text, article_slug, article_title } = body;

        if (!name || !rating || !review_text) {
          return res.status(400).json({ error: 'Missing required fields: name, rating, review_text.' });
        }

        const review = {
          name: String(name).trim(),
          email: email ? String(email).trim() : null,
          rating: parseInt(rating, 10),
          review_text: String(review_text).trim(),
          article_slug: article_slug ? String(article_slug).trim() : null,
          article_title: article_title ? String(article_title).trim() : null,
          status: 'pending'
        };

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
          return res.status(response.status).json({ error: data.message || 'Failed to submit review.' });
        }

        return res.status(201).json(data[0] || data);
      }

      case 'PATCH': {
        // Admin: approve/reject review
        // Future: verify JWT before allowing
        const { id, status, approved_by } = body;

        if (!id || !status) {
          return res.status(400).json({ error: 'Missing required fields: id, status.' });
        }

        const updateData = {
          status: String(status),
          updated_at: new Date().toISOString()
        };

        if (status === 'approved') {
          updateData.approved_at = new Date().toISOString();
          if (approved_by) updateData.approved_by = approved_by;
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
          return res.status(patchResponse.status).json({ error: patchData.message || 'Failed to update review.' });
        }

        return res.status(200).json(patchData[0] || patchData);
      }

      default:
        return res.status(405).json({ error: 'Method not allowed.' });
    }
  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
