/**
 * Guardrail types for input validation
 */

export interface GuardrailResult {
  allowed: boolean;
  reason?: string;
  category?: 'off-topic' | 'prompt-injection' | 'length' | 'ok';
}

export interface GuardrailContext {
  preferences?: {
    team?: string;
    division?: string;
    mcpServer?: string;
  };
  conversationHistory?: Array<{ role: string; content: string }>;
}
