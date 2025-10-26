# GitHub API Research: Image Upload & Issue Creation

**Date**: October 25, 2025
**Project**: HockeyGoTime Feedback Feature
**Framework**: Next.js 15 App Router + TypeScript

---

## Executive Summary

**Is direct GitHub attachment upload via API viable?** ❌ **No**

After extensive research, **GitHub does NOT provide a public REST API endpoint for uploading attachments to issues**. Multiple GitHub community discussions (2022-2024) confirm this limitation exists due to abuse prevention concerns.

**Recommended Approach:** ✅ **Use Vercel Blob + External URL Reference**

1. Upload image to **Vercel Blob** storage (simple, edge-optimized, 5GB free tier)
2. Get publicly accessible URL from Vercel Blob
3. Create GitHub issue via **@octokit/rest** with markdown referencing the external image URL
4. Result: Image displays in GitHub issue, hosted on Vercel infrastructure

**Major Gotchas:**
- GitHub's web UI allows drag-and-drop uploads, but this functionality is **not exposed via REST API**
- Cannot use GitHub's CDN (`user-images.githubusercontent.com`) programmatically
- Personal Access Token requires `repo` scope (or `public_repo` for public repos only)
- Vercel Blob has 4.5MB request limit via API routes (use client-side upload for larger files)

**Alternative if Vercel Blob unavailable:** Upload to AWS S3, Cloudinary, or Imgur and reference external URL.

---

## 1. Technical Implementation Guide

### Architecture Overview

```
┌──────────────┐     FormData      ┌─────────────────────┐
│   Browser    │ ───────────────>  │  Next.js API Route  │
│ (User Upload)│                    │ /api/feedback/route │
└──────────────┘                    └──────────┬──────────┘
                                              │
                                              │ 1. Upload image
                                              ▼
                                    ┌──────────────────────┐
                                    │   Vercel Blob Store  │
                                    │  (returns public URL)│
                                    └──────────┬───────────┘
                                              │
                                              │ 2. Create issue
                                              ▼
                                    ┌──────────────────────┐
                                    │   GitHub REST API    │
                                    │   (@octokit/rest)    │
                                    └──────────────────────┘
```

### Step-by-Step Implementation

#### **Step 1: Install Required Packages**

```bash
pnpm add @octokit/rest @vercel/blob
```

**Package Versions (as of Oct 2025):**
- `@octokit/rest`: ^20.x or later
- `@vercel/blob`: ^0.23.x or later
- Next.js: 15.x
- TypeScript: 5.x

#### **Step 2: Environment Variables**

Create `.env.local`:

```bash
# GitHub Personal Access Token
# Required scopes: 'repo' (or 'public_repo' for public repos only)
GITHUB_TOKEN=ghp_your_token_here

# GitHub repository details
GITHUB_OWNER=your-username
GITHUB_REPO=HockeyGoTime

# Vercel Blob (auto-configured on Vercel, manual for local dev)
# Get from: https://vercel.com/dashboard/stores
BLOB_READ_WRITE_TOKEN=vercel_blob_token_here
```

**How to create GitHub Personal Access Token:**
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Select scopes:
   - `repo` (full control of private repos) **OR**
   - `public_repo` (access to public repos only)
4. Copy token immediately (only shown once)

#### **Step 3: Create Type Definitions**

Create `lib/github/types.ts`:

```typescript
export interface FeedbackSubmission {
  title: string;
  description: string;
  userEmail?: string;
  browserInfo?: string;
  screenshot?: File;
}

export interface GitHubIssueResponse {
  issueUrl: string;
  issueNumber: number;
}
```

#### **Step 4: Create GitHub Issue Helper**

Create `lib/github/issue-creator.ts`:

