# Backend Foundation Plan — RapidFix Kenya

## 1. Current Architecture

### 1.1 Site Type
- **Static HTML/CSS/JS** — no build step, no framework, no runtime
- Precompiled Tailwind CSS (`css/tailwind.min.css`)
- Custom CSS: `css/nav.css`
- Vanilla JS: `js/header.js` (mobile menu only)
- Font Awesome 6 (CDN), Google Fonts Inter (CDN)

### 1.2 Entry Points
- Root `index.html` — homepage
- Service pages: `tv-repair.html`, `washing-machine-repair.html`, `fridge-repair.html`, `microwave-repair.html`, `oven-repair.html`, `ac-repair.html`, `dishwasher-repair.html`, `home-theatre-repair.html`, `kettle-repair.html`
- Blog listing: `blog.html`
- Blog articles: 20 HTML files in `blog/` plus 20 redirect `index.html` files in subdirectories
- Reviews: `reviews.html`
- Contact: `pages/contact.html`
- Sub-pages: `pages/about.html`, `pages/privacy.html`, `pages/terms.html`
- Redirect aliases in subdirectories: `about/`, `contact/`, `privacy/`, `terms/`, `services/`, `reviews/`, and each service/blog path

### 1.3 Routing
- No client-side router
- Pure static file routing via Vercel
- HTML redirect files use `<meta http-equiv="refresh">` + `window.location.replace()`

### 1.4 Assets
- Images stored in root `/Images/` directory
- Additional images scattered in root (logo PNGs, product photos)
- Favicon: `favicon.svg`

### 1.5 Deployment
- Hosted on Vercel
- No `vercel.json`, no `.vercel/` directory, no `package.json`
- No build configuration
- No serverless functions directory (`/api`) currently exists
- GitHub remote: `https://github.com/Wierdo7191/rapidfix.git`

---

## 2. Existing FormSubmit.co Integration

### 2.1 Forms Using FormSubmit.co
All forms submit to `https://formsubmit.co/gotjames199@gmail.com`.

| File | Form ID | Subject | Fields |
|------|---------|---------|--------|
| `pages/contact.html` | `contactForm` | N/A (default) | name, phone, email, subject, message |
| `index.html` | `bookingForm` | "New Booking Request from RapidFix Kenya" | name, phone, appliance, county, town, precise_location, description |
| `blog/*.html` (11 files) | `commentReviewForm` | "New Blog Comment from RapidFix Kenya" | _subject, _redirect, _captcha, article, article_url, rating, name, review |

### 2.2 FormSubmit Behavior
- FormSubmit.co is an email-only form backend
- It sends form data to the configured email address
- `_redirect` parameter: redirects user to specified URL after submission
- `_captcha` parameter: set to `false` on all forms
- `_subject` parameter: customizes email subject line
- No database, no API, no webhook support beyond email
- No authentication or authorization

### 2.3 Current Flow
```
User fills form → POST to formsubmit.co → Email sent to gotjames199@gmail.com → User redirected back
```

### 2.4 Data Currently NOT Captured
- No structured storage of submissions
- No review status tracking
- No message tracking
- No booking tracking
- No analytics

---

## 3. Existing Review Flow

### 3.1 Current Implementation
- `reviews.html` contains **3 static hardcoded testimonials**
- No dynamic review loading currently exists in the working tree
- Previous session attempted localStorage-based reviews, but those files do not exist in current branch state

### 3.2 Static Reviews (Current)
1. Mary Wanjiru — Westlands, Nairobi — 5 stars — Samsung fridge repair
2. James Omondi — Karen, Nairobi — 5 stars — LG washing machine repair
3. Sarah Njeri — Kileleshwa, Nairobi — 4.5 stars — Hisense AC repair

### 3.3 Existing "Leave a Review" Button
- `reviews.html` has a button linking to `/pages/contact.html`
- No dedicated review submission form exists yet

---

## 4. Existing localStorage Keys

**No localStorage keys are currently in use.** The repository contains no JavaScript that reads from or writes to localStorage or sessionStorage.

Previous session files (`js/comment-modal.js`, `js/reviews-page.js`, `js/contact-modal.js`) do not exist in the current working tree.

---

## 5. Existing Backend/Database Check

### 5.1 No Backend Exists
- No `/api/` directory
- No `package.json`
- No `vercel.json`
- No `.vercel/` directory
- No `.env` files
- No serverless functions
- No database connections
- No Supabase, Firebase, PostgreSQL, MySQL, MongoDB references
- No authentication system

