import { tool } from "ai";
import { z } from "zod";
import { VectorizeService } from "@/lib/retrieval/vectorize";

export const retrieveKnowledgeBaseSimple = tool({
  description:
    "Search the knowledge base for information about Catan board game rules/strategies or Peruvian restaurant menu/dishes",
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        "Search query for Catan board game or Peruvian restaurant information"
      ),
  }),
  execute: async ({ query }) => {
    try {
      const vectorizeService = new VectorizeService();
      const documents = await vectorizeService.retrieveDocuments(query);

      if (!documents || documents.length === 0) {
        return {
          context: "No relevant information found in the knowledge base.",
          sources: [],
        };
      }

      // Return both context and sources for streaming
      const chatSources =
        vectorizeService.convertDocumentsToChatSources(documents);

      // Format sources for AI SDK source parts
      const aiSdkSources = chatSources.map((source, index) => ({
        sourceType: "url" as const,
        id: `vectorize-source-${Date.now()}-${index}`,
        url: source.url,
        title: source.title || "Knowledge Base Source",
      }));

      const toolResult = {
        context: vectorizeService.formatDocumentsForContext(documents),
        sources: aiSdkSources,
        chatSources: chatSources,
      };

      return toolResult;
    } catch (error) {
      console.error(`💥 RAG Tool error:`, error);
      throw error;
    }
  },
});
