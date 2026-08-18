// Vercel Serverless Function: Bookings API
// Uses native fetch to call Supabase REST API
// No npm dependencies required — Node.js 18+ has native fetch

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
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

  try {
    switch (req.method) {
      case 'POST': {
        const { name, phone, appliance, county, town, precise_location, description } = req.body;

        if (!name || !phone || !appliance || !county || !town || !precise_location) {
          return res.status(400).json({ error: 'Missing required fields.' });
        }

        const booking = {
          name: String(name).trim(),
          phone: String(phone).trim(),
          appliance: String(appliance).trim(),
          county: String(county).trim(),
          town: String(town).trim(),
          precise_location: String(precise_location).trim(),
          description: description ? String(description).trim() : null,
          status: 'new'
        };

        const response = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
          method: 'POST',
          headers: {
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(booking)
        });

        const data = await response.json();
        if (!response.ok) {
          console.error('[API] Supabase POST error:', data);
          return res.status(response.status).json({ error: data.message || 'Failed to create booking.' });
        }

        return res.status(201).json(data[0] || data);
      }

      case 'GET': {
        // Admin: list bookings
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/bookings?order=created_at.desc`,
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
          return res.status(response.status).json({ error: data.message || 'Failed to fetch bookings.' });
        }

        return res.status(200).json(data);
      }

      default:
        return res.status(405).json({ error: 'Method not allowed.' });
    }
  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
