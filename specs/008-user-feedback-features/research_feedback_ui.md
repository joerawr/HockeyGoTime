# Research Task: Feedback UI Component Implementation

**Context**: We're building a user feedback feature for HockeyGoTime that allows users to submit bug reports with screenshots. This research focuses on the frontend/UI implementation.

**Your Mission**: Research and design the React components for a feedback modal with file upload that works seamlessly on both desktop and mobile browsers.

**DELIVERABLE**: Create a markdown file named `feedback_ui_findings.md` with your complete design spec and component code.

---

## What You Need to Research

### 1. shadcn/ui Dialog Component
- Review shadcn/ui dialog component documentation
- How to properly implement open/close state
- How to handle form submission within dialog
- Best practices for dialog accessibility (focus management, ESC key, etc.)
- Mobile considerations (dialog on small screens)

### 2. File Upload UX Patterns
- Best pattern for `<input type="file" accept="image/*">` in React
- How to show file preview after user selects image
- How to handle file validation (size, type) on client-side
- Mobile UX: Does file input properly trigger photo picker on iOS/Android?
- How to clear/replace selected file
- Drag-and-drop support (desktop only? worth it?)

### 3. Form Handling with File Uploads
- How to submit FormData with both text fields and file to Next.js API route
- Client-side validation before submission
- Loading states during upload (disable button, show spinner, etc.)
- Error handling UX (what to show if API returns error)
- Success state (close modal? show confirmation? redirect?)

### 4. Toast Notifications
- Review shadcn/ui toast component
- How to trigger toast from inside dialog/modal
- Success message pattern
- Error message pattern with retry option?
- Multiple toast handling (if user submits multiple times)

### 5. Auto-Capturing User Context
- How to read from localStorage in React component
- Type-safe reading of UserPreferences from localStorage
- How to handle case where preferences don't exist
- Should we show what context we're capturing to the user?
- Privacy consideration: should we ask permission to include context?

### 6. Responsive Design
- How should button appear next to Ko-fi button?
  - Desktop: side-by-side
  - Mobile: stack vertically or stay horizontal?
- Dialog sizing on mobile vs desktop
- File input button styling (make it look good, not default ugly button)
- Textarea sizing for feedback text

### 7. Component Architecture
- Should FeedbackButton and FeedbackModal be separate components or combined?
- Where should state live (button click → open modal)?
- Should we use React Hook Form or plain controlled components?
- How to share state between button and modal (context? props?)

---

## Research Strategy

1. **Review Existing Code**:
   - Look at `/home/jrogers/code/HockeyGoTime/app/page.tsx` to see current layout
   - Check PreferencePanel component to understand localStorage pattern
   - Review existing shadcn/ui components in `components/ui/`

2. **shadcn/ui Docs**:
   - Dialog component examples
   - Toast component examples
   - Form handling patterns in shadcn

3. **Modern Patterns**:
   - Search for Next.js 15 App Router + FormData + file upload patterns
   - Look for mobile-optimized file upload UX examples
   - Check for accessibility best practices (ARIA labels, keyboard nav)

4. **Mobile Testing Considerations**:
   - How to test mobile file picker behavior
   - iOS Safari quirks
   - Android Chrome quirks

---

## Deliverables

**Create a design spec that includes**:

### 1. Component Specifications

**FeedbackButton.tsx**:
- Props interface
- Where it renders (exact position relative to Ko-fi button)
- Button text/icon (just icon? icon + text on desktop only?)
- Styling (colors, size, hover states)

**FeedbackModal.tsx**:
- Props interface
- Form fields with labels
- Validation rules
- Layout (mobile vs desktop)
- Error state display
- Success state handling

### 2. Complete Code Examples

Provide full, runnable TypeScript/React components:

```typescript
// components/ui/feedback/FeedbackButton.tsx
// Full implementation
```

```typescript
// components/ui/feedback/FeedbackModal.tsx
// Full implementation
```

Include:
- All imports
- TypeScript types
- State management
- Event handlers
- Styling (Tailwind classes)

### 3. User Flow Diagram

Map out the complete user interaction:
1. User clicks "Report Issue" button
2. Modal opens with form
3. User types feedback, optionally uploads screenshot
4. User clicks Submit
5. Loading state shows
6. (Success) Toast appears, modal closes
7. (Error) Error message shows in modal, can retry

### 4. Layout Integration

Show exactly how to modify `app/page.tsx`:
- Where to import components
- Exact code changes to Ko-fi button section (line 52)
- Responsive classes for flex layout

### 5. localStorage Integration Pattern

Show how to:
- Read UserPreferences from localStorage
- Handle undefined/null cases
- Type safety with TypeScript
- Example of what gets captured and sent to API

### 6. API Integration

Show how component calls the API:
```typescript
// How to construct FormData
// How to POST to /api/feedback
// How to handle response
// How to parse errors
```

### 7. Accessibility Checklist

- [ ] Keyboard navigation works
- [ ] Screen reader announces dialog opening
- [ ] Focus management (trap focus in modal)
- [ ] ESC key closes modal
- [ ] Form validation errors announced
- [ ] File input has descriptive label
- [ ] Submit button has proper disabled state

### 8. Mobile Considerations

- [ ] File input triggers native photo picker
- [ ] Works on iOS Safari
- [ ] Works on Android Chrome
- [ ] Dialog doesn't overflow screen
- [ ] Buttons are touch-friendly size (min 44x44px)
- [ ] Keyboard appears when focusing textarea

### 9. Edge Cases to Handle

- User closes modal without submitting
- User submits without filling required field
- User selects file, then wants to remove it
- File is too large (>10MB? check GitHub limits)
- Network error during submission
- API returns 500 error
- No preferences saved (localStorage empty)
- User clicks button multiple times rapidly

---

## Output Format

**Create a file named `feedback_ui_findings.md` with your complete findings.**

Structure the markdown document with:
1. **Design Overview** (summary of approach)
2. **Complete Component Code** (ready to copy-paste)
3. **Integration Instructions** (step-by-step)
4. **Testing Checklist** (how to verify it works)
5. **Open Questions** (anything that needs decision from main developer)

**IMPORTANT**: At the end of your research, create the file `feedback_ui_findings.md` in the HockeyGoTime directory with all your findings.

---

## Notes

- We're using shadcn/ui with "New York" style
- Tailwind CSS v4
- Next.js 15 with App Router
- User preferences stored in localStorage (see `lib/storage/preferences.ts`)
- Ko-fi button is currently centered below chat interface
- Need to maintain consistent design with existing app (check `app/page.tsx` for colors/styling)

**Goal**: Create production-ready components that feel native to the existing app design and work flawlessly on mobile devices.
