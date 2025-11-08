/**
 * Prompt injection detector - identifies jailbreak attempts
 */

import type { GuardrailResult } from './types';

/**
 * Patterns for prompt injection attacks
 */
const PROMPT_INJECTION_PATTERNS = {
  ignore_instructions: /ignore\s+(all\s+|previous\s+|above\s+)?(instructions?|prompts?|rules?)/i,
  forget_rules: /forget\s+(all\s+|previous\s+)?(instructions?|rules?)/i,
  role_play: /(act as|pretend (you are|to be)|you are now (a|an))\s+(?!hockeygotime)/i,
  reveal_prompt: /(print|show|reveal|display|repeat)\s+(your\s+)?(system\s+)?(prompt|instructions?|rules?)/i,
  what_instructions: /what\s+(are|is)\s+your\s+instructions?/i,
  system_access: /(\/admin|bypass|override)\s+(restrictions?|rules?|security)/i,
  html_injection: /<!--.*?system.*?-->/i,
  repeat_above: /repeat\s+(everything|all)\s+above/i,
  new_instructions: /new\s+instructions?:/i,
  disregard: /disregard\s+(all\s+)?(previous|above)/i,
};

/**
 * Detect prompt injection attempts
 */
export function checkPromptInjection(input: string): GuardrailResult {
  // Empty input - safe
  if (!input || input.trim().length === 0) {
    return { allowed: true, category: 'ok' };
  }

  // Check each injection pattern
  for (const [attackType, pattern] of Object.entries(PROMPT_INJECTION_PATTERNS)) {
    if (pattern.test(input)) {
      // Don't reveal what we detected - generic error
      return {
        allowed: false,
        reason: 'I can only help with hockey schedules and travel planning. Please ask about SCAHA or PGHL games, teams, or venues.',
        category: 'prompt-injection',
      };
    }
  }

  // No injection detected
  return { allowed: true, category: 'ok' };
}
