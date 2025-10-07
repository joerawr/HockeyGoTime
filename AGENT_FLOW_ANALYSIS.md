# Agent Flow Analysis - "Who are the 14B jr Kings playing on 10/12?"

## Timeline (Total: ~77 seconds)

```
User Question: "Who are the 14B jr Kings playing on 10/12?"
│
├─ Step 1: Agent Thinking (44 seconds) 🐌 BOTTLENECK #1
│   └─ "Thought for 44 seconds"
│   └─ Deciding what tools to call
│
├─ Step 2: Tool Call #1 - list_schedule_options (parallel)
│   ├─ Call A: list_schedule_options(season="SCAHA 2025/26 Season", schedule="14U B")
│   │   └─ Returns: teams list including "Jr. Kings (1)"
│   │   └─ Duration: ~3-5 seconds (Puppeteer scrape)
│   │
│   └─ Call B: list_schedule_options(season="SCAHA 2025/26 Season", schedule="14U A") ❌ WASTE
│       └─ Returns: teams list (wrong division!)
│       └─ Duration: ~3-5 seconds (Puppeteer scrape)
│       └─ WHY? Agent confused, searched wrong division
│
├─ Step 3: Agent Thinking (24 seconds) 🐌 BOTTLENECK #2
│   └─ "Thought for 24 seconds"
│   └─ Processing tool results, deciding next action
│
├─ Step 4: Tool Call #2 - get_schedule
│   └─ get_schedule(season="2025/26", schedule="14U B", team="Jr. Kings (1)", date="2025-10-12")
│   └─ Returns: Game vs Avalanche at 3:00 PM
│   └─ Duration: ~5-8 seconds (Puppeteer scrape)
│
├─ Step 5: Agent Thinking (9 seconds) 🐌 BOTTLENECK #3
│   └─ "Thought for 9 seconds"
│   └─ Formatting final response
│
└─ Final Response
    └─ "On Sunday, October 12th at 3:00 PM, the Jr. Kings (1) play the Avalanche..."
```

## Performance Breakdown

| Phase | Duration | Percentage | Bottleneck? |
|-------|----------|------------|-------------|
| **Agent Thinking #1** | 44s | 57% | 🔴 YES |
| **Tool Execution** | 10s | 13% | 🟡 Moderate |
| **Agent Thinking #2** | 24s | 31% | 🔴 YES |
| **Agent Thinking #3** | 9s | 12% | 🟡 Moderate |
| **Total** | ~77s | 100% | |

## Key Findings

### 🔴 Critical Issues

1. **Excessive Reasoning Time (77s total thinking)**
   - Step 1: 44 seconds to decide which tools to call
   - Step 2: 24 seconds to process results
   - Step 3: 9 seconds to format response
   - **Problem**: `reasoningEffort: "minimal"` doesn't seem to be working
   - **Impact**: 77% of total time is just thinking

2. **Unnecessary Tool Call**
   - Agent called `list_schedule_options` for both "14U B" and "14U A"
   - Only needed "14U B" (correct division)
   - **Waste**: ~3-5 seconds + extra context processing time
   - **Why**: Agent was confused about which division Jr. Kings is in

### 🟡 Minor Issues