```typescript
import { Octokit } from "@octokit/rest";
import { put } from "@vercel/blob";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const GITHUB_OWNER = process.env.GITHUB_OWNER!;
const GITHUB_REPO = process.env.GITHUB_REPO!;

export interface CreateIssueOptions {
  title: string;
  body: string;
  imageFile?: File;
  labels?: string[];
}

export interface CreateIssueResult {
  issueUrl: string;
  issueNumber: number;
  imageUrl?: string;
}

export async function createIssueWithAttachment(
  options: CreateIssueOptions
): Promise<CreateIssueResult> {
  const { title, body, imageFile, labels = ["user-feedback"] } = options;

  let imageUrl: string | undefined;
  let enhancedBody = body;

  // Step 1: Upload image to Vercel Blob (if provided)
  if (imageFile) {
    try {
      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const sanitizedName = imageFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const blobPath = `feedback/${timestamp}-${sanitizedName}`;

      // Upload to Vercel Blob
      const blob = await put(blobPath, imageFile, {
        access: "public",
        addRandomSuffix: false,
      });

      imageUrl = blob.url;

      // Append image to issue body using markdown
      enhancedBody = `${body}\n\n## Screenshot\n\n![User screenshot](${imageUrl})`;
    } catch (error) {
      console.error("Failed to upload image to Vercel Blob:", error);
      // Continue creating issue without image
      enhancedBody = `${body}\n\n*Note: Screenshot upload failed*`;
    }
  }

  // Step 2: Create GitHub issue
  try {
    const response = await octokit.rest.issues.create({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      title,
      body: enhancedBody,
      labels,
    });

    return {
      issueUrl: response.data.html_url,
      issueNumber: response.data.number,
      imageUrl,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create GitHub issue: ${error.message}`);
    }
    throw error;
  }
}
```

#### **Step 5: Create Next.js API Route**

Create `app/api/feedback/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { createIssueWithAttachment } from "@/lib/github/issue-creator";

export async function POST(request: Request) {
  try {
    // Parse multipart form data
    const formData = await request.formData();

    // Extract fields
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const userEmail = formData.get("email") as string | null;
    const browserInfo = formData.get("browserInfo") as string | null;
    const screenshot = formData.get("screenshot") as File | null;

    // Validation
    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      );
    }

    // Build issue body
    let issueBody = `## Description\n\n${description}\n\n`;

    if (userEmail) {
      issueBody += `**Submitted by:** ${userEmail}\n\n`;
    }

    if (browserInfo) {
      issueBody += `## Browser Information\n\n\`\`\`\n${browserInfo}\n\`\`\`\n\n`;
    }

    issueBody += `---\n*Submitted via HockeyGoTime feedback form*`;

    // Create GitHub issue with optional screenshot
    const result = await createIssueWithAttachment({
      title: `[User Feedback] ${title}`,
      body: issueBody,
      imageFile: screenshot || undefined,
      labels: ["user-feedback", "needs-triage"],
    });

    return NextResponse.json({
      success: true,
      issueUrl: result.issueUrl,
      issueNumber: result.issueNumber,
    });
  } catch (error) {
    console.error("Feedback submission error:", error);

    return NextResponse.json(
      {
        error: "Failed to submit feedback",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Increase body size limit for file uploads (default: 1MB)
export const config = {
  api: {
    bodyParser: false, // Let Next.js handle FormData
    responseLimit: false,
  },
};
```

#### **Step 6: Create Client Component**

Create `components/feedback-form.tsx`:

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function FeedbackForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    issueUrl?: string;
    error?: string;
  } | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    try {
      const formData = new FormData(event.currentTarget);

      // Add browser info automatically
      const browserInfo = `User Agent: ${navigator.userAgent}
Screen: ${window.screen.width}x${window.screen.height}
Viewport: ${window.innerWidth}x${window.innerHeight}
Language: ${navigator.language}
URL: ${window.location.href}`;

      formData.append("browserInfo", browserInfo);

      const response = await fetch("/api/feedback", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, issueUrl: data.issueUrl });
        // Reset form
        event.currentTarget.reset();
      } else {
        setResult({ success: false, error: data.error || "Submission failed" });
      }
    } catch (error) {
      setResult({
        success: false,
        error: "Network error. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Submit Feedback</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            name="title"
            required
            placeholder="Brief description of the issue"
            maxLength={100}
          />
        </div>

        <div>
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            name="description"
            required
            placeholder="Detailed explanation of the issue or suggestion"
            rows={5}
          />
        </div>

        <div>
          <Label htmlFor="email">Your Email (optional)</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="your.email@example.com"
          />
        </div>

        <div>
          <Label htmlFor="screenshot">Screenshot (optional)</Label>
          <Input
            id="screenshot"
            name="screenshot"
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Max file size: 4.5MB (PNG, JPG, GIF, WebP)
          </p>
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Submitting..." : "Submit Feedback"}
        </Button>

        {result && (
          <div
            className={`p-4 rounded ${
              result.success
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            {result.success ? (
              <>
                <p className="font-semibold">Feedback submitted successfully!</p>
                <a
                  href={result.issueUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  View GitHub Issue
                </a>
              </>
            ) : (
              <p>Error: {result.error}</p>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
```

---

## 2. API Reference

### Vercel Blob: `put()` Method

```typescript
import { put } from "@vercel/blob";

const blob = await put(pathname: string, body: ReadableStream | string | File, options: PutOptions);

// Returns:
{
  url: string;           // Public HTTPS URL
  downloadUrl: string;   // URL with content-disposition
  pathname: string;      // Path in blob storage
  contentType: string;   // MIME type
  contentDisposition: string;
}
```

**Options:**
- `access: "public"` - Required for GitHub issue embedding
- `addRandomSuffix: boolean` - Append random chars to filename (default: true)
- `contentType: string` - Override MIME type detection
- `cacheControlMaxAge: number` - Cache control header in seconds

**Limits:**
- File size: Up to 5TB (but API route limited to 4.5MB via serverless functions)
- Free tier: 5GB storage, 100GB bandwidth/month
- Pricing: $0.15/GB storage, $0.10/GB bandwidth after free tier

### @octokit/rest: `issues.create()` Method

```typescript
import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: "YOUR_GITHUB_TOKEN" });

const response = await octokit.rest.issues.create({
  owner: string;          // Repository owner username
  repo: string;           // Repository name
  title: string;          // Issue title (required)
  body?: string;          // Issue description (markdown supported)
  labels?: string[];      // Array of label names
  assignees?: string[];   // Array of GitHub usernames
  milestone?: number;     // Milestone number (not ID)
});

// Returns:
{
  data: {
    id: number;
    number: number;        // Issue number (for #123)
    html_url: string;      // Public issue URL
    state: "open" | "closed";
    title: string;
    body: string;
    user: { login: string; ... };
    labels: Array<{ name: string; ... }>;
    created_at: string;
    updated_at: string;
  };
  status: 201;            // HTTP status code
}
```

**Required Token Scopes:**
- `repo` - Full access to private repositories
- `public_repo` - Access to public repositories only (if repo is public)

**Markdown Support in `body`:**
```markdown
## Heading
**Bold text**
*Italic text*
- Bullet list
![Alt text](https://external-url.com/image.png)
[Link text](https://example.com)
```

---

## 3. Error Handling & Edge Cases

### Common Errors

#### **1. Image Upload Fails**

```typescript
try {
  const blob = await put(path, file, { access: "public" });
  imageUrl = blob.url;
} catch (error) {
  console.error("Blob upload failed:", error);
  // Strategy: Create issue without image, log error
  issueBody += "\n\n*Note: Screenshot upload failed*";
}
```

**Causes:**
- File size exceeds 4.5MB (via API route)
- Invalid file format
- Vercel Blob token missing/invalid
- Network timeout

**Mitigation:**
- Validate file size on client before upload
- Compress images client-side (use `canvas` API)
- Provide fallback message in issue body

#### **2. GitHub Issue Creation Fails**

```typescript
try {
  const response = await octokit.rest.issues.create({...});
} catch (error) {
  if (error.status === 401) {
    // Invalid or expired token
    throw new Error("GitHub authentication failed");
  } else if (error.status === 403) {
    // Rate limit exceeded or insufficient permissions
    throw new Error("GitHub API rate limit exceeded");
  } else if (error.status === 404) {
    // Repository not found or no access
    throw new Error("Repository not found");
  } else {
    throw new Error(`GitHub API error: ${error.message}`);
  }
}
```

**Causes:**
- Invalid GitHub token
- Token lacks required scopes
- Rate limit exceeded (5,000 requests/hour for authenticated)
- Repository doesn't exist or no access

**Mitigation:**
- Validate token on app startup
- Implement exponential backoff for rate limits
- Log errors to monitoring service (Sentry, LogRocket)

#### **3. Large File Size Limit (4.5MB)**

**Problem:** Next.js API routes have 4.5MB request limit on Vercel.

**Solution 1: Client-Side Upload to Vercel Blob**

```typescript
// Client component
async function uploadToBlob(file: File): Promise<string> {
  const response = await fetch(`/api/upload-blob?filename=${file.name}`, {
    method: "POST",
    body: file,
  });
  const { url } = await response.json();
  return url;
}

// API route: /api/upload-blob/route.ts
import { handleUpload } from "@vercel/blob/client";

export async function POST(request: Request) {
  const blob = await handleUpload({
    body: request.body,
    request,
    onBeforeGenerateToken: async () => {
      // Optional: Validate user session here
      return { allowedContentTypes: ["image/png", "image/jpeg"] };
    },
    onUploadCompleted: async ({ blob }) => {
      console.log("Upload completed:", blob.url);
    },
  });

  return Response.json(blob);
}
```

**Solution 2: Increase Body Size Limit (Self-Hosted Only)**

```javascript
// next.config.js
module.exports = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};
```

**Note:** This only works for self-hosted deployments, **not on Vercel**.

### File Format Validation

```typescript
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
const MAX_FILE_SIZE = 4.5 * 1024 * 1024; // 4.5MB

function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: PNG, JPG, GIF, WebP`,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Max size: 4.5MB`,
    };
  }

  return { valid: true };
}
```

### Rate Limiting

**GitHub API Limits:**
- Authenticated: 5,000 requests/hour
- Unauthenticated: 60 requests/hour

**Check rate limit status:**

```typescript
const { data: rateLimit } = await octokit.rest.rateLimit.get();
console.log(`Remaining: ${rateLimit.rate.remaining}/${rateLimit.rate.limit}`);
console.log(`Resets at: ${new Date(rateLimit.rate.reset * 1000)}`);
```

**Handle rate limits:**

```typescript
import { retry } from "@octokit/plugin-retry";
import { throttling } from "@octokit/plugin-throttling";

const MyOctokit = Octokit.plugin(retry, throttling);

const octokit = new MyOctokit({
  auth: process.env.GITHUB_TOKEN,
  throttle: {
    onRateLimit: (retryAfter, options) => {
      console.warn(`Rate limit hit, retrying after ${retryAfter}s`);
      return true; // Retry once
    },
    onSecondaryRateLimit: (retryAfter, options) => {
      console.warn(`Secondary rate limit hit`);
      return true;
    },
  },
});
```

---

## 4. Testing Strategy

### Local Development Testing

**1. Test Vercel Blob Locally**

```bash
# Install Vercel CLI
pnpm add -g vercel

# Link project
vercel link

# Pull environment variables
vercel env pull .env.local
```

**2. Test GitHub API with Test Repository**

Create a dedicated test repository (e.g., `your-username/test-feedback`) to avoid cluttering your main repo during development.

Update `.env.local`:
```bash
GITHUB_OWNER=your-username
GITHUB_REPO=test-feedback
```

**3. Manual Testing Checklist**

- [ ] Submit feedback without screenshot
- [ ] Submit feedback with small image (< 1MB)
- [ ] Submit feedback with large image (> 4MB) - should fail gracefully
- [ ] Submit with invalid file type (e.g., .pdf) - should show validation error
- [ ] Test with missing required fields
- [ ] Verify image displays correctly in GitHub issue
- [ ] Verify issue labels applied correctly
- [ ] Test form reset after successful submission
- [ ] Test error message display for network failures

### Automated Tests (Optional)

**Unit Test Example (Jest/Vitest):**

```typescript
// __tests__/lib/github/issue-creator.test.ts
import { describe, it, expect, vi } from "vitest";
import { createIssueWithAttachment } from "@/lib/github/issue-creator";

// Mock Octokit
vi.mock("@octokit/rest", () => ({
  Octokit: vi.fn(() => ({
    rest: {
      issues: {
        create: vi.fn().mockResolvedValue({
          data: {
            html_url: "https://github.com/test/repo/issues/1",
            number: 1,
          },
        }),
      },
    },
  })),
}));

// Mock Vercel Blob
vi.mock("@vercel/blob", () => ({
  put: vi.fn().mockResolvedValue({
    url: "https://example.blob.vercel-storage.com/test.png",
  }),
}));

describe("createIssueWithAttachment", () => {
  it("creates issue without image", async () => {
    const result = await createIssueWithAttachment({
      title: "Test issue",
      body: "Test body",
    });

    expect(result.issueNumber).toBe(1);
    expect(result.imageUrl).toBeUndefined();
  });

  it("creates issue with image", async () => {
    const mockFile = new File(["test"], "test.png", { type: "image/png" });

    const result = await createIssueWithAttachment({
      title: "Test issue",
      body: "Test body",
      imageFile: mockFile,
    });

    expect(result.imageUrl).toBeDefined();
    expect(result.issueNumber).toBe(1);
  });
});
```

### curl Testing

**Test API route directly:**

```bash
# Without screenshot
curl -X POST http://localhost:3000/api/feedback \
  -F "title=Test Issue" \
  -F "description=Testing the API" \
  -F "email=test@example.com"

# With screenshot
curl -X POST http://localhost:3000/api/feedback \
  -F "title=Test with Image" \
  -F "description=Testing image upload" \
  -F "screenshot=@/path/to/test-image.png"
```

---

## 5. Production Considerations

### Vercel Deployment Setup

**1. Add Environment Variables in Vercel Dashboard**

```
Project Settings → Environment Variables → Add New

GITHUB_TOKEN=ghp_xxx (Production, Preview, Development)
GITHUB_OWNER=your-username
GITHUB_REPO=HockeyGoTime
```

**2. Enable Vercel Blob Storage**

```bash
# Via Vercel Dashboard:
Storage → Create Database → Blob

# Via CLI:
vercel env add BLOB_READ_WRITE_TOKEN
```

Vercel automatically provisions `BLOB_READ_WRITE_TOKEN` when you create a Blob store.

**3. Configure Image Domains for next/image**

If displaying uploaded images in your app:

```javascript
// next.config.js
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};
```

### Security Best Practices

**1. Validate File Upload Client-Side**

```typescript
// components/feedback-form.tsx
function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
  const file = event.target.files?.[0];
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith("image/")) {
    alert("Only image files are allowed");
    event.target.value = "";
    return;
  }

  // Validate file size (4.5MB)
  if (file.size > 4.5 * 1024 * 1024) {
    alert("File too large. Maximum size: 4.5MB");
    event.target.value = "";
    return;
  }
}
```

**2. Sanitize User Input**

```typescript
import DOMPurify from "isomorphic-dompurify";

function sanitizeInput(input: string): string {
  // Remove HTML/script tags
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
}

// In API route
const title = sanitizeInput(formData.get("title") as string);
const description = sanitizeInput(formData.get("description") as string);
```

**3. Implement Rate Limiting**

```typescript
// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 h"), // 5 requests per hour
});

