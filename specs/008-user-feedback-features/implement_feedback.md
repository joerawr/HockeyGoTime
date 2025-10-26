# User Feedback Feature Implementation Plan

## Overview
Add a "Report Issue" button next to the Ko-fi button that lets users submit feedback with screenshots directly to GitHub Issues using the GitHub Attachments API.

## User Answers
- **Target repo**: HockeyGoTime (current repo)
- **Button location**: To the right of Ko-fi button
- **Auto-capture**: User preferences (team, division, league)

## Implementation Steps

### 1. Add Required UI Components
- Install shadcn dialog component: `pnpm dlx shadcn@latest add dialog`
- Install shadcn toast component for success/error messages: `pnpm dlx shadcn@latest add toast`

### 2. Create Feedback Components
**File**: `components/ui/feedback/FeedbackButton.tsx`
- Simple button with bug/feedback icon
- Opens feedback modal on click
- Positioned next to Ko-fi button

**File**: `components/ui/feedback/FeedbackModal.tsx`
- Dialog with form fields:
  - "What went wrong?" (textarea, required)
  - "Attach screenshot" (file input, optional, accept="image/*")
  - "Your email" (text input, optional)
  - Submit button with loading state
- Auto-captures from localStorage: team, division, league (mcpServer)
- Client-side validation
- Handles submission to API route
- Shows toast on success/error

### 3. Create GitHub Integration
**File**: `lib/github/issue-creator.ts`
- Function to create GitHub issue with attachments
- Uses Octokit (GitHub API client)
- Steps:
  1. Upload image to GitHub (if provided) via REST API
  2. Create issue with description including:
     - User's feedback text
     - Screenshot (embedded if uploaded)
     - Auto-captured context (team, division, league)
     - Timestamp
     - Browser/device info from user agent
  3. Return issue URL

**File**: `app/api/feedback/route.ts`
- POST endpoint to receive feedback form data
- Parse multipart form data (image upload)
- Call `issue-creator.ts` to create GitHub issue
- Return success/error response with issue number

### 4. Environment Variables
**File**: `.env.local` (add to existing)
```bash
GITHUB_TOKEN=ghp_...  # Personal access token with repo scope
GITHUB_OWNER=jrogers  # Your GitHub username
GITHUB_REPO=HockeyGoTime
```

**File**: `.env.example` (document for others)
- Add GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO

### 5. Update Main Page
**File**: `app/page.tsx`
- Import `FeedbackButton` component
- Add button in div with Ko-fi button (line 52)
- Use flex layout: `flex gap-2 justify-center items-center`

### 6. Add Toast Provider
**File**: `app/layout.tsx`
- Wrap app with Toaster component for notifications

### 7. GitHub Token Setup
- Create GitHub Personal Access Token:
  - Settings → Developer Settings → Personal Access Tokens → Fine-grained tokens
  - Repository access: Only HockeyGoTime
  - Permissions: Issues (Read and Write), Contents (Read only for attachments)
- Add to Vercel environment variables (production)

### 8. Type Definitions
**File**: `types/feedback.ts`
- FeedbackSubmission interface
- FeedbackResponse interface

## Technical Decisions

**GitHub Attachments API Flow:**
1. User uploads image → sent to `/api/feedback`
2. API uploads image to GitHub: `POST /repos/{owner}/{repo}/issues/attachments`
3. GitHub returns attachment URL
4. API creates issue with attachment URL embedded in markdown
5. Issue appears with screenshot visible

**Package to install:**
- `@octokit/rest` - Official GitHub API client
- Command: `pnpm add @octokit/rest`

**Error Handling:**
- Client-side: Toast for network errors, validation errors
- Server-side: Log errors, return user-friendly messages
- Fallback: If attachment upload fails, still create issue with text

**Mobile Considerations:**
- File input opens native photo picker on mobile
- Works with both camera and photo library
- Responsive button layout (stacks on small screens)

## File Structure
```
components/ui/feedback/
  ├── FeedbackButton.tsx      (new)
  └── FeedbackModal.tsx       (new)

lib/github/
  └── issue-creator.ts        (new)

app/api/feedback/
  └── route.ts                (new)

types/
  └── feedback.ts             (new)

app/
  ├── page.tsx                (modify - add button)
  └── layout.tsx              (modify - add Toaster)
```

## Testing Checklist
- [ ] Dialog opens/closes correctly
- [ ] Form validation works (required fields)
- [ ] File upload accepts images only
- [ ] Auto-captures user preferences correctly
- [ ] Handles case where user has no preferences saved
- [ ] API creates issue successfully
- [ ] Screenshot appears in GitHub issue
- [ ] Email field is optional
- [ ] Toast notifications appear
- [ ] Mobile: file picker opens correctly
- [ ] Mobile: button layout responsive
- [ ] Error handling for GitHub API failures
- [ ] Works without screenshot (text-only feedback)

## Post-Implementation
- Test in development with test GitHub repo first
- Add rate limiting (optional, to prevent spam)
- Consider adding issue labels: `feedback`, `user-reported`
- Monitor GitHub issues for feedback trends

## Implementation Order

1. **Install dependencies**
   - `pnpm add @octokit/rest`
   - `pnpm dlx shadcn@latest add dialog`
   - `pnpm dlx shadcn@latest add toast`

2. **Setup GitHub token** (do this first!)
   - Create fine-grained token on GitHub
   - Add to `.env.local`
   - Add to Vercel env vars

3. **Create type definitions** (`types/feedback.ts`)

4. **Build GitHub integration** (`lib/github/issue-creator.ts`)

5. **Create API endpoint** (`app/api/feedback/route.ts`)

6. **Build UI components**
   - `FeedbackButton.tsx`
   - `FeedbackModal.tsx`

7. **Update pages**
   - Add Toaster to `layout.tsx`
   - Add FeedbackButton to `page.tsx`

8. **Test thoroughly** (use checklist above)

9. **Deploy and verify** production works