3. **Tool Execution Time (10s)**
   - Each Puppeteer scrape: 3-5 seconds
   - StreamableHTTP roundtrip overhead
   - Not terrible, but could be cached

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    User: "14B jr Kings 10/12?"              │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              STEP 1: Initial Reasoning (44s) 🔴             │
│  • Parse user question                                      │
│  • Identify: team="Jr Kings", division="14B", date="10/12"  │
│  • Plan: Need to find team options, then get schedule      │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         STEP 2: Tool Calls (parallel, ~5-8s total)          │
│                                                             │
│  ┌──────────────────────┐    ┌──────────────────────┐     │
│  │ list_schedule_options│    │ list_schedule_options│     │
│  │ season: 2025/26      │    │ season: 2025/26      │     │
│  │ schedule: 14U B ✅   │    │ schedule: 14U A ❌   │     │
│  └──────┬───────────────┘    └──────┬───────────────┘     │
│         │                            │                      │
│         ▼                            ▼                      │
│  StreamableHTTP          StreamableHTTP                     │
│  → scaha-mcp.vercel.app  → scaha-mcp.vercel.app           │
│  → Puppeteer scrape      → Puppeteer scrape               │
│  → Returns: Jr. Kings(1) → Returns: Jr. Kings (wrong!)    │
│                                                             │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│           STEP 3: Process Results (24s) 🔴                  │
│  • Parse both tool responses                                │
│  • Realize 14U A was wrong, use 14U B data                 │
│  • Extract team: "Jr. Kings (1)"                           │
│  • Plan next action: get_schedule for 10/12                │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              STEP 4: Tool Call (~5s)                        │
│                                                             │
│  ┌──────────────────────────────────────────────┐          │
│  │ get_schedule                                 │          │
│  │ season: 2025/26                              │          │
│  │ schedule: 14U B                              │          │
│  │ team: Jr. Kings (1)                          │          │
│  │ date: 2025-10-12                             │          │
│  └──────┬───────────────────────────────────────┘          │
│         │                                                   │
│         ▼                                                   │
│  StreamableHTTP → scaha-mcp.vercel.app                     │
│  → Puppeteer scrape                                        │
│  → Returns: Game data (Avalanche, 3:00 PM, Aliso Viejo)   │
│                                                             │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│            STEP 5: Format Response (9s) 🟡                  │
│  • Parse game data                                          │
│  • Format human-readable response                           │
│  • Add context (away game, jersey color, emoji)            │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  "On Sunday, October 12th at 3:00 PM, the Jr. Kings (1)    │
│   play the Avalanche at Aliso Viejo Ice (Rink 1).          │
│   It's an away game, so plan on white/light jerseys.       │
│   Bring both jerseys to be safe! 🏒"                        │
└─────────────────────────────────────────────────────────────┘
```

## Optimization Opportunities

### 🎯 High Impact (Save 50-60 seconds)

1. **Fix Reasoning Effort**
   - Current: `reasoningEffort: "minimal"` seems ignored
   - Goal: Reduce 77s thinking to <10s
   - Action: Verify API parameter is correct, check AI SDK version
   - **Potential savings: 60+ seconds**

2. **Improve System Prompt**
   - Add explicit examples showing single-step tool calling
   - Tell agent: "Call get_schedule directly if you have team/date"
   - Reduce confusion about divisions
   - **Potential savings: 20-30 seconds**

3. **Reduce Tool Calls**
   - Agent shouldn't need `list_schedule_options` if user specifies division
   - "14B jr Kings" → directly call `get_schedule` with team="Jr. Kings (1)"
   - **Potential savings: 5-10 seconds**

### 🎯 Medium Impact (Save 5-10 seconds)

4. **Cache Team Lists**
   - Cache `list_schedule_options` results (teams don't change mid-season)
   - Avoid Puppeteer scrape for known divisions
   - **Potential savings: 3-5 seconds per query**

5. **Parallel Tool Execution**
   - Already happening, but could be optimized further
   - **Potential savings: 2-3 seconds**

### 🎯 Low Impact (Save 1-3 seconds)

6. **Response Streaming**
   - Start streaming response before full reasoning completes
   - Show "Looking up 14B Jr Kings..." immediately
   - **Better UX, not faster overall**

## Recommended Actions

### Immediate (Today)

1. ✅ Verify `reasoningEffort: "minimal"` syntax in AI SDK
2. ✅ Test other models (gpt-4o-mini, gpt-4o) for speed comparison
3. ✅ Add logging to see if reasoning_effort parameter is being sent

### Short-term (This Week)

4. Improve system prompt with:
   - Explicit tool usage examples
   - "Don't verify team exists if user specifies it"
   - "Call tools directly, minimize planning steps"

5. Add conversation context:
   - Remember user's preferred team
   - Skip team lookup if context available

### Long-term (Next Sprint)

6. Implement caching layer for:
   - Team lists per division
   - Recent game schedules

7. Consider alternative models:
   - Claude 3.5 Haiku (very fast)
   - GPT-4o-mini (cheaper, faster than GPT-5)
   - Gemini 2.0 Flash (fast, good at tool calling)

## Expected Performance After Fixes

| Phase | Current | Target | Improvement |
|-------|---------|--------|-------------|
| Reasoning | 77s | 5-10s | 🟢 87% faster |
| Tool calls | 10s | 5-7s | 🟢 40% faster |
| **Total** | **~87s** | **~12-15s** | **🟢 83% faster** |

## Model Comparison Notes

Based on CLAUDE.md notes:
- ✅ **gpt-5** - Currently using, but reasoning_effort not working
- ❌ **gpt-4o / gpt-4o-mini** - Previous testing showed "not acceptable answers"
- ❓ **gpt-5-nano** - Not yet tested
- ❓ **Gemini 2.5 Flash** - Was working well before rollback
- ❓ **Claude 3.5 Haiku** - Worth testing for speed

## Conclusion

**The bottleneck is 100% the reasoning time, not the tool execution.**

GPT-5 with `reasoningEffort: "minimal"` is taking 77 seconds to think, which is slower than the default reasoning mode. This suggests:

1. The parameter isn't being respected by the API
2. The AI SDK might not be sending it correctly
3. GPT-5 might have a minimum thinking time regardless of the flag

**Next steps**:
1. Check AI SDK documentation for correct parameter format
2. Add debug logging to see what's being sent to OpenAI API
3. Test with gpt-5-nano and other fast models
4. Consider switching back to Gemini 2.5 Flash if it was faster