// In API route
const identifier = request.headers.get("x-forwarded-for") || "anonymous";
const { success, limit, remaining } = await ratelimit.limit(identifier);

if (!success) {
  return NextResponse.json(
    { error: "Rate limit exceeded. Try again later." },
    { status: 429 }
  );
}
```

**4. Never Expose GitHub Token Client-Side**

Always keep `GITHUB_TOKEN` server-side only. Never pass it to client components or include in client bundles.

**5. Content Security Policy**

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' https://*.blob.vercel-storage.com;"
  );

  return response;
}
```

### Performance Optimizations

**1. Image Compression Before Upload**

```typescript
// lib/image-compression.ts
import imageCompression from "browser-image-compression";

export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  };

  return await imageCompression(file, options);
}
```

**2. Parallel Upload + Issue Creation (if safe)**

```typescript
// Only if you're okay with orphaned images if issue creation fails
const [blob] = await Promise.all([
  put(path, file, { access: "public" }),
  // Don't create issue yet
]);

// Then create issue with image URL
const issue = await octokit.rest.issues.create({
  title,
  body: `${body}\n\n![Screenshot](${blob.url})`,
});
```

**3. Monitor Vercel Blob Usage**

```bash
# View storage usage
vercel blob ls

# View individual blob
vercel blob get <url>

# Delete old blobs (if implementing cleanup)
vercel blob delete <url>
```

