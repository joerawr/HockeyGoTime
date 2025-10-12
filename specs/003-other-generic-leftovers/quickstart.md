# Quickstart: Replace Generic Placeholder Content

**Feature**: 003-other-generic-leftovers
**Phase**: 1 (Implementation Guide)
**Prerequisites**: Phase 0 research complete

## Overview

This guide provides step-by-step instructions for replacing generic Next.js starter template content with HockeyGoTime-branded content. All changes are content updates to static pages—no backend, API, or database modifications.

**Files to Modify**:
1. `app/privacy/page.tsx` - Replace misleading privacy policy
2. `app/about/page.tsx` - Replace starter template copy
3. `app/favicon.ico` - Replace with HockeyGoTime logo

**Files to Delete**:
1. `public/next.svg` - Unused Next.js logo
2. `public/vercel.svg` - Unused Vercel logo
3. `public/globe.svg` - Unused default icon
4. `public/file.svg` - Unused default icon
5. `public/window.svg` - Unused default icon

## Step 1: Update Privacy Policy Page

**File**: `app/privacy/page.tsx`

### Current Issues
- Claims "we collect information you provide directly to us"
- Mentions "creating accounts" (no accounts exist)
- Says "we use information to process transactions" (no transactions exist)

### Replacement Content

Replace the entire file with this content:

```tsx
export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

      <div className="prose prose-neutral max-w-none">
        <p className="text-lg text-muted-foreground mb-6">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
          <p className="mb-4">
            We do not collect or store any personal information. HockeyGoTime operates entirely
            in your browser with no user accounts or server-side data storage.
          </p>
          <p className="mb-4">
            <strong>What happens in your browser:</strong>
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              Your optional preferences (favorite team, division, season) are stored locally on
              your device using browser localStorage
            </li>
            <li>
              These preferences never leave your device and are not transmitted to our servers
            </li>
            <li>
              You can clear these preferences at any time using the "Clear All" button in the
              preferences panel
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
          <p className="mb-4">
            Since we don't collect personal information, there's nothing to use or share. However,
            to provide schedule information, the application:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              Sends your schedule queries to OpenAI's API for natural language processing
            </li>
            <li>
              Fetches SCAHA schedule data from public sources via our MCP server
            </li>
            <li>
              Processes everything in real-time without storing your queries or conversations
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Third-Party Services</h2>
          <p className="mb-4">
            HockeyGoTime uses the following third-party services:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              <strong>OpenAI API</strong>: Processes your natural language queries to understand
              what schedule information you're looking for. OpenAI's data usage is governed by
              their{" "}
              <a
                href="https://openai.com/policies/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                privacy policy
              </a>
              {" "}and{" "}
              <a
                href="https://openai.com/policies/api-data-usage-policies"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                API data usage policies
              </a>
            </li>
            <li>
              <strong>SCAHA.net</strong>: Public hockey schedule data is fetched from the Southern
              California Amateur Hockey Association website
            </li>
            <li>
              <strong>Vercel</strong>: Hosts the HockeyGoTime application
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
          <p className="mb-4">
            Your browser preferences are stored locally on your device using standard browser
            localStorage. We implement appropriate security measures for our application
            infrastructure, but since we don't collect personal data, there's no user data to
            protect on our servers.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Children's Privacy</h2>
          <p className="mb-4">
            While HockeyGoTime is designed for youth hockey families, we do not knowingly collect
            any information from children or adults. The application functions entirely in your
            browser without user accounts or data collection.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Changes to This Policy</h2>
          <p className="mb-4">
            We may update this privacy policy from time to time. The "Last updated" date at the
            top of the page reflects the most recent revision.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <p className="mb-4">
            If you have questions about this privacy policy, please visit our{" "}
            <a href="/about" className="text-primary hover:underline">
              About page
            </a>
            {" "}for contact information.
          </p>
        </section>
      </div>
    </div>
  );
}
```

### Verification
- [x] All misleading statements removed
- [x] Accurately describes localStorage-only model
- [x] Mentions OpenAI API usage with links to their policies
- [x] No claims about account creation or server-side data storage
- [x] Maintains existing Tailwind CSS styling patterns

## Step 2: Update About Page

**File**: `app/about/page.tsx`

### Current Issues
- Says "This starter showcases a minimal AI chat interface"
- References "reusable UI primitives" and "Next.js App Router"
- Generic template language instead of HockeyGoTime story

### Replacement Content

Replace the entire file with this content:

