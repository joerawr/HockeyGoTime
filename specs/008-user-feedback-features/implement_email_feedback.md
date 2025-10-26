# Email-Based Feedback Implementation Plan

## Overview
Add a simple "Report Issue" button next to the Ko-fi button that sends feedback directly to your Gmail inbox using Resend email service. This is a lightweight alternative to the GitHub Issues approach—much faster to implement with no screenshot support.

## Why Email Instead of GitHub Issues?

### Pros:
- ✅ **10-minute setup** (vs 1-2 hours for GitHub)
- ✅ **Feedback in your inbox** (no need to check GitHub)
- ✅ **Only 1 dependency** (Resend package)
- ✅ **Simple, proven tech** (email always works)
- ✅ **100 free emails/day** (plenty for feedback)

### Cons:
- ❌ **No screenshot support** (text-only feedback)
- ❌ **No tracking/labels** (manual organization in Gmail)
- ❌ **No public transparency** (all private)

## Implementation Steps

### 1. Install Resend Package

```bash
pnpm add resend
```

### 2. Get Free Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Free tier: **3,000 emails/month** (100/day limit)
3. Go to **API Keys** in dashboard
4. Create new API key
5. Copy the key (starts with `re_...`)

**Note**: For testing, you can use `onboarding@resend.dev` as the sender. For production, you'll need to verify your domain (optional).

### 3. Add Environment Variables

**File**: `.env.local` (add to existing)
```bash
RESEND_API_KEY=re_...your-key-here...
FEEDBACK_EMAIL=your-email@gmail.com
```

**File**: `.env.example` (document for others)
```bash
# Resend API for feedback emails
RESEND_API_KEY=re_xxx
FEEDBACK_EMAIL=your-email@example.com
```

### 4. Install shadcn/ui Components

```bash
pnpm dlx shadcn@latest add dialog
pnpm dlx shadcn@latest add toast
```

### 5. Create Type Definitions

**File**: `types/feedback.ts`
```typescript
export interface FeedbackSubmission {
  message: string;
  email?: string;
  userPrefs?: {
    team?: string;
    division?: string;
    mcpServer?: string;
  };
}

export interface FeedbackResponse {
  success: boolean;
  error?: string;
}
```

### 6. Create API Endpoint

**File**: `app/api/feedback/route.ts`
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

    // Build email content with auto-captured context
    const emailText = `
📝 New Feedback from HockeyGoTime

Message:
${message}

---
User Details:
${email ? `Email: ${email}` : 'Email: Not provided'}
${userPrefs?.team ? `Team: ${userPrefs.team}` : ''}
${userPrefs?.division ? `Division: ${userPrefs.division}` : ''}
${userPrefs?.mcpServer ? `League: ${userPrefs.mcpServer.toUpperCase()}` : ''}

Submitted: ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })}
    `.trim();

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'HockeyGoTime Feedback <onboarding@resend.dev>', // Use your verified domain in production
      to: process.env.FEEDBACK_EMAIL!,
      subject: '🐛 HockeyGoTime User Feedback',
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

### 7. Create Feedback Components

**File**: `components/ui/feedback/FeedbackButton.tsx`
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
        size="sm"
        className="gap-2"
      >
        <MessageSquare className="h-4 w-4" />
        Report Issue
      </Button>
      <FeedbackModal open={open} onOpenChange={setOpen} />
    </>
  );
}
```

**File**: `components/ui/feedback/FeedbackModal.tsx`
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
      // Auto-capture user preferences
      const userPrefs = PreferencesStore.get();

      const feedbackData: FeedbackSubmission = {
        message,
        email: email || undefined,
        userPrefs: userPrefs
          ? {
              team: userPrefs.team,
              division: userPrefs.division,
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
            Let us know what went wrong. We'll get back to you as soon as possible.
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
              We'll only use this to follow up about your issue
            </p>
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

### 8. Add Toaster to Layout

**File**: `app/layout.tsx` (modify)
```typescript
import { Toaster } from 'sonner';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
```

**Note**: If `sonner` is not installed:
```bash
pnpm dlx shadcn@latest add sonner
```

### 9. Update Main Page

**File**: `app/page.tsx` (modify the Ko-fi section around line 52)

**Before:**
```tsx
{/* Ko-fi donation button */}
<div className="mt-4 flex justify-center">
  <a href="https://ko-fi.com/joerawr" ...>
    <img src="..." alt="Buy Me a Coffee" />
  </a>
