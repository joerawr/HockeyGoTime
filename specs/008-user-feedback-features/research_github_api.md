# Research Task: GitHub API Image Upload & Issue Creation

**Context**: We're building a user feedback feature for HockeyGoTime that allows users to submit bug reports with screenshots directly to GitHub Issues.

**Your Mission**: Research and document exactly how to use the @octokit/rest package to upload images and create GitHub issues with attachments in a Next.js 15 App Router API route.

**DELIVERABLE**: Create a markdown file named `github_api_findings.md` with your complete research findings and code examples.

---

## What You Need to Research

### 1. Image Upload Method
- What is the exact Octokit method/endpoint to upload images to GitHub?
- Is it `POST /repos/{owner}/{repo}/issues/attachments` or something else?
- What format must the image be in? (Buffer, base64, blob, FormData, etc.)
- How do we convert a File/Blob from Next.js request to the required format?
- Required authentication (Personal Access Token? GitHub App?)
- Required permissions (what scopes/permissions needed?)

### 2. Issue Creation with Attachments
- Exact Octokit method to create a GitHub issue (`octokit.rest.issues.create`?)
- How to embed the uploaded image in the issue body using markdown
- Example markdown syntax for embedded images
- Do attachment URLs require authentication to view, or are they public?
- Can we upload image first, then create issue? Or must be done together?

### 3. Next.js Integration
- How to parse multipart form data in Next.js 15 App Router (FormData with images)
- How to handle file uploads in `app/api/feedback/route.ts`
- Type safety with TypeScript for Octokit responses

### 4. Working Code Example

Provide a complete, working TypeScript code example:

```typescript
// app/api/feedback/route.ts
export async function POST(request: Request) {
  // 1. Parse form data (including image file)
  // 2. Upload image to GitHub
  // 3. Create issue with embedded image
  // 4. Return issue URL
}
```

```typescript
// lib/github/issue-creator.ts
export async function createIssueWithAttachment(
  title: string,
  body: string,
  imageFile?: File | Buffer
): Promise<{ issueUrl: string; issueNumber: number }> {
  // Implementation here
}
```

### 5. Error Handling & Edge Cases
- What happens if image upload fails but issue creation succeeds?
- File size limits (GitHub's max attachment size)
- Supported image formats (PNG, JPG, GIF, WebP?)
- Rate limiting considerations
- How to handle missing GITHUB_TOKEN gracefully
- What if user submits feedback without image?

### 6. Best Practices
- Should we upload image first, then create issue? Or reverse?
- Fallback strategy if attachment API is down
- Security considerations (sanitizing user input, file validation)
- Performance (should we stream large files or buffer them?)

### 7. Alternative Approaches (if needed)
- If GitHub Attachments API has issues, what are alternatives?
  - Upload to Vercel Blob and link in issue?
  - Use GitHub's content API to add files to repo?
  - Embed base64 images directly (likely too large)?

---

## Research Strategy

1. **Official Docs**:
   - @octokit/rest documentation on npm or GitHub
   - GitHub REST API official docs: https://docs.github.com/en/rest
   - Search for "GitHub Issues Attachments API"

2. **Real-World Examples**:
   - Search GitHub for repos using this pattern
   - Look for Next.js + Octokit + image upload examples
   - Check Stack Overflow for common issues

3. **Recent Updates**:
   - Check for 2024-2025 updates to GitHub API
   - Verify @octokit/rest is still the recommended package (vs @octokit/core or others)

---

## Deliverables

**Create a report that includes**:

1. **Executive Summary** (3-5 sentences)
   - Is this approach viable?
   - Any major gotchas or blockers?
   - Alternative recommendation if needed

2. **Technical Implementation Guide**
   - Step-by-step instructions
   - Complete, runnable code examples
   - Required environment variables
   - Required package versions

3. **API Reference**
   - Exact method signatures
   - Required parameters
   - Response types
   - Error codes to handle

4. **Testing Strategy**
   - How to test locally (test repo?)
   - How to validate image upload worked
   - Example curl commands if helpful

5. **Production Considerations**
   - Vercel deployment requirements
   - Environment variable setup
   - Security best practices

---

## Output Format

**Create a file named `github_api_findings.md` with your complete findings.**

Structure the markdown document with:
- Clear headings
- Code blocks with syntax highlighting
- Links to official documentation
- Specific version numbers for packages

**Target**: Complete technical spec that can be handed to a developer to implement without further research.

**IMPORTANT**: At the end of your research, create the file `github_api_findings.md` in the HockeyGoTime directory with all your findings.

---

## Notes

- We're using Next.js 15 with App Router (not Pages Router)
- TypeScript strict mode
- Deployed on Vercel
- Users will upload from mobile and desktop browsers
- Need to support PNG, JPG at minimum
