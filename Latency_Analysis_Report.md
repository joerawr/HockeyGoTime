# Latency Analysis Report

## Comparative Summary: Google Direct vs OpenRouter

| Scenario | Google Direct (Avg) | OpenRouter (Avg) | Improvement |
| :--- | :--- | :--- | :--- |
| **Cold Start** | 24.70s | **17.13s** | 🟢 31% Faster |
| **Warm Cache** | 14.87s | **7.42s** | 🟢 50% Faster |
| **Context Retention** | 13.88s | **4.13s** | 🟢 70% Faster |
| **Reasoning (Stats)** | 8.71s | **6.23s** | 🟢 28% Faster |
| **Long Context Recall** | 9.81s | **2.10s** | 🟢 79% Faster |

**Model Used**: `google/gemini-3-flash-preview:nitro` (OpenRouter) vs `gemini-3-flash-preview` (Google Direct).

## OpenRouter Benchmark Data (Run 1-3)

| Scenario | Run 1 (s) | Run 2 (s) | Run 3 (s) | Avg (s) | StdDev (s) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Cold Start** | 16.54 | 18.10 | 16.77 | **17.13** | 0.84 |
| **Warm Cache** | 7.46 | 6.85 | 7.94 | **7.42** | 0.55 |
| **Context Retention** | 4.30 | 3.94 | 4.16 | **4.13** | 0.18 |
| **Reasoning (Stats)** | 6.24 | 6.31 | 6.15 | **6.23** | 0.08 |
| **Long Context Recall** | 2.12 | 2.07 | 2.12 | **2.10** | 0.03 |

## Key Findings
1.  **Massive Speedup**: The OpenRouter endpoint provides a consistently faster response, cutting the "thinking" time by nearly half in warm cache scenarios (7.4s vs 14.9s).
2.  **Stability**: The variance (Standard Deviation) is extremely low with OpenRouter. The model reliably uses context instead of re-triggering tools for "Retention" and "Recall" tasks, which was a major issue with the direct implementation.
3.  **Efficiency**: The "Long Context Recall" dropped from an unpredictable 3-22s to a rock-solid 2.1s, indicating the model is correctly utilizing the cached context without unnecessary processing.

## Conclusion
Migrating to OpenRouter is a clear performance upgrade. The `:nitro` routing or the specific model instance on OpenRouter handles tool outputs and context retrieval much more efficiently than the previous direct integration.
