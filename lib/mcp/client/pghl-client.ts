/**
 * PGHL MCP Client using Stdio Transport
 *
 * Spawns PGHL MCP server as subprocess via npx
 */

import { experimental_createMCPClient } from "ai";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { PghlMCPClientConfig } from "./pghl-types";

export class PghlMCPClient {
  private client: Awaited<
    ReturnType<typeof experimental_createMCPClient>
  > | null = null;
  private isConnected = false;

  constructor(private config: PghlMCPClientConfig) {}

  /**
   * Initialize the MCP client connection via Stdio (spawns subprocess)
   */
  async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      console.log("🔗 PGHL MCP client already connected");
      return;
    }

    try {
      console.log("🚀 Spawning PGHL MCP server via npx @joerawr/pghl-mcp...");

      const transport = new StdioClientTransport({
        command: "npx",
        args: ["-y", "@joerawr/pghl-mcp"],
      });

      this.client = await experimental_createMCPClient({
        transport,
      });

      this.isConnected = true;
      console.log("✅ PGHL MCP client connected via Stdio subprocess");
    } catch (error) {
      console.error("💥 Failed to spawn PGHL MCP server:", error);
      throw new Error(
        `Failed to spawn PGHL MCP server: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Disconnect the MCP client (terminates subprocess)
   */
  async disconnect(): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      await this.client.close();
      this.client = null;
      this.isConnected = false;
      console.log("🔌 PGHL MCP client disconnected (subprocess terminated)");
    } catch (error) {
      console.error("⚠️ Error during PGHL MCP client disconnect:", error);
    }
  }

  /**
   * Get all available PGHL tools
   */
  async getTools(): Promise<Record<string, any>> {
    if (!this.isConnected || !this.client) {
      await this.connect();
    }

    if (!this.client) {
      throw new Error("PGHL MCP client not initialized");
    }

    try {
      console.log("🔧 Retrieving PGHL MCP tools...");
      const tools = await this.client.tools();
      console.log(`✅ Retrieved ${Object.keys(tools).length} PGHL tools`);
      return tools;
    } catch (error) {
      console.error("💥 Failed to retrieve PGHL tools:", error);
      throw new Error(
        `Failed to retrieve PGHL tools: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Get the connection status
   */
  isClientConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get the underlying MCP client instance
   */
  getClient() {
    return this.client;
  }
}

/**
 * Singleton instance for PGHL MCP client
 */
let pghlClientInstance: PghlMCPClient | null = null;

/**
 * Get or create a PGHL MCP client instance
 */
export function getPghlMCPClient(): PghlMCPClient {
  if (!pghlClientInstance) {
    pghlClientInstance = new PghlMCPClient({});
  }

  return pghlClientInstance;
}

/**
 * Reset the singleton instance (useful for testing or reconfiguration)
 */
export function resetPghlMCPClient(): void {
  if (pghlClientInstance) {
    pghlClientInstance.disconnect().catch(console.error);
    pghlClientInstance = null;
  }
}
