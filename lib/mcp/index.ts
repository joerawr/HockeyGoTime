/**
 * MCP (Model Context Protocol) Integration
 * Public exports for MCP client functionality
 */

export {
  FirecrawlMCPClient,
  getFirecrawlMCPClient,
  resetFirecrawlMCPClient,
} from "./client/firecrawl-client";

export {
  SchahaMCPClient,
  getSchahaMCPClient,
  resetSchahaMCPClient,
} from "./client/scaha-client";

export type {
  FirecrawlScrapeParams,
  FirecrawlBatchScrapeParams,
  FirecrawlSearchParams,
  FirecrawlCrawlParams,
  FirecrawlExtractParams,
  FirecrawlDeepResearchParams,
  FirecrawlGenerateLlmsTxtParams,
  FirecrawlScrapeResult,
  FirecrawlSearchResult,
  FirecrawlCrawlResult,
  FirecrawlExtractResult,
  FirecrawlDeepResearchResult,
  FirecrawlGenerateLlmsTxtResult,
  MCPClientConfig,
} from "./client/types";

export type {
  SchahaGetScheduleParams,
  SchahaGame,
  SchahaGetScheduleResult,
} from "./client/scaha-types";