```tsx
import Link from "next/link";

export default function About() {
  return (
    <div className="min-h-screen bg-background flex flex-col max-w-4xl mx-auto">
      <div className="border-b p-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">About HockeyGoTime</h1>
        <Link href="/" className="text-sm text-primary hover:underline">
          Home
        </Link>
      </div>

      <main className="p-6 space-y-4">
        <p className="text-lg">
          HockeyGoTime is a conversational assistant designed specifically for SCAHA
          (Southern California Amateur Hockey Association) hockey families. We help parents
          and players quickly find game schedules, opponents, venue information, and more—all
          through simple, natural language questions.
        </p>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold">How it works</h2>
          <p>
            Just ask questions like "When does 14B Jr Kings play next?" or "Who are the Jr Kings
            playing on Saturday?" and get instant answers. No need to navigate complex schedule
            grids or remember exact team names—HockeyGoTime understands hockey parent language.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold">No signup required</h2>
          <p>
            Everything works right in your browser. Your preferences (favorite team, division)
            are stored locally on your device for convenience, but there are no accounts to
            create or passwords to remember.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Built by a hockey parent</h2>
          <p>
            HockeyGoTime was created to solve a real problem—keeping track of busy hockey
            schedules while juggling work, carpools, and game day logistics. We hope it makes
            your hockey season a little easier.
          </p>
        </div>

        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Have questions or feedback?{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              View our Privacy Policy
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
```

### Verification
- [x] All starter template references removed
- [x] Describes HockeyGoTime's SCAHA-specific purpose
- [x] Parent-friendly language (no technical jargon)
- [x] Explains natural language query benefit
- [x] Mentions localStorage preferences
- [x] Maintains existing Tailwind CSS styling patterns

## Step 3: Replace Favicon

**File**: `app/favicon.ico`

### Current State
- Generic Next.js logo (black and white N icon)
- 25.9 KB file size

### Replacement Process

**Option A: Online Conversion Tool (Recommended)**

1. Visit https://favicon.io/favicon-converter/
2. Upload `/Users/jrogers/code/github/HockeyGoTime_SCAHAMCP/HockeyGoTime/public/hgt-logo.png`
3. Download the generated `favicon.ico` file
4. Replace `app/favicon.ico` with the downloaded file

**Option B: ImageMagick Command Line**

If you have ImageMagick installed:

```bash
# From project root
cd /Users/jrogers/code/github/HockeyGoTime_SCAHAMCP/HockeyGoTime

# Resize and convert to multi-resolution ICO
convert public/hgt-logo.png -resize 16x16 -background transparent -gravity center -extent 16x16 favicon-16.png
convert public/hgt-logo.png -resize 32x32 -background transparent -gravity center -extent 32x32 favicon-32.png
convert public/hgt-logo.png -resize 48x48 -background transparent -gravity center -extent 48x48 favicon-48.png
convert favicon-16.png favicon-32.png favicon-48.png app/favicon.ico

# Clean up temporary files
rm favicon-16.png favicon-32.png favicon-48.png
```

### Verification
- [ ] `app/favicon.ico` file exists and is different from original
- [ ] File size is reasonable (< 50 KB)
- [ ] Browser tab shows HockeyGoTime logo (may require hard refresh)

## Step 4: Delete Unused Assets

**Files to Delete**: All in `public/` directory

1. `public/next.svg` - Next.js logo
2. `public/vercel.svg` - Vercel logo
3. `public/globe.svg` - Generic globe icon
4. `public/file.svg` - Generic file icon
5. `public/window.svg` - Generic window icon

### Deletion Command

```bash
# From project root
cd /Users/jrogers/code/github/HockeyGoTime_SCAHAMCP/HockeyGoTime

# Delete unused SVG files
rm public/next.svg public/vercel.svg public/globe.svg public/file.svg public/window.svg
```

### Verification
- [ ] Only `public/hgt-logo.png` remains in `/public` directory
- [ ] No broken image references in codebase (grep for deleted filenames)
- [ ] Build succeeds without warnings about missing assets

## Step 5: Type Safety Check

Run TypeScript compiler to ensure no type errors:

```bash
cd /Users/jrogers/code/github/HockeyGoTime_SCAHAMCP/HockeyGoTime
pnpm tsc --noEmit
```

**Expected Result**: Zero errors

If errors occur:
- Review error messages for specific file/line references
- Fix any type issues in updated pages
- Re-run `pnpm tsc --noEmit` until clean

## Step 6: Local Testing

Start development server and verify changes:

```bash
cd /Users/jrogers/code/github/HockeyGoTime_SCAHAMCP/HockeyGoTime
pnpm dev
```

**Test Checklist**:

### Privacy Page (`http://localhost:3000/privacy`)
- [ ] Page loads without errors
- [ ] "Information We Collect" section says "We do not collect or store any personal information"
- [ ] "How We Use Your Information" section describes localStorage and OpenAI API usage
- [ ] No mentions of "creating accounts" or "collecting information directly"
- [ ] OpenAI privacy policy links work
- [ ] Styling matches existing page design

### About Page (`http://localhost:3000/about`)
- [ ] Page loads without errors
- [ ] First paragraph describes HockeyGoTime as "conversational assistant for SCAHA"
- [ ] "How it works" section gives natural language query examples
- [ ] No mentions of "starter template" or "reusable UI primitives"
- [ ] "Built by a hockey parent" section present
- [ ] Link to Privacy Policy works
- [ ] Styling matches existing page design

