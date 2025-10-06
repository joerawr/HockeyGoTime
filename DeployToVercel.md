# Deploy HockeyGoTime to Vercel - Next Steps

## Current Status

✅ **Completed:**
- SCAHA MCP published to npm as `@joerawr/scaha-mcp@1.0.0`
- HockeyGoTime updated to use STDIO transport with published package
- Fixed duplicate message rendering bug in chat UI
- All changes committed and pushed to `main` branch
- Local testing successful

🔲 **Ready to Deploy:**
- HockeyGoTime is ready for Vercel deployment
- Uses subprocess spawning (`npx @joerawr/scaha-mcp`) which Vercel supports

## Deployment Options

### Option 1: Vercel Dashboard (Recommended - Easiest)

1. **Go to Vercel:** https://vercel.com/new
2. **Import Repository:**
   - Connect your GitHub account if not already connected
   - Import: `joerawr/HockeyGoTime`
   - Vercel will auto-detect Next.js configuration
3. **Configure Project:**
   - Project Name: `hockeygotime` (or whatever you prefer)
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `pnpm build` (auto-detected)
   - Output Directory: `.next` (auto-detected)
4. **Add Environment Variable:**
   - Key: `OPENAI_API_KEY`
   - Value: `<your-openai-api-key-here>`
   - Scope: Production, Preview, Development (select all)
5. **Click Deploy**
6. **Wait for deployment** (~2-3 minutes)
7. **Test the deployment** at the provided URL

### Option 2: Vercel CLI (More Control)

```bash
# Install Vercel CLI globally
pnpm add -g vercel

# Login to Vercel
vercel login

# Deploy from project directory
cd /Users/jrogers/code/github/HockeyGoTime_SCAHAMCP/HockeyGoTime
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No (first time)
# - Project name? hockeygotime
# - Directory? ./ (default)
# - Override settings? No (use auto-detected Next.js settings)

# Add environment variable
vercel env add OPENAI_API_KEY
# Paste the value when prompted
# Select: Production, Preview, Development (all)

# Deploy to production
vercel --prod
```

## Post-Deployment Testing

Once deployed, test with these queries:

1. **Basic Schedule Query:**
   - "Who do the 14U B Jr Kings (1) play on 10/12/2025?"
   - Expected: Details about game vs Avalanche at Aliso Viejo Ice

2. **Check for Issues:**
   - No duplicate messages appearing
   - Tool calls (MCP) working correctly
   - Proper jersey color info (home/away)

3. **Check Vercel Logs:**
   - Go to Vercel Dashboard → Project → Deployments → [Latest] → Functions
   - Look for console logs:
     - "🚀 Spawning SCAHA MCP server via STDIO..."
     - "✅ SCAHA MCP client connected via STDIO"
     - "🏒 Tool called: get_schedule"
     - "🔌 Disconnecting SCAHA MCP client..."

## Troubleshooting

### If MCP Fails to Spawn

**Symptoms:** API errors, "Failed to connect to SCAHA MCP server"

**Check:**
1. Vercel function logs for subprocess errors
2. Ensure `npx` is available in Vercel Node.js environment (it should be)
3. Check that `@joerawr/scaha-mcp` is accessible from npm registry

**Fix:**
- Vercel supports subprocess spawning, so this should work
- If issues persist, check package.json for any missing dependencies

### If Puppeteer/Chrome Fails

**Symptoms:** Scraping errors, "Could not find Chrome"

**Note:** The SCAHA MCP package uses `@sparticuz/chromium` which is designed for serverless environments like Vercel. This should work out of the box.

**If it fails:**
- Check Vercel function size limits (50MB default, can increase to 250MB)
- The `@sparticuz/chromium` package is optimized for serverless

### If Build Fails

**Check:**
1. Build logs in Vercel dashboard
2. Ensure `pnpm` is being used (auto-detected from `pnpm-lock.yaml`)
3. TypeScript compilation errors

**Fix:**
- All TypeScript errors were already fixed
- Build should succeed as it does locally

## Important URLs

- **GitHub Repo:** https://github.com/joerawr/HockeyGoTime
- **Published MCP Package:** https://www.npmjs.com/package/@joerawr/scaha-mcp
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Vercel New Project:** https://vercel.com/new

## Architecture Reminder

```
User Browser
  ↓
Vercel (HockeyGoTime Next.js)
  ↓
/api/hockey-chat (API Route)
  ↓
SCAHA MCP Client (STDIO)
  ↓
npx @joerawr/scaha-mcp (spawned subprocess)
  ↓
Puppeteer → scaha.net (web scraping)
```

## Environment Variables Required

Only one is needed:

- `OPENAI_API_KEY` - Your OpenAI API key (already in `.env.local`, needs to be added to Vercel)

Optional (not currently used):
- `CHROME_EXECUTABLE_PATH` - Not needed on Vercel, `@sparticuz/chromium` handles this

## Git Status

- **Current branch:** `main`
- **Latest commit:** `c771a0c Fix duplicate message rendering in chat UI`
- **Remote:** Already pushed to GitHub
- **Ready for:** Vercel deployment

## Quick Start Tomorrow

```bash
# 1. Navigate to project
cd /Users/jrogers/code/github/HockeyGoTime_SCAHAMCP/HockeyGoTime

# 2. Choose deployment method (see options above)

# 3. Test the deployment

# 4. Celebrate! 🏒
```

## Questions to Consider

1. **Custom Domain:** Do you want to add a custom domain to the Vercel deployment?
2. **Analytics:** Enable Vercel Analytics/Speed Insights?
3. **Production URL:** Should be something like `hockeygotime.vercel.app`

---

**Last Updated:** 2025-10-05 (Evening session)
**Next Session:** Deploy to Vercel using one of the options above