</div>
```

**After:**
```tsx
import { FeedbackButton } from '@/components/ui/feedback/FeedbackButton';

{/* Ko-fi donation button + Feedback */}
<div className="mt-4 flex justify-center items-center gap-3">
  <FeedbackButton />
  <a href="https://ko-fi.com/joerawr" ...>
    <img src="..." alt="Buy Me a Coffee" />
  </a>
</div>
```

### 10. Add to Vercel Environment Variables

In Vercel Dashboard:
1. Go to your project → Settings → Environment Variables
2. Add `RESEND_API_KEY` with your API key
3. Add `FEEDBACK_EMAIL` with your Gmail address
4. Redeploy (Vercel auto-deploys on env var changes)

---

## File Structure

```
components/ui/feedback/
  ├── FeedbackButton.tsx      (new)
  └── FeedbackModal.tsx       (new)

app/api/feedback/
  └── route.ts                (new)

types/
  └── feedback.ts             (new)

app/
  ├── page.tsx                (modify - add button)
  └── layout.tsx              (modify - add Toaster)

.env.local                    (add RESEND_API_KEY, FEEDBACK_EMAIL)
.env.example                  (document env vars)
```

---

## Testing Checklist

### Local Testing
- [ ] Install dependencies (`pnpm add resend`)
- [ ] Add API key to `.env.local`
- [ ] Run `pnpm dev` and visit `localhost:3000`
- [ ] Click "Report Issue" button
- [ ] Fill out form (message required, email optional)
- [ ] Submit and verify toast notification appears
- [ ] Check your Gmail inbox for feedback email
- [ ] Verify email contains message and user context

### Edge Cases
- [ ] Submit without message (should show error toast)
- [ ] Submit without email (should work, email shown as "Not provided")
- [ ] Submit with no preferences saved (should work, context shown as "N/A")
- [ ] Submit with preferences saved (should include team/division/league)
- [ ] Close modal without submitting (should not send email)
- [ ] Network error handling (disconnect wifi, verify error toast)
- [ ] Rapid clicking submit button (should disable during submission)

### Mobile Testing
- [ ] Form works on mobile Safari (iOS)
- [ ] Form works on mobile Chrome (Android)
- [ ] Dialog doesn't overflow screen
- [ ] Textarea is easy to type in
- [ ] Toast notifications visible

### Production Testing
- [ ] Env vars set in Vercel dashboard
- [ ] Deploy to production
- [ ] Test form on live site
- [ ] Verify email arrives in inbox
- [ ] Check spam folder if not received

---

## Email Sample

What you'll receive in Gmail:

```
From: HockeyGoTime Feedback <onboarding@resend.dev>
To: your-email@gmail.com
Subject: 🐛 HockeyGoTime User Feedback

📝 New Feedback from HockeyGoTime

Message:
The schedule isn't showing my team's next game. It skipped from Oct 18 to Nov 5.

---
User Details:
Email: parent@example.com
Team: Jr. Kings (1)
Division: 14U B
League: SCAHA

