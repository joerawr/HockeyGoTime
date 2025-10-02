📌 Where AI Agents Shine in This Project

Natural Language Interface

Let the user ask questions in plain language:
“Hey, when do we have to leave for Saturday’s game?”

AI can parse the intent, pull the right date from the schedule, and trigger the logic.

This turns your FRD into an AI-powered conversational assistant rather than just a script.

Data Extraction / Parsing

League sites (like scaha.net) often have ugly HTML tables/CSVs.

AI agents are good at screen scraping + pattern recognition in semi-structured data:

Extract schedule rows.

Normalize venue names.

Detect opponent/venue/time without writing brittle regex.

They can be paired with a “tool call” that hands off structured data for reliable computation.

Venue & Opponent Mapping

Some names will vary (“Toyota Sports Center” vs. “TSC”).

AI can resolve these fuzzy matches to a canonical address from your database.

Could also auto-suggest corrections when the venue isn’t recognized.

Hotel Recommendations

Instead of hardcoding filters, you can let an AI agent interpret a vague ask like:
“Find me a decent family-friendly hotel within 15 minutes of the rink.”

AI can query Google Maps results, summarize options, and present them back in human terms.

User Personalization & Guidance

Suggest reminders: “Looks like this is an away game—don’t forget black socks.”

Summarize multiple weekends at once if the user asks: “When do we need hotels this season?”

📌 Where Code Functions Are Safer

Math / Scheduling Calculations

Time zone conversions, daylight savings adjustments, subtracting minutes → don’t trust an LLM alone.

Use proper libraries (e.g., Python’s pytz / zoneinfo or JavaScript’s luxon/day.js) for guaranteed correctness.

Google Routes API Calls

Departure/arrival time math must be deterministic. AI should trigger these API calls, not “guess” travel times.

Wake / Leave Time Logic

All “subtract minutes, compare to min wake time” steps → use code. AI may hallucinate or drift in arithmetic.

Validation

If the input is malformed (bad CSV, missing fields), code should validate and throw an error. AI may “make something up.”

🔑 Hybrid Approach (Best of Both Worlds)

AI as Orchestrator / Interface:

User-facing Q&A.

Flexible parsing, mapping, and hotel suggestions.

Code as Deterministic Engine:

Time zones, UTC conversion, math, API queries, validation.

Think of the AI agent as the front desk receptionist (good at conversation, fuzzy matching, guidance) while the back office code is the accountant (hard numbers, no mistakes).

👉 For your AI class project, I’d frame it like this:

Agent Layer: Conversational, interprets requests, extracts info from messy sources.

Logic Layer: Pure functions/code that calculate times, call APIs, and guarantee correctness.

Bridge: AI calls the logic layer when math or API reliability is needed.