### 5.2 Vercel Configuration
- No explicit Vercel configuration files
- Site is deployed on Vercel (confirmed via production URL `https://rapidfixkenya.site`)
- Vercel configuration is likely in the Vercel dashboard only

### 5.3 GitHub Configuration
- Repository: `https://github.com/Wierdo7191/rapidfix.git`
- Branch: `main` (production), `session/agent_1b05dc68-f136-4b05-b350-a641d3ea8a40` (current session)
- No GitHub Actions workflows found

---

## 6. Proposed Minimal Backend Architecture

### 6.1 Architecture Diagram
```
Existing Static HTML/CSS/JS
        ↓
      Vercel
        ↓
Vercel Serverless Functions (/api/*)
        ↓
    Supabase
    ├── Auth (admin authentication)
    ├── PostgreSQL (reviews, messages, settings)
    └── Storage (image uploads — future)
```

### 6.2 Rationale
- **Supabase**: Provides PostgreSQL + Auth + Storage with minimal configuration
- **Vercel Serverless Functions**: Already hosted on Vercel; API routes are native to the platform
- **No framework migration**: Static HTML remains static; only new `/api/` routes are added
- **No new infrastructure**: Uses existing Vercel deployment + Supabase free tier

### 6.3 What Stays Static
- All HTML pages
- All CSS files
- All existing JS files
- All images and assets
- FormSubmit.co for email delivery (preserved, not replaced)

### 6.4 What Changes
- New `/api/` directory for serverless functions
- New Supabase client integration in JS
- New database tables for reviews, messages, settings
- New admin authentication flow

---

## 7. Required Environment Variables

### 7.1 Vercel Environment Variables (Production)
```
SUPABASE_URL=https://[project].supabase.co
SUPABASE_ANON_KEY=[anon-public-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]  // ONLY for serverless functions, never exposed to browser
```

### 7.2 Supabase Project
- Must be created by the project owner
- Anon key is safe for browser exposure (row-level security will enforce access control)
- Service role key is ONLY for serverless functions (`/api/*`)
- Never commit keys to Git

### 7.3 FormSubmit.co
- Remains as-is for email delivery
- No changes needed to existing forms

---

## 8. Proposed Database Schema

### 8.1 reviews
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  article_slug TEXT,
  article_title TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 8.2 messages
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  appliance TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 8.3 bookings
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

