# Latency Analysis Report (Gemini 3.0 Flash Preview)

## Baseline Metrics (Localhost)

### Detailed Breakdown (Run 1)
| Scenario | Total RTT | MCP Connect | Data Retrieval | LLM Overhead |
| :--- | :--- | :--- | :--- | :--- |
| **Cold Start** (Schedule) | 26.3s | 3.05s | 10.3s (Miss) | ~11s |
| **Warm Cache** (Schedule) | 12.5s | 0.48s | <1ms (Hit) | ~11.5s |
| **Context Retention** | 11.7s | 0.41s | <1ms (Hit) | ~10.8s |
| **Stats Query** | 8.2s | 0.34s | 2.7s (Exec) | ~5s |
| **Long Context Recall** | 22.4s | 0.37s | 1.8s (Exec) | ~19s |

### Multi-Run Comparison (Total Duration)

| Scenario | Run 1 (s) | Run 2 (s) | Run 3 (s) | Avg (s) | StdDev (s) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Cold Start** | 26.33 | 22.02 | 25.75 | **24.70** | 2.34 |
| **Warm Cache** | 12.49 | 14.25 | 17.88 | **14.87** | 2.75 |
| **Context Retention** | 11.68 | 23.22 | 6.73 | **13.88** | 8.48 |
| **Reasoning (Stats)** | 8.22 | 9.79 | 8.11 | **8.71** | 0.94 |
| **Long Context Recall** | 22.43 | 3.68 | 3.32 | **9.81** | 10.93 |

## Key Findings
1.  **High Variance in Context Tasks**: The "Context Retention" and "Long Context Recall" scenarios show massive variance (StdDev ~8-10s).
    -   *Cause*: The model occasionally hallucinates a need to re-fetch data (via tools) even when it has the answer in context. In Run 2, "Context Retention" took 23s (likely tool calls), while in Run 3 it took 6.7s (pure context). Similarly for "Long Context Recall" in Run 1 (22s vs ~3.5s).
2.  **Consistent Overhead**: Cold starts consistently take ~24-26s, and even warm cache hits hover around 15s. This indicates a consistent ~10-15s "floor" for requests that involve any tool usage or complex orchestration, regardless of data fetching speed.
3.  **MCP Latency**: The first connection to the StreamableHTTP MCP server takes ~3s. Subsequent connections are faster (~400ms).
4.  **Data Latency**: The `get_schedule` tool is the slowest external dependency, taking ~10s on a cache miss.

## Conclusion
Switching to OpenRouter will allow us to compare if this ~10s model overhead is specific to the Google AI SDK/API or if it's a characteristic of the Flash models when using multiple tools. The high variance in context tasks suggests prompt engineering might also be needed to discourage redundant tool use.