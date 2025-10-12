# Implementation Plan: Replace Generic Placeholder Content

**Branch**: `003-other-generic-leftovers` | **Date**: 2025-10-09 | **Spec**: [spec.md](./spec.md)

## Summary

Replace generic Next.js starter template placeholder content with HockeyGoTime-branded content across three areas: (1) Privacy policy containing misleading data collection statements, (2) About page with starter template copy, and (3) Browser favicon showing Next.js logo instead of HockeyGoTime brand. This is a content update feature with no backend changes, no API modifications, and no database work—purely static page updates and asset replacement.

**Technical Approach**: Direct file edits to static React pages (`app/privacy/page.tsx`, `app/about/page.tsx`) and favicon replacement using existing HockeyGoTime logo asset (`public/hgt-logo.png`). Remove unused Next.js default assets from `/public` directory.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 15 (App Router)
**Primary Dependencies**: React 19, Next.js 15, Tailwind CSS v4
**Storage**: N/A (static content only)
**Testing**: Manual browser testing (Chrome, Firefox, Safari, Edge) for favicon display; text search verification for placeholder removal
**Target Platform**: Vercel deployment (web application)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: No performance impact (static content updates only)
**Constraints**: Must maintain existing page routing (`/privacy`, `/about`); must not break existing layout or styling
**Scale/Scope**: 3 files updated (privacy page, about page, favicon), 5 assets removed (unused SVGs)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle Compliance

**I. User-Centric AI Experience**: ✅ PASS
- Privacy policy update improves user trust by accurately describing data practices
- About page update clarifies product purpose for hockey parents
- No AI model or natural language processing changes in this feature

**II. Type Safety & Quality Gates**: ✅ PASS
- `pnpm tsc --noEmit` must pass after React page updates
- Static TSX changes are straightforward (no complex type requirements)

**III. Performance First - Caching & Speed**: ✅ PASS
- No performance impact (static pages, no caching logic changes)
- Favicon replacement has negligible performance effect

**IV. MCP Integration Correctness**: ✅ PASS
- No MCP client changes
- No impact on SCAHA MCP server integration

**V. Package Manager Discipline**: ✅ PASS
- No dependencies added or removed
- No package.json changes required
- pnpm remains exclusive package manager

**VI. AI Model Selection & Fallback Strategy**: ✅ PASS
- No AI model changes
- No impact on GPT-5/GPT-5-mini usage

**VII. Deployment Ready & Environment Configuration**: ✅ PASS
- No environment variable changes
- Works in both local dev and Vercel production
- No deployment configuration changes required

**Timezone Handling & Time Display**: ✅ PASS (Not Applicable)
- No date/time logic in this feature

**Capstone Priority Alignment**: ⚠️ **MEDIUM PRIORITY**
- This is a polish feature, not a core Capstone demo feature
- However, privacy policy accuracy is legally important
- About page branding improves presentation professionalism
- Recommend: Complete this feature AFTER P1 user preferences and routing fix, but BEFORE Capstone presentation

**Overall Gate Status**: ✅ **APPROVED** - No constitution violations. Feature is low-risk, high-polish content update suitable for Capstone preparation.

## Project Structure

### Documentation (this feature)

```
specs/003-other-generic-leftovers/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output (minimal - content writing research)
├── quickstart.md        # Phase 1 output (developer guide)
└── checklists/
    └── requirements.md  # Spec quality validation (complete)
```

**Note**: No `data-model.md` or `contracts/` for this feature (no data entities or API contracts).

### Source Code (repository root)

```
app/
├── privacy/
│   └── page.tsx         # MODIFY: Replace placeholder privacy text with accurate data practices
├── about/
│   └── page.tsx         # MODIFY: Replace starter template copy with HockeyGoTime story
├── favicon.ico          # REPLACE: Convert hgt-logo.png to favicon.ico format
└── layout.tsx           # NO CHANGES: Existing layout unchanged

public/
├── hgt-logo.png         # EXISTING: Source file for favicon conversion
├── next.svg             # DELETE: Unused Next.js logo
├── vercel.svg           # DELETE: Unused Vercel logo
├── globe.svg            # DELETE: Unused default icon
├── file.svg             # DELETE: Unused default icon
└── window.svg           # DELETE: Unused default icon
```

**Structure Decision**: Next.js App Router structure (Option 2: Web application). All changes are within the `app/` directory for static pages and `public/` for static assets. No backend, API, or database changes required.

## Complexity Tracking

*No constitution violations - this section is not applicable.*

## Phase 0: Research & Content Creation

### Research Tasks

Since this is a content update feature with no technical unknowns, research focuses on **content creation** rather than technical investigation:

#### R1: Privacy Policy Content
**Task**: Draft accurate privacy policy language that reflects HockeyGoTime's client-side-only data model.

**Key Points to Address**:
- Clearly state: "We do not collect any personal information"
- Explain: localStorage preferences are stored on user's device only
- Clarify: No user accounts, no server-side data storage, no third-party data sharing
- Mention: OpenAI API usage for chat processing (but user queries are not stored by HockeyGoTime)
- Address: SCAHA schedule data is public information fetched in real-time
- Optional: Link to OpenAI privacy policy for transparency about AI processing

**Deliverable**: Draft privacy policy sections for `research.md`

