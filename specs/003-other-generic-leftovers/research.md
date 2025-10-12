# Research: Replace Generic Placeholder Content

**Feature**: 003-other-generic-leftovers
**Phase**: 0 (Research & Content Creation)
**Date**: 2025-10-09

## R1: Privacy Policy Content

### Decision
Create a transparent privacy policy that accurately reflects HockeyGoTime's client-side-only architecture with no user data collection or server-side storage.

### Rationale
- HockeyGoTime stores all user preferences in localStorage (client-side only)
- No user accounts, authentication, or server-side user data storage
- OpenAI API processes chat queries but HockeyGoTime doesn't store conversations
- SCAHA schedule data is public information fetched in real-time via MCP server
- Transparency builds trust with hockey parents concerned about youth data privacy

### Privacy Policy Draft

**Section 1: Information We Collect**

We do not collect or store any personal information. HockeyGoTime operates entirely in your browser with no user accounts or server-side data storage.

**What happens in your browser:**
- Your optional preferences (favorite team, division, season) are stored locally on your device using browser localStorage
- These preferences never leave your device and are not transmitted to our servers
- You can clear these preferences at any time using the "Clear All" button

**Section 2: How We Use Your Information**

Since we don't collect personal information, there's nothing to use or share. However, to provide schedule information, the application:

- Sends your schedule queries to OpenAI's API for natural language processing
- Fetches SCAHA schedule data from public sources via our MCP server
- Processes everything in real-time without storing your queries or conversations

**Section 3: Third-Party Services**

HockeyGoTime uses the following third-party services:

