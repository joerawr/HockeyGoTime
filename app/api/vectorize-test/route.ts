import { VectorizeService } from "@/lib/retrieval";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { query, numResults = 2 } = await request.json();

    if (!query) {
      return new Response("Query is required", { status: 400 });
    }

    const vectorize = new VectorizeService();
    const documents = await vectorize.retrieveDocuments(query, numResults);

    // Return full response shape for inspection
    const response = {
      query,
      documentsCount: documents.length,
      documents,
      // Add formatted context and sources for preview
      formattedContext: vectorize.formatDocumentsForContext(documents),
      chatSources: vectorize.convertDocumentsToChatSources(documents),
    };

    return Response.json(response);
  } catch (error) {
    console.error("Vectorize test API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to retrieve documents", details: error }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
