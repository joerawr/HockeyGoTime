/**
 * TypeScript types for privacy-compliant analytics system
 * Feature: 006-privacy-analytics-dashboard
 */

/**
 * Base metric counter entity
 * Represents an aggregate count for a specific metric over a time period
 */
export interface MetricCounter {
  metricKey: string;
  count: number;
  granularity: "daily" | "weekly" | "monthly";
  date: string; // YYYY-MM-DD format
  ttl: number; // Seconds remaining until deletion
}

/**
 * Token usage tracking for LLM cost calculations
 * Tracks input/output tokens separately for accurate pricing
 */
export interface TokenUsage {
  modelName: string;
  inputTokens: number;
  outputTokens: number;
  granularity: "daily" | "weekly" | "monthly";
  date: string; // YYYY-MM-DD format
  inputPricePerMillion: number;
  outputPricePerMillion: number;
}

/**
 * Derived cost estimate from token usage
 * Calculated on-demand, not stored in Redis
 */
export interface TokenCostEstimate {
  modelName: string;
  totalInputTokens: number;
  totalOutputTokens: number;
  estimatedCost: number;
  period: {
    start: string;
    end: string;
  };
}

/**
 * MCP tool call tracking for feature adoption metrics
 */
export interface ToolCallMetrics {
  toolName: string;
  callCount: number;
  granularity: "daily" | "weekly" | "monthly";
  date: string; // YYYY-MM-DD format
}

/**
 * Feature usage breakdown (percentage of total activity by tool)
 */
export interface FeatureBreakdown {
  toolName: string;
  totalCalls: number;
  percentage: number; // 0-100
}

/**
 * Performance metrics for service health monitoring
 */
export interface PerformanceMetrics {
  endpoint: string;
  responseTimeP95: number; // milliseconds
  errorCount: number;
  successCount: number;
  granularity: "daily" | "weekly" | "monthly";
  date: string; // YYYY-MM-DD format
}

/**
 * Service health summary (derived from performance metrics)
 */
export interface ServiceHealth {
  endpoint: string;
  uptime: number; // percentage (0-100)
  avgResponseTime: number; // milliseconds
  errorRate: number; // percentage (0-100)
  period: {
    start: string;
    end: string;
  };
}

/**
 * Analytics API request parameters
 */
export interface AnalyticsRequest {
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  metrics?: string[]; // Optional: filter specific metrics
  granularity?: "daily" | "weekly" | "monthly";
}

/**
 * Analytics API response
 */
export interface AnalyticsResponse {
  period: {
    start: string;
    end: string;
  };
  granularity: "daily" | "weekly" | "monthly";
  metrics: {
    conversations?: Array<{ date: string; count: number }>;
    tokens?: Record<
      string,
      Array<{ date: string; input: number; output: number }>
    >;
    tools?: Record<string, Array<{ date: string; count: number }>>;
  };
}

/**
 * Cost calculation API request
 */
export interface CostRequest {
  start_date: string;
  end_date: string;
  model?: string;
}

/**
 * Cost calculation API response
 */
export interface CostResponse {
  period: {
    start: string;
    end: string;
  };
  model: string;
  token_usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  pricing: {
    input_price_per_million: number;
    output_price_per_million: number;
  };
  cost_breakdown: {
    input_cost: number;
    output_cost: number;
    total_cost: number;
  };
  projected_monthly_cost: number;
  daily_average: {
    tokens: number;
    cost: number;
  };
}

/**
 * Feature breakdown API request
 */
export interface FeatureBreakdownRequest {
  start_date: string;
  end_date: string;
}

/**
 * Feature breakdown API response
 */
export interface FeatureBreakdownResponse {
  period: {
    start: string;
    end: string;
  };
  total_tool_calls: number;
  breakdown: Array<{
    tool_name: string;
    count: number;
    percentage: number; // 0-100
  }>;
}

/**
 * Performance metrics API request
 */
export interface PerformanceRequest {
  start_date: string;
  end_date: string;
  endpoint?: string;
}

/**
 * Performance metrics API response
 */
export interface PerformanceResponse {
  period: {
    start: string;
    end: string;
  };
  endpoint: string;
  metrics: {
    response_times: {
      p50: number; // milliseconds
      p95: number;
      p99: number;
    };
    requests: {
      total: number;
      successful: number;
      failed: number;
    };
    error_rate: number; // percentage (0-100)
    uptime_percentage: number; // percentage (0-100)
  };
  daily_breakdown: Array<{
    date: string;
    response_time_p95: number;
    error_count: number;
    success_count: number;
  }>;
}

/**
 * Standard error response format
 */
export interface ErrorResponse {
  error: string; // Machine-readable error code
  message: string; // Human-readable error message
  details?: Record<string, unknown>; // Optional additional context
}
