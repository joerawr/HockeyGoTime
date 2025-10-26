# Test gpt-oss-120b as Cost-Effective Alternative to gemini-2.5-flash

**GitHub Issue:** [#19](https://github.com/joerawr/HockeyGoTime/issues/19)

## Problem

As HockeyGoTime grows in usage, AI API costs will scale. Currently using gemini-2.5-flash for chat responses. Need to evaluate more cost-effective alternatives without sacrificing quality.

**Current costs (Gemini 2.5 Flash via Google AI):**
- Input: $0.15 per 1M tokens
- Output: $0.60 per 1M tokens

**Potential alternative (gpt-oss-120b via DeepInfra):**
- Input: ~$0.08 per 1M tokens
- Output: ~$0.24 per 1M tokens
- **~60% cost reduction**

Source: https://deepinfra.com/openai/gpt-oss-120b

## Solution

1. **Add DeepInfra support** to existing AI SDK setup:
   - DeepInfra is OpenAI-compatible, should work with AI SDK's `openai` provider
   - Endpoint: `https://api.deepinfra.com/v1/openai`
   - Model: `openai/gpt-oss-120b`

2. **Test quality** with real hockey schedule queries:
   - Schedule lookups ("when do we play next?")
   - Travel time questions ("what time should I leave?")
   - Standings queries ("show our team stats")
   - Natural language understanding (team name variations, date parsing)

3. **Compare performance**:
   - Response quality vs gemini-2.5-flash
   - Response time/latency
   - Token usage patterns
   - Error rates

4. **Implementation approach**:
   - Add `DEEPINFRA_API_KEY` to env vars
   - Create feature flag or A/B test setup
   - Keep gemini as fallback/default initially
   - Monitor both models in parallel if possible

5. **Success criteria**:
   - Quality comparable to gemini-2.5-flash (subjective evaluation)
   - Response time < 3 seconds for typical queries
   - Handles all current use cases correctly
   - 50%+ cost reduction confirmed

## Rabbit holes

- Don't spend time fine-tuning or prompt engineering beyond current setup - test as drop-in replacement first
- Don't migrate all traffic immediately - start with small percentage or development testing
- Avoid comparing to GPT-4 or other premium models - focus on flash-tier alternatives
- Don't get distracted by other DeepInfra models yet - focus on gpt-oss-120b first

## No gos

- **Don't remove gemini-2.5-flash support** - this is purely additive/testing phase
- **Don't change AI SDK version** - work with current AI SDK 5 setup
- **Don't modify existing prompts** - use same system prompts to ensure fair comparison
- **Don't deploy to production without thorough testing** - keep in dev/staging until validated
- **Don't change the conversation storage or analytics** - those should remain model-agnostic

## Implementation Details

### AI SDK Integration

DeepInfra is OpenAI-compatible, example:

```typescript
import { createOpenAI } from '@ai-sdk/openai';

const deepinfra = createOpenAI({
  apiKey: process.env.DEEPINFRA_API_KEY,
  baseURL: 'https://api.deepinfra.com/v1/openai',
});

const model = deepinfra('openai/gpt-oss-120b');
```

### Environment Variable Toggle

Could implement as environment variable toggle:

```bash
# .env.local
AI_PROVIDER=deepinfra  # or 'gemini'
DEEPINFRA_API_KEY=...
```

### Files to Modify

- `app/api/hockey-chat/route.ts` - Add DeepInfra provider option
- `.env.local` - Add DEEPINFRA_API_KEY
- `.env.example` - Document new env var
- `lib/ai/providers.ts` - (new) Provider configuration logic

## Success Metrics

Track in testing:
- Total cost per 1000 conversations
- Average response quality rating (manual review of 50+ responses)
- P95 latency
- Error rate
- User feedback volume (if any quality issues surface)

## Resources

- DeepInfra gpt-oss-120b: https://deepinfra.com/openai/gpt-oss-120b
- AI SDK custom providers: https://sdk.vercel.ai/docs/ai-sdk-core/custom-providers
- DeepInfra API docs: https://deepinfra.com/docs

## Testing Plan

1. **Phase 1: Development Testing (1-2 days)**
   - Set up DeepInfra provider locally
   - Test 20-30 queries manually
   - Compare response quality side-by-side with gemini

2. **Phase 2: Staging/Beta Testing (3-5 days)**
   - Deploy to staging environment
   - Run automated tests
   - Invite 5-10 beta users to test
   - Collect feedback

3. **Phase 3: Gradual Rollout (1-2 weeks)**
   - Start with 10% of production traffic
   - Monitor metrics closely
   - Increase to 50% if successful
   - Full rollout if all metrics pass

4. **Phase 4: Evaluation (ongoing)**
   - Compare 7-day and 30-day metrics
   - Calculate actual cost savings
   - Decide: commit, rollback, or hybrid approach

## Cost Projection

**Assumptions:**
- 1000 conversations/day
- Average 500 tokens input, 200 tokens output per conversation

**Current (Gemini 2.5 Flash):**
- Input: 1000 * 500 * $0.15 / 1M = $0.075/day
- Output: 1000 * 200 * $0.60 / 1M = $0.120/day
- **Total: $0.195/day = $5.85/month**

**With gpt-oss-120b:**
- Input: 1000 * 500 * $0.08 / 1M = $0.040/day
- Output: 1000 * 200 * $0.24 / 1M = $0.048/day
- **Total: $0.088/day = $2.64/month**

**Savings: $3.21/month (55% reduction)**

At 10,000 conversations/day: **$32.10/month savings**

## Decision Framework

**Proceed to rollout if:**
- ✅ Response quality rated 8/10 or higher (vs gemini baseline)
- ✅ P95 latency < 3 seconds
- ✅ Error rate < 1%
- ✅ No significant user complaints
- ✅ Cost reduction > 40%

**Rollback if:**
- ❌ Response quality rated < 7/10
- ❌ P95 latency > 5 seconds
- ❌ Error rate > 3%
- ❌ Multiple user complaints about quality
- ❌ Any critical failures

**Hybrid approach if:**
- 🤔 Quality slightly lower but acceptable
- 🤔 Performance varies by query type
- 🤔 Cost savings significant but quality trade-off exists
- **Solution**: Use gemini for complex queries, gpt-oss for simple queries
