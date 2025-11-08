/**
 * Guardrails orchestrator - validates user input before AI processing
 */

import type { GuardrailResult, GuardrailContext } from './types';
import { checkOffTopic } from './input-filter';
import { checkPromptInjection } from './prompt-injection-detector';

/**
 * Validate user input through all guardrail checks
 *
 * Returns:
 * - { allowed: true } if input passes all checks
 * - { allowed: false, reason: string } if input violates any rule
 *
 * Check order:
 * 1. Prompt injection (security risk - highest priority)
 * 2. Off-topic detection (cost optimization)
 */
export function validateUserInput(
  input: string,
  context: GuardrailContext = {}
): GuardrailResult {
  // Check 1: Prompt injection attempts
  const injectionCheck = checkPromptInjection(input);
  if (!injectionCheck.allowed) {
    return injectionCheck;
  }

  // Check 2: Off-topic queries
  const topicCheck = checkOffTopic(input, context);
  if (!topicCheck.allowed) {
    return topicCheck;
  }

  // All checks passed
  return { allowed: true, category: 'ok' };
}

// Re-export types for convenience
export type { GuardrailResult, GuardrailContext };
