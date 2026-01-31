"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type ToolUIPart } from "ai";
import { useState, useEffect, useRef, useMemo, memo } from "react";
import { PreferencesStore } from "@/lib/storage/preferences";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import {
  Sources,
  SourcesTrigger,
  SourcesContent,
  Source,
} from "@/components/ai-elements/sources";
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from "@/components/ai-elements/reasoning";
import { Response } from "@/components/ai-elements/response";
import { SlidingPuck } from "@/components/ui/sliding-puck";
import { HelperHints } from "@/components/chat/helper-hints";
type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Array<{
    url: string;
    title?: string;
  }>;
  toolCalls?: Array<{
    type: `tool-${string}`;
    state:
    | "input-streaming"
    | "input-available"
    | "output-available"
    | "output-error";
    input?: any;
    output?: any;
    errorText?: string;
  }>;
};

// RAG Tool types for proper TypeScript support
type RAGToolInput = {
  query: string;
};

type RAGToolOutput = {
  context: string;
  sources: Array<{
    sourceType: 'url';
    id: string;
    url: string;
    title: string;
  }>;
  chatSources?: Array<{
    url: string;
    title: string;
  }>;
};

type RAGToolUIPart = ToolUIPart<{
  retrieveKnowledgeBase: {
    input: RAGToolInput;
    output: RAGToolOutput;
  };
}>;

interface ChatAssistantProps {
  api?: string;
}

// Memoized components for better performance
const MemoizedToolCall = memo(({
  toolPart,
  displayName,
  shouldBeExpanded
}: {
  toolPart: any; // RAGToolUIPart;
  displayName: string;
  shouldBeExpanded: boolean;
}) => (
  <Tool defaultOpen={shouldBeExpanded}>
    <ToolHeader
      type={displayName as any}
      state={toolPart.state}
    />
    <ToolContent>
      {toolPart.state === "input-streaming" && (
        <div className="text-sm text-muted-foreground p-2">
          🔍 {displayName}...
        </div>
      )}
      {toolPart.input && toolPart.state !== "input-streaming" && (
        <ToolInput input={toolPart.input} />
      )}
      {toolPart.output && (
        <ToolOutput
          output={toolPart.output}
          errorText={toolPart.errorText}
        />
      )}
    </ToolContent>
  </Tool>
));

MemoizedToolCall.displayName = 'MemoizedToolCall';

const MemoizedMessage = memo(({
  message,
  isStreaming,
  children
}: {
  message: any;
  isStreaming: boolean;
  children?: React.ReactNode;
}) => {
  // Only handle text parts (reasoning is now handled as separate flow items)
  const textParts = message.parts?.filter((p: any) => p.type === 'text') || [];

  return (
    <>
      {/* Render text message if there's content */}
      {(textParts.length > 0 || message.content) && (
        <Message from={message.role}>
          <MessageContent>
            <Response>
              {textParts.map((part: any, i: number) => part.text).join('') || message.content || ""}
            </Response>
          </MessageContent>
          {children}
        </Message>
      )}
    </>
  );
});

MemoizedMessage.displayName = 'MemoizedMessage';

