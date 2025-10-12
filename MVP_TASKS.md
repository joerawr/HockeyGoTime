# HockeyGoTime MVP Task List

**Capstone Deadline**: ~2025-10-25 (2.5 weeks remaining as of 2025-10-07)
**Production URL**: https://hockeygotime.vercel.app/

## ✅ Completed Features

### Core Functionality
- ✅ Schedule queries via SCAHA MCP integration
- ✅ Natural language input normalization (14B → 14U B, team name variations)
- ✅ Travel time calculations with Google Routes API
- ✅ Wake-up and departure time suggestions
- ✅ User preferences (optional, localStorage-based)
- ✅ In-memory caching (24hr for schedules, 6hr for stats)
- ✅ Team statistics (get_team_stats)
- ✅ Player statistics (get_player_stats)

### Infrastructure
- ✅ Next.js 15 App Router deployment
- ✅ StreamableHTTP MCP transport to remote Vercel server
- ✅ GPT-5-mini with 'low' effort setting (production)
- ✅ Type safety (TypeScript strict mode)
- ✅ Automatic Vercel deployment on push to main

### Polish
- ✅ Root path routing (app at `/` not `/hockey`)
- ✅ 12-hour AM/PM time format display
- ✅ Venue address mappings hardcoded in system prompt

## 🚧 In Progress

### Spec 003: Generic Placeholder Content Cleanup
**Status**: Spec & plan complete, ready for `/speckit.tasks`

**Tasks**:
- Replace privacy policy placeholder text (misleading data collection statements)
- Replace About page starter template copy with HockeyGoTime story
- Replace Next.js favicon with HockeyGoTime logo
- Remove unused default Next.js assets from `/public`

**Priority**: Medium (presentation polish)
**Effort**: Low (mostly content updates)

## 🔴 Critical User Experience Issues (from testing)

### Issue #5: Help users discover correct SCAHA team names
**Problem**: Users don't know SCAHA's exact team name format
- User enters "Bay Harbor Red Wings" but SCAHA name is "Red Wings"
- Causes failed queries and confusion

**Solution** (recommended for MVP):
- **Option A**: AI fuzzy matching for common variations
- **Option C**: Support queries like "What teams are in 14U B?" to list official names
- (Option B: Autocomplete in preferences UI - defer to post-MVP)

**Priority**: 🔴 **HIGH** - Blocking user adoption
**GitHub**: https://github.com/joerawr/HockeyGoTime/issues/5

### Issue #6: Preferences changes require page refresh
**Problem**: After editing preferences, changes don't apply until page refresh
- User updates team in preferences
- Chat still uses old team until refresh
- Confusing UX

**Solution**: Use React Context to propagate preference updates
- Create `PreferencesContext` provider
- Trigger chat re-render when preferences saved
- No page refresh needed

**Priority**: 🔴 **HIGH** - Poor user experience
**GitHub**: https://github.com/joerawr/HockeyGoTime/issues/6

### SCAHA MCP Issue: Add get_division_player_stats tool
**Problem**: Current `get_player_stats` requires player name, causing AI question spiral
- User asks "Who has the most goals on our team?"
- AI can't answer without knowing all player names
- AI gets stuck asking endless clarifying questions

**Solution**: New SCAHA MCP tool to return full division player list
- `get_division_player_stats({ season, division, team_filter? })`
- Returns all players sorted by rank (with optional team filter)
- Enables queries like "top scorer on our team" without knowing names

**Status**: 🟡 **DEPENDENCY** - Requires SCAHA MCP server update
**Priority**: 🔴 **HIGH** - Needed before Capstone demo
**GitHub**: https://github.com/joerawr/scaha.net-mcp/issues/6
**Estimate**: 2-3 hours (SCAHA MCP implementation)

**Impact on HockeyGoTime**:
- ✅ Once available, HockeyGoTime will automatically pick up the new tool
- ✅ No HockeyGoTime code changes needed (MCP tools auto-discovered)
- ⚠️ **Blocking Capstone demo** - Critical user query pattern currently broken

## 📋 Remaining MVP Features

### P2: Hotel Recommendations for Early Games
**Status**: Not started
**Description**: Suggest hotels near venue for early morning games (e.g., 7am start)
**Priority**: Medium (strong demo value, compelling parent use case)
**Complexity**: Medium (requires hotel search API or hardcoded suggestions)
**Defer?**: Consider deferring if Issues #5 and #6 consume remaining time

## 🎯 MVP Completion Criteria

**Must Have** (P1):
- ✅ User preferences and team association
- ✅ Schedule queries working
- ✅ Travel time calculations
- ⚠️ **Issue #5**: Team name discovery (CRITICAL)
- ⚠️ **Issue #6**: Preferences refresh fix (CRITICAL)

**Should Have** (P2):
- ✅ Team/Player statistics
- ❓ Hotel recommendations (defer if needed)

**Nice to Have** (P3):
- Spec 003 placeholder content cleanup (polish)

## 📊 Recommended Prioritization

**Week 1** (Current):
1. Fix Issue #6: Preferences refresh (1-2 days) - Critical UX
2. Fix Issue #5: Team name discovery (2-3 days) - Critical UX
3. Complete Spec 003: Placeholder cleanup (1 day) - Quick wins

**Week 2** (if time permits):
4. Hotel recommendations (3-4 days) - Strong demo value

**Week 2.5** (Capstone prep):
- Demo script preparation
- Production testing
- Bug fixes and polish

## 🚨 Risk Assessment

**High Risk**:
- ❌ **Issue #5 and #6 block user adoption** - Must fix for successful demo
- ❌ Running out of time for hotel recommendations
- ❌ Discovering new user testing issues late

**Mitigation**:
- ✅ Prioritize Issues #5 and #6 immediately
- ✅ Make hotel recommendations optional (can demo without it)
- ✅ Continue user testing in parallel with development

## 📝 Notes

- All features must pass TypeScript strict mode (`pnpm tsc --noEmit`)
- Test in production early and often (Vercel auto-deploy)
- Focus on demo-ready features over backend polish
- Keep localStorage-only preference model (no backend needed)

---

**Last Updated**: 2025-10-09
**Next Review**: After Issues #5 and #6 are resolved
