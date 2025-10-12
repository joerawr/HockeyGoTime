# Feature Specification: Replace Generic Placeholder Content

**Feature Branch**: `003-other-generic-leftovers`
**Created**: 2025-10-09
**Status**: Draft
**Input**: User description: "  - Other generic leftovers worth tightening soon:
      - app/about/page.tsx:15 still ships the stock "This starter showcases a minimal AI chat interface…" copy; we should swap in a short HGT story or remove the route if it's not public.
      - app/privacy/page.tsx:11 contains placeholder legal text about collecting account data. Since we only keep preferences client-side, we should rewrite the policy to match reality (or hide the page until
        we have a real policy).
      - app/favicon.ico remains the default Next.js logo; replacing it with the HGT mark will polish the browser tab even further (and we can purge unused /public/next.svg, etc.).

These two statement seem incorrect in the privacy page:
Information We Collect
We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support.

How We Use Your Information
We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.

We do not collect any personal information.  All user preferences are stored in localStorage on the user's device.  We do not have user accounts or store any user data on our servers.
Correct?"

## User Scenarios & Testing

### User Story 1 - Privacy Policy Reflects Actual Data Practices (Priority: P1)

Users and parents visiting HockeyGoTime need to understand the app's data practices. Currently, the privacy policy contains misleading placeholder text claiming the app collects account information and stores user data, when in reality HockeyGoTime stores all preferences client-side in localStorage and collects no personal information.

**Why this priority**: Legal and trust issue. Inaccurate privacy policy undermines user trust and could expose the app to regulatory scrutiny. This is the highest-risk item and must be fixed before public launch.

**Independent Test**: Can be fully tested by visiting the privacy page and verifying all statements accurately describe the app's client-side-only data model. Delivers immediate compliance and trust value.

**Acceptance Scenarios**:

1. **Given** a parent visits `/privacy`, **When** they read the privacy policy, **Then** they see accurate statements that the app stores no user data on servers and all preferences are client-side only
2. **Given** a parent visits `/privacy`, **When** they read "Information We Collect" section, **Then** they see clear statement that no personal information is collected
3. **Given** a parent visits `/privacy`, **When** they read "How We Use Your Information" section, **Then** they see accurate description of localStorage-based preferences with no server-side storage

---

### User Story 2 - About Page Tells HockeyGoTime Story (Priority: P2)

Users visiting the About page expect to learn about HockeyGoTime and its purpose for SCAHA hockey families. Currently, they see generic Next.js starter template copy about "AI chat interface" and "reusable UI primitives."

**Why this priority**: Brand identity and user clarity. While not a legal issue like privacy, this directly impacts user understanding of what HockeyGoTime is and why it exists. Should be fixed before public launch.

**Independent Test**: Can be fully tested by visiting `/about` and verifying the content explains HockeyGoTime's purpose for SCAHA families. Delivers standalone brand value.

**Acceptance Scenarios**:

1. **Given** a parent visits `/about`, **When** they read the page content, **Then** they see a description of HockeyGoTime as a conversational AI for SCAHA hockey schedules
2. **Given** a parent visits `/about`, **When** they read the page content, **Then** they understand the app helps them find game times, opponents, and venues through natural language queries
3. **Given** a parent visits `/about`, **When** they read the page content, **Then** they see no references to "starter template" or generic Next.js terminology

---

### User Story 3 - Browser Tab Shows HockeyGoTime Brand (Priority: P3)

Users opening HockeyGoTime in their browser see the default Next.js logo favicon, not the HockeyGoTime brand mark. This makes the tab harder to identify among multiple open tabs and lacks professional polish.

**Why this priority**: Visual polish and brand consistency. This is the lowest priority as it doesn't affect functionality or trust, but improves the professional appearance and tab discoverability.

**Independent Test**: Can be fully tested by opening the app in a browser and verifying the HockeyGoTime logo appears in the browser tab. Delivers standalone branding value.

**Acceptance Scenarios**:

1. **Given** a user opens HockeyGoTime in their browser, **When** they look at the browser tab, **Then** they see the HockeyGoTime logo instead of the Next.js logo
2. **Given** a user has multiple tabs open, **When** they scan their tabs, **Then** they can easily identify HockeyGoTime by its distinctive logo
3. **Given** unused Next.js assets exist in `/public`, **When** the favicon is replaced, **Then** obsolete default assets (next.svg, vercel.svg, etc.) are removed to keep the project clean

---

### Edge Cases

- What happens if a user bookmarks the About page before it's updated? (No impact - static page update)
- What happens if the HockeyGoTime logo file is missing? (Build should fail or fall back gracefully)
- What happens if the privacy policy is legally inadequate even after updates? (Out of scope - assumes legal review happens separately)

## Requirements

### Functional Requirements

- **FR-001**: Privacy policy MUST accurately state that no personal information is collected by the app
- **FR-002**: Privacy policy MUST accurately state that all user preferences are stored in localStorage on the user's device
- **FR-003**: Privacy policy MUST accurately state that the app does not have user accounts or store any user data on servers
- **FR-004**: Privacy policy MUST remove all misleading statements about "creating accounts" and "collecting information you provide directly"
- **FR-005**: About page MUST describe HockeyGoTime's purpose as a conversational AI assistant for SCAHA hockey schedules
- **FR-006**: About page MUST remove all generic Next.js starter template references
- **FR-007**: Browser favicon MUST display the HockeyGoTime logo (using existing hgt-logo.png asset)
- **FR-008**: Obsolete default Next.js assets MUST be removed from `/public` (next.svg, vercel.svg, globe.svg, file.svg, window.svg)
- **FR-009**: About page MUST explain the app helps users find game times, opponents, and venues through natural language queries

### Key Entities

- **Privacy Policy Page**: Static page at `/privacy` containing accurate data practice statements
- **About Page**: Static page at `/about` containing HockeyGoTime product story
- **Favicon**: Browser tab icon file (app/favicon.ico) displaying HockeyGoTime brand
- **Public Assets**: Static files in `/public` directory requiring cleanup

## Success Criteria

### Measurable Outcomes

- **SC-001**: Privacy policy contains zero misleading statements about data collection or account creation (verified by manual review)
- **SC-002**: About page contains zero references to "starter template" or generic Next.js terminology (verified by text search)
- **SC-003**: Browser tab displays HockeyGoTime logo in 100% of browsers (Chrome, Firefox, Safari, Edge)
- **SC-004**: Public directory contains only required assets with no unused Next.js defaults remaining (verified by file count)
- **SC-005**: All three pages (privacy, about, favicon) can be updated and tested independently without affecting other functionality

## Assumptions

- The existing `/public/hgt-logo.png` file is suitable for conversion to favicon format (ICO or modern icon formats)
- The About page should remain publicly accessible (not be removed)
- The Privacy page should remain publicly accessible (not be hidden until legal review)
- Standard favicon conversion tools or online services can convert the PNG logo to ICO format
- No legal review is required before updating the privacy policy (assumes this is internal consistency fix, not legal advice)
- The HockeyGoTime "story" can be brief (1-3 paragraphs) focusing on solving SCAHA schedule lookup for hockey parents

## Dependencies

- Existing HockeyGoTime logo file at `/public/hgt-logo.png`
- No external dependencies or API changes required
- No database or backend changes required

## Out of Scope

- Legal review or validation of privacy policy compliance with GDPR/CCPA/COPPA regulations
- Creating new branding assets beyond using the existing hgt-logo.png
- Adding new pages or routes beyond updating the existing About and Privacy pages
- Implementing actual privacy controls or data management features
- Internationalizing the About or Privacy page content
- Adding analytics or tracking to measure page views