#### R2: About Page Content
**Task**: Write concise HockeyGoTime story explaining the product purpose for SCAHA hockey families.

**Key Points to Address**:
- What: Conversational AI assistant for SCAHA hockey schedules
- Who: Built for hockey parents and players navigating busy game schedules
- Why: Simplifies finding game times, opponents, venues through natural language
- How: Ask questions like "When does 14B Jr Kings play next?" and get instant answers
- Brief mention: Powered by AI, no signup required

**Deliverable**: Draft About page content (1-3 paragraphs) for `research.md`

#### R3: Favicon Generation Best Practices
**Task**: Research best practices for converting PNG logo to favicon format for Next.js 15.

**Questions to Answer**:
1. What favicon formats should be generated? (ICO, PNG, SVG?)
2. What sizes are required for modern browsers? (16x16, 32x32, 180x180 for Apple?)
3. Should we use Next.js metadata API or direct favicon.ico file?
4. What tools can convert `public/hgt-logo.png` to favicon format?
5. Do we need additional icon sizes for mobile/PWA support?

**Deliverable**: Favicon generation strategy and tool recommendations for `research.md`

#### R4: Vercel Deployment Verification
**Task**: Verify that favicon and page changes deploy correctly to Vercel without additional configuration.

**Questions to Answer**:
1. Does Vercel automatically serve `app/favicon.ico`?
2. Are there caching considerations for favicon updates?
3. Should we test in Vercel preview deployment first?

**Deliverable**: Deployment notes for `research.md`

### Research Output

All findings will be consolidated in `research.md` with the structure:
- **Privacy Policy Draft**: Ready-to-use policy text
- **About Page Draft**: Ready-to-use about content
- **Favicon Strategy**: Step-by-step conversion process
- **Deployment Notes**: Vercel-specific considerations

## Phase 1: Design & Implementation Guide

### Content Artifacts

Since this feature has no data model or API contracts, Phase 1 focuses on **content finalization** and **implementation guide**:

#### Artifact 1: Final Privacy Policy Content
**Location**: Included in `quickstart.md` as copy-paste ready content
**Format**: Complete JSX/TSX for `app/privacy/page.tsx`

#### Artifact 2: Final About Page Content
**Location**: Included in `quickstart.md` as copy-paste ready content
**Format**: Complete JSX/TSX for `app/about/page.tsx`

#### Artifact 3: Favicon Files
**Location**: Generated favicon files ready for placement in `app/`
**Format**: `favicon.ico` (16x16, 32x32 multi-resolution ICO file)

#### Artifact 4: Developer Quickstart Guide
**Location**: `quickstart.md`
**Contents**:
- Step-by-step instructions for updating privacy page
- Step-by-step instructions for updating about page
- Favicon replacement instructions
- Unused asset cleanup instructions
- Local testing commands (`pnpm dev`, `pnpm tsc --noEmit`)
- Verification checklist (all browsers, text searches)

### Agent Context Update

Run `.specify/scripts/bash/update-agent-context.sh claude` after Phase 1 to update Claude-specific context with:
- Location of privacy policy content source
- Location of about page content source
- Note about favicon generation process

**Note**: Since this is a content-only feature with no new technical dependencies, agent context updates are minimal.

## Implementation Phases Summary

**Phase 0 (Research)**:
1. Draft privacy policy content addressing localStorage-only model
2. Draft About page HockeyGoTime story (1-3 paragraphs)
3. Research favicon generation best practices for Next.js 15
4. Document Vercel deployment considerations

**Phase 1 (Content Finalization)**:
1. Finalize privacy policy JSX content
2. Finalize About page JSX content
3. Generate favicon.ico from hgt-logo.png
4. Create quickstart.md with step-by-step implementation guide
5. Update agent context with content source locations

**Phase 2 (Task Generation)** - via `/speckit.tasks`:
1. Generate `tasks.md` with actionable implementation tasks
2. Each task maps to one file change or asset operation
3. Tasks include verification steps (TypeScript check, browser testing)

## Risk Assessment

**Low Risk Feature** - This is a straightforward content update with minimal technical complexity:

✅ **No Backend Changes**: Static page updates only
✅ **No API Changes**: No impact on MCP integration or AI chat
✅ **No Database Changes**: No data persistence involved
✅ **No Dependency Changes**: Uses existing React/Next.js/Tailwind
✅ **No Performance Impact**: Static content has negligible load time effect
✅ **Easy Rollback**: Git revert restores previous content immediately

**Potential Issues**:
- ⚠️ Favicon caching in browsers (users may need hard refresh to see new icon)
- ⚠️ Privacy policy legal adequacy (out of scope - assumes legal review happens separately)
- ⚠️ About page tone/messaging (subjective - may need iteration based on feedback)

**Mitigation**:
- Document browser cache clearing in testing checklist
- Add disclaimer to privacy policy noting it's not legal advice
- Keep About page concise and factual (easy to revise post-launch)

## Next Steps

1. ✅ **Specification Complete**: `spec.md` validated and approved
2. 🔄 **Planning Complete**: This file (`plan.md`) generated
3. ⏭️ **Next Command**: `/speckit.tasks` to generate `tasks.md` with actionable implementation tasks

**Ready for Task Generation**: All prerequisites met. Run `/speckit.tasks` to proceed with implementation planning.
