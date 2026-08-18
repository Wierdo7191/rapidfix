# Supabase Foundation — RapidFix Kenya

## 1. Supabase Project Configuration

### 1.1 Project Details
- **Provider**: Supabase (supabase.com)
- **Purpose**: Backend for reviews, messages, bookings, site settings, and admin authentication
- **Region**: Choose closest to Kenya or primary user base
- **Plan**: Free tier acceptable for foundation; upgrade path documented

### 1.2 Environment Variables

#### Client-side (public, safe to expose)
```
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-public-key]
```
Note: `VITE_` prefix is a convention; actual variable names should match deployment setup.

#### Server-side (VERCEL ONLY — never commit to Git)
```
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
```

### 1.3 Security
- `SUPABASE_SERVICE_ROLE_KEY` must ONLY exist in Vercel serverless function environment
- Never reference service role key in client JavaScript, HTML, or documentation
- Anon key is public by design; Row Level Security (RLS) enforces access control

---

## 2. Database Tables

### 2.1 reviews
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  article_slug TEXT,
  article_title TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id)
);
```

### 2.2 messages
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  appliance TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);
```

### 2.3 bookings
```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  appliance TEXT NOT NULL,
  county TEXT NOT NULL,
  town TEXT NOT NULL,
  precise_location TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 2.4 site_settings
```sql
CREATE TABLE site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 2.5 profiles (admin role extension)
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 3. Row Level Security (RLS) Policies

### 3.1 reviews
```sql
-- Public can insert reviews (anyone can submit)
CREATE POLICY "Public can insert reviews" ON reviews
  FOR INSERT WITH CHECK (true);

-- Public can only read approved reviews
CREATE POLICY "Public can read approved reviews" ON reviews
  FOR SELECT USING (status = 'approved');

-- Admin can read all reviews
CREATE POLICY "Admin can read all reviews" ON reviews
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admin can update reviews
CREATE POLICY "Admin can update reviews" ON reviews
  FOR UPDATE USING (auth.role() = 'authenticated');
```

### 3.2 messages
```sql
-- Public can insert messages
CREATE POLICY "Public can insert messages" ON messages
  FOR INSERT WITH CHECK (true);

-- Admin can read/update messages
CREATE POLICY "Admin can read messages" ON messages
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can update messages" ON messages
  FOR UPDATE USING (auth.role() = 'authenticated');
```

### 3.3 bookings
```sql
-- Public can insert bookings
CREATE POLICY "Public can insert bookings" ON bookings
  FOR INSERT WITH CHECK (true);

-- Admin can read/update bookings
CREATE POLICY "Admin can read bookings" ON bookings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can update bookings" ON bookings
  FOR UPDATE USING (auth.role() = 'authenticated');
```

### 3.4 site_settings
```sql
-- Public can read site settings
CREATE POLICY "Public can read site settings" ON site_settings
  FOR SELECT USING (true);

-- Admin can manage site settings
CREATE POLICY "Admin can insert site settings" ON site_settings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin can update site settings" ON site_settings
  FOR UPDATE USING (auth.role() = 'authenticated');
```

### 3.5 profiles
```sql
-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Admin can read all profiles
CREATE POLICY "Admin can read all profiles" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');
```

---

## 4. Authentication Design

### 4.1 Supabase Auth
- Email/password authentication for admin users
- Session managed via Supabase Auth (JWT)
- Serverless functions verify JWT before allowing mutations

### 4.2 Admin Flow
1. Admin navigates to `/admin/`
2. Supabase Auth login form
3. JWT stored in HTTP-only cookie or localStorage
4. `/api/admin/*` requests include JWT in Authorization header
5. Serverless functions verify JWT
6. Invalid/missing token → 401

### 4.3 Public Flow
- Public reads via anon key with RLS policies
- Public can only insert reviews/messages/bookings
- Public can only read `approved` reviews

---

## 5. Security Model

### 5.1 Service Role Key
- ONLY used in Vercel serverless functions (`/api/*`)
- Never exposed to browser
- Never committed to Git
- Stored in Vercel environment variables

### 5.2 Input Validation
- All API inputs validated server-side
- Sanitize text fields to prevent XSS
- Limit field lengths
- Validate email/phone formats

