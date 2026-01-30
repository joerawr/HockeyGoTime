## Final Results (Success ✅)

The `openrouter-minimal` branch (Commit `5a221bf`) is the stable winner.

### Benchmarks (Actuals)
- **Single Request (Cold)**: ~16s
- **Single Request (Cached)**: 6-7s
- **Parallel Load (4 concurrent requests)**: ~17-18s average for the set.
- **Subsequent Parallel Load (Cached)**: 6-7s each.

### Technical Configuration
- **AI SDK**: `ai@5.0.60`
- **Model**: `google/gemini-3-flash-preview:nitro`
- **Stability**: Confirmed SCAHA-MCP handles parallel requests smoothly without disconnections in this configuration.

### Conclusion
The sub-20s performance goal has been met. The `:nitro` model ID on OpenRouter combined with effective schedule caching provides the necessary speed while maintaining accuracy.
