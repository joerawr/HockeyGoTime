"use client";

import ChatAssistant from "@/components/chat/chat-assistant";

export default function RAGAgentPage() {

  return (
    <div className="h-screen bg-background flex flex-col max-w-4xl mx-auto overflow-hidden">
      <div className="border-b p-4">
        <h1 className="text-xl font-semibold">Catan & Peruvian Restaurant Assistant</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ask me about Catan board game rules and strategies, or about our Peruvian restaurant menu and dishes!
        </p>
      </div>

      <div className="flex-1 overflow-hidden">
        <ChatAssistant api="/api/rag-agent" />
      </div>
    </div>
  );
}