### Monitoring & Logging

**1. Add Error Tracking (Sentry)**

```typescript
// lib/error-reporting.ts
import * as Sentry from "@sentry/nextjs";

export function reportError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, { extra: context });
  console.error(error);
}

// In API route
} catch (error) {
  reportError(error as Error, {
    title,
    hasScreenshot: !!screenshot,
    userEmail: userEmail || "anonymous",
  });
  throw error;
}
```

**2. Add Success Metrics**

```typescript
// Track successful submissions
analytics.track("Feedback Submitted", {
  hasScreenshot: !!screenshot,
  issueNumber: result.issueNumber,
});
```

---

## 6. Alternative Approaches

### Option 1: Direct Client Upload (Bypass 4.5MB Limit)

**Pros:**
- Supports files up to 5GB
- Reduces server load
- Faster uploads (direct to edge network)

**Cons:**
- More client-side code complexity
- GitHub token still needed server-side for issue creation

**Implementation:**

```typescript
// Step 1: Client uploads to Vercel Blob
const response = await fetch(`/api/blob-upload-url?filename=${file.name}`);
const { url, token } = await response.json();

await fetch(url, {
  method: "PUT",
  body: file,
  headers: { Authorization: `Bearer ${token}` },
});

// Step 2: Client sends image URL to server for issue creation
await fetch("/api/feedback", {
  method: "POST",
  body: JSON.stringify({ title, description, imageUrl: url }),
});
```

