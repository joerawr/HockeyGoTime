# Chat Component Guidelines

This document provides specific guidance for working with the chat interface components in this directory.

## Chat Assistant Component (`chat-assistant.tsx`)

### Performance Optimization

- **Debounced Streaming**: Messages are debounced at 30ms intervals to prevent excessive re-renders during streaming
- **Memoized Components**: Use `MemoizedToolCall` and `MemoizedMessage` to prevent unnecessary re-renders
- **Immediate Updates**: Critical events (streaming stops, new tool calls) bypass debouncing for instant UI updates

### Tool Display Requirements

#### Human-Readable Labels
- **ALWAYS** display human-readable labels for tools instead of technical names
- Map tool types to display names:
  ```typescript
  const toolDisplayNames: Record<string, string> = {
    'tool-retrieveKnowledgeBase': 'Knowledge Base Search',
    // Add more mappings as tools are added
  };
  ```
- Pass `displayName` to the ToolHeader's `type` prop (with type assertion if needed)

#### Tool Accordion Behavior
- **Auto-expand** during execution:
  - `"input-streaming"` - Tool is being called
  - `"input-available"` - Tool is running
  - `"output-error"` - Tool failed (keep expanded to show error)
- **Auto-collapse** when complete:
  - `"output-available"` - Tool finished successfully (collapse to reduce clutter)

#### Tool Status Indicators
- Show loading state with emoji and human-readable label during `"input-streaming"`:
  ```tsx
  🔍 Knowledge Base Search...
  ```
- Display tool input/output only after streaming phase completes
- Keep error states visible for debugging

### Message Flow Architecture

#### Chronological Ordering
- Tool calls and messages are treated as **flow items** in chronological order
- Tool calls appear **before** the assistant messages that use their results
- Each flow item has a unique key to prevent React warnings

#### Message Structure
- Messages use `parts` array, NOT simple `content` field
- Part types include:
  - `"text"` - Regular message text
  - `"reasoning"` - AI reasoning (displayed as collapsible blocks)
  - `"tool-*"` - Tool execution results

### Reasoning Token Display

- **Reasoning parts** are extracted and rendered as `<Reasoning>` components
- Auto-opens during streaming, auto-closes 1 second after completion
- Shows duration: "Thought for X seconds" after completion
- Renders **before** the actual message text

### Sources Display Rules

#### Positioning
- Sources **MUST** render below messages, never side-by-side
- Sources **NEVER** appear below tool call blocks
- Only show sources when there's actual text content in the message

#### Source Association
- Sources are extracted from the most recent `retrieveKnowledgeBase` tool call
- Look backward through flow items to find the relevant tool output
- Display sources only for the assistant message that follows the tool call

### Component Integration

#### Using ChatAssistant
```tsx
// With default API endpoint
<ChatAssistant />

// With custom API endpoint (e.g., RAG agent)
<ChatAssistant api="/api/rag-agent" />
```

#### Message Sending
- **CRITICAL**: Always use `sendMessage({ text: "message" })` format
- **NEVER** use `sendMessage("string")` - this causes runtime errors

### UI/UX Best Practices

1. **Visual Hierarchy**:
   - Reasoning blocks → Tool calls → Message text → Sources

2. **Loading States**:
   - Show streaming indicators for tools
   - Disable submit button during streaming

3. **Error Handling**:
   - Keep tool errors expanded for visibility
   - Gracefully handle missing data with fallbacks

4. **Accessibility**:
   - All collapsible elements are keyboard navigable
   - Clear visual indicators for expand/collapse states

## Testing Checklist

When modifying chat components, verify:

- [ ] Tools display human-readable names
- [ ] Tools auto-collapse when complete
- [ ] Sources appear below messages (not tool calls)
- [ ] Reasoning blocks render and animate correctly
- [ ] Message ordering is chronological
- [ ] No duplicate React keys
- [ ] Streaming feels responsive (30ms debounce)
- [ ] TypeScript compilation passes (`pnpm tsc --noEmit`)