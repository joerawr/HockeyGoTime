# Metrics and Latency Testing Plan

## Objective
To diagnose latency bottlenecks in the HockeyGoTime chat application and prepare for a migration to OpenRouter. We aim to differentiate between network latency (Google API, MCP), model processing time, and application overhead.

## Goals
1.  **Enhanced Observability**: Add verbose, high-resolution timing logs to the server-side code (`/api/hockey-chat` and dependencies).
2.  **Automated Latency Testing**: Create a CLI tool to run standard test scenarios against `localhost:3000` and capture performance metrics.
3.  **Baseline Establishment**: Collect timing data for Gemini 3.0 Flash (and 2.5 Flash) to compare against future OpenRouter implementations.

## Implementation Steps

### 1. Enhanced Logging (`app/api/hockey-chat/route.ts` & libs)
-   **Granular Timers**: Implement a structured logging mechanism to capture start/end times for:
    -   Request parsing and validation.
    -   MCP Client connection.
    -   Tool discovery.
    -   Individual Tool execution (with breakdown for cache hits vs. misses).
    -   External API calls (Google Maps, etc., within tools).
    -   LLM Streaming response (Time to First Token - TTFT, Total generation time).
-   **Log Format**: Ensure logs are easily grep-able or structured (JSON-like) for analysis.

### 2. CLI Test Script (`scripts/benchmark-chat.ts`)
-   **Tech Stack**: TypeScript, `node-fetch` (or built-in `fetch`).
-   **Features**:
    -   Maintain session state (cookies/headers) for multi-turn testing.
    -   Measure Client-side Round Trip Time (RTT).
    -   Parse Server-side timing headers (if we choose to send them back) or correlate with server logs.
-   **Scenarios**:
    1.  **Cold Start**: "When do we need to leave for our next game?" (Expect slow)
    2.  **Warm Cache**: "When do we need to leave for our next game?" (Expect fast)
    3.  **Context Retention**: "Who do we play?" (Expect fast, no external calls)
    4.  **Reasoning/Retrieval**: "Top 5 in points on our team?" (Expect tool call + processing)
    5.  **Long Context**: "What was the first thing I asked you?" (Expect pure LLM recall)

### 3. Execution & Verification
-   Run `pnpm dev` to start the server.
-   Run the benchmark script.
-   Analyze the combined output of client RTT and server logs to identify the slowest components.

## Success Criteria
-   We can clearly see *exactly* how many milliseconds are spent in:
    -   SCAHA/PGHL MCP calls.
    -   Google Routes API.
    -   LLM processing.
-   We have a repeatable script to verify performance improvements (or regressions) when we switch to OpenRouter.
