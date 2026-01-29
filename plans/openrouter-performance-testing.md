# OpenRouter Integration & Performance Testing Plan

## Objective
Enable OpenRouter integration to test high-performance/low-latency models and measure their impact on chat responsiveness. Identify bottlenecks and optimize the user experience.

## Branch
`development`

## Tasks

### 1. OpenRouter Configuration
- [x] Configure the AI SDK to support OpenRouter.
  - This typically involves using the `openai` provider with a custom `baseURL` (`https://openrouter.ai/api/v1`) in `app/api/hockey-chat/route.ts`.
  - Ensure API keys are handled correctly (`OPENROUTER_API_KEY`).
- [x] Implement a model switching mechanism.
  - Allow dynamic selection of models via environment variables or a config object.
  - Target Models:
    - **Cerebras**: `gpt-oss-120` (e.g., `openrouter/cerebras/gpt-oss-120` - verify ID).
    - **Gemini**: `gemini-3.0` (via Google AI Studio/OpenRouter).
    - **Llama 4**: `llama-4-scout` (with Nitro flag).

### 2. OpenRouter Specific Features
- [/] Implement "Nitro" flag support.
  - Send the `HTTP-Referer` and `X-Title` headers (good practice).
  - Add the provider-specific routing preference (Nitro/throughput).
- [ ] Implement "Floor Price" logic if applicable (to prioritize speed/throughput).

### 3. Performance Instrumentation
- [x] Add timing metrics to the API response.
  - Use `Server-Timing` headers or include a debug object in the JSON stream.
  - Metrics to capture:
    - Total API Latency.
    - Time to First Token (TTFT) - *Critical for perceived speed*.
    - Tool Execution Time (already logged, ensure it's exposed).
    - Rate limits/Tokens per second (if available from metadata).
- [x] Create a Browser Testing Script.
  - A simple JS snippet (or bookmarklet) to:
    - Open 4-6 tabs with the query "When do we need to leave for our next game".
    - Capture the start/end times from the console/network tab.
    - Aggregate results.

### 4. Bottleneck Analysis
- [ ] Analyze the timing data.
- [ ] Identify if the bottleneck is:
  - LLM Inference (TTFT or generation speed).
  - Tool Execution (Google Maps API vs. MCP calls).
  - Network overhead.
- [ ] Document findings.

## Verification
- Run the browser test suite.
- Confirm successful responses from all target models.
- Verify timing headers are present.