### 8.4 site_settings
```sql
CREATE TABLE site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 8.5 admin_users (via Supabase Auth)
- Use Supabase Auth `auth.users` table
- Add `profiles` table for role assignment:
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 9. Authentication Approach

### 9.1 Supabase Auth
- Email/password authentication for admin users
- Session managed via Supabase Auth (JWT tokens stored in HTTP-only cookies or localStorage)
- Serverless functions verify JWT tokens before allowing mutations

### 9.2 Admin Access Flow
1. Admin navigates to `/admin/`
2. Supabase Auth login form
3. On success, JWT stored in cookie/localStorage
4. All `/api/admin/*` requests include JWT in Authorization header
5. Serverless functions verify JWT against Supabase Auth
6. Invalid/missing token → 401 Unauthorized

### 9.3 Public Access
- Public pages read from database via anon key with RLS policies
- RLS ensures public can only read `approved` reviews
- Admin endpoints require valid JWT + admin role

---

## 10. Security Model

### 10.1 Row Level Security (RLS)
- All tables have RLS policies
- Public: can only read `status = 'approved'` reviews
- Authenticated admin: can read/write all rows
- Serverless functions use service role key for admin operations

### 10.2 Input Validation
- All API inputs validated server-side
- Sanitize text fields to prevent XSS
- Limit field lengths
- Validate email/phone formats

### 10.3 Secret Management
- `SUPABASE_SERVICE_ROLE_KEY` only in Vercel environment variables
- Never exposed to browser
- Never committed to Git
- Anon key is public by design (protected by RLS)

### 10.4 CORS
- Vercel serverless functions handle CORS automatically
- Restrict to site origin in production

---

## 11. Migration Strategy

### 11.1 Existing Data
- **Static reviews in reviews.html**: Remain as fallback. Do NOT delete.
- **FormSubmit.co emails**: Continue delivering to email. No migration needed.
- **No existing database data**: Fresh start.

### 11.2 Migration Steps
1. Create Supabase project (manual step — requires owner action)
2. Create tables via SQL migration
3. Deploy `/api/` serverless functions to Vercel
4. Update frontend JS to call API endpoints instead of localStorage
5. **Parallel run**: FormSubmit.co continues alongside new API (both receive data)
6. Once API is stable, FormSubmit.co can be optionally removed per form

### 11.3 Rollback
- If Supabase fails, revert to FormSubmit.co (still working)
- Static HTML never changes
- No destructive migrations

---

## 12. Files That Will Need Modification

### 12.1 New Files
- `api/reviews.js` — GET/POST reviews, admin approve/reject
- `api/messages.js` — POST contact form data, GET for admin
- `api/bookings.js` — POST booking data, GET for admin
- `js/supabase-client.js` — Supabase JS client initialization
- `js/reviews-fetch.js` — Fetch approved reviews from API
- `admin/index.html` — Admin dashboard (future phase)

### 12.2 Modified Files
- `reviews.html` — Replace localStorage logic with API fetch
- `pages/contact.html` — Submit to both FormSubmit.co AND API
- `index.html` — Submit booking to both FormSubmit.co AND API
- `blog/*.html` — Submit comments to both FormSubmit.co AND API

### 12.3 Untouched Files
- All existing CSS files
- `js/header.js`
- All HTML structure/pages (only form actions modified)
- All images/assets
- `blog/*.html` content (only form submissions modified)

---

## 13. Files That Must NOT Be Changed

- `css/tailwind.min.css`
- `css/nav.css`
- `js/header.js`
- Any image in `/Images/` or root directory
- Existing page layouts and content
- Existing SEO metadata
- Existing navigation structure

---

## 14. Deployment Considerations

### 14.1 Vercel
- Add environment variables in Vercel dashboard
- Deploy `/api/` as Vercel Serverless Functions
- No build step required (static files served as-is, API functions run as Node.js)

### 14.2 Supabase
- Create project at supabase.com
- Run SQL migrations in Supabase SQL Editor
- Enable RLS on all tables
- Create admin user accounts via Supabase Auth
- Configure redirect URLs for auth

### 14.3 GitHub
- Push `/api/` and new JS files to `main` branch
- Vercel auto-deploys on push

---

## 15. Risks

### 15.1 Supabase Project Not Existing
- **Risk**: No Supabase project has been created yet
- **Mitigation**: Stop and request owner to create Supabase project before proceeding
- **Action Required**: Provide Supabase project URL and initial credentials

### 15.2 FormSubmit.co Dependency
- **Risk**: FormSubmit.co is a third-party service with no SLA
- **Mitigation**: Run parallel submission (FormSubmit.co + new API) during transition
- **Fallback**: If API fails, FormSubmit.co still delivers emails

### 15.3 Vercel Serverless Limits
- **Risk**: Vercel free tier has execution time/memory limits
- **Mitigation**: Keep API functions lightweight; upgrade Vercel plan if needed
- **Expected**: Simple CRUD operations well within free tier limits

### 15.4 Data Consistency During Transition
- **Risk**: Reviews submitted via FormSubmit.co email but not in database during transition period
- **Mitigation**: Admin manually enters missed reviews, or use migration script
- **Timeline**: Transition period expected to be 1-2 weeks

### 15.5 Security Misconfiguration
- **Risk**: Exposing service role key or misconfiguring RLS
- **Mitigation**: 
  - Service role key only in serverless functions
  - RLS tested thoroughly before production
  - Regular security audits

---

## 16. Next Steps (Pending Approval)

1. **Owner creates Supabase project** and provides:
   - Supabase project URL
   - Anon key
   - Service role key

2. **Create SQL migrations** for tables listed in Section 8

3. **Create `/api/` serverless functions** (one at a time, tested individually):
   - `api/reviews.js`
   - `api/messages.js`
   - `api/bookings.js`

4. **Update frontend JS** to call new API endpoints (parallel with FormSubmit.co)

5. **Create admin dashboard** (`/admin/`) with Supabase Auth

6. **Update reviews page** to fetch from API instead of localStorage

7. **Test, verify, deploy**

---

## 17. Current State Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Static HTML/CSS/JS | ✅ Complete | No changes needed |
| FormSubmit.co forms | ✅ Working | 13 forms active |
| Reviews page | ⚠️ Static only | 3 hardcoded testimonials |
| localStorage reviews | ❌ Not implemented | Previous session files not in current branch |
| Backend/API | ❌ None | No serverless functions exist |
| Database | ❌ None | No Supabase or other DB |
| Authentication | ❌ None | No admin system |
| Admin dashboard | ❌ None | Not started |
| Vercel config | ⚠️ Implicit | No vercel.json, dashboard-only config |
| Environment variables | ❌ None | No .env files |

---

*Document created: 2026-08-18*
*Branch: session/agent_1b05dc68-f136-4b05-b350-a641d3ea8a40*
*Repository: https://github.com/Wierdo7191/rapidfix.git*
