<!--
Sync Impact Report:
- Version: 2.0.4 → 2.1.0
- Change Type: MINOR version bump (new architecture constraints added)
- Rationale: Added timezone handling and time format display requirements as new technical constraints

- Principles Modified:
  * I. User-Centric AI Experience: Added 12-hour AM/PM time format display requirement

- Sections Modified:
  * Testing Discipline: Added timezone/DST edge case testing requirement
  * Pre-Commit Checklist: Added timezone handling verification (if touching date/time code)

- Principles Added: None
- Sections Added:
  * Architecture Constraints: "Timezone Handling & Time Display" (new subsection)

- Sections Removed: None

- Templates Requiring Updates:
  ✅ constitution.md - Updated to v2.1.0 with timezone handling guidance
  ⚠ plan-template.md - Constitution Check section already covers principles I-VII (no update needed)
  ⚠ spec-template.md - No changes needed (feature-level requirements, not technical constraints)
  ⚠ tasks-template.md - No changes needed (tasks will reflect this guidance during implementation)

- Follow-up TODOs:
  * Fix routing: Move app from /hockey to root path (user request - carryover from v2.0.4)
  * Update lib/mcp/CLAUDE.md to reflect StreamableHTTP as primary transport (carryover from v2.0.0)
  * Verify environment variable documentation includes SCAHA_MCP_URL (carryover from v2.0.0)
  * Prioritize feature implementation for Capstone presentation (2.5 weeks remaining)
  * Implement venue address hardcoding for Capstone demo schedules (carryover from v2.0.4)
  * Implement donation button for Capstone (P5 - if time permits, carryover from v2.0.4)
  * Update implementation code to handle PST/PDT → UTC conversions for Google Routes API
  * Update user preferences default: arrivalBufferMinutes = 60 (coach requirement, carryover from research.md)
-->

# HockeyGoTime Constitution

## Project Context

**Capstone Project**: Agent Engineering Bootcamp
**Timeline**: 2.5 weeks remaining (as of 2025-10-07)
**Deliverable**: MVP (or post-MVP) demonstration for Capstone presentation

### Capstone Constraints

This project is being developed as a Capstone project for the Agent Engineering Bootcamp. The following time-sensitive constraints apply:

- **Deadline**: Approximately 2025-10-25 (2.5 weeks from ratification date)
- **Scope Priority**: MVP features take absolute precedence over post-MVP enhancements
- **Feature Selection**: Focus on demonstrable AI agent capabilities and MCP integration
- **Quality over Quantity**: Prefer fewer, polished features over many incomplete ones

### Recommended Capstone Feature Priorities

Based on the feature specification (specs/001-hockey-go-time/spec.md), prioritize in this order:

**Must Have for Capstone (P1)**:
1. User Preferences and Team Association (foundational - required for all demos)
2. Enhanced current schedule queries (already working - polish UX)
3. Fix `/hockey` routing to root path (cleaner demo URL)

**Strong Demo Value (P2)**:
4. Travel Time Calculations with Wake-Up and Departure Times (unique differentiator)
5. Hotel Recommendation for Early Games (compelling parent use case)

**Nice to Have (P3+)**:
6. Performance Optimization with Caching (if time permits)
7. Player/Team Statistics (lower priority - less unique)

**Defer Post-Capstone (P4-P5)**:
8. Enhanced Team/Venue Information (visual polish - not critical for demo)
9. Multi-League Support (PGHL)
10. Community Features (About, Donate/Support Button, Feedback) - Monetization to offset API costs

## Core Principles

### I. User-Centric AI Experience

Every feature MUST prioritize the hockey parent and player experience. Natural language understanding takes precedence over technical precision. The system MUST:

