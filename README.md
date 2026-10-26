# Alpha Mathematics Academy (ꯑꯜꯐꯥꯃꯦꯊꯦꯃꯦꯇꯤꯛꯁ ꯑꯦꯀꯥꯗꯦꯃꯤ)

Online Admission & Management Portal for Alpha Mathematics Academy, Bishnupur, Manipur, India.

## Features
- **Public Admission & Contact Form**:
  - Full Name in uppercase block letters, Date of Birth, Gender, Parents' names, Address, School, Class.
  - 10-digit Indian mobile contact number with optional "Same as contact" sync for WhatsApp.
  - Course categories: Category A (Class IX) & Category B (Class X).
  - Client-side image compression & preview for passport-size photo (max 2MB).
  - Sequential admission Form Number generation (`AMA-2027-0001`) from Postgres sequence.
  - Direct WhatsApp click-to-chat button with prefilled greeting.
  - Strict compliance: Explicit notice not to upload Aadhaar or ID documents online.
  - Deadline enforcement (`25-12-2026` configurable via `ADMISSION_LAST_DATE`).
  - Anti-spam honeypot and IP-based rate limiting (stored in Postgres).
- **Private Neon Object Storage**:
  - Secure S3-compatible file storage for student passport photos.
  - Private bucket configuration; photos streamed exclusively through authenticated admin sessions.
- **Password-Protected Admin Portal (`/admin`)**:
  - Protected with constant-time password verification (`ADMIN_PASSWORD`) and brute-force attempt limits.
  - 12-hour session via signed JWT in `httpOnly`, `secure`, `sameSite=lax` cookie using `jose`.
  - Dual-layer security: Middleware protection + in-route handler session verification.
  - Submissions dashboard with search (name, phone, form no), filter (category, status), date sorting, and pagination.
  - Metric counters for Class IX and Class X enrollment and status breakdown.
  - Inline status update (`New`, `Contacted`, `Admitted`, `Rejected`) and counseling notes.
  - Detail print view (`/admin/submissions/[id]`) with printable paper-form stylesheet (`@media print`).
  - One-click CSV export of submissions.
  - Cascade deletion: Removes submission record and purges photo from Neon Object Storage.
  - Blocked in `robots.txt` with `X-Robots-Tag: noindex, nofollow`.

---

## Tech Stack
- **Framework**: Next.js (App Router, TypeScript)
- **Styling**: Tailwind CSS
- **Typography**: Google Fonts (`Noto Sans Meetei Mayek` + `Inter`) via `next/font/google`
- **Validation**: `zod` + `react-hook-form`
- **Database**: Lakebase Postgres on Neon via `@neondatabase/serverless`
- **Object Storage**: Neon Object Storage (S3-compatible via `@aws-sdk/client-s3`)
- **Authentication**: `jose` (JWT)

---

## Local Setup

1. **Clone and Install Dependencies**:
   ```bash
   git clone <repo-url>
   cd alpha-mathematics-academy
   npm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env.local` or run `neon deploy`:
   ```bash
   cp .env.example .env.local
   ```
   Ensure the following variables are defined in `.env.local`:
   ```ini
   # Neon Lakebase Postgres
   DATABASE_URL=postgresql://...
   DATABASE_URL_UNPOOLED=postgresql://...
   NEON_BRANCH=production

   # Neon Object Storage
   AWS_ACCESS_KEY_ID=...
   AWS_SECRET_ACCESS_KEY=...
   AWS_ENDPOINT_URL_S3=...
   AWS_REGION=us-east-2
   ASSETS_BUCKET=assets

   # App Settings
   ADMIN_PASSWORD=YourSecurePassword
   SESSION_SECRET=min-32-chars-random-secret-key-for-jwt-signing
   ADMISSION_LAST_DATE=2026-12-25
   ```

3. **Run Database Migrations**:
   ```bash
   node scripts/migrate.mjs
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## How to Change the Admin Password
To change the admin password, update the `ADMIN_PASSWORD` variable in `.env.local` (locally) or in your Vercel Project Settings (for production):
```ini
ADMIN_PASSWORD=NewSecretPassword2027!
```
Restart the server (or redeploy on Vercel) for the change to take immediate effect.

---

## How to View Submissions (Admin Access)
1. Navigate to `/admin/login`.
2. Enter your `ADMIN_PASSWORD`.
3. In the dashboard (`/admin`), you can:
   - View submissions, search by name/phone/form number, and filter by Category / Status.
   - Click any Form No to view the full student profile and passport photo.
   - Click **Print Paper Form** on the detail page to print or export the physical admission form.
   - Click **Export CSV** on the dashboard to download records for spreadsheet management.

---

## Deployment on Vercel

1. Push your repository to GitHub / GitLab / Bitbucket.
2. Go to [Vercel Dashboard](https://vercel.com/new) and **Import** the repository.
3. In the **Environment Variables** section of the Vercel project configuration, add all variables from `.env.local`:
   - `DATABASE_URL`
   - `DATABASE_URL_UNPOOLED`
   - `NEON_BRANCH`
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_ENDPOINT_URL_S3`
   - `AWS_REGION`
   - `ASSETS_BUCKET`
   - `ADMIN_PASSWORD`
   - `SESSION_SECRET`
   - `ADMISSION_LAST_DATE`
4. Click **Deploy**. Vercel will automatically build and deploy the Next.js serverless application.
