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

export {
  PghlMCPClient,
  getPghlMCPClient,
  resetPghlMCPClient,
} from "./client/pghl-client";

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
  SchahaGetTeamStatsParams,
  SchahaTeamStats,
  SchahaGetPlayerStatsParams,
  SchahaPlayerSkaterStats,
  SchahaPlayerGoalieStats,
  SchahaPlayerStats,
} from "./client/scaha-types";

export type {
  PghlSelectOption,
  PghlScheduleOptions,
  PghlListScheduleOptionsParams,
  PghlGetScheduleParams,
  PghlGame,
  PghlGetScheduleResult,
  PghlMCPClientConfig,
} from "./client/pghl-types";
