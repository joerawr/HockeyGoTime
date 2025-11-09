# Progress - Distance Calculator & Team Normalization

**Branch**: `feature/distance-calculator`

## Completed ✅

### 1. Distance Calculator Implementation (Issue #23)
- ✅ Created `lib/travel/distance-calculator.ts` using Routes API (replaced deprecated Distance Matrix API)
- ✅ Added `calculate_venue_distances` tool to `app/api/hockey-chat/route.ts`
- ✅ Updated `scaha-prompt.ts` with travel tool selection guidance
- ✅ Updated `pghl-prompt.ts` with travel tool selection guidance
- ✅ Fixed API deprecation error (Distance Matrix → Routes API)
- ✅ Type checking passes for all modified files
- ✅ Issue #23 created and updated with implementation notes

**Key fix**: Routes API's `departureTime` parameter is optional, allowing distance calculations for past/future games without errors.

### 2. Team Name Normalization (Issue #24)
- ✅ Added proactive team normalization rules to `scaha-prompt.ts`
- ✅ Case-insensitive matching for all team names
- ✅ Comprehensive examples for Jr Ducks, OC Hockey, Jr Kings variations
- ✅ Clear DO/DON'T sections showing timing impact (11s → 6s)
- ✅ Updated preference usage examples
- ✅ Issue #24 created with before/after comparisons

**Key fix**: AI now normalizes team names BEFORE calling tools, eliminating wasted API calls and cache pollution.

**Normalization examples:**
- "Jr Kings" → "Jr. Kings (1)"
- "JR DUCKS 2" → "Jr. Ducks (2)"
- "O.C. Hockey 1" → "OC Hockey (1)"

## Completed ✅ (continued)

### 3. Preference Normalization in System Prompt

**Problem identified**: User preferences stored as "Jr Kings" and "141" weren't being recognized by AI because they were injected into the system prompt unnormalized.

**Solution implemented**:
- ✅ Added `normalizeTeamName()` function to `scaha-prompt.ts`
  - Handles Jr Kings, Jr Ducks, OC Hockey variations
  - Case-insensitive matching
  - Adds parentheses around team numbers: "Jr Kings" → "Jr. Kings (1)"
- ✅ Added `normalizeDivisionName()` function to `scaha-prompt.ts`
  - Converts numeric codes: "141" → "14U B"
  - Handles missing "U": "14B" → "14U B"
  - Normalizes spacing and hyphens
- ✅ Both functions run BEFORE preferences are injected into system prompt
- ✅ Fixed TypeScript template literal errors (removed backticks in markdown examples)

**Result**: AI now recognizes saved preferences and uses them automatically without asking.

### 4. Travel Time Response Formatting

**Problem**: Travel time responses had fields squashed together due to single newlines being collapsed in markdown.

**Solution**:
- ✅ Updated system prompt template to show double newlines after each field
- ✅ Added explicit instruction: "CRITICAL: Add a blank line (double newline) after EVERY field"
- ✅ Updated example response to demonstrate proper formatting

**Result**: Each field now displays on its own line with proper spacing.

### 5. Error Response Caching Fix

**Problem**: API was caching error responses (e.g., "Team 'Jr. Kings (3)' not found"), preventing AI from retrying with normalized values.

**Solution**:
- ✅ Updated all tool caching logic to check `result.isError` before caching
- ✅ Applied to: `get_schedule`, `get_team_schedule`, `get_division_schedule`, `get_team_stats`, `get_player_stats`
- ✅ Log `⚠️ Not caching error response` when errors occur

**Result**: AI can now retry failed tool calls with different normalized values (e.g., try "Jr. Kings (3)", then "Jr. Kings (1)", then "Jr. Kings").

### 6. Mileage Calculation Accuracy Improvements

**Problem**: AI occasionally miscounted games (17 vs 18) and made arithmetic errors (967.6 vs 853.0 miles).

**Solution**:
- ✅ Added 8-step verification process to `scaha-prompt.ts`:
  1. Count total games first
  2. Verify count matches schedule data
  3. Group games by venue
  4. Verify venue counts sum to total
  5. Calculate distance × 2 × games per venue
  6. Verify arithmetic by re-adding
  7. Present verification to user
  8. Emphasize accuracy matters for budgeting

**Result**: Multiple checkpoints to catch counting and arithmetic errors before presenting to users.

## Next Steps 📋

### Testing (Ready for Preview)
1. ✅ Test distance calculator with local dev server
   - ✅ Query: "How far is Paramount Ice Land from my house?"
   - ✅ Query: "How many miles will we drive this season?"
2. ✅ Test team normalization
   - ✅ Preferences: "Jr Kings" normalizes to "Jr. Kings (1)"
   - ✅ Eliminates double API calls
3. ✅ Test division normalization
   - ✅ Preferences: "141" normalizes to "14U B"
   - ✅ Error recovery works automatically
4. ✅ Test travel time formatting
   - ✅ Fields display on separate lines with proper spacing
5. ✅ Test error recovery
   - ✅ "14A JR KINGS 3" correctly retries and finds "Jr. Kings"
6. 🔄 Test mileage calculation improvements
   - Test game counting accuracy
   - Test arithmetic verification

### Git Workflow
1. ✅ Fix TypeScript errors
2. ✅ Run `pnpm tsc --noEmit` to verify no errors
3. ✅ Commit changes to `feature/distance-calculator` branch
4. ✅ Push to GitHub
5. 🔄 Create PR to merge into main
6. 🔄 Test in Vercel preview deployment
7. 🔄 Merge to main after verification

## Files Modified

**New files:**
- `lib/travel/distance-calculator.ts` - Routes API distance calculator

**Modified files:**
- `app/api/hockey-chat/route.ts` - Added calculate_venue_distances tool, error caching fix, removed debug logging
- `components/agent/scaha-prompt.ts` - Team/division normalization functions, formatting fixes, mileage verification steps
- `components/agent/pghl-prompt.ts` - Travel tool guidance
- `CLAUDE.md` (parent) - Updated cross-project architecture docs

## Issues Created

- **Issue #23**: Add distance-only venue calculator for seasonal mileage tracking
  - https://github.com/joerawr/HockeyGoTime/issues/23

- **Issue #24**: Proactive team name normalization to eliminate wasted API calls
  - https://github.com/joerawr/HockeyGoTime/issues/24

## Performance Impact

**Before**:
- Team name trial-and-error: 11+ seconds (4.7s error + 6.4s success)
- Cache pollution with error responses

**After**:
- Proactive normalization: 6.4 seconds (single successful call)
- ~50% faster for preference-based queries
- No error caching

## Known Issues

1. 📝 User preferences still store unnormalized values (e.g., "141", "Jr Kings")
   - This is acceptable - normalization happens at query time in the AI system prompt
   - Consider adding UI hint to save as "Jr. Kings (1)" and "14U B" for clarity
2. ⚠️ Mileage calculations may occasionally have counting/arithmetic errors (~1 in 6)
   - Added verification steps to reduce errors
   - AI is reminded to double-check math
   - Further improvements may require structured output validation
