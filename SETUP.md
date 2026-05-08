# Khaata Setup Guide

## Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Initialize Local Database

Wrangler uses a **local D1 database** for development. Initialize it:

```bash
wrangler d1 execute khaata --file=./db/schema.sql --local
```

This creates tables in `.wrangler/state/v3/d1/` for local development.

### 3. Configure Environment Variables (Optional)

The `.dev.vars` file already exists. Edit if you want to disable signups:
```
DISABLE_SIGNUPS=false
```

### 4. Build and Start Development Server

```bash
# Build the frontend
npm run build

# Start the dev server (uses local D1 database)
npm run dev
```

Open http://localhost:5173

**For active development with auto-rebuild:**

Terminal 1 - Watch mode (rebuilds on file changes):
```bash
npm run build:watch
```

Terminal 2 - Dev server:
```bash
npm run dev
```

### How It Works

- `npm run dev` runs wrangler pages dev which:
  - Serves your built app from `dist/`
  - Provides Cloudflare Pages Functions (API routes)
  - Connects to your **local D1 database** (in `.wrangler/state/`)
  - Enables live reload when files change

- `npm run build:watch` rebuilds automatically when you edit source files

**Local vs Remote Database:**
- **Local** (`--local`): Used during development, stored in `.wrangler/state/`
- **Remote** (`--remote`): Production database on Cloudflare
- They are completely separate - changes in local don't affect production

## Authentication

Session-based authentication with Cloudflare D1:
- Passwords hashed with SHA-256
- HTTP-only secure cookies
- 30-day session expiry

### Disable New Signups

Edit `.dev.vars` file:
```
DISABLE_SIGNUPS=true
```

For production, update in Cloudflare Pages dashboard:
- Settings → Environment variables
- `DISABLE_SIGNUPS` = `true`

## AI Configuration

Users configure AI in Settings page:
- Google Gemini (free tier)
- Custom OpenAI-compatible API

API keys encrypted and stored in D1 database with AES-256-GCM.

## Deployment

### GitHub + Cloudflare Pages

1. Push code to GitHub
2. Cloudflare Dashboard → Workers & Pages → Create application → Pages
3. Connect repository
4. Build settings:
   - Build command: `npm run build`
   - Build output: `dist`
5. Settings → Functions → D1 database bindings:
   - Variable name: `DB`
   - D1 database: Select your database
6. (Optional) Settings → Environment variables:
   - `DISABLE_SIGNUPS` = `true`

### Direct Deploy

```bash
npm run build
wrangler pages deploy dist
```

## Database Management

### Local Database (Development)

```bash
# View tables
wrangler d1 execute khaata --command "SELECT name FROM sqlite_master WHERE type='table'" --local

# View users
wrangler d1 execute khaata --command "SELECT id, email FROM users" --local

# View transactions
wrangler d1 execute khaata --command "SELECT COUNT(*) FROM transactions" --local

# Reset local database
wrangler d1 execute khaata --file=./db/schema.sql --local
```

### Remote Database (Production)

```bash
# View users
wrangler d1 execute khaata --command "SELECT id, email, created_at FROM users" --remote

# View transactions
wrangler d1 execute khaata --command "SELECT COUNT(*) as total FROM transactions" --remote

# Backup
wrangler d1 export khaata --output backup.sql --remote

# Restore
wrangler d1 execute khaata --file=backup.sql --remote
```

## Troubleshooting

### "Cannot find module" errors
Run `npm install` to ensure all dependencies are installed.

### API routes return 500 errors: "no such table: users"

**This means the local database isn't initialized.**

**Solution:**
```bash
wrangler d1 execute khaata --file=./db/schema.sql --local
```

Then restart the dev server:
```bash
npm run build
npm run dev
```

### API routes return 404 errors

**Solution:**
1. Make sure you've built the project: `npm run build`
2. Start the dev server: `npm run dev`
3. Check terminal output for errors

**Verify wrangler is running correctly:**
```bash
# You should see:
Your worker has access to the following bindings:
- D1 Databases:
  - DB: khaata (c0c4a1c2-0f46-40e9-83e1-906fbcb4630d)
[wrangler:inf] Ready on http://localhost:5173
```

### Changes not showing up

You need to rebuild after editing source files:
```bash
npm run build
```

Or use watch mode in a separate terminal:
```bash
npm run build:watch
```

### Want to use remote database for development?

By default, wrangler uses the local database. If you want to test against production data:

1. Add `--remote` flag to wrangler command (not recommended for development)
2. Or manually configure in `wrangler.toml` (advanced)

**Note:** Using remote database for development can affect production users. Use local database for safety.

## Cost

Cloudflare Free Tier:
- 5GB D1 storage
- 5M reads/day
- 100K writes/day
- 100K Pages Functions requests/day

## Support

For user guide and feature documentation, see [README.md](README.md)
