# Model Benchmark Report

Generated on: 1/30/2026, 6:25:44 PM

## Aggregate Performance (Avg Duration)

| Model | Cold Start | Warm Cache | Context Retention | Reasoning | Recall | Overall Pass Rate |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **google/gemini-3-flash-preview:nitro** | 14.65s | 3.72s | 4.11s | 7.38s | 2.78s | 100% |
| **anthropic/claude-3-haiku:nitro** | 12.18s | 4.15s | 8.84s | 12.75s | 5.19s | 13% |
| **anthropic/claude-3.5-haiku:nitro** | 10.34s | 26.05s | 8.62s | 19.12s | 9.93s | 80% |
| **openai/gpt-4o-mini:nitro** | 18.95s | 10.43s | 8.61s | 25.74s | 8.46s | 60% |
| **meta-llama/llama-4-scout:nitro** | 11.04s | 3.13s | 3.25s | 24.35s | 2.87s | 60% |

## Pass/Fail Analysis

### google/gemini-3-flash-preview:nitro
- **Cold Start - Schedule & Travel**: ✅ PASS (3/3 runs passed)
- **Warm Cache - Schedule & Travel**: ✅ PASS (3/3 runs passed)
- **Context Retention**: ✅ PASS (3/3 runs passed)
- **Reasoning - Stats**: ✅ PASS (3/3 runs passed)
- **Long Context Recall**: ✅ PASS (3/3 runs passed)

### anthropic/claude-3-haiku:nitro
- **Cold Start - Schedule & Travel**: ❌ FAIL (0/3 runs passed)
- **Warm Cache - Schedule & Travel**: ❌ FAIL (0/3 runs passed)
- **Context Retention**: ❌ FAIL (0/3 runs passed)
- **Reasoning - Stats**: ❌ FAIL (0/3 runs passed)
- **Long Context Recall**: ⚠️ UNSTABLE (2/3 runs passed)

### anthropic/claude-3.5-haiku:nitro
- **Cold Start - Schedule & Travel**: ❌ FAIL (0/3 runs passed)
- **Warm Cache - Schedule & Travel**: ✅ PASS (3/3 runs passed)
- **Context Retention**: ✅ PASS (3/3 runs passed)
- **Reasoning - Stats**: ✅ PASS (3/3 runs passed)
- **Long Context Recall**: ✅ PASS (3/3 runs passed)

### openai/gpt-4o-mini:nitro
- **Cold Start - Schedule & Travel**: ✅ PASS (3/3 runs passed)
- **Warm Cache - Schedule & Travel**: ❌ FAIL (0/3 runs passed)
- **Context Retention**: ✅ PASS (3/3 runs passed)
- **Reasoning - Stats**: ✅ PASS (3/3 runs passed)
- **Long Context Recall**: ❌ FAIL (0/3 runs passed)

### meta-llama/llama-4-scout:nitro
- **Cold Start - Schedule & Travel**: ✅ PASS (3/3 runs passed)
- **Warm Cache - Schedule & Travel**: ⚠️ UNSTABLE (1/3 runs passed)
- **Context Retention**: ⚠️ UNSTABLE (1/3 runs passed)
- **Reasoning - Stats**: ⚠️ UNSTABLE (2/3 runs passed)
- **Long Context Recall**: ⚠️ UNSTABLE (2/3 runs passed)

