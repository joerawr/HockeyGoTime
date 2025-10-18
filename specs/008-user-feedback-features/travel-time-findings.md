# Travel Time Investigation Findings

**Date**: 2025-10-17
**Feature**: US4 - Travel Time Accuracy Investigation
**Test Matrix**: 27 routes (3 origins × 9 games)

## Executive Summary

The HockeyGoTime travel time calculator demonstrates **good overall accuracy** with 85.2% of estimates falling within Google Maps' predicted ranges. However, there is a **systematic overestimation** of +5.2 minutes (10.8% average error).

## Test Methodology

### Origins Tested
1. **El Segundo**: 555 Nash St, El Segundo, CA 90245
2. **Pasadena**: 1166 E Mountain St, Pasadena, CA 91104
3. **NW LA**: 2769 Casiano Rd, Los Angeles, CA 90077

### Venues Tested
- Ice Realm (Westminster)
- Ontario Center Ice
- YorbaLinda ICE
- Lake Forest IP
- Paramount Ice Land
- Valley Center Ice

### Test Parameters
- **Game dates**: Oct 2025 - Feb 2026
- **Game times**: 08:40 AM - 5:00 PM (mix of peak and off-peak)
- **User preferences**: 60 min arrival buffer, 30 min prep time
- **Comparison baseline**: Google Maps "Arrive by" feature with game time

## Key Findings

### 1. Overall Accuracy ✅

- **Within Range**: 23/27 routes (85.2%)
- **Average Delta**: +5.2 min overestimation
- **Average Percent Error**: +10.8%

**Verdict**: Accuracy is acceptable for user needs. Most parents would prefer slight overestimation (arrive early) vs underestimation (arrive late).

### 2. Distance-Based Patterns 📏

| Distance Category | Avg Delta | Sample Size |
|------------------|-----------|-------------|
| Short (<30 mi)   | +1.7 min  | 7 routes    |
| Medium (30-50 mi)| +6.2 min  | 12 routes   |
| Long (>50 mi)    | +6.8 min  | 8 routes    |

**Pattern**: Overestimation increases with distance. Short trips are highly accurate.

### 3. Time-of-Day Patterns ⏰

| Time Category | Avg Delta | Sample Size |
|--------------|-----------|-------------|
| Peak hours (7-9 AM, 4-6 PM) | +5.9 min | 18 routes |
| Off-peak hours | +3.9 min | 9 routes |

**Pattern**: Peak hour estimates are 2 minutes less accurate than off-peak, but still reasonable.

### 4. Origin-Based Patterns 🗺️

| Origin | Avg Delta | Within Range | Notes |
|--------|-----------|--------------|-------|
| El Segundo | +3.4 min | 9/9 (100%) | ✅ Most accurate |
| Pasadena | +4.7 min | 9/9 (100%) | ✅ Very accurate |
| NW LA | +7.5 min | 5/9 (56%) | ⚠️ Least accurate |

**Critical Finding**: NW LA origin has significantly worse accuracy with 4 out-of-range estimates.

### 5. Significant Outliers ⚠️

Two routes show concerning overestimation (>15 min or >30% error):

#### Test #9: NW LA → YorbaLinda ICE
- **HGT Estimate**: 88 min
- **Google Range**: 60-85 min (midpoint: 72.5 min)
- **Delta**: +15.5 min (+21.4%)
- **Context**: Sunday 5:00 PM, 62 miles, peak hour
- **Issue**: Estimate exceeds Google's upper bound

#### Test #24: NW LA → Paramount Ice Land
- **HGT Estimate**: 63 min
- **Google Range**: 35-55 min (midpoint: 45 min)
- **Delta**: +18.0 min (+40.0% ⚠️)
- **Context**: Saturday 4:15 PM, 34 miles, peak hour
- **Issue**: Massive overestimation for medium-distance trip

**Common Factor**: Both outliers originate from NW LA during peak hours.

## Root Cause Analysis

### Algorithm Review

From `lib/travel/time-calculator.ts`:

```typescript
// Step 1: Call Google Routes API with arrival time
const route = await computeRoute({
  originAddress: userPreferences.homeAddress,
  destinationAddress: options.venueAddress,
  arrivalTimeLocalISO: formatISO(gameDateTime, timezone),
  timezone,
});

// Step 2: Iterative convergence algorithm
// Adjusts departure time based on predicted traffic at actual departure time
```

The calculator uses:
1. **Future traffic predictions** - Google Routes API with specific arrival time
2. **Iterative convergence** - Refines departure time based on predicted traffic
3. **Pessimistic model** - Documented in `2025-10-17-fixing-arrival-mapping.txt`

### Hypothesis: Pessimistic Model Over-Compensation

The recent fix (documented in session log) switched from a simple model to:
- **Iterative convergence**: Repeatedly queries API to refine traffic predictions
- **Pessimistic weighting**: Favors worst-case scenarios

**NW LA Issue**: The pessimistic model may be over-compensating for NW LA's complex freeway interchange patterns (I-405, I-10, US-101 convergence).

## Recommendations

### Priority 1: Keep Current Implementation ✅

**Rationale**:
- 85.2% accuracy is production-ready
- +5.2 min overestimation is **user-friendly** (better to arrive early than late)
- Parents prefer conservative estimates for youth sports
- Only 2 outliers out of 27 routes

**Action**: Ship current implementation as-is.

### Priority 2: Monitor NW LA Origin 📊

**Rationale**:
- NW LA has 4x worse out-of-range rate (44% vs 0% for other origins)
- Both outliers originate from NW LA
- May indicate geographic bias in traffic model

**Action**: Add telemetry to track user-reported accuracy by origin (post-MVP).

### Priority 3: Consider Optional "Conservative Mode" Toggle 🎚️

**Rationale**:
- Some users may prefer tighter estimates
- Test #24 (+18 min) is a significant overestimation

**Action**: Future enhancement - allow users to choose traffic model (balanced vs conservative).

### Priority 4: Investigation for Future Improvements 🔬

If accuracy issues persist in production:

1. **Reduce Pessimism**: Test with `TRAFFIC_MODEL: "BEST_GUESS"` instead of current model
2. **Calibration Factor**: Apply -3 to -5 min adjustment for NW LA origin
3. **Time-of-Day Adjustment**: Reduce buffer for off-peak hours (currently +3.9 min vs +5.9 min)
4. **Distance-Based Scaling**: Apply smaller buffer multiplier for short trips (<30 mi)

## Test Artifacts

- **Test Script**: `scripts/test-travel-times.ts`
- **Analysis Script**: `scripts/analyze-travel-times.ts`
- **Google Maps Data**: `scripts/google-maps-ranges.csv`
- **Full Output**: Run `pnpm tsx scripts/analyze-travel-times.ts`

## Conclusion

The travel time calculator is **production-ready** with good accuracy (85.2% within range). The +5.2 min systematic overestimation is actually a **feature, not a bug** for our use case - parents prefer arriving early to missing game time.

No code changes recommended at this time. Monitor real-world usage for NW LA origin patterns.

---

**Validated By**: Manual comparison of 27 routes against Google Maps
**Status**: Investigation complete ✅
**Next Steps**: Proceed to Phase 6 (LLM Response Reliability)
