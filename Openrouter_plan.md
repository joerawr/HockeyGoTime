# OpenRouter Migration & Testing Plan

## Objective
Migrate the AI provider from direct Google AI SDK to OpenRouter (using the `@openrouter/ai-sdk-provider`) to evaluate performance, cost, and flexibility. Specifically, we aim to test if `gemini-3-flash-preview` behaves differently via OpenRouter and prepare for testing other models.

## Prerequisites
-   [x] OpenRouter API Key in `.env.local` (`OPENROUTER_API_KEY`).
-   [x] Baseline latency metrics for direct Google API (collected in `metrics_cli_testing` branch).

## Implementation Steps

### 1. Install Dependencies
-   Install `@openrouter/ai-sdk-provider`.
    ```bash
    pnpm add @openrouter/ai-sdk-provider
    ```

### 2. Code Refactoring (`app/api/hockey-chat/route.ts`)
-   **Import**: Replace `@ai-sdk/google` with `@openrouter/ai-sdk-provider`.
-   **Configuration**: Initialize `createOpenRouter` with the API key.
-   **Model Selection**: Change the model string to `google/gemini-2.0-flash-001` (or OpenRouter equivalent for "preview" if available, checking OpenRouter docs).
    *   *Note*: The user requested `gemini-3-flash-preview`. I need to verify its availability on OpenRouter. If "3.0" isn't out/public on OR yet, I will check for `google/gemini-2.0-flash-001` or similar, but the user explicitly said "gemini-3-flash-preview:nitro" or similar.
    *   *Correction*: The user mentioned `gemini-3-flash-preview`. I will assume it maps to `google/gemini-2.0-flash-thinking-exp-1219` or similar on OpenRouter, or explicitly `google/gemini-flash-1.5`.
    *   *User instruction*: "Model: gemini-3-flash-preview:nitro". I will use this exact string if possible, or `google/gemini-2.0-flash-001` if that's what "3.0 preview" actually is (Google's naming can be confusing, "Gemini 2.0 Flash" is the current "next gen" preview).
    *   **Clarification**: Google recently released "Gemini 2.0 Flash". The user might be referring to that as "3.0" informally or I should stick to what they said if it exists. I'll check OpenRouter model list if needed.
-   **Integration**: Update `streamText` to use the OpenRouter model instance.

### 3. Verification & Testing
-   **Build**: Ensure `pnpm run build` passes.
-   **Benchmark**: Run `scripts/benchmark-chat.ts` 3 times.
-   **Comparison**: Compare results with `Latency_Analysis_Report.md` from the previous branch.

## Success Criteria
-   The application functions identically to before (tools work, reasoning works).
-   We have a new set of latency metrics for OpenRouter.
-   We can confirm whether the "10s overhead" persists.

## Future Steps (Post-Plan)
-   Test `openai/gpt-4o` or `anthropic/claude-3.5-sonnet` to compare latency.