- Accept informal input ("14B Jr Kings", "this Sunday") and normalize intelligently
- Provide conversational, friendly responses suitable for non-technical users
- Display all times in **12-hour AM/PM format** (e.g., "7:00 AM", not "07:00" or "0700")
- Default to helpful assumptions (current season, user's team) rather than asking clarifying questions
- Handle ambiguity gracefully with contextual suggestions

**Rationale**: Hockey parents need quick answers while rushing to games, not technical troubleshooting. AI should feel like talking to a helpful friend, not a database query interface. User feedback confirms preference for familiar 12-hour time format over military time.

### II. Type Safety & Quality Gates (NON-NEGOTIABLE)

TypeScript strict mode is mandatory. No code is considered complete until it passes type checking. The development workflow MUST:

- Run `pnpm tsc --noEmit` before considering any code complete
- Treat TypeScript errors as blocking issues, not warnings
- Use explicit types; avoid `any` except where truly unavoidable
- Document unavoidable `any` usage with inline comments explaining why

**Rationale**: Hockey schedule data involves dates, times, teams, and venues—critical information where type errors lead to parents missing games or arriving at wrong locations. Type safety prevents catastrophic user-facing bugs.

### III. Performance First - Caching & Speed

User queries MUST respond in under 3 seconds for 95th percentile. Schedule data MUST be cached aggressively. The system MUST:

- Cache schedule data with 24-hour default TTL
- Respond to cached queries in under 1 second
- Use background refresh for stale data rather than blocking user queries
- Monitor and log response times for travel calculations and MCP tool calls

**Rationale**: Parents checking schedules are often multitasking (driving, preparing for games). Slow responses = app abandonment. Caching is not optional; it's a core user experience requirement.

### IV. MCP Integration Correctness

MCP client lifecycle management is critical. StreamableHTTP transport MUST be used to connect to the remote SCAHA MCP server hosted on Vercel. The implementation MUST:

- Connect to SCAHA MCP server via `StreamableHTTPClientTransport` using the deployed endpoint (https://scaha-mcp.vercel.app/api/mcp or environment-configured URL)
- Close MCP client AFTER streaming completes (in `onFinish` callback, not before)
- Handle MCP server failures gracefully with user-friendly error messages
- Use singleton pattern for MCP client reuse within a session to minimize connection overhead
- Configure server URL via `SCAHA_MCP_URL` environment variable

**Rationale**: The SCAHA MCP server is a separate Vercel deployment maintained independently. StreamableHTTP enables HockeyGoTime to connect to this remote service without spawning subprocesses. Incorrect MCP lifecycle causes "closed client" errors mid-stream, breaking the user experience.

**Note**: The SCAHA MCP server itself may use STDIO for Claude Desktop integration, but HockeyGoTime connects to it via HTTP.

### V. Package Manager Discipline

This project uses **pnpm exclusively**. No npm or yarn commands are permitted in documentation or scripts. The workflow MUST:

- Use `pnpm` for all dependency management
- Document all commands using `pnpm` (e.g., `pnpm dev`, `pnpm build`)
- Reject PRs that introduce npm or yarn usage
- Maintain lock file integrity (`pnpm-lock.yaml`)

**Rationale**: Mixed package managers cause dependency conflicts, disk space bloat, and version mismatches. pnpm's workspace support and disk efficiency are required for the monorepo structure (HockeyGoTime + SCAHA MCP).

### VI. AI Model Selection & Fallback Strategy

GPT-5 and GPT-5-mini are the primary models. GPT-4o and GPT-4o-mini have proven insufficient for complex schedule queries and MUST NOT be used. The system MUST:

- Default to GPT-5 for schedule queries requiring reasoning
- Use GPT-5-mini for simple queries (cached lookups, date parsing)
- Configure model effort level based on query complexity (production uses GPT-5-mini with 'low' setting)
- Never fall back to GPT-4o models even if GPT-5 is unavailable (fail explicitly)
- Document model selection rationale in code comments

**Rationale**: GPT-4o models fail regularly on queries like "What teams do the 14U B Jr Kings (1) play this season and how many times?" GPT-5's reasoning capabilities are non-negotiable for multi-step hockey schedule analysis. GPT-5-mini with 'low' effort setting provides cost-effective performance for most queries.

**Current Production**: Running GPT-5-mini with 'low' effort setting at https://hockeygotime.vercel.app

### VII. Deployment Ready & Environment Configuration

Every feature MUST work in Vercel production with proper environment configuration. The deployment strategy MUST:

- Use environment variables for all configuration (API keys, MCP server URLs)
- Configure `SCAHA_MCP_URL` to point to the deployed SCAHA MCP server (default: https://scaha-mcp.vercel.app/api/mcp)
- Test locally with `.env.local` before deploying to Vercel
- Document all required environment variables in `.env.local.template`
- Handle network failures when connecting to remote MCP server
- Deploy automatically to Vercel on push to main branch

**Rationale**: HockeyGoTime and SCAHA MCP server are separate Vercel deployments that communicate over HTTP. Proper environment configuration ensures the production app connects to the correct MCP server endpoint. Production failures = angry parents missing game information.

**Current Production**: https://hockeygotime.vercel.app/hockey (automatic deployment from main branch)

**Known Issue**: App currently served at `/hockey` path. Should be moved to root path `/` for cleaner URLs (prioritize for Capstone demo).

## Development Workflow

### Pre-Commit Checklist

Before committing any code, developers MUST:

1. Run `pnpm tsc --noEmit` - Zero TypeScript errors allowed
2. Test locally with `pnpm dev` - Verify changes work end-to-end
3. Verify MCP client lifecycle (if touching MCP code) - No "closed client" errors
4. Check response times (if touching queries) - Must meet <3s target
5. Verify remote MCP server connectivity (if touching MCP integration)
6. Verify timezone conversions (if touching date/time code) - Test PST/PDT edge cases

### Pre-Deployment Checklist

Before pushing to main branch (triggers automatic Vercel deployment):

1. All pre-commit checks passed
2. Test against production MCP server endpoint (https://scaha-mcp.vercel.app/api/mcp)
3. Verify environment variables are set in Vercel dashboard
4. Check that changes work with GPT-5-mini 'low' setting (production config)

### Code Review Requirements

All PRs MUST:

- Pass TypeScript strict mode checks
- Include performance impact assessment (if touching queries or caching)
- Document AI model choice rationale (if changing model selection)
- Verify pnpm usage (reject npm/yarn)
- Verify StreamableHTTP transport usage for MCP (reject STDIO for HockeyGoTime)

### Testing Discipline

Tests are OPTIONAL but ENCOURAGED for:

- MCP client lifecycle edge cases
- Date/time parsing and timezone handling
- User input normalization logic
- Travel time calculations
- Remote MCP server failure scenarios
- **Timezone edge cases**: PST/PDT transitions during DST changes (March/November)
- **Time format display**: Verify 12-hour AM/PM format in all user-facing outputs

When tests are included, TDD is preferred: write failing tests, then implement.

### Capstone Development Priorities

Given the 2.5-week Capstone timeline, apply these additional workflow rules:

**Time-Boxed Development**:
- Complete P1 features first (user preferences, routing fix)
- Move to P2 features only after P1 is production-ready
- Do not start P3+ features unless P1 and at least one P2 feature are complete

**Demo-Driven Development**:
- Prioritize features that showcase AI agent capabilities
- Focus on end-to-end user journeys over backend polish
- Ensure every implemented feature has a clear demo script

**Risk Management**:
- Avoid large refactors during Capstone period
- Prefer working incremental improvements over ambitious rewrites
- Test in production early and often (Vercel auto-deploy enables this)

**Venue Mapping Approach**:
- **Capstone**: Hardcode venue name → address mappings in system prompt for demo schedules (learning focus: retrieval methods, not data accuracy)
- **Post-Capstone**: Implement full LLM-based venue resolution pipeline (scrape all venues, LLM deduplication, address search with confidence scoring, human-in-the-loop verification, agentic RAG retrieval)

## Architecture Constraints

### Next.js App Router

- App Router MUST be used (no Pages Router)
- AI SDK 5 streaming with `streamText` is the standard pattern
- Server components by default; client components only when required

### MCP Integration Architecture

- **SCAHA MCP Server**: Remote Vercel deployment at https://scaha-mcp.vercel.app/api/mcp
- **Transport**: StreamableHTTP via `StreamableHTTPClientTransport`
- **Connection Pattern**: HTTP client connecting to remote server (not subprocess spawning)
- **Future leagues (PGHL)**: Same StreamableHTTP pattern as SCAHA (remote Vercel deployment)
- **Local Development**: Use same remote MCP server or configure local endpoint via `SCAHA_MCP_URL`

**Note**: The SCAHA MCP server repository may maintain STDIO support for Claude Desktop, but HockeyGoTime exclusively uses HTTP transport.

### Timezone Handling & Time Display

**Challenge**: Google Maps Routes API requires UTC timestamps, but SCAHA schedules and users operate in California time (Pacific Time Zone with DST transitions).

**Requirements**:

1. **SCAHA Schedule Times**: All SCAHA games are in California (America/Los_Angeles timezone)
   - Store times internally with timezone information
   - SCAHA MCP returns times in local California time

2. **Google Routes API**: Requires ISO 8601 timestamps in UTC
   - Convert California game times to UTC before API calls
   - Account for PST (UTC-8) vs PDT (UTC-7) during DST transitions
   - DST transitions: March (spring forward) and November (fall back)

3. **User Display**: All times shown to users MUST be in 12-hour AM/PM format
   - Example: "7:00 AM" NOT "07:00" or "0700"
   - Include timezone indicator when ambiguous: "7:00 AM PST" or "7:00 AM PDT"
   - Apply to: game times, wake-up times, departure times, arrival times

4. **Implementation Pattern**:
   ```typescript
   // SCAHA game time (California local time)
   const gameTime = "2025-10-05T07:00:00"; // 7:00 AM game time

   // Convert to UTC for Google Routes API
   const gameTimeUTC = toUTC(gameTime, "America/Los_Angeles"); // Handles PST/PDT
   const arrivalTimeUTC = gameTimeUTC; // Google API uses arrivalTime parameter

   // API call with UTC timestamp
   const route = await computeRoute({
     arrivalTime: arrivalTimeUTC.toISOString() // ISO 8601 UTC format
   });

   // Convert back to California time for user display
   const departureTimePT = fromUTC(departureTimeUTC, "America/Los_Angeles");
   const displayTime = format12Hour(departureTimePT); // "5:30 AM PST"
   ```

5. **Validation Requirements**:
   - All date/time parsing MUST handle timezone information
   - Test DST transition edge cases (games near 2:00 AM on DST change days)
   - Verify UTC conversions are correct for both PST and PDT periods
   - Ensure 12-hour format displays correctly for all hours (12:00 AM/PM edge cases)

**Rationale**: Incorrect timezone handling leads to wrong travel time calculations, causing parents to miss games or arrive hours early/late. User feedback confirms preference for familiar 12-hour AM/PM format over 24-hour military time.

**Recommended Libraries**:
- `date-fns` with `date-fns-tz` for timezone-aware operations
- Avoid native `Date` object timezone methods (inconsistent across environments)

### Venue Address Resolution

**Challenge**: SCAHA schedules list venue names as odd acronyms, colloquial names, or outdated sponsorship names. Venue names may be inconsistent across divisions (initials vs. partial names for the same rink).

**Capstone Implementation (P1)**:
- Hardcode venue name → address mappings in system prompt for demo schedules
- Purpose: Demonstrate agentic retrieval methods, not build production data pipeline
- Scope: Only venues appearing in demo schedules (minimize manual effort)

**Post-Capstone Implementation (P3)**:
1. **Venue Discovery**: Scrape all venue names across all SCAHA divisions
2. **LLM Deduplication**: Use LLM to identify duplicate venues with different naming conventions
3. **Address Search**: LLM searches for physical addresses with confidence scoring
4. **Human Verification**: One-time human-in-the-loop verification for low-confidence matches
5. **RAG Storage**: Store verified venue → address mappings in file/database for agentic RAG retrieval

**Rationale**: Capstone focuses on learning retrieval patterns, not data engineering. Hardcoding for demo is acceptable; post-Capstone can build robust pipeline.

### Monetization & Sustainability

**Goal**: Offset API costs (Google Maps Routes API, OpenAI GPT-5) through voluntary user donations while keeping the app free to use.

**Capstone Implementation (P5 - if time permits)**:
- Add donation/support button at bottom of UI
- Link to dedicated support page with payment options:
  - Venmo: one-time donations ($1, $5 options)
  - PayPal: one-time donations ($1, $5 options) or recurring ($1/month)
- Simple, non-intrusive placement (does not block core functionality)
- Messaging: "Support the app", "Help keep this app free", or "Donate"

**Post-Capstone A/B Testing & Analytics**:
1. **Message Variation Testing**: Randomly display one of three messages per session:
   - "Donate" (control)
   - "Support the app" (variant A)
   - "Help keep this app free" (variant B)
2. **Analytics Tracking**:
   - Log donation button clicks and payment page visits
   - Track conversion events (successful donations)
   - Monitor drop-off rates at each funnel step
   - Calculate conversion rate by message variation
3. **Optimization**: Use data to determine most effective messaging and placement

**Rationale**: API costs (especially Google Maps with traffic data) can be significant. Voluntary donations keep the app free while funding infrastructure. A/B testing post-Capstone optimizes donation conversion without compromising user experience during Capstone demo.

### Styling & Components

- Tailwind CSS v4 for all styling
- shadcn/ui components (New York style, neutral base color)
- No custom CSS files; Tailwind utilities only

## Governance

### Constitution Authority

This constitution supersedes all other practices, documentation, and tribal knowledge. When conflicts arise:

1. Constitution principles take precedence
2. CLAUDE.md provides implementation guidance
3. README.md documents current capabilities
4. Spec documents describe features, not architecture

### Amendment Process

Amendments require:

1. Clear documentation of what changed and why
2. Update of dependent templates (plan-template.md, spec-template.md, tasks-template.md)
3. Verification that existing features remain compliant
4. Version bump following semantic versioning

### Versioning Policy

- **MAJOR** (X.0.0): Backward incompatible principle changes (e.g., transport protocol change, removing type safety requirement)
- **MINOR** (X.Y.0): New principle added or materially expanded guidance (e.g., adding PGHL multi-league principle)
- **PATCH** (X.Y.Z): Clarifications, wording, typo fixes, non-semantic refinements

### Compliance Reviews

Every feature planning phase (`/speckit.plan`) MUST include a "Constitution Check" verifying:

- Type safety gates are defined
- Performance targets align with <3s query response principle
- MCP integration uses StreamableHTTP transport to remote Vercel server
- AI model selection uses GPT-5/GPT-5-mini only
- pnpm usage is exclusive
- Environment variables are documented
- Timezone handling follows California (America/Los_Angeles) → UTC conversion pattern
- User-facing times display in 12-hour AM/PM format

### Capstone-Specific Governance

During the Capstone period (through 2025-10-25):

- **Feature Priority Override**: Capstone demo value takes precedence over long-term roadmap
- **Specification Flexibility**: May implement partial user stories if they deliver demo value
- **Quality Bar**: All implemented features must be production-ready, even if scope is reduced
- **Documentation**: Prioritize demo scripts and presentation materials over comprehensive docs

**Post-Capstone**: Resume normal governance after presentation. Review Capstone shortcuts and address technical debt.

**Version**: 2.1.0 | **Ratified**: 2025-10-07 | **Last Amended**: 2025-10-07
