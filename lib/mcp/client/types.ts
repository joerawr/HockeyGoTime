/**
 * TypeScript types for Firecrawl MCP tools
 * Based on: https://docs.firecrawl.dev/mcp-server
 */

export interface FirecrawlScrapeParams {
  url: string;
  formats?: Array<"markdown" | "html" | "rawHtml" | "links" | "screenshot">;
  onlyMainContent?: boolean;
  includeTags?: string[];
  excludeTags?: string[];
  headers?: Record<string, string>;
  waitFor?: number;
  timeout?: number;
}

export interface FirecrawlBatchScrapeParams {
  urls: string[];
  formats?: Array<"markdown" | "html" | "rawHtml" | "links" | "screenshot">;
  onlyMainContent?: boolean;
  includeTags?: string[];
  excludeTags?: string[];
  headers?: Record<string, string>;
  waitFor?: number;
  timeout?: number;
}

export interface FirecrawlSearchParams {
  query: string;
  limit?: number;
  scrapeOptions?: {
    formats?: Array<"markdown" | "html" | "rawHtml" | "links">;
    onlyMainContent?: boolean;
  };
}

export interface FirecrawlCrawlParams {
  url: string;
  excludePaths?: string[];
  includePaths?: string[];
  maxDepth?: number;
  limit?: number;
  allowBackwardLinks?: boolean;
  allowExternalLinks?: boolean;
  ignoreSitemap?: boolean;
  scrapeOptions?: {
    formats?: Array<"markdown" | "html" | "rawHtml" | "links">;
    onlyMainContent?: boolean;
  };
}

export interface FirecrawlExtractParams {
  urls: string[];
  prompt?: string;
  schema?: Record<string, unknown>;
  allowExternalLinks?: boolean;
}

export interface FirecrawlDeepResearchParams {
  query: string;
  maxDepth?: number;
  limit?: number;
  scrapeOptions?: {
    formats?: Array<"markdown" | "html" | "rawHtml">;
    onlyMainContent?: boolean;
  };
}

export interface FirecrawlGenerateLlmsTxtParams {
  url: string;
}

export interface FirecrawlScrapeResult {
  markdown?: string;
  html?: string;
  rawHtml?: string;
  links?: string[];
  screenshot?: string;
  metadata?: {
    title?: string;
    description?: string;
    language?: string;
    sourceURL?: string;
    statusCode?: number;
  };
}

export interface FirecrawlSearchResult {
  results: Array<{
    url: string;
    title?: string;
    description?: string;
    markdown?: string;
  }>;
}

export interface FirecrawlCrawlResult {
  status: "completed" | "failed" | "pending";
  pages?: Array<{
    url: string;
    markdown?: string;
    html?: string;
  }>;
  error?: string;
}

export interface FirecrawlExtractResult {
  data: Record<string, unknown>;
}

export interface FirecrawlDeepResearchResult {
  results: Array<{
    url: string;
    title?: string;
    content?: string;
  }>;
  summary?: string;
}

export interface FirecrawlGenerateLlmsTxtResult {
  llmstxt: string;
}

export interface MCPClientConfig {
  apiKey: string;
  serverUrl?: string;
}