export default function ChatAssistant({ api }: ChatAssistantProps) {

  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timeoutError, setTimeoutError] = useState(false); // T041: Timeout error UI state
  const [league, setLeague] = useState<'scaha' | 'pghl'>('scaha');

  // Custom transport that includes user preferences in the request body
  const transport = useMemo(() => {
    if (!api) return undefined;

    return new DefaultChatTransport({
      api,
      fetch: async (url, options) => {
        // Load current preferences from localStorage
        const preferences = PreferencesStore.get();
        // const preferences = null;

        // Parse the body to add preferences
        const body = JSON.parse(options?.body as string || '{}');
        const enhancedBody = {
          ...body,
          preferences, // Include preferences in request
        };

        return fetch(url, {
          ...options,
          body: JSON.stringify(enhancedBody),
        });
      },
    });
  }, [api]);


  const { messages: rawMessages, status, sendMessage } = useChat(
    transport ? { transport } : undefined
  );

  // Debounced messages for performance - update every 30ms instead of every token
  const [debouncedMessages, setDebouncedMessages] = useState(rawMessages);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastRawMessagesRef = useRef(rawMessages);

  useEffect(() => {
    console.log("📝 Raw messages update", rawMessages);
    console.log("📡 Status", status);
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Check for critical events that need immediate updates
    const needsImmediateUpdate = () => {
      // Update immediately when streaming stops
      if (status !== 'streaming' && lastRawMessagesRef.current !== rawMessages) {
        return true;
      }

      // Update immediately when tool calls appear/change
      const hasNewToolCalls = rawMessages.some(msg =>
        (msg as any).parts?.some((p: any) => p.type?.startsWith('tool-')) &&
        !lastRawMessagesRef.current.some(oldMsg => oldMsg.id === msg.id)
      );

      if (hasNewToolCalls) {
        return true;
      }

      return false;
    };

    if (needsImmediateUpdate()) {
      // Immediate update for critical events
      setDebouncedMessages(rawMessages);
      lastRawMessagesRef.current = rawMessages;
    } else {
      // Debounced update for regular streaming
      debounceTimerRef.current = setTimeout(() => {
        setDebouncedMessages(rawMessages);
        lastRawMessagesRef.current = rawMessages;
      }, 30);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [rawMessages, status]);

  // Use debounced messages for rendering
  const messages = debouncedMessages;

  // Load league preference
  useEffect(() => {
    const preferences = PreferencesStore.get();
    if (preferences?.mcpServer) {
      setLeague(preferences.mcpServer);
    }
  }, []);

  // Reset isSubmitting when streaming starts or completes
  useEffect(() => {
    if (status === "streaming") {
      setIsSubmitting(false);
    }
  }, [status]);

  // Track elapsed time for progressive status message
  useEffect(() => {
    const showLoading = isSubmitting || status === "streaming";

    if (!showLoading) {
      setElapsedTime(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime(t => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isSubmitting, status]);

  // T040: Client-side timeout - show error after 60 seconds
  useEffect(() => {
    const isProcessing = isSubmitting || status === "streaming";

    if (!isProcessing) {
      setTimeoutError(false); // Reset timeout error when not processing
      return;
    }

    const timeoutId = setTimeout(() => {
      console.warn("⏱️ Client-side timeout after 60 seconds");
      setTimeoutError(true);
    }, 60000); // 60 second client-side timeout

    return () => clearTimeout(timeoutId);
  }, [isSubmitting, status]);


  const handleExampleClick = (query: string) => {
    setInput(query);
    // Focus the textarea so user can see the filled query
    setTimeout(() => {
      const textarea = document.querySelector('textarea[placeholder*="Ask about"]');
      if (textarea instanceof HTMLTextAreaElement) {
        textarea.focus();
      }
    }, 100);
  };

  const handleSubmit = async (
    message: { text?: string; files?: any[] },
    event: React.FormEvent
  ) => {
    if (!message.text?.trim() || status === "streaming") return;

    // Set loading state immediately for instant feedback
    setIsSubmitting(true);

    // Clear the form immediately after extracting the message
    const form = (event.target as Element)?.closest("form") as HTMLFormElement;
    if (form) {
      form.reset();
    }

    sendMessage({ text: message.text });
    setInput("");
  };

  const isLoading = isSubmitting || status === "streaming";
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <Conversation className="flex-1 overflow-hidden">
        <ConversationContent className="space-y-4 px-6 py-6">
          {messages.length === 0 ? (
            <>
              <ConversationEmptyState
                title="Welcome to HockeyGoTime!"
                description="I help hockey parents answer the question: When do we need to leave?"
              />
              <HelperHints onQueryClick={handleExampleClick} league={league} />
            </>
          ) : (
            (() => {
              // Tool display name mapping
              const toolDisplayNames: Record<string, string> = {
                'tool-retrieveKnowledgeBase': 'Knowledge Base Search',
                // Add more tool mappings as needed
              };

              // Extract flow items (messages + tool calls + reasoning) in chronological order
              const flowItems: Array<{
                type: 'message' | 'tool-call' | 'reasoning';
                data: any;
                id: string;
                messageId?: string;
                displayName?: string;
                partIndex?: number;
              }> = [];

              messages.forEach((message, messageIndex) => {
                // Process all parts in chronological order
                const parts = (message as any).parts || [];

                parts.forEach((part: any, partIndex: number) => {
                  if (part.type?.startsWith('tool-')) {
                    console.log('🛠️ Tool part', part);
                    // Handle tool calls
                    const uniqueId = part.toolCallId ||
                      part.id ||
                      `${message.id}-${part.type}-${partIndex}`;

                    flowItems.push({
                      type: 'tool-call',
                      data: part,
                      id: `tool-${uniqueId}`,
                      messageId: message.id,
                      displayName: toolDisplayNames[part.type] || part.type,
                      partIndex
                    });
                  } else if (part.type === 'reasoning') {
                    // Handle reasoning parts
                    flowItems.push({
                      type: 'reasoning',
                      data: part,
                      id: `reasoning-${message.id}-${partIndex}`,
                      messageId: message.id,
                      partIndex
                    });
                  }
                  // text parts will be handled in the message itself
                });

                // Add the message itself (with only text parts and legacy content)
                const messageWithTextOnly = {
                  ...message,
                  parts: parts.filter((part: any) =>
                    part.type === 'text' || !part.type // include parts without type for backward compatibility
                  )
                };

                // Only add message if it has content (text or legacy content)
                const hasContent = messageWithTextOnly.parts.length > 0 || !!(message as any).content;
                if (hasContent) {
                  flowItems.push({
                    type: 'message',
                    data: messageWithTextOnly,
                    id: `message-${message.id}-${messageIndex}` // Include index for uniqueness
                  });
                }
              });

              // Deduplicate flow items by ID (keep first occurrence)
              const seenIds = new Set<string>();
              const deduplicatedFlowItems = flowItems.filter(item => {
                if (seenIds.has(item.id)) {
                  return false;
                }
                seenIds.add(item.id);
                return true;
              });

              return deduplicatedFlowItems.map((item, itemIndex) => {
                if (item.type === 'tool-call') {
                  // Render tool call status block
                  const toolPart = item.data as RAGToolUIPart;

                  // Tools are collapsed by default
                  const shouldBeExpanded = false;

                  return (
                    <div key={item.id} className="w-full mb-4">
                      <MemoizedToolCall
                        toolPart={toolPart}
                        displayName={item.displayName || toolPart.type}
                        shouldBeExpanded={shouldBeExpanded}
                      />
                    </div>
                  );
                } else if (item.type === 'reasoning') {
                  // Render reasoning block
                  const reasoningPart = item.data;

                  return (
                    <div key={item.id} className="w-full mb-4">
                      <Reasoning
                        isStreaming={isLoading}
                        className="mb-4"
                      >
                        <ReasoningTrigger />
                        <ReasoningContent>{reasoningPart.text || ''}</ReasoningContent>
                      </Reasoning>
                    </div>
                  );
                } else {
                  // Render regular message
                  const message = item.data;

                  // Generate sources component
                  const sourcesComponent = message.role === 'assistant' && (() => {
                    // Strict check for actual text content - don't show sources without real text
                    const hasRealTextContent = (
                      message.parts?.some((p: any) => p.type === 'text' && p.text?.trim()) ||
                      (message.content?.trim())
                    );

                    if (!hasRealTextContent) {
                      // No real text content = never show sources (prevents showing below tool calls)
                      return null;
                    }

                    // Look backward through flow items for recent tool results
                    let toolSources: any[] = [];

                    for (let i = itemIndex - 1; i >= 0; i--) {
                      const prevItem = deduplicatedFlowItems[i];
                      if (prevItem.type === 'tool-call') {
                        const toolData = prevItem.data as RAGToolUIPart;
                        if (toolData.type === 'tool-retrieveKnowledgeBase' && toolData.output?.sources) {
                          toolSources = toolData.output.sources;
                          break;
                        }
                      }
                    }

                    if (toolSources.length > 0) {
                      return (
                        <div className="mt-4">
                          <Sources>
                            <SourcesTrigger count={toolSources.length} />
                            <SourcesContent>
                              {toolSources.map((source: any, i: number) => (
                                <Source
                                  key={`source-${item.id}-${i}`}
                                  href={source.url}
                                  title={source.title}
                                />
                              ))}
                            </SourcesContent>
                          </Sources>
                        </div>
                      );
                    }
                    return null;
                  })();

                  return (
                    <div key={item.id} className="w-full">
                      <MemoizedMessage message={message} isStreaming={isLoading} />
                      {sourcesComponent}
                    </div>
                  );
                }
              });
            })()
          )}
          {isLoading && (
            <div className="mt-4">
              <SlidingPuck
                message={elapsedTime > 3 ? "Fetching schedule data..." : "Thinking..."}
              />
            </div>
          )}
          {timeoutError && (
            <div className="mt-4 rounded-lg border-2 border-destructive/50 bg-destructive/10 p-4">
              <p className="text-sm font-semibold text-destructive">
                ⏱️ Request took too long
              </p>
              <p className="mt-2 text-sm text-destructive/90">
                The AI is taking longer than expected to respond. This might happen with complex queries. Please try again or simplify your question.
              </p>
            </div>
          )}
        </ConversationContent>
      </Conversation>

      <div className="flex-shrink-0 border-t border-border bg-accent/30 px-6 py-4">

        <PromptInput
          className="divide-y-0 border-none bg-transparent p-0 shadow-none"
          onSubmit={handleSubmit}
        >
          <PromptInputBody className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <div className="flex-1 rounded-2xl border border-input bg-card px-4 py-2 shadow-inner">
              <PromptInputTextarea
                className="h-10 min-h-0 w-full resize-none border-none bg-transparent p-0 text-sm leading-6 text-foreground focus-visible:outline-none placeholder:text-muted-foreground"
                placeholder="Ask about schedules, travel times, or stats..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </div>
            <PromptInputToolbar className="justify-end gap-2 p-0">
              <div />
              <PromptInputSubmit
                className="h-11 w-11 rounded-2xl bg-sky-500 text-white shadow-md transition hover:bg-sky-600"
                status={isLoading ? "submitted" : undefined}
              />
            </PromptInputToolbar>
          </PromptInputBody>
        </PromptInput>

        <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <span role="img" aria-label="lock">
            🔒
          </span>
          Your preferences stay in your browser • We don&apos;t track or store your data
        </p>
      </div>
    </div>

  );
}