- **OpenAI API**: Processes your natural language queries to understand what schedule information you're looking for. OpenAI's data usage is governed by their [privacy policy](https://openai.com/policies/privacy-policy) and [API data usage policies](https://openai.com/policies/api-data-usage-policies)
- **SCAHA.net**: Public hockey schedule data is fetched from the Southern California Amateur Hockey Association website
- **Vercel**: Hosts the HockeyGoTime application

**Section 4: Data Security**

Your browser preferences are stored locally on your device using standard browser localStorage. We implement appropriate security measures for our application infrastructure, but since we don't collect personal data, there's no user data to protect on our servers.

**Section 5: Children's Privacy**

While HockeyGoTime is designed for youth hockey families, we do not knowingly collect any information from children or adults. The application functions entirely in your browser without user accounts or data collection.

**Section 6: Changes to This Policy**

We may update this privacy policy from time to time. The "Last updated" date at the top of the page reflects the most recent revision.

**Section 7: Contact Us**

If you have questions about this privacy policy, please visit our About page for contact information.

---

### Alternatives Considered

**Alternative A: Generic "We collect minimal data" policy**
- Rejected because it's vague and doesn't accurately describe localStorage-only architecture
- Could mislead users into thinking we collect *some* data

**Alternative B: No privacy policy page**
- Rejected because transparency is important, especially for youth sports applications
- Having a clear "we don't collect data" policy builds trust

**Alternative C: Link to OpenAI privacy policy only**
- Rejected because users deserve clarity about HockeyGoTime's specific practices
- OpenAI's policy doesn't cover localStorage usage or our architecture

## R2: About Page Content

### Decision
Write a concise, parent-friendly explanation of HockeyGoTime's purpose as a conversational AI for SCAHA hockey schedules.

### Rationale
- Hockey parents are busy and need quick understanding of what the app does
- Emphasize natural language convenience (no complex searches)
- Highlight SCAHA-specific focus (not generic sports app)
- Avoid technical jargon (AI, MCP, etc.) - focus on user benefits
- Keep it brief (1-3 paragraphs) for scanability

### About Page Draft

**Title**: About HockeyGoTime

**Content**:

HockeyGoTime is a conversational assistant designed specifically for SCAHA (Southern California Amateur Hockey Association) hockey families. We help parents and players quickly find game schedules, opponents, venue information, and more—all through simple, natural language questions.

**How it works**: Just ask questions like "When does 14B Jr Kings play next?" or "Who are the Jr Kings playing on Saturday?" and get instant answers. No need to navigate complex schedule grids or remember exact team names—HockeyGoTime understands hockey parent language.

**No signup required**: Everything works right in your browser. Your preferences (favorite team, division) are stored locally on your device for convenience, but there are no accounts to create or passwords to remember.

**Built by a hockey parent**: HockeyGoTime was created to solve a real problem—keeping track of busy hockey schedules while juggling work, carpools, and game day logistics. We hope it makes your hockey season a little easier.

---

### Alternatives Considered

**Alternative A: Technical explanation (mention AI, MCP, etc.)**
- Rejected because hockey parents don't need to know implementation details
- Focus should be on benefits, not technology

**Alternative B: Detailed feature list**
- Rejected because it's too long and feature-focused rather than problem/solution focused
- Better to keep it concise and conversational

**Alternative C: Corporate/formal tone**
- Rejected because hockey parents respond better to friendly, relatable tone
- "Built by a hockey parent" humanizes the product

## R3: Favicon Generation Best Practices

### Decision
Generate a multi-resolution favicon.ico file (16x16, 32x32, 48x48) from the existing HockeyGoTime logo PNG using an online conversion tool or ImageMagick.

### Rationale
- Next.js 15 automatically serves `app/favicon.ico` without configuration
- ICO format supports multiple resolutions for different contexts
- Modern browsers primarily use 16x16 and 32x32 sizes
- No need for Apple touch icons or PWA icons (not in MVP scope)

### Favicon Strategy

**Step 1: Source File**
- Use existing `public/hgt-logo.png` (1052x400px)
- Logo has good contrast (blue/white on black) suitable for small sizes

**Step 2: Conversion Approach**

**Option A: Online Conversion Tool (Recommended)**
- Use https://favicon.io/favicon-converter/ or https://realfavicongenerator.net/
- Upload `public/hgt-logo.png`
- Generate multi-resolution ICO file
- Download and place in `app/favicon.ico`

**Option B: ImageMagick (Command Line)**
```bash
# Resize to multiple sizes and combine into ICO
convert public/hgt-logo.png -resize 16x16 -background transparent -gravity center -extent 16x16 favicon-16.png
convert public/hgt-logo.png -resize 32x32 -background transparent -gravity center -extent 32x32 favicon-32.png
convert public/hgt-logo.png -resize 48x48 -background transparent -gravity center -extent 48x48 favicon-48.png
convert favicon-16.png favicon-32.png favicon-48.png app/favicon.ico
rm favicon-16.png favicon-32.png favicon-48.png
```

**Option C: Next.js Metadata API (Future Enhancement)**
- Create `app/icon.png` or `app/icon.svg` instead of `favicon.ico`
- Next.js automatically optimizes and serves
- Better for PWA support
- Deferred to post-MVP (simpler to use ICO for now)

**Step 3: Verification**
- Test in Chrome, Firefox, Safari, Edge
- Clear browser cache (Cmd+Shift+R / Ctrl+Shift+R) to force reload
- Check tab icon displays correctly
- Verify no console errors about missing favicon

### Tool Recommendation
**Primary**: Use https://favicon.io/favicon-converter/ for simplicity (no local tools required)

**Backup**: Use ImageMagick if available on local system

### Alternatives Considered

**Alternative A: Use PNG favicon instead of ICO**
- Rejected because ICO format has better browser compatibility
- ICO supports multiple resolutions in one file (better quality across contexts)

**Alternative B: Generate full icon suite (16x16, 32x32, 180x180, 192x192, 512x512)**
- Rejected because it's overkill for MVP
- Can add Apple touch icons and PWA icons post-MVP if needed

**Alternative C: Use SVG favicon**
- Rejected because SVG favicon support is still inconsistent across browsers
- ICO is more universally supported

## R4: Vercel Deployment Verification

### Decision
No special Vercel configuration needed. Next.js 15 automatically serves `app/favicon.ico` and static pages deploy without additional setup.

### Rationale
- Vercel automatically detects and deploys Next.js App Router applications
- `app/favicon.ico` is part of App Router convention (no `public/` needed)
- Static page changes (`app/about/page.tsx`, `app/privacy/page.tsx`) deploy automatically
- Deleted files from `public/` are removed from deployment

### Deployment Notes

**Automatic Handling by Vercel:**
- ✅ `app/favicon.ico` automatically served at `/favicon.ico`
- ✅ Static pages rebuild automatically on deployment
- ✅ Deleted `public/` assets are removed from CDN

**Caching Considerations:**
- ⚠️ **Favicon caching**: Browsers aggressively cache favicons
  - Users may need hard refresh (Cmd+Shift+R / Ctrl+Shift+R) to see new icon
  - Favicon cache can persist even after clearing browser cache
  - Not a deployment issue—this is normal browser behavior
- ✅ **Page content caching**: Vercel automatically invalidates on deployment (no action needed)

**Testing Strategy:**
1. Test locally with `pnpm dev` first
2. Push to feature branch (`003-other-generic-leftovers`)
3. Vercel creates preview deployment automatically
4. Verify favicon, privacy page, and about page in preview
5. Merge to main for production deployment

**Preview Deployment Testing:**
- Vercel preview URL: `https://hockeygotime-<unique-hash>.vercel.app`
- Test favicon in preview before production
- Verify no broken links or missing assets

### Alternatives Considered

**Alternative A: Use Vercel Image Optimization for favicon**
- Rejected because favicon.ico doesn't need image optimization
- ICO files are already optimized for small sizes

**Alternative B: Add cache-busting query string to favicon URL**
- Rejected because it's unnecessary complexity
- Hard refresh handles cache issues adequately

**Alternative C: Use custom Next.js metadata API config**
- Rejected for MVP simplicity
- Standard `app/favicon.ico` convention is simpler and sufficient

## Summary

**Phase 0 Research Complete** ✅

All research tasks completed with actionable deliverables:

1. ✅ **Privacy Policy Draft**: Ready-to-use content reflecting localStorage-only architecture
2. ✅ **About Page Draft**: Concise, parent-friendly HockeyGoTime story (4 paragraphs)
3. ✅ **Favicon Strategy**: Online conversion tool approach (favicon.io) with multi-resolution ICO output
4. ✅ **Deployment Verification**: No special Vercel configuration needed; preview deployment testing recommended

**Ready for Phase 1**: Content finalization and quickstart guide creation.
