/**
 * Input filter - detects obvious off-topic queries using blocklist approach
 */

import type { GuardrailResult, GuardrailContext } from './types';

/**
 * Patterns for obviously off-topic content
 * Uses blocklist (NOT allowlist) to avoid rejecting valid hockey queries
 */
const OFF_TOPIC_PATTERNS = {
  recipes: /\b(recipe|cook|bake|ingredient|meal (preparation|recipes)|deviled egg|pasta|cuisine)\b/i,
  weather: /\b(weather (forecast|tomorrow|today)?|temperature (tomorrow|today)|rain forecast|snow forecast)\b/i,
  politics: /\b(president|congress|election|political party|democrat|republican|liberal|conservative)\b/i,
  general_knowledge: /\b(capital of|define|who invented)\b/i,
  coding: /\b(write (a )?code|function|python|javascript|sql query|debug|programming)\b/i,
  entertainment: /\b(movie|tv show|netflix|streaming|recommend.*movie)\b/i,
  automotive: /\b(fix (my )?car|repair|engine|oil change)\b/i,
};

/**
 * Hockey-related keywords that provide context
 * If present, even borderline queries are likely hockey-related
 */
const HOCKEY_CONTEXT_KEYWORDS = /\b(hockey|game|schedule|team|scaha|pghl|player|stats?|rink|ice|puck|playoff|season)\b/i;

/**
 * Check if query is obviously off-topic
 *
 * Strategy: Fail open for borderline cases
 * - Block obvious off-topic patterns
 * - Allow if hockey context is present
 * - Allow if uncertain (let system prompt handle it)
 */
export function checkOffTopic(
  input: string,
  context: GuardrailContext = {}
): GuardrailResult {
  // Empty input - let system prompt handle
  if (!input || input.trim().length === 0) {
    return { allowed: true, category: 'ok' };
  }

  // Very long inputs might be spam or attacks
  if (input.length > 2000) {
    return {
      allowed: false,
      reason: 'Message too long. Please keep queries concise.',
      category: 'length',
    };
  }

  // Check for off-topic patterns
  for (const [topic, pattern] of Object.entries(OFF_TOPIC_PATTERNS)) {
    if (pattern.test(input)) {
      // Exception: If hockey keywords are present, it might be legitimate
      // Example: "best recipe for playoff success" = hockey metaphor
      if (HOCKEY_CONTEXT_KEYWORDS.test(input)) {
        continue; // Allow it
      }

      // Exception: User has hockey preferences set = implicit hockey context
      if (context.preferences?.team || context.preferences?.division) {
        // Still block if very clearly off-topic
        if (topic === 'recipes' && /deviled egg|pasta|cuisine/i.test(input)) {
          return {
            allowed: false,
            reason: `I'm HockeyGoTime, and I only help with ${context.preferences.mcpServer === 'pghl' ? 'PGHL' : 'SCAHA'} hockey schedules and travel planning. I can't help with recipes. Is there anything hockey-related I can help you with?`,
            category: 'off-topic',
          };
        }
        // Otherwise allow (might be contextual)
        continue;
      }

      // Block clearly off-topic request
      const league = context.preferences?.mcpServer === 'pghl' ? 'PGHL' : 'SCAHA';
      return {
        allowed: false,
        reason: `I'm HockeyGoTime, and I only help with ${league} hockey schedules, stats, and travel planning. I can't help with ${topic.replace('_', ' ')}. Is there anything hockey-related I can help you with?`,
        category: 'off-topic',
      };
    }
  }

  // No off-topic patterns detected - allow
  return { allowed: true, category: 'ok' };
}