### Option 2: AWS S3 Instead of Vercel Blob

**Use case:** Already using AWS infrastructure, need more storage control

**Setup:**

```bash
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

```typescript
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const command = new PutObjectCommand({
  Bucket: "your-bucket-name",
  Key: `feedback/${Date.now()}-${file.name}`,
  Body: Buffer.from(await file.arrayBuffer()),
  ContentType: file.type,
  ACL: "public-read",
});

await s3Client.send(command);

const imageUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
```

### Option 3: Embed Base64 Images (Not Recommended)

**Only viable for tiny images (<100KB)**

```typescript
const buffer = await file.arrayBuffer();
const base64 = Buffer.from(buffer).toString("base64");
const dataUrl = `data:${file.type};base64,${base64}`;

const issueBody = `
## Description
${description}

## Screenshot
![Screenshot](${dataUrl})
`;
```

**Problems:**
- GitHub issue body has character limits
- Base64 encoding increases size by ~33%
- Poor performance for large images
- Not recommended by GitHub

### Option 4: GitHub Gist for Images (Workaround)

**Upload image as file to GitHub Gist, reference in issue:**

```typescript
const gist = await octokit.rest.gists.create({
  files: {
    "screenshot.png": {
      content: buffer.toString("base64"),
    },
  },
  public: false,
});

