# Quickstart: Gamified Job Application Tracker

**Branch**: `001-gamified-job-tracker` | **Date**: 2025-03-25
**Purpose**: Get the development environment running and verify core functionality

## Prerequisites

- Node.js 20 LTS or later
- npm 10 or later (or pnpm/yarn)
- Git
- Azure account with Blob Storage access
- Neon account for PostgreSQL

## Environment Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd job-tracker-saas
npm install
```

### 2. Environment Variables

Create `.env.local` from template:

```bash
cp .env.example .env.local
```

Configure the following variables:

```env
# Database (Neon)
DATABASE_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require"

# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net"
AZURE_STORAGE_CONTAINER_NAME="resumes"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Optional: Development
NODE_ENV="development"
```

### 3. Database Setup

Run Drizzle migrations:

```bash
# Generate migrations from schema
npm run db:generate

# Apply migrations to database
npm run db:push

# Seed initial data (quests, rewards)
npm run db:seed
```

### 4. Azure Blob Storage Setup

Create the container for resume uploads:

```bash
# Via Azure CLI
az storage container create --name resumes --account-name <your-account>
```

Or create via Azure Portal:
1. Navigate to Storage Account → Containers
2. Create container named "resumes"
3. Set access level to "Private"

### 5. Start Development Server

```bash
npm run dev
```

Application available at: http://localhost:3000

## Verification Steps

### Step 1: Landing Page Loads

1. Navigate to http://localhost:3000
2. Verify the 8-bit styled landing page displays
3. Check light/dark mode toggle works

**Expected**: Landing page with retro pixel styling, registration/login buttons visible.

### Step 2: User Registration

1. Click "Register" or navigate to /register
2. Fill in:
   - Email: `test@example.com`
   - Password: `password123`
   - Name: `Test User`
3. Submit form

**Expected**: Account created, redirected to dashboard.

### Step 3: Create Job Application

1. From dashboard, click "Add Application"
2. Fill in:
   - Job Title: `Software Engineer`
   - Company: `Acme Corp`
   - Date Applied: Today
3. Submit

**Expected**:
- Application appears in list
- XP notification shows (+25 XP)
- Quest progress may update

### Step 4: Upload Resume

1. Navigate to Resumes section
2. Click "Upload Resume"
3. Select a PDF file (< 10MB)
4. Wait for upload to complete

**Expected**:
- Resume appears in library
- XP notification shows (+15 XP)
- File accessible via download link

### Step 5: Update Application Status

1. Click on the created application
2. Change status from "Applied" to "Phone Screen"
3. Save changes

**Expected**:
- Status updates immediately
- Status history shows entry with timestamp
- XP notification shows (+10 XP)

### Step 6: View XP and Level

1. Navigate to Profile section
2. Check XP progress bar

**Expected**:
- Total XP: 50 (25 + 15 + 10)
- Level: 1 (assuming level 2 at 100 XP)
- Progress bar shows 50/100

### Step 7: Dark Mode Toggle

1. Click theme toggle in header
2. Verify all components update

**Expected**:
- Background changes to dark
- Text colors invert appropriately
- 8-bit styling preserved

## Common Issues

### Database Connection Failed

**Error**: `Connection refused` or `SSL required`

**Solution**:
1. Verify `DATABASE_URL` is correct
2. Ensure `?sslmode=require` is in connection string
3. Check Neon dashboard for connection limits

### Azure Upload Failed

**Error**: `403 Forbidden` or `Container not found`

**Solution**:
1. Verify `AZURE_STORAGE_CONNECTION_STRING` is correct
2. Ensure container "resumes" exists
3. Check CORS settings allow localhost

### NextAuth Session Issues

**Error**: `CSRF token mismatch` or session not persisting

**Solution**:
1. Ensure `NEXTAUTH_SECRET` is set
2. Verify `NEXTAUTH_URL` matches your URL
3. Clear browser cookies and retry

## NPM Scripts Reference

| Script | Description |
|--------|-------------|
| `dev` | Start development server |
| `build` | Build for production |
| `start` | Start production server |
| `lint` | Run ESLint |
| `test` | Run Vitest unit tests |
| `test:e2e` | Run Playwright e2e tests |
| `db:generate` | Generate Drizzle migrations |
| `db:push` | Apply migrations to database |
| `db:seed` | Seed initial data |
| `db:studio` | Open Drizzle Studio (DB viewer) |

## Next Steps

After verifying the quickstart:

1. Review [data-model.md](./data-model.md) for schema details
2. Review [contracts/](./contracts/) for API specifications
3. Run `/speckit.tasks` to generate implementation tasks