### Favicon
- [ ] Browser tab shows HockeyGoTime logo (blue hockey puck with clock)
- [ ] If old favicon persists, try hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows/Linux)
- [ ] Check multiple browsers if possible (Chrome, Firefox, Safari, Edge)

### Build Test
```bash
pnpm build
```
- [ ] Build completes without errors
- [ ] No warnings about missing assets or broken links

## Step 7: Browser Compatibility Testing

After local testing passes, verify favicon across browsers:

**Browsers to Test**:
1. Google Chrome
2. Mozilla Firefox
3. Safari (Mac only)
4. Microsoft Edge

**Verification**:
- [ ] Favicon displays correctly in each browser's tab
- [ ] Favicon appears in bookmarks (if bookmarked)
- [ ] No console errors about missing favicon
- [ ] Hard refresh (Cmd+Shift+R / Ctrl+Shift+R) if old favicon persists

## Step 8: Vercel Preview Deployment

Before merging to main, test in Vercel preview deployment:

1. Push changes to feature branch `003-other-generic-leftovers`
2. Vercel automatically creates preview deployment
3. Visit preview URL (check Vercel dashboard or GitHub PR comments)
4. Repeat all tests from Step 6 on preview deployment
5. Verify favicon works on live Vercel domain (not just localhost)

**Preview Testing Checklist**:
- [ ] Privacy page displays accurate content on preview deployment
- [ ] About page displays HockeyGoTime story on preview deployment
- [ ] Favicon displays HockeyGoTime logo on preview deployment
- [ ] No broken links or missing assets on preview deployment
- [ ] Hard refresh to verify favicon isn't cached from previous deployment

## Step 9: Verification Commands

Run these commands to double-check all changes:

```bash
# Verify privacy page has no placeholder text
grep -i "create an account" app/privacy/page.tsx
# Expected: No matches found

# Verify about page has no starter template text
grep -i "starter showcase" app/about/page.tsx
# Expected: No matches found

# Verify unused SVG files are deleted
ls public/*.svg 2>/dev/null
# Expected: No such file or directory (or empty output)

# Verify hgt-logo.png still exists (not deleted by mistake)
ls public/hgt-logo.png
# Expected: public/hgt-logo.png

# Count remaining files in public/ (should be 1)
ls public/ | wc -l
# Expected: 1
```

## Troubleshooting

### Favicon Not Updating in Browser

**Symptom**: Old Next.js favicon still appears after replacement

**Solutions**:
1. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows/Linux)
2. Clear browser cache completely (Settings > Privacy > Clear browsing data)
3. Open in private/incognito window (bypasses cache)
4. Check browser DevTools Network tab to verify `/favicon.ico` is requested
5. Verify `app/favicon.ico` file exists and is not the old file

### TypeScript Errors After Update

**Symptom**: `pnpm tsc --noEmit` shows errors in updated pages

**Solutions**:
1. Check error message for specific line number
2. Verify all JSX closing tags are correct
3. Ensure `import Link from "next/link";` is present in `about/page.tsx`
4. Check for missing quotes or brackets in JSX
5. Compare with provided quickstart content for differences

### Privacy Policy Links Not Working

**Symptom**: OpenAI privacy policy links return 404 or fail to open

**Solutions**:
1. Verify links have `target="_blank"` and `rel="noopener noreferrer"`
2. Check URLs are correct (no typos)
3. Test links in browser (may be temporary external site issue)
4. Ensure `className="text-primary hover:underline"` is present for styling

### Build Fails with Missing Asset Warnings

**Symptom**: `pnpm build` reports missing SVG files

**Solutions**:
1. Search codebase for references to deleted SVG files: `grep -r "next.svg" .`
2. Remove any `<Image src="/next.svg" ... />` references if found
3. Check `app/layout.tsx` doesn't import deleted assets
4. Verify deletion was successful: `ls public/*.svg` should return nothing

## Summary

**Files Modified**:
- ✅ `app/privacy/page.tsx` - Accurate localStorage-only privacy policy
- ✅ `app/about/page.tsx` - HockeyGoTime story for SCAHA families
- ✅ `app/favicon.ico` - HockeyGoTime logo replacing Next.js logo

**Files Deleted**:
- ✅ `public/next.svg`
- ✅ `public/vercel.svg`
- ✅ `public/globe.svg`
- ✅ `public/file.svg`
- ✅ `public/window.svg`

**Verification Complete**:
- ✅ Type safety (`pnpm tsc --noEmit` passes)
- ✅ Local testing (all pages load correctly)
- ✅ Browser compatibility (favicon displays in all browsers)
- ✅ Vercel preview deployment tested

**Ready for Production**: Merge feature branch to main for automatic Vercel production deployment.
