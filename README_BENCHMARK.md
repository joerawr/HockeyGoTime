# OpenRouter Model Benchmarking

This branch contains tooling to benchmark various LLM models via OpenRouter for the HockeyGoTime application.

## Current State
- **Branch**: `openrouter-testing`
- **Provider**: OpenRouter (`@openrouter/ai-sdk-provider`)
- **Status**: Infrastructure is ready. Verification run with `google/gemini-3-flash-preview:nitro` passed successfully.

## Files
- `scripts/benchmark-chat.ts`: Client-side script that simulates a user session, measures latency, and verifies response correctness.
- `scripts/run-model-benchmarks.ts`: Master script that iterates through a list of models, restarts the server, and aggregates results into a report.
- `Latency_Analysis_Report.md`: Previous results comparison.

## How to Resume Testing

1.  **Ensure Environment Variables**:
    Make sure `.env.local` has a valid `OPENROUTER_API_KEY`.

2.  **Run the Benchmark Suite**:
    This script will test 5 models (Gemini Flash, Claude Haiku 3/3.5, GPT-4o-mini, Llama 4 Scout) and generate `Model_Benchmark_Report.md`.

    ```bash
    npx tsx scripts/run-model-benchmarks.ts
    ```

    *Note: The script takes about 10 minutes to run.*

3.  **Analyze Results**:
    Check `Model_Benchmark_Report.md` for a comparison of latency and pass rates.

## Troubleshooting
If the script fails or hangs:
-   Kill any rogue server processes: `pkill -f "next-server"`
-   Check logs: `server_*.log` files are created for each model run.
