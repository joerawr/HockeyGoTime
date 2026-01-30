# Email-Based Feedback Implementation Plan

## Objective
Implement a simple "Report Issue" button that sends user feedback directly to email using Resend. This is a privacy-first, lightweight alternative to GitHub Issues with no screenshot support.

## Before You Start

**YOU NEED TO CREATE A RESEND ACCOUNT FIRST!**

1. Go to https://resend.com
2. Click **"Sign up with GitHub"** (recommended - fastest, no password needed)
   - **Alternative**: Use Google or email if you prefer
3. Free tier: 3,000 emails/month (100/day) - no credit card required
4. After signup, go to **API Keys** in the left sidebar
5. Click **"Create API Key"**
6. Name: "HockeyGoTime Feedback"
7. Permission: "Sending access" (default)
8. Domain: "All domains" (default)
9. Click **"Add"**
10. **Copy the key** (starts with `re_...`) - you can only see this once!
11. Save it somewhere safe - you'll paste it into `.env.local` in step 3

**⚠️ Do this BEFORE running any code!**

## Privacy Principles
- ✅ NO automatic browser/device fingerprinting
- ✅ NO tracking or analytics
- ✅ Only collect what users explicitly provide
- ✅ Be transparent about what data is sent
- ✅ Align with existing privacy policy

## Implementation Tasks

**Recommended Order**: Follow steps 1-10 in sequence for smoothest implementation.

### 1. Install Dependencies

```bash
pnpm add resend
pnpm dlx shadcn@latest add dialog
pnpm dlx shadcn@latest add sonner
```

### 2. Setup Resend Account (SKIP IF ALREADY DONE ABOVE)

If you didn't create your Resend account yet, do it now:

1. Sign up at https://resend.com
2. Free tier: 3,000 emails/month (100/day limit)
3. Go to API Keys → Create API Key
4. Name it "HockeyGoTime Feedback"
5. Copy key (starts with `re_...`)
6. **Keep this key safe** - you'll paste it in `.env.local` in the next step

### 3. Add Environment Variables

**File**: `.env.local` (add these)
```bash
RESEND_API_KEY=re_xxx
FEEDBACK_EMAIL=your-email@gmail.com
```

**File**: `.env.example` (document for others)
```bash
# Resend API for feedback emails (https://resend.com)
RESEND_API_KEY=re_xxx
FEEDBACK_EMAIL=your-email@example.com
```

### 4. Create Type Definitions

**File**: `types/feedback.ts` (create new)
```typescript
export interface FeedbackSubmission {
  message: string;
  email?: string;
  userPrefs?: {
    team?: string;
    division?: string;
    season?: string;
    mcpServer?: string;
  };
}

export interface FeedbackResponse {
  success: boolean;
  error?: string;
}
```

### 5. Create API Endpoint

**File**: `app/api/feedback/route.ts` (create new)
```typescript
import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import type { FeedbackSubmission } from '@/types/feedback';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body: FeedbackSubmission = await request.json();
    const { message, email, userPrefs } = body;

    // Validate required fields
    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    // Build email content (NO browser/device fingerprinting)
    const emailText = `
📝 New Feedback from HockeyGoTime

Message:
${message}

---
Contact Info:
${email ? `Email: ${email}` : 'Email: Not provided'}

User Context (from saved preferences):
${userPrefs?.team ? `Team: ${userPrefs.team}` : 'Team: Not saved'}
${userPrefs?.division ? `Division: ${userPrefs.division}` : 'Division: Not saved'}
${userPrefs?.season ? `Season: ${userPrefs.season}` : 'Season: Not saved'}
${userPrefs?.mcpServer ? `League: ${userPrefs.mcpServer.toUpperCase()}` : 'League: Not saved'}

Submitted: ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })}
    `.trim();

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'HockeyGoTime Feedback <onboarding@resend.dev>',
      to: process.env.FEEDBACK_EMAIL!,
      subject: '🏒 HockeyGoTime User Feedback',
      text: emailText,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to send email' },
        { status: 500 }
      );
    }

    console.log('Feedback email sent:', data?.id);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 6. Create Feedback Components

**File**: `components/ui/feedback/FeedbackButton.tsx` (create new)
```typescript
'use client';

import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeedbackModal } from './FeedbackModal';

