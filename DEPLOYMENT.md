# Deployment Guide

## Deploy to Cloudflare Pages

Since `wrangler.toml` is not pushed to git (it contains your database ID), you need to configure the D1 binding through the Cloudflare dashboard.

### Option 1: Deploy via Dashboard (Recommended)

1. **Push to GitHub:**
   ```bash
   # If you haven't already, create a GitHub repo and push
   git remote add origin https://github.com/yourusername/khaata.git
   git branch -M main
   git push -u origin main
   ```

2. **Connect to Cloudflare Pages:**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Workers & Pages → Create application → Pages
   - Connect to Git → Select your repository
   - Click "Begin setup"

3. **Build Settings:**
   - Project name: `khaata`
   - Production branch: `main`
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Click "Save and Deploy"

4. **Configure D1 Binding (IMPORTANT):**
   - After first deployment, go to: Settings → Functions
   - Scroll to "D1 database bindings"
   - Click "Add binding"
   - Variable name: `DB`
   - D1 database: Select `khaata` (your database)
   - Click "Save"

5. **Configure Environment Variables (Optional):**
   - Settings → Environment variables
   - Add variable:
     - Name: `DISABLE_SIGNUPS`
     - Value: `false` (or `true` to disable signups)
   - Click "Save"

6. **Redeploy:**
   - Go to Deployments tab
   - Click "Retry deployment" on the latest deployment
   - Or push a new commit to trigger deployment

### Option 2: Direct Deploy (Advanced)

If you want to deploy directly without GitHub:

1. **Create a temporary wrangler config for deployment:**
   ```bash
   cp wrangler.toml wrangler.pages.toml
   ```

2. **Deploy:**
   ```bash
   wrangler pages deploy dist --project-name=khaata
   ```

3. **Configure D1 binding via CLI:**
   ```bash
   wrangler pages project create khaata --production-branch=main
   ```

   Then add D1 binding through dashboard (see Option 1, step 4).

### After Deployment

Your app will be available at:
- Production: `https://khaata.pages.dev`
- Or your custom domain if configured

### Initialize Production Database

If this is your first deployment, initialize the remote database:

```bash
wrangler d1 execute khaata --file=./db/schema.sql --remote
```

### Troubleshooting

**Issue: API routes return 404**
- Make sure D1 binding is configured (Settings → Functions → D1 database bindings)
- Variable name must be exactly `DB`
- Redeploy after adding binding

**Issue: 500 errors on signup**
- Initialize the remote database (see command above)
- Check D1 binding is correct

**Issue: Environment variables not working**
- Make sure they're set in Settings → Environment variables
- Redeploy after adding variables

### Update Deployment

To deploy updates:

**Via GitHub:**
```bash
git add .
git commit -m "Update message"
git push
```

**Direct deploy:**
```bash
npm run build
wrangler pages deploy dist --project-name=khaata
```

### Custom Domain

1. Go to your Pages project → Custom domains
2. Click "Set up a custom domain"
3. Enter your domain
4. Follow DNS configuration instructions

## Production Checklist

- [ ] D1 database binding configured (`DB`)
- [ ] Remote database initialized with schema
- [ ] Environment variables set (if needed)
- [ ] Custom domain configured (optional)
- [ ] Test signup/signin
- [ ] Test AI features (configure in Settings)
- [ ] Test all CRUD operations

## Monitoring

- **Logs:** Cloudflare Dashboard → Your Pages project → Functions → Logs
- **Analytics:** Your Pages project → Analytics
- **D1 Database:** Workers & Pages → D1 → khaata

## Costs

Cloudflare Free Tier:
- 5GB D1 storage
- 5M reads/day
- 100K writes/day
- 100K Pages Functions requests/day
- Unlimited bandwidth

Perfect for personal use!
