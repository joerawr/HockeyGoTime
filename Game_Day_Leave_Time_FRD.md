# Game Day Leave-Time Assistant — Functional Requirements Document (FRD)

## 1) Purpose
Compute when to wake up and leave so a family arrives at a youth hockey game on time, including DST handling and optional hotel suggestion.

## 2) Scope / Actors
- **Actor**: Parent (“Dad”) or the Hockey player ("Child")
- **System**: Scheduler tool using league schedule + Google Routes API.

## 3) Inputs
- `start_address`
- `get_ready_minutes`
- `before_game_minutes` (e.g., 60/65/70)
- `min_wake_time` (local time constraint)
- `game_date` (selected by user)
- Google Maps API key

## 4) Data Sources
- League schedule on `scaha.net` (navigate via two dropdowns, download CSV)
- Team/venue directory (mapping venue → postal address)
- Google Routes API (duration and recommended departure for an arrival deadline)

## 5) Core Workflow
1. Navigate to SCAHA schedule page (two dropdowns), download CSV.
2. Ask user for `game_date`.
3. Parse CSV to extract on `game_date`:
   - `venue_name`
   - `opponent`
   - `game_time_local` (and home/away for jersey color)
4. Resolve `venue_name` → `end_address` (lookup table; if missing, geocode once and store).
5. Convert `game_time_local` → `game_time_utc` (observe DST rules for venue locale).
6. Compute `desired_arrival_utc = game_time_utc - before_game_minutes`.
7. Compute `leave_time_utc` via Google Routes API with:
   - `start_address`, `end_address`, `desired_arrival_utc`, `game_date`
8. Compute `wake_time_local = leave_time_local - get_ready_minutes`.
9. Hotel logic:
   - If `leave_time_local` < `min_wake_time`, trigger “need a hotel”.
   - Search hotels near `end_address` with min star rating and radius.
   - Provide a Google Maps search link with filters applied.

## 6) Business Rules
- Always show both jerseys; select primary jersey by home/away.
- DST: use venue time zone for all conversions; store and display both local and UTC.
- Persist resolved venues (name → address) for future runs.
- If schedule CSV unavailable, prompt user to paste or retry.

## 7) Outputs (to user)
### Game Information
- **Game Time**: `<game_time_local>` (and UTC)
- **Opponent**: `<opponent>`
- **Location**: `<venue_name>`
- **Address**: `<end_address>`

### Timing Schedule
- **⏰ WAKE UP / GET READY TIME**: `<wake_time_local>`
- **🚗 LEAVE HOME BY**: `<leave_time_local>`
- **🏒 ARRIVE AT RINK**: `<desired_arrival_local>` (`<before_game_minutes>` min early)

### Travel Details
- **Estimated Drive Time**: `<drive_duration>`

### Equipment Reminders
- **Jersey**: `<jerseyColor>` (bring both)
- **Pre-game Meal**: guidance text
- **Water Bottle**: reminder

### Hotel (conditional)
- Rationale (leave time before `min_wake_time`)
- Hotel list summary + **Google Maps link** with filters (stars/radius)

## 8) Error Handling
- CSV missing/format change → show friendly prompt and fallback.
- Venue not found → ask to confirm address, then cache it.
- Routes API failure → retry with fallback departure-time estimation.

## 9) Non-Functional
- Time zone correctness is critical.
- Idempotent venue caching.
- Minimal external dependencies beyond CSV fetch + Routes API.

## 10) Acceptance Criteria (sample)
- **Given** a game at 10:00 AM local, **when** `before_game_minutes=60` and `get_ready_minutes=45`, **then** `desired_arrival=9:00 AM` and `wake_time=leave_time - 45`.
- **Given** `leave_time_local` < `min_wake_time`, **then** hotel suggestions and a Google Maps link are displayed.
- **Given** home game, **then** jersey color = home.
- **Given** DST boundary date, **then** local/UTC times reflect correct offset.

## 11) Nice-to-Haves
- Display team logo; small logo DB keyed by team/league.
- One-time scrape/build of venue → address directory; periodic refresh.

## 12) Example Interactions
Questions the Parent might ask:
- "When do we need to leave for this Sundays game?"
- "For a min wake up time of 6am, for which games do we need a hotel?"
- "When do I need to make sure my child is awake by?"

The hockey player or Parent might ask:
- "Are we home or away this weekend?" or "What jersey for this Sunday?"
- "Who are we playing this weekend?"
- "What time do I need to start getting ready?"
- "What time is this weekends game?"
- "How far away is this weekends game?"
