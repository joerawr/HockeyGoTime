# Changelog

All notable changes to HockeyGoTime are documented in this file.

This project uses **continuous deployment** - every commit to `main` deploys immediately to production. We create milestone releases (1.0, 2.0, etc.) to mark significant feature sets or major improvements.

Changes are grouped by deployment date, with multiple commits per day consolidated into a single date entry.

## [1.0.0] - 2025-11-10

🎉 **First official release!** HockeyGoTime is feature-complete for SCAHA and PGHL hockey families.

### Changed
- Privacy policy date rendering now uses static date instead of dynamic date
  - **Note**: Privacy policy wording has NOT changed - only the way the date is displayed
- Adopted hybrid CD + milestone release approach (see top of this file)

## Pre-1.0 Development History

### 2025-11-09
- Fixed preference normalization and improved travel time calculation features

### 2025-11-07
- Added guardrails to prevent off-topic queries and keep conversations focused on hockey schedules

### 2025-11-06
- Added API response time metrics to analytics dashboard for performance monitoring
- Integrated Upstash Redis for persistent analytics storage
- Fixed analytics tracking timezone issues for accurate PST/PDT time recording
- Fixed UI display issues in analytics dashboard

### 2025-11-03
- Added Vercel Speed Insights integration for Core Web Vitals tracking
- Added Supabase database refresh mechanism to prevent connection pausing
- Renamed system prompt file from `hockey-prompt.ts` to `scaha-prompt.ts` for consistency
- Removed unused starter template files

### 2025-10-26
- Updated documentation with feedback system information and current features
- Added cost optimization specifications for AI model usage
- Organized feedback research documentation

### 2025-10-25
- Added email-based feedback system using Resend API
- Replaced Ko-fi coffee button with custom "Buy me a beer" button
- Improved feedback form messaging for clarity and transparency

### 2025-10-22
- Added division standings tool (`get_division_standings`) for league table queries
- Added player statistics tool support for individual and team performance queries
- Added Ko-fi donation button for community support
- Added onboarding hints and clickable helper suggestions to guide new users
- Changed user preference label from "Player Position" to "Skater/Goalie" for clarity
- Fixed grammar in helper hint messages

### 2025-10-20
- Fixed analytics dashboard timezone handling for accurate date calculations
- Fixed chart date shifting by forcing midday timestamps to prevent DST issues
- Fixed date formatting using explicit Intl.DateTimeFormat for PST accuracy

### 2025-10-18
- Added dark mode support with persistent theme preference
- Added loading states for better user feedback during API calls
- Added player position field in user preferences
- Fixed dark mode flash on page reload by improving theme initialization
- Improved LLM reliability for more accurate query responses

### 2025-10-17
- Improved travel time algorithm using iterative convergence with pessimistic traffic model
- Added Gemini API tier management documentation

### 2025-10-16
- Added clickable Google Maps directions links in travel responses with pin emoji
- Added venue database management system with aliases for flexible venue name matching
- Added comprehensive venue documentation for adding new rinks
- Made home address optional in user preferences

### 2025-10-15
- Added privacy-compliant usage analytics dashboard
- Added venue resolution system to fix address hallucination issues
- Fixed preference changes not updating chat session (now reloads page when preferences saved)
- Removed legacy documentation from main branch

### 2025-10-13
- Fixed puck image with transparent background
- Documented optional team_slug parameter for player stats

### 2025-10-12
- Updated About and Privacy pages for production readiness
- Added puck image loading optimization for Vercel
- Added wake-up time vs prep time terminology based on 9am cutoff
- Fixed AI context to include current time for filtering past games correctly
- Added PGHL stats limitation notice to system prompt

### 2025-10-11
- Switched to Gemini 2.5 Flash AI model for improved agentic behavior
- Integrated iCal-based PGHL schedule tools with team ID mappings
- Fixed timezone abbreviation handling (PT, PDT, PST, etc.) in travel calculator
- Fixed AI permission loop prevention with critical operating rules
- Improved PGHL date filtering and arrival buffer guidance
- Fixed current date injection into AI context to enable proper "next game" filtering

### 2025-10-10
- Optimized PGHL MCP integration with division-level caching
- Simplified league selector UI and removed redundancy
- Fixed season format to work universally for both SCAHA and PGHL

### 2025-10-09
- Added PGHL MCP integration and league selector for multi-league support
- Added team and player stats tools integration
- Refreshed hockey UI layout with new design
- Added structured template for travel time responses
- Added travel fallback estimate when precise calculations unavailable
- Fixed timezone parsing in DST-aware date handler
- Fixed LLM hallucination prevention for travel calculation values
- Updated browser tab metadata and site title
- Improved hero headline copy and sizing
- Updated suggestion prompts

### 2025-10-08
- Added Google Routes API integration for traffic-aware travel time calculations
- Added preferences flow with persistent storage
- Added caching system for schedule data

### 2025-10-07
- Switched to o4-mini AI model with optimized reasoning parameters

### 2025-10-06
- Switched from STDIO to HTTP transport for SCAHA MCP
- Updated to use stable SCAHA MCP server endpoint (scaha-mcp.vercel.app)
- Fixed HTTP transport implementation with StreamableHTTPClientTransport
- Deployed with STDIO MCP transport support on Vercel

### 2025-10-05
- Updated to use published @joerawr/scaha-mcp npm package with STDIO transport
- Fixed duplicate message rendering in chat UI

### 2025-10-03
- **Initial HockeyGoTime MVP** - SCAHA schedule chat functionality
- Fixed multi-step tool execution with stopWhen parameter

### 2025-10-02
- Initial project setup
- Updated FRD to reflect conversational chat architecture

---

## Version History

- **1.0.0** (2025-11-10) - First official release