const imageUrl = gist.data.files["screenshot.png"].raw_url;
```

**Problems:**
- Gists aren't designed for binary data
- Rate limits apply
- More API calls = slower
- Complexity not justified

---

## 7. Conclusion & Recommendations

### Recommended Tech Stack

✅ **Next.js 15 App Router** + **@octokit/rest** + **Vercel Blob**

This combination provides:
- Simple integration (minimal code)
- Excellent performance (edge-optimized)
- Cost-effective (5GB free tier)
- Production-ready error handling
- TypeScript support
- Easy deployment on Vercel

### Implementation Timeline

**Phase 1 (Day 1):** Core functionality
- Install packages
- Set up environment variables
- Create API route for feedback submission (no images)
- Create basic form component
- Test GitHub issue creation

**Phase 2 (Day 2):** Image upload
- Integrate Vercel Blob
- Add file upload to form
- Implement image validation
- Test end-to-end flow

**Phase 3 (Day 3):** Polish & deploy
- Error handling & user feedback
- Rate limiting
- Security hardening
- Deploy to Vercel
- Monitor first submissions

### Known Limitations

1. **No native GitHub attachment API** - Must use external storage
2. **4.5MB file size limit** via API routes (use client-side upload for larger files)
3. **Vercel Blob is Vercel-specific** - Vendor lock-in consideration
4. **GitHub rate limits** - 5,000 requests/hour per token

### Future Enhancements

- [ ] Image compression before upload
- [ ] Multiple file uploads
- [ ] Admin dashboard to view submissions
- [ ] Auto-close resolved issues
- [ ] Email notifications for submitters
- [ ] Integration with project boards

---

## Resources & Links

### Official Documentation
- [@octokit/rest Documentation](https://octokit.github.io/rest.js)
- [GitHub REST API - Issues](https://docs.github.com/en/rest/issues/issues)
- [Vercel Blob Documentation](https://vercel.com/docs/storage/vercel-blob)
- [Next.js 15 App Router - Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

### GitHub Community Discussions
- [Upload attachments via REST API](https://github.com/orgs/community/discussions/28219) (2022 - confirms no API)
- [File upload to GitHub issues](https://github.com/orgs/community/discussions/46951) (2023 - workarounds)

### Example Repositories
- [Vercel Blob Starter](https://github.com/vercel/examples/tree/main/storage/blob-starter)
- [Next.js File Upload Examples](https://github.com/vercel/next.js/tree/canary/examples/api-routes-rest)

---

**Document Version:** 1.0
**Last Updated:** October 25, 2025
**Author:** Research Agent for HockeyGoTime
**Status:** Complete & Ready for Implementation
