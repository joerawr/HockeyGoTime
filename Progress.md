# OpenRouter Performance Benchmarking Progress

This document tracks the attempts, successes, and failures in optimizing OpenRouter model performance (latency and reliability) for Hockey Go Time.

## Summary of Attempts

### 1. Initial SDK v6 Upgrade & Nitro Implementation
- **Goal**: Achieve < 20s response times using Gemini and GPT-OSS-120B.
- **Action**: 
    - Upgraded to AI SDK v6.
    - Switched model IDs to use the `:nitro` suffix (e.g., `google/gemini-3-flash-preview:nitro`).
- **Result**:
    - **Local Success**: Achieved 17s response times on Gemini.
    - **Vercel Issue**: Latency was still high (26s+) on some branches because providers were falling back to "thinking" models or ignoring Nitro routing.

### 2. "Harden & Hide" Optimization Pass
- **Goal**: Suppress "Thought" blocks and prevent Vercel 504 timeouts.
- **Action**:
    - **Hard Tool Timeouts**: Wrapped MCP tool calls in a 15s `Promise.race`.
    - **Explicit Suppression**: Added `reasoning: { effort: "none" }` to `extraBody`.
    - **Provider Pinning**: Forced `groq` and `deepinfra` providers on GPT branches.
    - **SDK Shift**: Reverted to `@ai-sdk/openai` provider (mapping to OpenRouter) for better control over headers and extra parameters.
- **Result**:
    - **Gemini Branch**: Built successfully. However, runtime failures occurred: **SCAHA MCP client disconnected (HTTP connection closed)**.
    - **GPT Branches**: **Build Failed** on Vercel. 

## Successes ✅
- **Gemini Nitro**: Confirmed sub-20s capability when the tool chain works correctly.
- **Build Logic**: Fixed Model Context Protocol client conflicts.

## Failures ❌
- **Production Reliability**: Frequent MCP disconnections on Vercel (`🔌 SCAHA MCP client disconnected`). This prevents the schedule fetching from completing successfully in the production environment.
- **Build Rigidity**: The specialized "Harden & Hide" pass introduced build errors on some branches that were difficult to resolve without further SDK investigation.

## Current State
`openrouter-minimal` has been reverted to commit `5a221bf` (the state before the AI SDK v6 / "Harden & Hide" pass) to ensure a stable baseline.