Submitted: 10/25/2025, 2:30:15 PM
```

---

## Upgrading to Production (Optional)

### Verify Your Domain (for branded emails)

If you want emails from `feedback@yourdomain.com` instead of `onboarding@resend.dev`:

1. Go to Resend → Domains
2. Add your domain (e.g., `hockeygotime.net`)
3. Add DNS records (SPF, DKIM, DMARC)
4. Wait for verification (usually 5-15 minutes)
5. Update API route:
   ```typescript
   from: 'HockeyGoTime Feedback <feedback@hockeygotime.net>'
   ```

**Note**: This is optional. The free `onboarding@resend.dev` works fine for testing and low-volume production use.

---

## Comparison to GitHub Issues Implementation

| Aspect | Email (Resend) | GitHub Issues |
|--------|----------------|---------------|
| **Setup Time** | 10-15 minutes | 1-2 hours |
| **Code Complexity** | Low (~100 lines) | Medium (~300 lines) |
| **Dependencies** | 1 (`resend`) | 1 (`@octokit/rest`) |
| **Screenshots** | ❌ Not supported | ✅ Full support |
| **Free Tier** | 3,000/month | Unlimited |
| **Notification** | ✅ Email inbox | ❌ Must check GitHub |
| **Organization** | Gmail labels/filters | GitHub labels/milestones |
| **Public Access** | ❌ Private only | ✅ Can be public |
| **Mobile UX** | ✅ Text-only form | ✅ Native photo picker |

---

## Migration Path

If you start with email and later want screenshots:

1. Keep the email implementation as-is
2. Build the GitHub Issues version separately
3. Add a toggle in the modal: "Include screenshot?"
   - If YES → route to GitHub API
   - If NO → route to email API
4. Or simply replace the email API with GitHub API

The UI components are nearly identical, so migration is easy.

---

## Troubleshooting

### Email not arriving?

1. **Check spam folder** - Resend emails may be filtered
2. **Verify API key** - Make sure `RESEND_API_KEY` is set correctly
3. **Check Resend logs** - Go to Resend dashboard → Logs to see delivery status
4. **Check rate limits** - Free tier: 100 emails/day, 3,000/month
5. **Verify email address** - Make sure `FEEDBACK_EMAIL` is correct in env vars

### API returning 500 error?

1. Check server logs: `pnpm dev` (look for console errors)
2. Verify `RESEND_API_KEY` is in `.env.local`
3. Make sure Resend package is installed: `pnpm list resend`
4. Check API key is valid (not revoked) in Resend dashboard

### Toast not showing?

1. Verify `Toaster` is added to `layout.tsx`
2. Check `sonner` is installed: `pnpm dlx shadcn@latest add sonner`
3. Open browser console for errors

---

## Post-Implementation

### Organize Feedback in Gmail

Create filters to auto-label feedback:
1. Gmail → Settings → Filters and Blocked Addresses
2. Create filter for emails from `onboarding@resend.dev` with subject "HockeyGoTime"
3. Apply label: "HGT Feedback"
4. Star important feedback
5. Archive once resolved

### Monitor Usage

Check Resend dashboard:
- Total emails sent
- Delivery rate
- Bounce rate
- Rate limit usage

Free tier is 3,000 emails/month—plenty for feedback.

---

## Implementation Order

1. ✅ **Install Resend**: `pnpm add resend`
2. ✅ **Get API key** from Resend dashboard
3. ✅ **Add env vars** to `.env.local`
4. ✅ **Install shadcn components**: dialog, toast, sonner
5. ✅ **Create types** (`types/feedback.ts`)
6. ✅ **Create API route** (`app/api/feedback/route.ts`)
7. ✅ **Create components** (FeedbackButton, FeedbackModal)
8. ✅ **Update layout** (add Toaster)
9. ✅ **Update main page** (add FeedbackButton next to Ko-fi)
10. ✅ **Test locally** (full checklist above)
11. ✅ **Deploy to Vercel** (add env vars in dashboard)
12. ✅ **Test production** (submit real feedback)

---

## Summary

This email-based approach gives you:
- ✅ **Fast implementation** (10 minutes vs 2 hours)
- ✅ **Simple code** (1 API route, 2 components)
- ✅ **Reliable delivery** (Resend handles email infrastructure)
- ✅ **Auto-captured context** (team, division, league)
- ✅ **Mobile-friendly** (text-only form works everywhere)
- ✅ **Free tier** (3,000 emails/month)

Trade-off: No screenshot support (users must describe issues in text).

For most use cases, this is **sufficient**. Add GitHub Issues later if you need screenshots and better tracking.