export function FeedbackButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        size="default"
        className="gap-2 transition-transform hover:scale-105"
        aria-label="Report an issue or provide feedback"
      >
        <MessageSquare className="h-4 w-4" />
        <span className="hidden sm:inline">Report Issue</span>
      </Button>
      <FeedbackModal open={open} onOpenChange={setOpen} />
    </>
  );
}
```

**File**: `components/ui/feedback/FeedbackModal.tsx` (create new)
```typescript
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { PreferencesStore } from '@/lib/storage/preferences';
import type { FeedbackSubmission } from '@/types/feedback';

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackModal({ open, onOpenChange }: FeedbackModalProps) {
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      toast.error('Please describe the issue');
      return;
    }

    setIsSubmitting(true);

    try {
      // Auto-capture user preferences (privacy-respecting)
      const userPrefs = PreferencesStore.get();

      const feedbackData: FeedbackSubmission = {
        message,
        email: email || undefined,
        userPrefs: userPrefs
          ? {
              team: userPrefs.team,
              division: userPrefs.division,
              season: userPrefs.season,
              mcpServer: userPrefs.mcpServer,
            }
          : undefined,
      };

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Thanks! Your feedback has been sent.');
        setMessage('');
        setEmail('');
        onOpenChange(false);
      } else {
        throw new Error(result.error || 'Failed to send feedback');
      }
    } catch (error) {
      console.error('Feedback submission error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Report an Issue</DialogTitle>
          <DialogDescription>
            Describe the problem you encountered. We&apos;ll include your team preferences to help us reproduce the issue.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="message">
              What went wrong? <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="message"
              placeholder="Describe the issue you encountered..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              className="mt-2 min-h-[120px]"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="email">Your email (optional)</Label>
            <Input
              id="email"
              type="email"
              placeholder="your-email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2"
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              We&apos;ll only use this to follow up about your issue
            </p>
          </div>

          {/* Privacy transparency note */}
          <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            📋 What we&apos;ll send: your message, email (if provided), and saved team preferences. No browser or device tracking.
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Feedback'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

**File**: `components/ui/feedback/index.tsx` (create new)
```typescript
export { FeedbackButton } from './FeedbackButton';
export { FeedbackModal } from './FeedbackModal';
```

### 7. Add Toaster to Layout

**File**: `app/layout.tsx` (modify)

Add import at top:
```typescript
import { Toaster } from 'sonner';
```

Add `<Toaster />` before closing `</body>` tag:
```typescript
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={/* existing classes */}>
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
```

### 8. Update Main Page

**File**: `app/page.tsx` (modify)

Add import at top:
```typescript
import { FeedbackButton } from '@/components/ui/feedback';
```

Find the Ko-fi button section (around line 460-470) and modify:

**Before:**
```tsx
{/* Ko-fi donation button */}
<div className="mt-4 flex justify-center">
  <a href="https://ko-fi.com/joerawr" ...>
    <img ... />
  </a>
</div>
```

**After:**
```tsx
{/* Feedback button + Ko-fi donation */}
<div className="mt-4 flex justify-center items-center gap-3">
  <FeedbackButton />
  <a href="https://ko-fi.com/joerawr" ...>
    <img ... />
  </a>
</div>
```

### 9. Update Privacy Policy

**File**: `app/privacy/page.tsx` (modify)

Add new section before "Questions?" section (around line 98):

```tsx
<section className="mb-8">
  <h2 className="text-2xl font-semibold mb-4">Feedback Submissions</h2>
  <p className="mb-4">
    If you submit feedback via the &quot;Report Issue&quot; button, we collect:
  </p>
  <ul className="list-disc pl-6 mb-4 space-y-2">
    <li>Your feedback message (required)</li>
    <li>Your email address (optional, only if you provide it)</li>
    <li>Your saved team preferences (team, division, season, league)</li>
  </ul>
  <p className="text-muted-foreground mb-4">
    We do <strong>not</strong> automatically collect browser type, device information,
    IP addresses, or any tracking identifiers. This feedback is sent directly to
    the developer&apos;s email and is not stored in any database.
  </p>
  <p className="text-muted-foreground">
    Your email address (if provided) is only used to follow up about your specific
    issue and is never shared with third parties.
  </p>
</section>
```

### 10. Add Vercel Environment Variables

In Vercel Dashboard:
1. Go to your project → Settings → Environment Variables
2. Add `RESEND_API_KEY` with your API key
3. Add `FEEDBACK_EMAIL` with your email address
4. Apply to: Production, Preview, Development
5. Redeploy (Vercel auto-deploys on env var changes)

## Testing Checklist

### Local Testing
- [ ] Run `pnpm add resend` to install dependency
- [ ] Install shadcn components: `pnpm dlx shadcn@latest add dialog sonner`
- [ ] Add `RESEND_API_KEY` and `FEEDBACK_EMAIL` to `.env.local`
- [ ] Run `pnpm dev`
- [ ] Click "Report Issue" button → Modal opens
- [ ] Submit empty form → Error toast appears
- [ ] Submit with message only → Success toast, modal closes
- [ ] Submit with message + email → Success toast, modal closes
- [ ] Check your Gmail inbox → Feedback email received
- [ ] Verify email contains: message, email (or "Not provided"), team preferences
- [ ] Verify NO browser/device info in email

### Edge Cases
- [ ] Submit without saved preferences → Email shows "Not saved" for team/division
- [ ] Submit with all preferences saved → Email includes team/division/season/league
- [ ] Close modal without submitting → No email sent
- [ ] Rapid click submit button → Only one request sent (disabled state works)
- [ ] Network error (disconnect wifi) → Error toast shows

### Mobile Testing
- [ ] Test on iOS Safari → Modal opens, form submits
- [ ] Test on Android Chrome → Modal opens, form submits
- [ ] Verify button shows icon only on mobile (text hidden)
- [ ] Verify buttons stack properly on small screens

### Production Testing
- [ ] Deploy to Vercel
- [ ] Verify env vars set in Vercel dashboard
- [ ] Test feedback form on live site
- [ ] Verify email arrives (check spam folder)
- [ ] Run TypeScript check: `pnpm tsc --noEmit`

## File Structure

```
components/ui/feedback/
  ├── FeedbackButton.tsx      (new)
  ├── FeedbackModal.tsx       (new)
  └── index.tsx               (new)

app/api/feedback/
  └── route.ts                (new)

types/
  └── feedback.ts             (new)

app/
  ├── page.tsx                (modify - add button)
  ├── layout.tsx              (modify - add Toaster)
  └── privacy/
      └── page.tsx            (modify - add feedback section)

.env.local                    (add RESEND_API_KEY, FEEDBACK_EMAIL)
.env.example                  (document env vars)
```

## Expected Email Format

```
From: HockeyGoTime Feedback <onboarding@resend.dev>
To: your-email@gmail.com
Subject: 🏒 HockeyGoTime User Feedback

📝 New Feedback from HockeyGoTime

Message:
The schedule isn't showing my team's next game. It skipped from Oct 18 to Nov 5.

---
Contact Info:
Email: parent@example.com

User Context (from saved preferences):
Team: Jr. Kings (1)
Division: 14U B
Season: 2025/2026
League: SCAHA

Submitted: 10/25/2025, 2:30:15 PM
```

## Privacy Compliance Checklist

- [ ] NO automatic collection of navigator.userAgent
- [ ] NO automatic collection of screen size/resolution
- [ ] NO automatic collection of IP addresses
- [ ] NO tracking cookies or analytics
- [ ] Only collect data user explicitly provides (message, email)
- [ ] Only collect data user already saved (team preferences)
- [ ] Privacy policy updated to reflect feedback collection
- [ ] Transparency note in modal about what data is sent

## Troubleshooting

**Email not arriving?**
1. Check spam folder
2. Verify `RESEND_API_KEY` is correct in env vars
3. Check Resend dashboard → Logs for delivery status
4. Verify `FEEDBACK_EMAIL` is correct

**API returning 500 error?**
1. Check server logs in terminal
2. Verify Resend package installed: `pnpm list resend`
3. Check API key is valid in Resend dashboard

**Toast not showing?**
1. Verify `Toaster` component added to `layout.tsx`
2. Check sonner installed: `pnpm dlx shadcn@latest add sonner`

## Post-Implementation Tasks

### Organize Feedback in Gmail
1. Create Gmail filter for emails from `onboarding@resend.dev`
2. Apply label: "HGT Feedback"
3. Star important feedback
4. Archive once resolved

### Monitor Resend Usage
- Check Resend dashboard for delivery stats
- Free tier: 3,000 emails/month (plenty for feedback)
- Monitor bounce rate

## Success Criteria

- [ ] Users can submit feedback in 30 seconds
- [ ] Email arrives in developer inbox within 1 minute
- [ ] No browser/device fingerprinting data collected
- [ ] Privacy policy accurately reflects data collection
- [ ] TypeScript compiles with no errors
- [ ] Works on desktop and mobile browsers
- [ ] Aligned with privacy-first philosophy

## Implementation Order Summary

**Do these steps in order:**

1. ✅ **Create Resend account** (see "Before You Start" section)
2. ✅ **Copy API key** from Resend dashboard
3. ✅ **Install dependencies** (step 1)
4. ✅ **Add env vars to `.env.local`** (step 3) - paste your Resend API key here
5. ✅ **Create files** (steps 4-6): types → API route → components
6. ✅ **Modify files** (steps 7-9): layout → main page → privacy page
7. ✅ **Test locally** (use testing checklist)
8. ✅ **Deploy to Vercel** (add env vars to Vercel dashboard)
9. ✅ **Test production** (submit real feedback)

## Estimated Implementation Time

**Total: 15-20 minutes** (after Resend account is created)
- Dependencies & setup: 5 min
- Create components: 5 min
- Update pages: 3 min
- Update privacy policy: 2 min
- Testing: 5 min

## Quick Start Commands

```bash
# 1. Install dependencies
pnpm add resend
pnpm dlx shadcn@latest add dialog
pnpm dlx shadcn@latest add sonner

# 2. Create .env.local (paste your Resend API key)
echo "RESEND_API_KEY=re_your_key_here" >> .env.local
echo "FEEDBACK_EMAIL=your-email@gmail.com" >> .env.local

# 3. Run dev server to test
pnpm dev

# 4. After implementation, check for TypeScript errors
pnpm tsc --noEmit
```

## Notes

- This is a **privacy-first** implementation
- No screenshots = simpler UX, faster implementation
- Can upgrade to GitHub Issues later if needed
- Email approach gets feedback flowing immediately
- Maintains trust with users through transparency
- **You must create a Resend account BEFORE coding** (see "Before You Start")