### 5.3 CORS
- Vercel serverless functions handle CORS
- Restrict to site origin in production

---

## 6. Vercel Configuration Requirements

### 6.1 Environment Variables to Add in Vercel Dashboard

#### Production
| Variable | Value | Environment |
|----------|-------|-------------|
| `SUPABASE_URL` | `https://[project].supabase.co` | Production |
| `SUPABASE_ANON_KEY` | `[anon-key]` | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | `[service-role-key]` | Production (Serverless only) |

### 6.2 Directory Structure
```
/
├── api/
│   ├── reviews.js
│   ├── messages.js
│   └── bookings.js
├── css/
├── js/
├── Images/
├── index.html
└── ... (existing static files)
```

### 6.3 Notes
- Vercel automatically serves `/api/*` as serverless functions
- Static files continue to be served as-is
- No build step required

---

## 7. Future Integration Points

### 7.1 Reviews
- Replace FormSubmit.co review submission with API call
- Keep FormSubmit.co as fallback during transition
- Public `/reviews` page fetches from API

### 7.2 Messages
- Contact form submits to both FormSubmit.co AND API
- Admin dashboard reads from API

### 7.3 Bookings
- Booking form submits to both FormSubmit.co AND API
- Admin dashboard manages bookings

### 7.4 Site Settings
- Admin can update logo, favicon, hero image, site title
- Frontend reads from API on load

### 7.5 Blog/Articles
- Future: posts table with rich text
- Future: TipTap or similar editor in admin

### 7.6 Analytics
- Future: events table for traffic tracking
- Future: simple page view counter

---

## 8. Migration Strategy

### 8.1 Parallel Operation
- FormSubmit.co continues working
- New API runs in parallel
- No downtime, no data loss

### 8.2 Rollback
- If API fails, FormSubmit.co still delivers emails
- Static HTML never changes
- No destructive migrations

### 8.3 Data Consistency
- Admin manually enters any FormSubmit.co submissions during transition
- Transition period: 1-2 weeks expected

---

## 9. Files Modified/Created

### 9.1 New Files
- `docs/SUPABASE_FOUNDATION.md` — this document
- `sql/supabase-schema.sql` — SQL migration
- `js/supabase-client.js` — Supabase client initialization
- `api/reviews.js` — reviews API
- `api/messages.js` — messages API
- `api/bookings.js` — bookings API

### 9.2 Modified Files
- `.gitignore` — add `.env` patterns

### 9.3 Untouched Files
- All existing HTML pages (except form submissions in future phase)
- All existing CSS files
- `js/header.js`
- All images/assets
- FormSubmit.co form actions (preserved)

---

## 10. Security Checklist

- [x] No service-role key in client code
- [x] No service-role key in documentation
- [x] No hardcoded credentials
- [x] `.env` in `.gitignore`
- [x] RLS enabled on all tables
- [x] Public access restricted to approved content
- [x] Admin authorization via Supabase Auth, not URL obscurity
- [x] Input validation planned for all API routes
- [x] FormSubmit.co remains functional
- [x] No existing data deleted or modified

---

## 11. Prerequisites for Implementation

Before proceeding to build the admin dashboard or update frontend forms:

1. **Supabase project created** by owner
2. **Supabase project URL** provided
3. **Supabase anon key** provided
4. **Supabase service role key** provided (server-side only)
5. **Vercel environment variables** configured
6. **SQL schema executed** in Supabase SQL Editor
7. **RLS policies verified** in Supabase dashboard

---

## 12. Next Steps (Pending Approval)

1. Execute `sql/supabase-schema.sql` in Supabase SQL Editor
2. Configure Vercel environment variables
3. Deploy `/api/` serverless functions
4. Create `js/supabase-client.js` with actual credentials
5. Test API endpoints
6. Update frontend forms to submit to API (parallel with FormSubmit.co)
7. Create admin dashboard (`/admin/`)
8. Update reviews page to fetch from API

---

*Document created: 2026-08-18*
*Branch: session/agent_1b05dc68-f136-4b05-b350-a641d3ea8a40*
*Repository: https://github.com/Wierdo7191/rapidfix.git*
